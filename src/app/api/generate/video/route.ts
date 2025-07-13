/**
 * Video Generation API Endpoint for Gensy AI Creative Suite
 * Handles AI video generation requests following image generation patterns
 * Includes comprehensive logging and error handling
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { GoogleVeoService } from '@/lib/services/google-veo'
import { ReplicateWanService } from '@/lib/services/replicate-wan'
import { BytedanceVideoService } from '@/lib/services/bytedance-video-service'
import { CreditService, CREDIT_COSTS } from '@/lib/credits'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { uploadFile } from '@/lib/storage/r2-client'
import { z } from 'zod'

// Request validation schema - updated for proper Veo API support
const videoGenerationSchema = z.object({
  prompt: z.string().min(3, 'Prompt must be at least 3 characters').max(1000, 'Prompt too long'),
  duration: z.number().min(5).max(10).default(5), // Veo supports 5-8 seconds, ByteDance supports 5-10 seconds
  aspectRatio: z.enum(['16:9', '9:16', '1:1']).default('16:9'), // Support for ByteDance 1:1 ratio
  style: z.enum(['realistic', 'artistic', 'cartoon', 'cinematic', 'documentary']).default('realistic'),
  quality: z.enum(['standard', 'high', 'ultra']).default('standard'),
  resolution: z.enum(['480p', '720p']).default('720p'),
  provider: z.enum(['google-veo', 'replicate-wan', 'bytedance']).default('google-veo'),
  motionIntensity: z.enum(['low', 'medium', 'high']).default('medium'),
  frameRate: z.number().min(24).max(60).default(24),
  referenceImage: z.string().optional(), // Base64 encoded
  startFrameImage: z.string().optional(), // Base64 encoded start frame
  endFrameImage: z.string().optional(), // Base64 encoded end frame
  seed: z.number().optional(),
  model: z.string().optional(), // Model name from frontend
  negativePrompt: z.string().optional(), // What to avoid in generation
  enhancePrompt: z.boolean().default(true), // Use Gemini to enhance prompts
  sampleCount: z.number().min(1).max(4).default(1), // Number of videos to generate
  // Image-to-video and video-to-video specific fields
  sourceType: z.enum(['text-to-video', 'image-to-video', 'video-to-video']).default('text-to-video'),
  sourceImageUrl: z.string().optional(),
  sourceImagePrompt: z.string().optional(),
  referenceVideo: z.string().optional(),
  testMode: z.boolean().optional() // For testing without authentication
})

export async function POST(request: NextRequest) {
  // Generate unique request ID for logging (mirrors image generation)
  const requestId = `video_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const startTime = Date.now()

  try {
    console.log(`🎬 [${requestId}] VIDEO GENERATION: Request received`)

    // Parse request body first to check for test mode
    const body = await request.json()
    const isTestMode = body.testMode === true

    let userId

    if (isTestMode) {
      console.log(`🧪 [${requestId}] VIDEO GENERATION: Test mode enabled - bypassing authentication`)
      userId = 'test-user'
    } else {
      console.log(`🔐 [${requestId}] VIDEO GENERATION: Checking authentication...`)

      // Check authentication
      const authResult = await auth()
      userId = authResult.userId
      if (!userId) {
        console.error(`❌ [${requestId}] VIDEO GENERATION: Unauthorized - no userId`)
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        )
      }
    }

    if (!isTestMode) {
      console.log(`✅ [${requestId}] VIDEO GENERATION: Authentication successful - userId: ${userId}`)
    }

    // Validate request
    console.log(`📋 [${requestId}] VIDEO GENERATION: Validating request body...`)
    console.log(`📋 [${requestId}] VIDEO GENERATION: Raw request body:`, {
      promptLength: body.prompt?.length,
      aspectRatio: body.aspectRatio,
      style: body.style,
      quality: body.quality,
      resolution: body.resolution,
      provider: body.provider,
      sourceType: body.sourceType,
      hasReferenceImage: !!body.referenceImage,
      hasStartFrame: !!body.startFrameImage,
      hasEndFrame: !!body.endFrameImage,
      testMode: body.testMode
    })

    const validationResult = videoGenerationSchema.safeParse(body)

    if (!validationResult.success) {
      console.error(`❌ [${requestId}] VIDEO GENERATION: Validation failed:`, validationResult.error.errors)
      return NextResponse.json(
        {
          error: 'Invalid request parameters',
          details: validationResult.error.errors
        },
        { status: 400 }
      )
    }

    const {
      prompt,
      duration,
      aspectRatio,
      style,
      quality,
      resolution,
      provider,
      motionIntensity,
      frameRate,
      referenceImage,
      startFrameImage,
      endFrameImage,
      seed,
      model,
      sourceType,
      sourceImageUrl,
      sourceImagePrompt,
      negativePrompt,
      enhancePrompt,
      sampleCount
    } = validationResult.data

    console.log(`✅ [${requestId}] VIDEO GENERATION: Request validation successful`)
    console.log(`📝 [${requestId}] VIDEO GENERATION: Validated parameters:`, {
      prompt: prompt.substring(0, 100) + (prompt.length > 100 ? '...' : ''),
      promptLength: prompt.length,
      duration,
      aspectRatio,
      style,
      quality,
      resolution,
      provider,
      sourceType,
      model
    })

    // Determine model ID and provider based on model selection
    console.log(`🤖 [${requestId}] VIDEO GENERATION: Determining model ID and provider...`)

    let finalProvider = provider
    let modelId = model

    // Map model names to providers
    if (model) {
      if (model.includes('ByteDance') || model.includes('Seedream') || model === 'bytedance-seedream-1.0-lite-t2v') {
        finalProvider = 'bytedance'
        modelId = 'bytedance-seedream-1.0-lite-t2v'
      } else if (model.includes('veo') || model.includes('Veo') ||
                 model === 'veo-2.0-generate-001' ||
                 model === 'veo-3.0-generate-preview' ||
                 model === 'veo-3.0-fast-generate-preview') {
        finalProvider = 'google-veo'
        // Proper Veo model mapping based on exact model names
        if (model.includes('3.0 Fast') || model.includes('veo-3.0-fast') || model.includes('Veo 3.0 Fast')) {
          modelId = 'veo-3.0-fast-generate-preview'
        } else if (model.includes('3.0') || model.includes('veo-3.0-generate') || model.includes('Veo 3.0') || model.includes('Veo 3')) {
          modelId = 'veo-3.0-generate-preview'
        } else {
          modelId = 'veo-2.0-generate-001'
        }
      } else if (model.includes('replicate') || model.includes('wan')) {
        finalProvider = 'replicate-wan'
        modelId = model
      }
    }

    // Fallback to provider if no model specified
    if (!finalProvider) {
      finalProvider = provider || 'google-veo'
    }

    // Fallback model ID
    if (!modelId) {
      modelId = finalProvider === 'bytedance' ? 'bytedance-seedream-1.0-lite-t2v' :
                finalProvider === 'replicate-wan' ? 'replicate-wan' : 'veo-2.0-generate-001'
    }

    console.log(`🤖 [${requestId}] VIDEO GENERATION: Using model: ${modelId}, provider: ${finalProvider}`)
    console.log(`🔍 [${requestId}] VIDEO GENERATION: Model mapping debug - original model: "${model}", mapped modelId: "${modelId}"`)

    let profile, creditCost, currentCredits

    if (isTestMode) {
      console.log(`🧪 [${requestId}] VIDEO GENERATION: Test mode - skipping credit checks`)
      userId = 'test-user'
      profile = { id: 'test-profile' }
      creditCost = 0
      currentCredits = 999
    } else {
      // Check credit cost (video generation costs 5 credits)
      creditCost = CREDIT_COSTS.VIDEO_GENERATION
      console.log(`💳 [${requestId}] VIDEO GENERATION: Credit cost: ${creditCost}`)

      // Check user credits
      console.log(`💳 [${requestId}] VIDEO GENERATION: Checking user credits...`)
      const creditCheck = await CreditService.hasCredits(creditCost, userId)
      currentCredits = creditCheck.currentCredits
      console.log(`💳 [${requestId}] VIDEO GENERATION: User has ${currentCredits} credits, needs ${creditCost}`)

      if (!creditCheck.hasCredits) {
        console.error(`❌ [${requestId}] VIDEO GENERATION: Insufficient credits - required: ${creditCost}, available: ${currentCredits}`)
        return NextResponse.json(
          {
            error: 'Insufficient credits',
            required: creditCost,
            available: currentCredits
          },
          { status: 402 }
        )
      }

      console.log(`✅ [${requestId}] VIDEO GENERATION: Credit check passed`)

      const supabase = createServiceRoleClient()

      // Get user profile
      console.log(`👤 [${requestId}] VIDEO GENERATION: Fetching user profile...`)
      const profileResult = await supabase
        .from('profiles')
        .select('id')
        .eq('clerk_user_id', userId)
        .single()

      if (!profileResult.data) {
        console.error(`❌ [${requestId}] VIDEO GENERATION: User profile not found`)
        return NextResponse.json(
          { error: 'User profile not found' },
          { status: 404 }
        )
      }

      profile = profileResult.data
      console.log(`✅ [${requestId}] VIDEO GENERATION: User profile found - profileId: ${profile.id}`)
    }

    let generation

    if (isTestMode) {
      console.log(`🧪 [${requestId}] VIDEO GENERATION: Test mode - creating mock generation record`)
      generation = {
        id: `test-generation-${Date.now()}`,
        user_id: profile.id,
        type: 'video',
        prompt,
        model: modelId,
        status: 'processing',
        credits_used: creditCost,
        metadata: null // Ensure metadata property exists for type consistency
      }
    } else {
      // Create generation record
      console.log(`📝 [${requestId}] VIDEO GENERATION: Creating generation record in database...`)
      const supabase = createServiceRoleClient()
      const { data: generationData, error: generationError } = await supabase
        .from('generations')
        .insert({
          user_id: profile.id,
          type: 'video',
          prompt,
          model: modelId,
          status: 'processing',
          credits_used: creditCost,
          parameters: {
            duration,
            aspectRatio,
            style,
            quality,
            resolution,
            motionIntensity,
            frameRate,
            provider: finalProvider,
            seed,
            sourceType,
            sourceImageUrl,
            sourceImagePrompt,
            hasReferenceImage: !!referenceImage,
            hasStartFrame: !!startFrameImage,
            hasEndFrame: !!endFrameImage
          }
        })
        .select()
        .single()

      if (generationError || !generationData) {
        console.error(`❌ [${requestId}] VIDEO GENERATION: Failed to create generation record:`, generationError)
        return NextResponse.json(
          { error: 'Failed to create generation record' },
          { status: 500 }
        )
      }

      generation = generationData
      console.log(`✅ [${requestId}] VIDEO GENERATION: Generation record created - generationId: ${generation.id}`)
    }

    try {
      // Prepare generation options
      console.log(`⚙️ [${requestId}] VIDEO GENERATION: Preparing generation options...`)
      const options = {
        duration,
        aspectRatio,
        style,
        quality,
        resolution,
        motionIntensity,
        frameRate,
        referenceImage,
        startFrameImage,
        endFrameImage,
        sourceType,
        sourceImageUrl,
        sourceImagePrompt,
        negativePrompt,
        enhancePrompt,
        sampleCount,
        seed,
        model: (modelId === 'veo-2.0-generate-001' ||
                modelId === 'veo-3.0-generate-preview' ||
                modelId === 'veo-3.0-fast-generate-preview')
          ? modelId
          : (finalProvider === 'google-veo' ? 'veo-2.0-generate-001' : undefined)
      }
      console.log(`🔍 [${requestId}] VIDEO GENERATION: Final model in options: "${options.model}", modelId was: "${modelId}"`)
      console.log(`⚙️ [${requestId}] VIDEO GENERATION: Generation options prepared:`, {
        ...options,
        referenceImage: options.referenceImage ? '[BASE64_DATA]' : undefined
      })

      // Start video generation based on provider
      console.log(`🎬 [${requestId}] VIDEO GENERATION: Starting video generation with ${finalProvider}...`)
      console.log(`🎬 [${requestId}] VIDEO GENERATION: Sending prompt to ${finalProvider}: "${prompt.substring(0, 100)}${prompt.length > 100 ? '...' : ''}"`)

      let result
      try {
        const generationStartTime = Date.now()
        if (finalProvider === 'google-veo') {
          // Create Google Veo specific options
          const veoOptions = {
            ...options,
            // Override the model with the correctly mapped modelId
            model: modelId as 'veo-2.0-generate-001' | 'veo-3.0-generate-preview' | 'veo-3.0-fast-generate-preview'
          }

          console.log(`🎬 [${requestId}] VIDEO GENERATION: Calling Google Veo service with model: ${veoOptions.model}`)

          try {
            result = await GoogleVeoService.generateVideo(prompt, veoOptions, generation.id)
          } catch (error) {
            // Handle Veo 3.0 access issues with automatic fallback to Veo 2.0
            if (veoOptions.model.includes('veo-3.0') && error instanceof Error && error.message.includes('allowlist access')) {
              console.warn(`🔄 [${requestId}] VIDEO GENERATION: Veo 3.0 not accessible, falling back to Veo 2.0`)

              // Fallback to Veo 2.0
              const fallbackOptions = {
                ...veoOptions,
                model: 'veo-2.0-generate-001' as const,
                // Adjust parameters for Veo 2.0 compatibility
                generateAudio: undefined // Veo 2.0 doesn't support audio generation
              }

              console.log(`🎬 [${requestId}] VIDEO GENERATION: Retrying with Veo 2.0 fallback`)
              result = await GoogleVeoService.generateVideo(prompt, fallbackOptions, generation.id)

              // Update the generation record to reflect the fallback
              await supabase
                .from('generations')
                .update({
                  model_used: 'veo-2.0-generate-001',
                  metadata: {
                    ...generation.metadata,
                    fallback_reason: 'veo_3_access_not_available',
                    original_model_requested: modelId
                  }
                })
                .eq('id', generation.id)
            } else {
              throw error
            }
          }
        } else if (finalProvider === 'bytedance') {
          // Create ByteDance specific options
          const bytedanceOptions = {
            duration: options.duration,
            aspectRatio: options.aspectRatio as '16:9' | '9:16' | '1:1',
            style: options.style,
            quality: options.quality,
            resolution: options.resolution,
            motionIntensity: options.motionIntensity,
            frameRate: options.frameRate,
            referenceImage: options.referenceImage,
            sourceType: options.sourceType as 'text-to-video' | 'image-to-video',
            seed: options.seed,
            negativePrompt: options.negativePrompt
          }
          result = await BytedanceVideoService.generateVideo(prompt, bytedanceOptions, generation.id)
        } else {
          // Create Replicate specific options (remove Veo-specific fields)
          const { model: _, negativePrompt: __, enhancePrompt: ___, sampleCount: ____, ...replicateOptions } = options
          result = await ReplicateWanService.generateVideo(prompt, replicateOptions)
        }
        const generationEndTime = Date.now()
        console.log(`🎬 [${requestId}] VIDEO GENERATION: ${finalProvider} response received in ${generationEndTime - generationStartTime}ms`)
        console.log(`🎬 [${requestId}] VIDEO GENERATION: ${finalProvider} result:`, {
          success: result.success,
          hasVideoData: !!result.videoData,
          hasVideoUrls: !!(result.videoUrls && result.videoUrls.length > 0),
          videoDataLength: result.videoData ? result.videoData.length : 0,
          operationName: result.operationName,
          error: result.error,
          metadata: result.metadata
        })
      } catch (error) {
        console.log(`❌ [${requestId}] VIDEO GENERATION: ${finalProvider} failed, using fallback:`, error)
        // Fallback logic would go here
        throw error
      }

      if (!result.success) {
        // Update generation record with error (only for non-test mode)
        if (!isTestMode) {
          const supabase = createServiceRoleClient()
          await supabase
            .from('generations')
            .update({
              status: 'failed',
              error_message: result.error,
              processing_time_ms: result.metadata?.generationTime,
              updated_at: new Date().toISOString()
            })
            .eq('id', generation.id)
        }

        return NextResponse.json(
          { error: result.error || 'Video generation failed' },
          { status: 500 }
        )
      }

      // DIAGNOSTIC: Log result object to understand response structure
      console.log(`🔍 [${requestId}] VIDEO GENERATION: Analyzing result object:`, {
        status: result.status,
        hasVideoData: !!result.videoData,
        hasVideoUrls: !!result.videoUrls,
        videoUrlsLength: result.videoUrls?.length || 0,
        hasOperationName: !!result.operationName,
        hasJobId: !!result.jobId,
        operationName: result.operationName,
        jobId: result.jobId
      })

      // Handle immediate completion (mock services)
      if (result.status === 'completed' && result.videoData) {
        const supabase = createServiceRoleClient()
        const videoUrl = await handleVideoCompletion(
          generation.id,
          result.videoData,
          userId,
          profile.id,
          supabase
        )

        // Deduct credits
        if (!isTestMode) {
          await CreditService.deductCredits(
            creditCost,
            `Video generation: ${prompt.substring(0, 50)}...`,
            generation.id,
            userId
          )
        }

        return NextResponse.json({
          success: true,
          generationId: generation.id,
          status: 'completed',
          videoUrl,
          metadata: result.metadata,
          creditsUsed: creditCost,
          remainingCredits: currentCredits - creditCost
        })
      }

      // Handle completed Veo API response with video URLs
      if (result.status === 'completed' && result.videoUrls && result.videoUrls.length > 0) {
        const supabase = createServiceRoleClient()

        // Use the first video URL (or handle multiple URLs if needed)
        const primaryVideoUrl = result.videoUrls[0]

        console.log(`🎥 [${requestId}] VIDEO GENERATION: Completed with video URL:`, primaryVideoUrl)

        // Store GCS path instead of full signed URL
        let resultUrl = primaryVideoUrl
        if (primaryVideoUrl.includes('storage.googleapis.com') || primaryVideoUrl.includes('storage.cloud.google.com')) {
          // Extract GCS path from signed URL
          try {
            const url = new URL(primaryVideoUrl)
            const pathParts = url.pathname.substring(1).split('/') // Remove leading '/'
            if (pathParts.length >= 2) {
              resultUrl = `gs://${pathParts[0]}/${pathParts.slice(1).join('/')}`
              console.log(`🔄 [${requestId}] VIDEO GENERATION: Converted signed URL to GCS path: ${resultUrl}`)
            }
          } catch (error) {
            console.warn(`⚠️ [${requestId}] VIDEO GENERATION: Failed to convert URL to GCS path, using original:`, error)
          }
        }

        // Update generation record with video URL
        await supabase
          .from('generations')
          .update({
            status: 'completed',
            result_url: resultUrl, // Store GCS path instead of signed URL
            completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', generation.id)

        // Create media file record
        await supabase
          .from('media_files')
          .insert({
            user_id: profile.id,
            generation_id: generation.id,
            filename: `video-${generation.id}.mp4`,
            original_filename: `video-${generation.id}.mp4`,
            file_path: resultUrl, // Store GCS path instead of signed URL
            file_size: 0, // Size unknown from Veo API
            mime_type: 'video/mp4',
            metadata: {
              type: 'generated-video',
              duration: result.metadata?.duration || 8,
              provider: finalProvider
            },
            is_public: false
          })

        // Deduct credits
        if (!isTestMode) {
          await CreditService.deductCredits(
            creditCost,
            `Video generation: ${prompt.substring(0, 50)}...`,
            generation.id,
            userId
          )
        }

        return NextResponse.json({
          success: true,
          generationId: generation.id,
          status: 'completed',
          videoUrl: primaryVideoUrl,
          videoUrls: result.videoUrls, // Return all URLs if multiple
          metadata: result.metadata,
          creditsUsed: creditCost,
          remainingCredits: currentCredits - creditCost
        })
      }

      // Handle async processing (operation submitted to Veo API or ByteDance)
      if (result.operationName || result.jobId || result.taskId) {
        console.log(`🔄 [${requestId}] VIDEO GENERATION: Async processing detected - operationName: ${result.operationName}, jobId: ${result.jobId}, taskId: ${result.taskId}`)

        // Update generation with operation info (only for non-test mode)
        if (!isTestMode) {
          const supabase = createServiceRoleClient()
          await supabase
            .from('generations')
            .update({
              parameters: {
                ...(generation.parameters && typeof generation.parameters === 'object' && !Array.isArray(generation.parameters) ? generation.parameters as Record<string, any> : {}),
                operationName: result.operationName,
                jobId: result.jobId,
                taskId: result.taskId, // Add ByteDance task ID
                provider: finalProvider
              },
              updated_at: new Date().toISOString()
            })
            .eq('id', generation.id)
        }

        // Deduct credits immediately for async operations
        if (!isTestMode) {
          await CreditService.deductCredits(
            creditCost,
            `Video generation: ${prompt.substring(0, 50)}...`,
            generation.id,
            userId
          )
        }

        const responseData = {
          success: true,
          generationId: generation.id,
          operationName: result.operationName,
          jobId: result.jobId,
          taskId: result.taskId, // Add ByteDance task ID
          // Only include GCS output directory for Google providers, not ByteDance
          ...(finalProvider !== 'bytedance' && result.gcsOutputDirectory && {
            gcsOutputDirectory: result.gcsOutputDirectory
          }),
          provider: finalProvider, // Add provider for frontend polling logic
          status: 'processing',
          estimatedTime: finalProvider === 'bytedance' ? 180 : 120, // ByteDance typically takes longer
          creditsUsed: creditCost,
          remainingCredits: currentCredits - creditCost
        }

        console.log(`📤 [${requestId}] VIDEO GENERATION: Returning async processing response:`, responseData)
        return NextResponse.json(responseData)
      }

      throw new Error('Unexpected generation result format')

    } catch (error) {
      console.error('Video generation error:', error)

      // Update generation record with error (only for non-test mode)
      if (!isTestMode) {
        const supabase = createServiceRoleClient()
        await supabase
          .from('generations')
          .update({
            status: 'failed',
            error_message: error instanceof Error ? error.message : 'Unknown error',
            updated_at: new Date().toISOString()
          })
          .eq('id', generation.id)
      }

      return NextResponse.json(
        { error: 'Video generation failed' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to handle video completion
async function handleVideoCompletion(
  generationId: string,
  videoData: string,
  userId: string,
  profileId: string,
  supabase: any
): Promise<string | null> {
    try {
      // Convert base64 video data to buffer
      const videoBuffer = Buffer.from(videoData, 'base64')
      
      // Upload video to R2 storage
      const filename = `video-${generationId}.mp4`
      
      const uploadResult = await uploadFile({
        key: `videos/${userId}/${filename}`,
        file: videoBuffer,
        contentType: 'video/mp4',
        metadata: {
          generationId,
          userId: profileId,
          type: 'generated-video'
        },
        isPublic: true // Make videos public to avoid signed URL issues
      })

      if (uploadResult.success) {
        // Update generation record with video URL
        await supabase
          .from('generations')
          .update({
            status: 'completed',
            result_url: uploadResult.url,
            completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', generationId)

        // Create media file record
        await supabase
          .from('media_files')
          .insert({
            user_id: profileId,
            generation_id: generationId,
            filename,
            original_filename: filename,
            file_path: uploadResult.url,
            file_size: videoBuffer.length,
            mime_type: 'video/mp4',
            metadata: {
              type: 'generated-video',
              duration: 5 // This would come from actual video metadata
            },
            is_public: false
          })

        return uploadResult.url || null
      } else {
        console.error('Failed to upload video to R2:', uploadResult.error)
        return null
      }

    } catch (error) {
      console.error('Error handling video completion:', error)
      return null
    }
}

export async function GET(request: NextRequest) {
  try {
    // Check for test mode
    const { searchParams } = new URL(request.url)
    const testMode = searchParams.get('testMode') === 'true'
    const isTestMode = process.env.NODE_ENV === 'development' &&
                      (process.env.NEXT_PUBLIC_TEST_MODE === 'true' || testMode)

    let userId
    let profile

    if (isTestMode) {
      console.log('🧪 VIDEO GENERATE GET: Test mode enabled - bypassing authentication')
      userId = 'test-user'
      profile = { id: 'test-profile' }
    } else {
      const { userId: authUserId } = await auth()
      if (!authUserId) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        )
      }
      userId = authUserId

      const supabase = createServiceRoleClient()

      // Get user's recent video generations
      const { data: profileData } = await supabase
        .from('profiles')
        .select('id')
        .eq('clerk_user_id', userId)
        .single()

      if (!profileData) {
        return NextResponse.json(
          { error: 'User profile not found' },
          { status: 404 }
        )
      }
      profile = profileData
    }

    let generations = []

    if (isTestMode) {
      console.log('🧪 VIDEO GENERATE GET: Test mode - returning mock generations')
      generations = []
    } else {
      const supabase = createServiceRoleClient()

      const { data: generationsData, error } = await supabase
        .from('generations')
        .select('*')
        .eq('user_id', profile.id)
        .eq('type', 'video')
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) {
        console.error('Failed to fetch video generations:', error)
        return NextResponse.json(
          { error: 'Failed to fetch generations' },
          { status: 500 }
        )
      }

      generations = generationsData || []
    }

    // Get supported options
    const googleVeoOptions = GoogleVeoService.getSupportedOptions()
    const replicateOptions = ReplicateWanService.getSupportedOptions()
    const bytedanceOptions = BytedanceVideoService.getSupportedOptions()

    return NextResponse.json({
      success: true,
      generations: generations || [],
      supportedOptions: {
        googleVeo: googleVeoOptions,
        replicate: replicateOptions,
        bytedance: bytedanceOptions
      }
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
