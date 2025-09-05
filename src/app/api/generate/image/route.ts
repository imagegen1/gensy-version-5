/**
 * Image Generation API Endpoint for Gensy AI Creative Suite
 * Handles AI image generation requests using Google Vertex AI
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { BytedanceService, BytedanceImageGenerationOptions } from '@/lib/services/bytedance-service'
import { BFLService, BFLImageGenerationOptions, BFLImageEditingOptions, BFLModel } from '@/lib/services/bfl-service'
import { MockImageGenerationService } from '@/lib/services/mock-image-generation'
import { CreditService, CREDIT_COSTS } from '@/lib/credits'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { uploadFile } from '@/lib/storage/r2-client'
import { z } from 'zod'
import { withRateLimit } from '@/lib/middleware/rate-limit'
import { enforceContentPolicy } from '@/lib/content-policy'
import { AdvancedSanitizer } from '@/lib/advanced-sanitizer'

// Request validation schema
const generateImageSchema = z.object({
  prompt: z.string().min(3, 'Prompt must be at least 3 characters').max(1000, 'Prompt too long'),
  negativePrompt: z.string().optional(),
  aspectRatio: z.enum(['1:1', '16:9', '9:16', '4:3', '3:4']).default('1:1'),
  style: z.enum(['realistic', 'artistic', 'cartoon', 'abstract', 'photographic', 'cinematic', 'vintage', 'watercolor']).default('realistic'),
  quality: z.enum(['standard', 'high', 'ultra']).default('standard'),
  referenceImage: z.string().optional(), // Base64 encoded
  seed: z.number().optional(),
  guidanceScale: z.number().min(1).max(20).default(7),
  model: z.string().optional(), // Model name from frontend
  testMode: z.boolean().optional() // For testing without authentication
})

// Map display names to actual model IDs and service types
const MODEL_MAPPING: Record<string, { id: string; service: 'vertex' | 'bytedance' | 'bfl' }> = {
  // Imagen 4.0 models (latest generation)
  'Imagen 4': { id: 'imagen-4.0-generate-preview-06-06', service: 'vertex' },
  'Imagen 4 Ultra': { id: 'imagen-4.0-ultra-generate-preview-06-06', service: 'vertex' },
  'Imagen 4 Fast': { id: 'imagen-4.0-fast-generate-preview-06-06', service: 'vertex' },

  // Imagen 3.0 models (previous generation)
  'Imagen 3.0': { id: 'imagen-3.0-generate-001', service: 'vertex' },
  'Imagen 3.0 Fast': { id: 'imagen-3.0-fast-generate-001', service: 'vertex' },
  'Imagen 2.0': { id: 'imagegeneration@006', service: 'vertex' },

  // Third-party models
  'Bytedance Seedream 3.0': { id: 'seedream-3-0-t2i-250415', service: 'bytedance' },

  // Black Forest Labs (BFL) Flux models
  'Flux Kontext Pro': { id: 'flux-kontext-pro', service: 'bfl' },
  'Flux Kontext Max': { id: 'flux-kontext-max', service: 'bfl' },
  'Flux Pro 1.1 Ultra': { id: 'flux-pro-1.1-ultra', service: 'bfl' },
  'Flux Pro 1.1': { id: 'flux-pro-1.1', service: 'bfl' },
  'Flux Pro': { id: 'flux-pro', service: 'bfl' },
  'Flux Dev': { id: 'flux-dev', service: 'bfl' },
}

// Apply database-driven rate limiting to image generation endpoint
export async function POST(request: NextRequest) {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  console.log(`🚀 [${requestId}] IMAGE GENERATION REQUEST STARTED`)
  console.log(`📝 [${requestId}] Timestamp: ${new Date().toISOString()}`)

  try {
    // Parse request body first to check for test mode
    console.log(`📥 [${requestId}] Parsing request body...`)
    const body = await request.json()
    const isTestMode = body.testMode === true

    let userId
    let profile

    if (isTestMode) {
      console.log(`🧪 [${requestId}] Test mode enabled - bypassing authentication`)
      userId = 'test-user'
      profile = { id: 'test-profile' }
    } else {
      // Check authentication
      console.log(`🔐 [${requestId}] Checking authentication...`)
      const authResult = await auth()
      userId = authResult.userId
      if (!userId) {
        console.log(`❌ [${requestId}] Authentication failed - no userId`)
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        )
      }
      console.log('✅ Authentication successful - requestId:', requestId, 'userId:', userId)
    }
    console.log('📋 Request body received - requestId:', requestId, {
      prompt: body.prompt?.substring(0, 100) + (body.prompt?.length > 100 ? '...' : ''),
      aspectRatio: body.aspectRatio,
      style: body.style,
      quality: body.quality,
      model: body.model
    })

    const validationResult = generateImageSchema.safeParse(body)

    if (!validationResult.success) {
      console.log(`❌ [${requestId}] Request validation failed:`, validationResult.error.errors)
      return NextResponse.json(
        {
          error: 'Invalid request data',
          details: validationResult.error.errors
        },
        { status: 400 }
      )
    }
    console.log(`✅ [${requestId}] Request validation successful`)

    const {
      prompt,
      negativePrompt,
      aspectRatio,
      style,
      quality,
      referenceImage,
      seed,
      guidanceScale,
      model
    } = validationResult.data

    // Advanced input sanitization
    const sanitizedPrompt = AdvancedSanitizer.sanitizePrompt(prompt)
    const sanitizedNegativePrompt = negativePrompt ? AdvancedSanitizer.sanitizePrompt(negativePrompt) : undefined

    console.log(`🧹 [${requestId}] Input sanitization completed`)

    // Content policy enforcement (skip for test mode)
    if (!isTestMode) {
      console.log(`🛡️ [${requestId}] Checking content policy...`)
      const contentPolicyResult = await enforceContentPolicy(sanitizedPrompt, userId, referenceImage)

      if (!contentPolicyResult.allowed) {
        console.log(`❌ [${requestId}] Content policy violation:`, contentPolicyResult.reason)
        return NextResponse.json(
          {
            error: 'Content policy violation',
            message: 'Your prompt contains content that violates our content policy. Please modify your prompt and try again.',
            code: 'CONTENT_POLICY_VIOLATION'
          },
          { status: 400 }
        )
      }
      console.log(`✅ [${requestId}] Content policy check passed`)
    }

    // Determine the actual model ID and service to use
    const modelConfig = model && MODEL_MAPPING[model] ? MODEL_MAPPING[model] : { id: 'imagen-4.0-generate-preview-06-06', service: 'vertex' as const }
    const modelId = modelConfig.id
    const serviceType = modelConfig.service
    console.log(`🤖 [${requestId}] Model mapping: "${model}" -> "${modelId}" (${serviceType})`)
    console.log(`🎯 [${requestId}] Generation parameters:`, {
      prompt: prompt.substring(0, 100) + (prompt.length > 100 ? '...' : ''),
      aspectRatio,
      style,
      quality,
      modelId,
      serviceType
    })

    // Get credit cost based on quality (skip for test mode)
    const creditCost = quality === 'ultra' ? CREDIT_COSTS.PREMIUM_MODEL : CREDIT_COSTS.IMAGE_GENERATION
    console.log(`💰 [${requestId}] Credit cost calculated: ${creditCost} credits for quality: ${quality}`)

    let currentCredits = 0
    if (!isTestMode) {
      // Check user credits
      console.log(`💳 [${requestId}] Checking user credits...`)
      const { hasCredits, currentCredits: userCredits } = await CreditService.hasCredits(creditCost, userId)
      currentCredits = userCredits
      console.log(`💳 [${requestId}] Credit check result: hasCredits=${hasCredits}, currentCredits=${currentCredits}, required=${creditCost}`)

      if (!hasCredits) {
        console.log(`❌ [${requestId}] Insufficient credits - blocking request`)
        return NextResponse.json(
          {
            error: 'Insufficient credits',
            required: creditCost,
            available: currentCredits
          },
          { status: 402 }
        )
      }
      console.log(`✅ [${requestId}] Credit check passed`)
    } else {
      console.log(`🧪 [${requestId}] Test mode - skipping credit check`)
    }

    console.log(`🗄️ [${requestId}] Initializing database connection...`)
    const supabase = createServiceRoleClient()

    // Get user profile (skip for test mode)
    if (!isTestMode) {
      console.log(`👤 [${requestId}] Fetching user profile for userId: ${userId}`)
      const { data: profileData } = await supabase
        .from('profiles')
        .select('id')
        .eq('clerk_user_id', userId)
        .single()

      if (!profileData) {
        console.log(`❌ [${requestId}] User profile not found for userId: ${userId}`)
        return NextResponse.json(
          { error: 'User profile not found' },
          { status: 404 }
        )
      }
      profile = profileData
      console.log(`✅ [${requestId}] User profile found - profileId: ${profile.id}`)
    }

    // Create generation record (skip for test mode)
    let generation
    if (!isTestMode) {
      console.log(`📝 [${requestId}] Creating generation record in database...`)
      const { data: generationData, error: generationError } = await supabase
        .from('generations')
        .insert({
          user_id: profile.id,
          type: 'image',
          prompt,
          negative_prompt: negativePrompt,
          model: modelId,
          status: 'processing',
          credits_used: creditCost,
          parameters: {
            aspectRatio,
            style,
            quality,
            seed,
            guidanceScale,
            hasReferenceImage: !!referenceImage
          }
        })
        .select()
        .single()

      if (generationError || !generationData) {
        console.error(`❌ [${requestId}] Failed to create generation record:`, generationError)
        return NextResponse.json(
          { error: 'Failed to create generation record' },
          { status: 500 }
        )
      }
      generation = generationData
      console.log(`✅ [${requestId}] Generation record created - generationId: ${generation.id}`)
    } else {
      // Create mock generation for test mode
      generation = {
        id: `test-generation-${Date.now()}`,
        user_id: 'test-profile',
        type: 'image',
        prompt,
        model: modelId,
        status: 'processing'
      }
      console.log(`🧪 [${requestId}] Test mode - using mock generation record`)
    }

    try {
      // Prepare generation options
      console.log(`⚙️ [${requestId}] Preparing generation options...`)
      const options = {
        aspectRatio,
        style,
        quality,
        referenceImage,
        negativePrompt,
        seed,
        guidanceScale,
        model: modelId // Pass the actual model ID to the service
      }
      console.log(`⚙️ [${requestId}] Generation options prepared:`, options)

      // Generate image using the selected service
      console.log(`🎨 [${requestId}] Starting image generation with ${serviceType} service...`)
      console.log(`🎨 [${requestId}] Sending prompt: "${prompt.substring(0, 100)}${prompt.length > 100 ? '...' : ''}"`)

      let result
      try {
        const startTime = Date.now()

        if (serviceType === 'bytedance') {
          // Use Bytedance service
          const bytedanceOptions: BytedanceImageGenerationOptions = {
            aspectRatio,
            style,
            quality,
            guidanceScale,
            seed
          }
          result = await BytedanceService.generateImage(prompt, bytedanceOptions)
        } else if (serviceType === 'bfl') {
          // Use BFL service - check if this is image editing or generation
          const isFluxKontextPro = modelId === 'flux-kontext-pro'
          const hasReferenceImage = !!referenceImage

          if (isFluxKontextPro && hasReferenceImage) {
            // Image editing mode: prompt becomes edit instructions, referenceImage becomes input_image
            console.log(`🎨 [${requestId}] BFL: Using image editing mode with Flux Kontext Pro`)
            const bflEditOptions: BFLImageEditingOptions = {
              aspectRatio,
              seed,
              outputFormat: 'jpeg'
            }
            result = await BFLService.editImage(prompt, referenceImage, bflEditOptions)
          } else {
            // Normal text-to-image generation
            console.log(`🎨 [${requestId}] BFL: Using text-to-image generation mode`)
            const bflOptions: BFLImageGenerationOptions = {
              aspectRatio,
              style,
              quality,
              guidanceScale,
              seed
            }
            result = await BFLService.generateImage(prompt, bflOptions, modelId as BFLModel)
          }
        } else {
          // Check if Google Cloud is configured before using VertexAI
          const { isGoogleCloudConfigured } = await import('@/lib/google-auth')

          if (!isGoogleCloudConfigured()) {
            console.log(`❌ [${requestId}] Google Cloud not configured, using mock service`)
            result = await MockImageGenerationService.generateMockImage(prompt, {
              aspectRatio,
              style,
              quality
            })
          } else {
            // Use Vertex AI service (default)
            const { VertexAIService } = await import('@/lib/services/vertex-ai')
            result = await VertexAIService.generateImage(prompt, options)
          }
        }

        const endTime = Date.now()
        console.log(`🎨 [${requestId}] ${serviceType} response received in ${endTime - startTime}ms`)
        console.log(`🎨 [${requestId}] ${serviceType} result:`, {
          success: result.success,
          hasImageData: !!result.imageData,
          hasImageUrl: !!result.imageUrl,
          imageDataLength: result.imageData ? result.imageData.length : 0,
          error: result.error,
          metadata: result.metadata
        })
      } catch (error) {
        console.log(`❌ [${requestId}] ${serviceType} failed, using mock service:`, error)
        // Fallback to mock service
        result = await MockImageGenerationService.generateMockImage(prompt, {
          aspectRatio,
          style,
          quality
        })
        console.log(`🎭 [${requestId}] Mock service result:`, {
          success: result.success,
          hasImageData: !!result.imageData,
          error: result.error
        })
      }

      if (!result.success) {
        console.log(`❌ [${requestId}] Image generation failed:`, result.error)
        // Update generation record with error
        console.log(`📝 [${requestId}] Updating generation record with failure status...`)
        await supabase
          .from('generations')
          .update({
            status: 'failed',
            error_message: result.error,
            processing_time_ms: result.metadata?.generationTime,
            updated_at: new Date().toISOString()
          })
          .eq('id', generation.id)

        return NextResponse.json(
          { error: result.error || 'Image generation failed' },
          { status: 500 }
        )
      }

      console.log(`✅ [${requestId}] Image generation successful!`)

      // Handle image storage based on service type
      console.log(`☁️ [${requestId}] Processing image for storage...`)
      let imageUrl: string | null = null
      let imageBuffer: Buffer | null = null

      if (serviceType === 'bytedance' && result.imageUrl) {
        // Bytedance returns direct URLs - we can use them directly or download and re-upload to R2
        console.log(`🔗 [${requestId}] Bytedance returned direct URL: ${result.imageUrl}`)

        // Download the image from Bytedance URL and upload to our R2 storage for consistency
        try {
          console.log(`📥 [${requestId}] Downloading image from Bytedance URL...`)
          const imageResponse = await fetch(result.imageUrl)
          if (imageResponse.ok) {
            const arrayBuffer = await imageResponse.arrayBuffer()
            imageBuffer = Buffer.from(arrayBuffer)
            console.log(`✅ [${requestId}] Image downloaded successfully, size: ${imageBuffer.length} bytes`)
          } else {
            console.error(`❌ [${requestId}] Failed to download image from Bytedance URL`)
            // Fallback to using the direct URL
            imageUrl = result.imageUrl
          }
        } catch (error) {
          console.error(`❌ [${requestId}] Error downloading image from Bytedance:`, error)
          // Fallback to using the direct URL
          imageUrl = result.imageUrl
        }
      } else if (result.imageData) {
        // Vertex AI returns base64 data
        imageBuffer = Buffer.from(result.imageData, 'base64')
        console.log(`📦 [${requestId}] Using base64 image data, size: ${imageBuffer.length} bytes`)
      }

      // Upload to R2 if we have image buffer
      if (imageBuffer && !imageUrl) {
        console.log(`☁️ [${requestId}] Starting image upload to Cloudflare R2...`)
        const filename = `generated-${generation.id}.png`
        const fileKey = `images/${userId}/${filename}`

        console.log(`☁️ [${requestId}] Upload details:`, {
          filename,
          fileKey,
          bufferSize: imageBuffer.length,
          contentType: 'image/png'
        })

        const uploadStartTime = Date.now()
        const uploadResult = await uploadFile({
          key: fileKey,
          file: imageBuffer,
          contentType: 'image/png',
          metadata: {
            generationId: generation.id,
            userId: profile.id,
            prompt: prompt.substring(0, 100),
            service: serviceType
          },
          isPublic: false
        })
        const uploadEndTime = Date.now()

        console.log(`☁️ [${requestId}] R2 upload completed in ${uploadEndTime - uploadStartTime}ms`)
        console.log(`☁️ [${requestId}] R2 upload result:`, {
          success: uploadResult.success,
          url: uploadResult.url,
          error: uploadResult.error,
          size: uploadResult.size
        })

        if (uploadResult.success) {
          imageUrl = uploadResult.url!
          console.log(`✅ [${requestId}] Image successfully uploaded to R2: ${imageUrl}`)
        } else {
          console.error(`❌ [${requestId}] Failed to upload image to R2:`, uploadResult.error)
        }
      } else if (!imageUrl) {
        console.log(`⚠️ [${requestId}] No image data or URL available - skipping storage`)
      }

      // Update generation record with success
      console.log(`📝 [${requestId}] Updating generation record with completion status...`)
      const { data: updatedGeneration, error: updateError } = await supabase
        .from('generations')
        .update({
          status: 'completed',
          result_url: imageUrl,
          processing_time_ms: result.metadata?.generationTime,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', generation.id)
        .select()
        .single()

      if (updateError) {
        console.error(`❌ [${requestId}] Failed to update generation record:`, updateError)
      } else {
        console.log(`✅ [${requestId}] Generation record updated successfully`)
      }

      // Deduct credits
      console.log(`💳 [${requestId}] Deducting ${creditCost} credits from user...`)
      const creditResult = await CreditService.deductCredits(
        creditCost,
        `Image generation: ${prompt.substring(0, 50)}...`,
        generation.id,
        userId
      )

      if (!creditResult.success) {
        console.error(`❌ [${requestId}] Failed to deduct credits:`, creditResult.error)
        // Note: We don't fail the request here since the image was generated successfully
      } else {
        console.log(`✅ [${requestId}] Credits deducted successfully. New balance: ${creditResult.newBalance}`)
      }

      // Create media file record if we have an image URL
      if (imageUrl) {
        console.log(`📁 [${requestId}] Creating media file record...`)

        // Calculate file size
        let fileSize = 0
        if (imageBuffer) {
          fileSize = imageBuffer.length
        } else if (result.imageData) {
          fileSize = Buffer.from(result.imageData, 'base64').length
        }

        const { error: mediaError } = await supabase
          .from('media_files')
          .insert({
            user_id: profile.id,
            generation_id: generation.id,
            filename: `generated-${generation.id}.png`,
            original_filename: `generated-${generation.id}.png`,
            file_path: imageUrl,
            file_size: fileSize,
            mime_type: 'image/png',
            width: 1024, // Default dimensions
            height: 1024,
            metadata: {
              prompt,
              aspectRatio,
              style,
              quality,
              service: serviceType,
              model: modelId
            },
            is_public: false
          })

        if (mediaError) {
          console.error(`❌ [${requestId}] Failed to create media file record:`, mediaError)
        } else {
          console.log(`✅ [${requestId}] Media file record created successfully`)
        }
      }

      const finalResponse = {
        success: true,
        generation: updatedGeneration || generation,
        imageUrl,
        metadata: result.metadata,
        creditsUsed: creditCost,
        remainingCredits: creditResult.success ? creditResult.newBalance : currentCredits - creditCost
      }

      console.log(`🎉 [${requestId}] IMAGE GENERATION COMPLETED SUCCESSFULLY!`)
      console.log(`📤 [${requestId}] Sending response:`, {
        success: finalResponse.success,
        hasImageUrl: !!finalResponse.imageUrl,
        imageUrl: finalResponse.imageUrl,
        creditsUsed: finalResponse.creditsUsed,
        remainingCredits: finalResponse.remainingCredits
      })

      return NextResponse.json(finalResponse)

    } catch (error) {
      console.error(`💥 [${requestId}] Image generation error:`, error)

      // Update generation record with error
      console.log(`📝 [${requestId}] Updating generation record with error status...`)
      await supabase
        .from('generations')
        .update({
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error',
          updated_at: new Date().toISOString()
        })
        .eq('id', generation.id)

      return NextResponse.json(
        { error: 'Image generation failed' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error(`💥 [${requestId}] API error:`, error)
    console.error(`💥 [${requestId}] Stack trace:`, error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabase = createServiceRoleClient()

    // Get user's recent generations
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('clerk_user_id', userId)
      .single()

    if (!profile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      )
    }

    const { data: generations, error } = await supabase
      .from('generations')
      .select('*')
      .eq('user_id', profile.id)
      .eq('type', 'image')
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) {
      console.error('Failed to fetch generations:', error)
      return NextResponse.json(
        { error: 'Failed to fetch generations' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      generations: generations || []
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
