/**
 * Batch Image Upscaling API Endpoint for Gensy AI Creative Suite
 * Handles batch upscaling requests with multiple images
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { BatchProcessingService } from '@/lib/services/batch-processing'
import { CreditService } from '@/lib/credits'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { uploadToR2 } from '@/lib/storage/r2-client'
import { z } from 'zod'

// Request validation schema
const batchUpscaleSchema = z.object({
  scaleFactor: z.number().min(1.5).max(8).default(2),
  enhancement: z.enum(['none', 'denoise', 'sharpen', 'colorize', 'ai-enhanced']).default('none'),
  outputFormat: z.enum(['png', 'jpeg', 'webp']).default('png'),
  quality: z.number().min(10).max(100).default(90),
  maxConcurrent: z.number().min(1).max(5).default(3),
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
    const imageFiles: File[] = []
    
    // Extract all image files
    for (const [key, value] of formData.entries()) {
      if (key.startsWith('images[') && value instanceof File) {
        imageFiles.push(value)
      }
    }

    const scaleFactor = parseFloat(formData.get('scaleFactor') as string) || 2
    const enhancement = formData.get('enhancement') as string || 'none'
    const outputFormat = formData.get('outputFormat') as string || 'png'
    const quality = parseInt(formData.get('quality') as string) || 90
    const maxConcurrent = parseInt(formData.get('maxConcurrent') as string) || 3

    // Validate inputs
    const validationResult = batchUpscaleSchema.safeParse({
      scaleFactor,
      enhancement,
      outputFormat,
      quality,
      maxConcurrent
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

    // Validate batch request
    const batchValidation = BatchProcessingService.validateBatchRequest(imageFiles)
    if (!batchValidation.isValid) {
      return NextResponse.json(
        { 
          error: 'Invalid batch request',
          details: batchValidation.errors
        },
        { status: 400 }
      )
    }

    // Calculate credit cost
    const creditCost = BatchProcessingService.calculateBatchCreditCost(
      imageFiles.length,
      enhancement
    )

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
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      )
    }

    // Create batch generation record
    const { data: batchGeneration, error: generationError } = await supabase
      .from('generations')
      .insert({
        user_id: profile.id,
        type: 'batch',
        prompt: `Batch upscale ${imageFiles.length} images at ${scaleFactor}x`,
        model_used: 'sharp-batch-upscaler',
        status: 'processing',
        credits_used: creditCost,
        metadata: {
          scaleFactor,
          enhancement,
          outputFormat,
          quality,
          maxConcurrent,
          imageCount: imageFiles.length,
          warnings: batchValidation.warnings
        }
      })
      .select()
      .single()

    if (generationError || !batchGeneration) {
      console.error('Failed to create batch generation record:', generationError)
      return NextResponse.json(
        { error: 'Failed to create batch generation record' },
        { status: 500 }
      )
    }

    try {
      // Process batch
      const batchResult = await BatchProcessingService.processBatch(imageFiles, {
        scaleFactor,
        enhancement: enhancement as any,
        outputFormat: outputFormat as any,
        quality,
        maxConcurrent,
        onProgress: (completed, total, currentFile) => {
          console.log(`Batch progress: ${completed}/${total} - ${currentFile}`)
        }
      })

      // Upload successful results to R2
      const uploadedResults = []
      for (const result of batchResult.results) {
        if (result.status === 'completed' && result.result?.success && result.result.imageBuffer) {
          const filename = `batch-${batchGeneration.id}-${result.index}.${outputFormat}`
          
          const uploadResult = await uploadToR2({
            key: `batch/${userId}/${filename}`,
            file: result.result.imageBuffer,
            contentType: `image/${outputFormat}`,
            metadata: {
              batchGenerationId: batchGeneration.id,
              userId: profile.id,
              originalFilename: result.filename,
              scaleFactor: scaleFactor.toString(),
              enhancement
            },
            isPublic: false
          })

          if (uploadResult.success) {
            uploadedResults.push({
              ...result,
              uploadedUrl: uploadResult.url
            })

            // Create individual media file record
            await supabase
              .from('media_files')
              .insert({
                user_id: profile.id,
                generation_id: batchGeneration.id,
                filename,
                original_filename: result.filename,
                file_path: uploadResult.url!,
                file_size: result.result.imageBuffer.length,
                mime_type: `image/${outputFormat}`,
                width: result.result.metadata?.upscaledSize?.width,
                height: result.result.metadata?.upscaledSize?.height,
                metadata: {
                  batchIndex: result.index,
                  scaleFactor,
                  enhancement,
                  originalSize: result.result.metadata?.originalSize,
                  upscaledSize: result.result.metadata?.upscaledSize
                },
                is_public: false
              })
          }
        }
      }

      // Update batch generation record with results
      const { data: updatedGeneration } = await supabase
        .from('generations')
        .update({
          status: batchResult.summary.failed === 0 ? 'completed' : 'completed_with_errors',
          processing_time_ms: batchResult.summary.totalProcessingTime,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          metadata: {
            ...batchGeneration.metadata,
            summary: batchResult.summary,
            uploadedCount: uploadedResults.length
          }
        })
        .eq('id', batchGeneration.id)
        .select()
        .single()

      // Deduct credits
      const creditResult = await CreditService.deductCredits(
        creditCost,
        `Batch upscaling: ${imageFiles.length} images at ${scaleFactor}x`,
        batchGeneration.id,
        userId
      )

      if (!creditResult.success) {
        console.error('Failed to deduct credits:', creditResult.error)
      }

      return NextResponse.json({
        success: true,
        batchGeneration: updatedGeneration || batchGeneration,
        summary: batchResult.summary,
        results: uploadedResults,
        creditsUsed: creditCost,
        remainingCredits: creditResult.success ? creditResult.newBalance : currentCredits - creditCost
      })

    } catch (error) {
      console.error('Batch processing error:', error)

      // Update generation record with error
      await supabase
        .from('generations')
        .update({
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error',
          updated_at: new Date().toISOString()
        })
        .eq('id', batchGeneration.id)

      return NextResponse.json(
        { error: 'Batch processing failed' },
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

    // Get user's recent batch generations
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
      .eq('type', 'batch')
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) {
      console.error('Failed to fetch batch generations:', error)
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
