/**
 * Video Generation Status API Endpoint for Gensy AI Creative Suite
 * Handles status polling for async video generation
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { GoogleVeoService } from '@/lib/services/google-veo'
import { ReplicateWanService } from '@/lib/services/replicate-wan'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { uploadToR2 } from '@/lib/storage/r2-client'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params
    const generationId = id

    if (!generationId) {
      return NextResponse.json(
        { error: 'Generation ID is required' },
        { status: 400 }
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

    // Get generation record
    const { data: generation, error: generationError } = await supabase
      .from('generations')
      .select('*')
      .eq('id', generationId)
      .eq('user_id', profile.id) // Ensure user owns this generation
      .single()

    if (generationError || !generation) {
      return NextResponse.json(
        { error: 'Generation not found' },
        { status: 404 }
      )
    }

    // If already completed, return the result
    if (generation.status === 'completed') {
      return NextResponse.json({
        success: true,
        status: 'completed',
        videoUrl: generation.result_url,
        metadata: generation.metadata,
        completedAt: generation.completed_at
      })
    }

    // If failed, return the error
    if (generation.status === 'failed') {
      return NextResponse.json({
        success: false,
        status: 'failed',
        error: generation.error_message,
        failedAt: generation.updated_at
      })
    }

    // Check with the provider for status update
    const jobId = generation.metadata?.jobId
    const provider = generation.metadata?.provider || generation.model_used

    if (!jobId) {
      return NextResponse.json({
        success: true,
        status: 'processing',
        progress: 0,
        message: 'Video generation in queue'
      })
    }

    try {
      let statusResult
      
      if (provider === 'google-veo') {
        statusResult = await GoogleVeoService.getGenerationStatus(jobId)
      } else if (provider === 'replicate-wan') {
        statusResult = await ReplicateWanService.checkPredictionStatus(jobId)
      } else {
        throw new Error(`Unknown provider: ${provider}`)
      }

      // Handle completion
      if (statusResult.status === 'completed' && statusResult.output) {
        const videoUrl = await handleVideoCompletion(
          generationId,
          statusResult.output,
          userId,
          profile.id,
          generation,
          supabase
        )

        return NextResponse.json({
          success: true,
          status: 'completed',
          videoUrl,
          metadata: generation.metadata,
          completedAt: new Date().toISOString()
        })
      }

      // Handle failure
      if (statusResult.status === 'failed') {
        await supabase
          .from('generations')
          .update({
            status: 'failed',
            error_message: statusResult.error || 'Video generation failed',
            updated_at: new Date().toISOString()
          })
          .eq('id', generationId)

        return NextResponse.json({
          success: false,
          status: 'failed',
          error: statusResult.error || 'Video generation failed',
          failedAt: new Date().toISOString()
        })
      }

      // Still processing
      return NextResponse.json({
        success: true,
        status: 'processing',
        progress: statusResult.progress || 0,
        message: 'Video generation in progress...'
      })

    } catch (error) {
      console.error('Error checking video generation status:', error)
      
      return NextResponse.json({
        success: true,
        status: 'processing',
        progress: 0,
        message: 'Checking generation status...'
      })
    }

  } catch (error) {
    console.error('Status API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Handle video completion and upload
 */
async function handleVideoCompletion(
  generationId: string,
  videoOutput: string,
  userId: string,
  profileId: string,
  generation: any,
  supabase: any
): Promise<string | null> {
  try {
    let videoBuffer: Buffer
    let filename: string

    // Handle different output formats
    if (videoOutput.startsWith('http')) {
      // Download video from URL
      const response = await fetch(videoOutput)
      if (!response.ok) {
        throw new Error(`Failed to download video: ${response.statusText}`)
      }
      videoBuffer = Buffer.from(await response.arrayBuffer())
      filename = `video-${generationId}.mp4`
    } else if (videoOutput.startsWith('data:')) {
      // Handle data URL
      const base64Data = videoOutput.split(',')[1]
      videoBuffer = Buffer.from(base64Data, 'base64')
      filename = `video-${generationId}.mp4`
    } else {
      // Assume base64 encoded
      videoBuffer = Buffer.from(videoOutput, 'base64')
      filename = `video-${generationId}.mp4`
    }

    // Upload video to R2 storage
    const uploadResult = await uploadToR2({
      key: `videos/${userId}/${filename}`,
      file: videoBuffer,
      contentType: 'video/mp4',
      metadata: {
        generationId,
        userId: profileId,
        type: 'generated-video',
        provider: generation.metadata?.provider || generation.model_used
      },
      isPublic: false
    })

    if (!uploadResult.success) {
      console.error('Failed to upload video to R2:', uploadResult.error)
      throw new Error('Failed to upload video')
    }

    // Update generation record
    await supabase
      .from('generations')
      .update({
        status: 'completed',
        result_url: uploadResult.url,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        metadata: {
          ...generation.metadata,
          fileSize: videoBuffer.length,
          uploadedAt: new Date().toISOString()
        }
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
          provider: generation.metadata?.provider || generation.model_used,
          duration: generation.metadata?.duration || 5,
          aspectRatio: generation.metadata?.aspectRatio || '16:9',
          style: generation.metadata?.style || 'realistic'
        },
        is_public: false
      })

    return uploadResult.url

  } catch (error) {
    console.error('Error handling video completion:', error)
    
    // Update generation with error
    await supabase
      .from('generations')
      .update({
        status: 'failed',
        error_message: `Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        updated_at: new Date().toISOString()
      })
      .eq('id', generationId)

    return null
  }
}

/**
 * Cancel video generation
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params
    const generationId = id
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

    // Get generation record
    const { data: generation } = await supabase
      .from('generations')
      .select('*')
      .eq('id', generationId)
      .eq('user_id', profile.id)
      .single()

    if (!generation) {
      return NextResponse.json(
        { error: 'Generation not found' },
        { status: 404 }
      )
    }

    // Can only cancel processing generations
    if (generation.status !== 'processing') {
      return NextResponse.json(
        { error: 'Cannot cancel completed or failed generation' },
        { status: 400 }
      )
    }

    // Cancel with provider if job ID exists
    const jobId = generation.metadata?.jobId
    const provider = generation.metadata?.provider || generation.model_used

    if (jobId) {
      try {
        if (provider === 'replicate-wan') {
          await ReplicateWanService.cancelPrediction(jobId)
        }
        // Google Veo cancellation would be implemented here
      } catch (error) {
        console.error('Error canceling with provider:', error)
      }
    }

    // Update generation status
    await supabase
      .from('generations')
      .update({
        status: 'failed',
        error_message: 'Cancelled by user',
        updated_at: new Date().toISOString()
      })
      .eq('id', generationId)

    return NextResponse.json({
      success: true,
      message: 'Video generation cancelled'
    })

  } catch (error) {
    console.error('Cancel API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
