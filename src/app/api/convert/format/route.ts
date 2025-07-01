/**
 * Image Format Conversion API Endpoint for Gensy AI Creative Suite
 * Handles image format conversion requests
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { FormatConversionService } from '@/lib/services/format-conversion'
import { CreditService, CREDIT_COSTS } from '@/lib/credits'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { uploadToR2 } from '@/lib/storage/r2-client'
import { z } from 'zod'

// Request validation schema
const convertFormatSchema = z.object({
  targetFormat: z.enum(['jpeg', 'png', 'webp', 'avif']),
  quality: z.number().min(10).max(100).default(85),
  compression: z.number().min(0).max(9).default(6),
  lossless: z.boolean().default(false),
  progressive: z.boolean().default(true),
  optimizeForWeb: z.boolean().default(false),
  stripMetadata: z.boolean().default(true),
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
    const targetFormat = formData.get('targetFormat') as string
    const quality = parseInt(formData.get('quality') as string) || 85
    const compression = parseInt(formData.get('compression') as string) || 6
    const lossless = formData.get('lossless') === 'true'
    const progressive = formData.get('progressive') !== 'false'
    const optimizeForWeb = formData.get('optimizeForWeb') === 'true'
    const stripMetadata = formData.get('stripMetadata') !== 'false'

    // Validate inputs
    const validationResult = convertFormatSchema.safeParse({
      targetFormat,
      quality,
      compression,
      lossless,
      progressive,
      optimizeForWeb,
      stripMetadata
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

    // Validate image file
    if (!imageFile) {
      return NextResponse.json(
        { error: 'Image file is required' },
        { status: 400 }
      )
    }

    // Check file size (max 100MB)
    if (imageFile.size > 100 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File too large (max 100MB)' },
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

    // Format conversion is free (no credits required)
    const creditCost = 0

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

    // Convert file to buffer
    const imageBuffer = Buffer.from(await imageFile.arrayBuffer())

    // Validate conversion request
    const validation = FormatConversionService.validateConversionRequest(
      imageBuffer,
      targetFormat
    )
    
    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.errors.join(', ') },
        { status: 400 }
      )
    }

    // Create generation record
    const { data: generation, error: generationError } = await supabase
      .from('generations')
      .insert({
        user_id: profile.id,
        type: 'conversion',
        prompt: `Convert ${imageFile.name} to ${targetFormat.toUpperCase()}`,
        model_used: 'sharp-converter',
        status: 'processing',
        credits_used: creditCost,
        metadata: {
          targetFormat,
          quality,
          compression,
          lossless,
          progressive,
          optimizeForWeb,
          stripMetadata,
          originalFilename: imageFile.name,
          originalSize: imageFile.size,
          originalType: imageFile.type
        }
      })
      .select()
      .single()

    if (generationError || !generation) {
      console.error('Failed to create generation record:', generationError)
      return NextResponse.json(
        { error: 'Failed to create generation record' },
        { status: 500 }
      )
    }

    try {
      // Perform format conversion
      const conversionResult = await FormatConversionService.convertFormat(
        imageBuffer,
        targetFormat as any,
        {
          quality,
          compression,
          lossless,
          progressive,
          optimizeForWeb,
          stripMetadata
        }
      )

      if (!conversionResult.success) {
        // Update generation record with error
        await supabase
          .from('generations')
          .update({
            status: 'failed',
            error_message: conversionResult.error,
            processing_time_ms: conversionResult.metadata?.processingTime,
            updated_at: new Date().toISOString()
          })
          .eq('id', generation.id)

        return NextResponse.json(
          { error: conversionResult.error || 'Format conversion failed' },
          { status: 500 }
        )
      }

      // Upload converted image to R2 storage
      let imageUrl: string | null = null
      if (conversionResult.imageBuffer) {
        const filename = `converted-${generation.id}.${targetFormat}`
        
        const uploadResult = await uploadToR2({
          key: `converted/${userId}/${filename}`,
          file: conversionResult.imageBuffer,
          contentType: `image/${targetFormat}`,
          metadata: {
            generationId: generation.id,
            userId: profile.id,
            originalFilename: imageFile.name,
            targetFormat
          },
          isPublic: false
        })

        if (uploadResult.success) {
          imageUrl = uploadResult.url!
        } else {
          console.error('Failed to upload converted image to R2:', uploadResult.error)
        }
      }

      // Update generation record with success
      const { data: updatedGeneration } = await supabase
        .from('generations')
        .update({
          status: 'completed',
          result_url: imageUrl,
          processing_time_ms: conversionResult.metadata?.processingTime,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          metadata: {
            ...generation.metadata,
            ...conversionResult.metadata
          }
        })
        .eq('id', generation.id)
        .select()
        .single()

      // Create media file record if we have an image URL
      if (imageUrl && conversionResult.imageBuffer) {
        await supabase
          .from('media_files')
          .insert({
            user_id: profile.id,
            generation_id: generation.id,
            filename: `converted-${generation.id}.${targetFormat}`,
            original_filename: imageFile.name,
            file_path: imageUrl,
            file_size: conversionResult.imageBuffer.length,
            mime_type: `image/${targetFormat}`,
            width: conversionResult.metadata?.dimensions.width,
            height: conversionResult.metadata?.dimensions.height,
            metadata: {
              originalFormat: conversionResult.metadata?.originalFormat,
              targetFormat,
              compressionRatio: conversionResult.metadata?.compressionRatio,
              originalSize: conversionResult.metadata?.originalSize,
              convertedSize: conversionResult.metadata?.convertedSize
            },
            is_public: false
          })
      }

      return NextResponse.json({
        success: true,
        generation: updatedGeneration || generation,
        imageUrl,
        metadata: conversionResult.metadata,
        creditsUsed: creditCost,
        savings: {
          sizeReduction: conversionResult.metadata?.originalSize && conversionResult.metadata?.convertedSize
            ? conversionResult.metadata.originalSize - conversionResult.metadata.convertedSize
            : 0,
          compressionRatio: conversionResult.metadata?.compressionRatio || 1
        }
      })

    } catch (error) {
      console.error('Format conversion error:', error)

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
        { error: 'Format conversion failed' },
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

    // Return supported formats and recommendations
    const supportedFormats = FormatConversionService.getSupportedFormats()

    return NextResponse.json({
      success: true,
      supportedFormats,
      recommendations: {
        jpeg: 'Best for photographs and images with many colors',
        png: 'Best for images with transparency or sharp edges',
        webp: 'Modern format with excellent compression',
        avif: 'Next-generation format with superior compression'
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
