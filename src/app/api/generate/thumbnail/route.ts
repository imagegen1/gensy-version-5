/**
 * Video Thumbnail Generation API
 * Generates thumbnails for existing videos or batch processes multiple videos
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { generateThumbnailForExistingVideo } from '@/lib/video/thumbnail-generator'
import { z } from 'zod'

// Request validation schema
const thumbnailRequestSchema = z.object({
  generationId: z.string().uuid().optional(),
  batchProcess: z.boolean().optional(),
  limit: z.number().min(1).max(50).optional()
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

    const requestId = `thumb_api_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    console.log(`🖼️ [${requestId}] THUMBNAIL API: Request received`)

    // Parse and validate request body
    const body = await request.json()
    const { generationId, batchProcess = false, limit = 10 } = thumbnailRequestSchema.parse(body)

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

    if (generationId) {
      // Generate thumbnail for specific video
      console.log(`🖼️ [${requestId}] THUMBNAIL API: Processing single video ${generationId}`)

      // Get generation details
      const { data: generation, error: generationError } = await supabase
        .from('generations')
        .select(`
          id,
          result_url,
          parameters,
          user_id,
          media_files (
            id,
            thumbnail_url
          )
        `)
        .eq('id', generationId)
        .eq('user_id', profile.id)
        .eq('type', 'video')
        .eq('status', 'completed')
        .single()

      if (generationError || !generation) {
        return NextResponse.json(
          { error: 'Video generation not found or not accessible' },
          { status: 404 }
        )
      }

      if (!generation.result_url) {
        return NextResponse.json(
          { error: 'Video URL not available' },
          { status: 400 }
        )
      }

      // Check if thumbnail already exists
      if (generation.media_files?.[0]?.thumbnail_url) {
        return NextResponse.json({
          success: true,
          message: 'Thumbnail already exists',
          thumbnailUrl: generation.media_files[0].thumbnail_url,
          generationId
        })
      }

      // Generate thumbnail
      const aspectRatio = generation.parameters?.aspectRatio || '16:9'
      const result = await generateThumbnailForExistingVideo(
        generationId,
        generation.result_url,
        aspectRatio
      )

      if (result.success) {
        console.log(`✅ [${requestId}] THUMBNAIL API: Successfully generated thumbnail for ${generationId}`)
        return NextResponse.json({
          success: true,
          message: 'Thumbnail generated successfully',
          thumbnailUrl: result.thumbnailUrl,
          generationId,
          metadata: result.metadata
        })
      } else {
        console.error(`❌ [${requestId}] THUMBNAIL API: Failed to generate thumbnail:`, result.error)
        return NextResponse.json(
          { error: result.error || 'Failed to generate thumbnail' },
          { status: 500 }
        )
      }

    } else if (batchProcess) {
      // Batch process videos without thumbnails
      console.log(`🖼️ [${requestId}] THUMBNAIL API: Starting batch processing (limit: ${limit})`)

      // Get videos without thumbnails
      const { data: generations, error: queryError } = await supabase
        .from('generations')
        .select(`
          id,
          result_url,
          parameters,
          media_files (
            id,
            thumbnail_url
          )
        `)
        .eq('user_id', profile.id)
        .eq('type', 'video')
        .eq('status', 'completed')
        .not('result_url', 'is', null)
        .limit(limit)
        .order('created_at', { ascending: false })

      if (queryError) {
        console.error(`❌ [${requestId}] THUMBNAIL API: Query error:`, queryError)
        return NextResponse.json(
          { error: 'Failed to query videos' },
          { status: 500 }
        )
      }

      // Filter videos that don't have thumbnails
      const videosNeedingThumbnails = generations?.filter(gen => 
        !gen.media_files?.[0]?.thumbnail_url
      ) || []

      console.log(`🖼️ [${requestId}] THUMBNAIL API: Found ${videosNeedingThumbnails.length} videos needing thumbnails`)

      if (videosNeedingThumbnails.length === 0) {
        return NextResponse.json({
          success: true,
          message: 'No videos need thumbnail generation',
          processed: 0,
          results: []
        })
      }

      // Process thumbnails (limit to prevent timeout)
      const results = []
      const processLimit = Math.min(videosNeedingThumbnails.length, 5) // Process max 5 at a time

      for (let i = 0; i < processLimit; i++) {
        const generation = videosNeedingThumbnails[i]
        const aspectRatio = generation.parameters?.aspectRatio || '16:9'

        try {
          console.log(`🖼️ [${requestId}] THUMBNAIL API: Processing ${i + 1}/${processLimit}: ${generation.id}`)
          
          const result = await generateThumbnailForExistingVideo(
            generation.id,
            generation.result_url,
            aspectRatio
          )

          results.push({
            generationId: generation.id,
            success: result.success,
            thumbnailUrl: result.thumbnailUrl,
            error: result.error
          })

          if (result.success) {
            console.log(`✅ [${requestId}] THUMBNAIL API: Generated thumbnail for ${generation.id}`)
          } else {
            console.error(`❌ [${requestId}] THUMBNAIL API: Failed for ${generation.id}:`, result.error)
          }

        } catch (error) {
          console.error(`❌ [${requestId}] THUMBNAIL API: Error processing ${generation.id}:`, error)
          results.push({
            generationId: generation.id,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          })
        }
      }

      const successCount = results.filter(r => r.success).length
      console.log(`✅ [${requestId}] THUMBNAIL API: Batch processing completed. ${successCount}/${processLimit} successful`)

      return NextResponse.json({
        success: true,
        message: `Batch processing completed. ${successCount}/${processLimit} thumbnails generated.`,
        processed: processLimit,
        totalFound: videosNeedingThumbnails.length,
        results
      })

    } else {
      return NextResponse.json(
        { error: 'Either generationId or batchProcess must be specified' },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('Thumbnail generation API error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request parameters', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    error: 'Method not allowed. Use POST to generate thumbnails.',
    usage: {
      singleVideo: 'POST with { "generationId": "uuid" }',
      batchProcess: 'POST with { "batchProcess": true, "limit": 10 }'
    }
  }, { status: 405 })
}
