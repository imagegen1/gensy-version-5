/**
 * Image Upscaling API Endpoint for Gensy AI Creative Suite
 * Handles image upscaling requests with file upload and processing
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { ImageUpscalingService } from '@/lib/services/image-upscaling'
import { CreditService, CREDIT_COSTS } from '@/lib/credits'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { uploadToR2 } from '@/lib/storage/r2-client'
import { z } from 'zod'

// Request validation schema
const upscaleImageSchema = z.object({
  scaleFactor: z.number().min(1.5).max(8).default(2),
  enhancement: z.enum(['none', 'denoise', 'sharpen', 'colorize', 'ai-enhanced']).default('none'),
  outputFormat: z.enum(['png', 'jpeg', 'webp']).default('png'),
  quality: z.number().min(10).max(100).default(90),
})

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse form data
    const formData = await request.formData()
    const imageFile = formData.get('image') as File
    const mediaFileId = formData.get('mediaFileId') as string
    const scaleFactor = parseFloat(formData.get('scaleFactor') as string) || 2
    const enhancement = formData.get('enhancement') as string || 'none'
    const outputFormat = formData.get('outputFormat') as string || 'png'
    const quality = parseInt(formData.get('quality') as string) || 90

    // Validate inputs
    const validationResult = upscaleImageSchema.safeParse({
      scaleFactor,
      enhancement,
      outputFormat,
      quality
    })

    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid request parameters',
          details: validationResult.error.errors
        },
        { status: 400 }
      )
    }

    // Validate image file or media file ID
    if (!imageFile && !mediaFileId) {
      return NextResponse.json(
        { error: 'Image file or media file ID is required' },
        { status: 400 }
      )
    }



    // Get credit cost (upscaling costs 2 credits, AI enhancement costs 3)
    const creditCost = enhancement === 'ai-enhanced' ? 3 : CREDIT_COSTS.IMAGE_UPSCALING

    // Check user credits
    const { hasCredits, currentCredits } = await CreditService.hasCredits(creditCost, userId)
    if (!hasCredits) {
      return NextResponse.json(
        { 
          error: 'Insufficient credits',
          required: creditCost,
          available: currentCredits
        },
        { status: 402 }
      )
    }

    const supabase = createServiceRoleClient()

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('clerk_user_id', userId)
      .single()

    if (!profile) {
      console.error('User profile not found for userId:', userId)
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      )
    }

    console.log('Found user profile:', { id: profile.id, userId })

    // Debug: Check Google Cloud configuration
    const { isGoogleCloudConfigured } = await import('@/lib/google-cloud')
    console.log('Google Cloud configured:', isGoogleCloudConfigured())
    console.log('Environment check:', {
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
      hasCredentials: !!process.env.GOOGLE_APPLICATION_CREDENTIALS
    })

    // Get image buffer from file or existing media file
    let imageBuffer: Buffer
    let originalFileName: string

    if (imageFile) {
      // Handle uploaded file
      imageBuffer = Buffer.from(await imageFile.arrayBuffer())
      originalFileName = imageFile.name

      // Check file size (max 50MB)
      if (imageFile.size > 50 * 1024 * 1024) {
        return NextResponse.json(
          { error: 'File too large (max 50MB)' },
          { status: 400 }
        )
      }

      // Check file type
      if (!imageFile.type.startsWith('image/')) {
        return NextResponse.json(
          { error: 'Invalid file type. Only images are allowed.' },
          { status: 400 }
        )
      }
    } else if (mediaFileId) {
      // Handle existing media file
      const { data: mediaFile, error: mediaError } = await supabase
        .from('media_files')
        .select('*')
        .eq('id', mediaFileId)
        .eq('user_id', profile.id)
        .single()

      if (mediaError || !mediaFile) {
        return NextResponse.json(
          { error: 'Media file not found' },
          { status: 404 }
        )
      }

      // Fetch the image from R2 storage
      try {
        const response = await fetch(mediaFile.file_path)
        if (!response.ok) {
          throw new Error('Failed to fetch image from storage')
        }
        imageBuffer = Buffer.from(await response.arrayBuffer())
        originalFileName = mediaFile.original_filename || mediaFile.filename
      } catch (error) {
        console.error('Failed to fetch media file:', error)
        return NextResponse.json(
          { error: 'Failed to fetch image from storage' },
          { status: 500 }
        )
      }
    } else {
      return NextResponse.json(
        { error: 'No image source provided' },
        { status: 400 }
      )
    }

    // Validate image
    const validation = await ImageUpscalingService.validateImage(imageBuffer)
    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.error || 'Invalid image' },
        { status: 400 }
      )
    }

    // Original image storage removed to reduce storage costs

    // Create generation record
    const insertData = {
      user_id: profile.id,
      type: 'upscale',
      prompt: `Upscale ${scaleFactor}x with ${enhancement} enhancement`,
      model: 'vertex-ai-upscaler',
      status: 'processing',
      credits_used: creditCost,
      metadata: {
        scaleFactor,
        enhancement,
        outputFormat,
        quality,
        originalSize: imageBuffer.length,
        originalFileName,
        originalDimensions: {
          width: validation.metadata?.width,
          height: validation.metadata?.height
        }
      }
    }

    console.log('Attempting to insert generation record:', insertData)

    const { data: generation, error: generationError } = await supabase
      .from('generations')
      .insert(insertData)
      .select()
      .single()

    if (generationError || !generation) {
      console.error('Failed to create generation record:', {
        error: generationError,
        profile: profile,
        insertData: {
          user_id: profile.id,
          type: 'upscale',
          prompt: `Upscale ${scaleFactor}x with ${enhancement} enhancement`,
          model: 'vertex-ai-upscaler',
          status: 'processing',
          credits_used: creditCost,
          metadata: {
            scaleFactor,
            enhancement,
            outputFormat,
            quality,
            originalSize: imageBuffer.length,
            originalFileName,
            originalDimensions: {
              width: validation.metadata?.width,
              height: validation.metadata?.height
            }
          }
        }
      })
      return NextResponse.json(
        { error: 'Failed to create generation record', details: generationError?.message },
        { status: 500 }
      )
    }

    try {
      // Perform upscaling using Google Vertex AI
      const upscalingResult = await ImageUpscalingService.upscaleWithVertexAI(imageBuffer, scaleFactor, {
        enhancement: enhancement as any,
        outputFormat: outputFormat as any,
        quality
      })

      if (!upscalingResult.success) {
        // Update generation record with error
        await supabase
          .from('generations')
          .update({
            status: 'failed',
            error_message: upscalingResult.error,
            processing_time_ms: upscalingResult.metadata?.processingTime,
            updated_at: new Date().toISOString()
          })
          .eq('id', generation.id)

        return NextResponse.json(
          { error: upscalingResult.error || 'Image upscaling failed' },
          { status: 500 }
        )
      }

      // Upload upscaled image to R2 storage
      let imageUrl: string | null = null
      const filename = `upscaled-${generation.id}.${outputFormat}`

      if (upscalingResult.imageBuffer) {
        console.log('Attempting to upload to R2:', {
          key: `upscaled/${userId}/${filename}`,
          bufferSize: upscalingResult.imageBuffer.length,
          contentType: `image/${outputFormat}`
        })

        const uploadResult = await uploadToR2({
          key: `upscaled/${userId}/${filename}`,
          file: upscalingResult.imageBuffer,
          contentType: `image/${outputFormat}`,
          metadata: {
            generationId: generation.id,
            userId: profile.id,
            scaleFactor: scaleFactor.toString(),
            enhancement
          },
          isPublic: false
        })

        console.log('R2 upload result:', uploadResult)

        if (uploadResult.success) {
          imageUrl = uploadResult.url!
          console.log('R2 upload successful, URL:', imageUrl)
        } else {
          console.error('Failed to upload upscaled image to R2:', uploadResult.error)
        }
      }

      // Update generation record with success
      const { data: updatedGeneration } = await supabase
        .from('generations')
        .update({
          status: 'completed',
          result_url: imageUrl,
          processing_time_ms: upscalingResult.metadata?.processingTime,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          metadata: {
            ...generation.metadata,
            ...upscalingResult.metadata
          }
        })
        .eq('id', generation.id)
        .select()
        .single()

      // Deduct credits
      const creditResult = await CreditService.deductCredits(
        creditCost,
        `Image upscaling: ${scaleFactor}x with ${enhancement}`,
        generation.id,
        userId
      )

      if (!creditResult.success) {
        console.error('Failed to deduct credits:', creditResult.error)
      }

      // Create media file record if we have an image URL
      if (imageUrl && upscalingResult.imageBuffer) {
        console.log('Creating media file record:', {
          user_id: profile.id,
          generation_id: generation.id,
          filename,
          file_path: imageUrl,
          file_size: upscalingResult.imageBuffer.length
        })

        const { data: mediaFile, error: mediaError } = await supabase
          .from('media_files')
          .insert({
            user_id: profile.id,
            generation_id: generation.id,
            filename,
            original_filename: originalFileName,
            file_path: imageUrl,
            file_size: upscalingResult.imageBuffer.length,
            mime_type: `image/${outputFormat}`,
            width: upscalingResult.metadata?.upscaledSize.width,
            height: upscalingResult.metadata?.upscaledSize.height,
            metadata: {
              scaleFactor,
              enhancement,
              originalSize: upscalingResult.metadata?.originalSize,
              upscaledSize: upscalingResult.metadata?.upscaledSize
            },
            is_public: false
          })
          .select()
          .single()

        if (mediaError) {
          console.error('Failed to create media file record:', mediaError)
        } else {
          console.log('Media file record created successfully:', mediaFile)
        }
      } else {
        console.log('Skipping media file creation:', {
          hasImageUrl: !!imageUrl,
          hasImageBuffer: !!upscalingResult.imageBuffer
        })
      }

      return NextResponse.json({
        success: true,
        generation: updatedGeneration || generation,
        imageUrl,
        metadata: upscalingResult.metadata,
        creditsUsed: creditCost,
        remainingCredits: creditResult.success ? creditResult.newBalance : currentCredits - creditCost
      })

    } catch (error) {
      console.error('Image upscaling error:', error)

      // Update generation record with error
      await supabase
        .from('generations')
        .update({
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error',
          updated_at: new Date().toISOString()
        })
        .eq('id', generation.id)

      return NextResponse.json(
        { error: 'Image upscaling failed' },
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

    // Get user's recent upscaling generations
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
      .eq('type', 'upscale')
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) {
      console.error('Failed to fetch upscaling generations:', error)
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
