/**
 * ULTIMATE GCS BUCKET POLLING API - THE WORKING SOLUTION
 * Instead of relying on Google's broken polling API, we check the storage bucket directly
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { Storage } from '@google-cloud/storage'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { BytedanceVideoService } from '@/lib/services/bytedance-video-service'
// TODO: Re-enable thumbnail generation after fixing FFmpeg webpack issues
// import { generateVideoThumbnail, updateMediaFileWithThumbnail } from '@/lib/video/thumbnail-generator'
import { z } from 'zod'

// Initialize Google Cloud Storage with service account
const storage = new Storage({
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS
})

// Request validation schema - supports both Google Veo and ByteDance
const pollRequestSchema = z.object({
  generationId: z.string().min(1, 'Generation ID is required'),
  gcsOutputDirectory: z.string().optional(), // GCS bucket path where video will be saved (Google Veo)
  taskId: z.string().optional(), // ByteDance task ID
  provider: z.enum(['google-veo', 'bytedance']).optional(), // Provider type
  testMode: z.boolean().optional()
})

export async function POST(request: NextRequest) {
  // ULTIMATE SOLUTION: GCS bucket polling instead of broken Google API
  console.log("🚨 [GCS POLL API] - POLL REQUEST RECEIVED! Using GCS bucket polling strategy!")

  const requestId = `gcs_poll_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`

  try {
    console.log(`🔄 [${requestId}] GCS POLL: Request received`)

    // Parse request body
    const body = await request.json()
    const isTestMode = body.testMode === true

    let userId
    if (isTestMode) {
      console.log(`🧪 [${requestId}] GCS POLL: Test mode enabled`)
      userId = 'test-user'
    } else {
      // Check authentication
      const authResult = await auth()
      userId = authResult.userId
      if (!userId) {
        console.error(`❌ [${requestId}] GCS POLL: Unauthorized`)
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    // Validate request
    const validationResult = pollRequestSchema.safeParse(body)
    if (!validationResult.success) {
      console.error(`❌ [${requestId}] GCS POLL: Validation failed:`, validationResult.error.errors)
      return NextResponse.json({
        error: 'Invalid request parameters',
        details: validationResult.error.errors
      }, { status: 400 })
    }

    const { generationId, gcsOutputDirectory, taskId, provider } = validationResult.data

    console.log(`🔄 [${requestId}] POLL: Polling for completion:`, {
      generationId,
      gcsOutputDirectory,
      taskId,
      provider
    })

    // Handle ByteDance polling
    if (provider === 'bytedance' && taskId) {
      console.log(`🔥 [${requestId}] BYTEDANCE POLL: Checking ByteDance task status...`)

      try {
        const taskStatus = await BytedanceVideoService.pollTaskStatus(taskId)

        if (!taskStatus.success) {
          console.error(`❌ [${requestId}] BYTEDANCE POLL: Task status check failed:`, taskStatus.error)
          return NextResponse.json({
            success: false,
            status: 'failed',
            error: taskStatus.error
          }, { status: 500 })
        }

        if ((taskStatus.status === 'completed' || taskStatus.status === 'succeeded') && taskStatus.downloadUrl) {
          console.log(`✅ [${requestId}] BYTEDANCE POLL: Task ${taskStatus.status}! Downloading and uploading to R2...`)

          // Get generation record to retrieve model information
          const supabase = createServiceRoleClient()
          const { data: generation } = await supabase
            .from('generations')
            .select('model_used')
            .eq('id', generationId)
            .single()

          const model = generation?.model_used || 'seedance-1-0-lite-i2v-250428' // Default to I2V model

          // Download video and upload to Cloudflare R2
          const uploadResult = await BytedanceVideoService.downloadAndUploadToR2(
            taskStatus.downloadUrl,
            generationId,
            {}, // Options will be retrieved from generation record if needed
            model
          )

          if (!uploadResult.success) {
            console.error(`❌ [${requestId}] BYTEDANCE POLL: Failed to upload to R2:`, uploadResult.error)
            return NextResponse.json({
              success: false,
              status: 'failed',
              error: `Failed to upload video to R2: ${uploadResult.error}`
            }, { status: 500 })
          }

          // Update database
          if (!isTestMode) {
            const supabase = createServiceRoleClient()

            // Get user profile
            const { data: profile } = await supabase
              .from('profiles')
              .select('id')
              .eq('clerk_user_id', userId)
              .single()

            if (!profile) {
              console.error(`❌ [${requestId}] BYTEDANCE POLL: User profile not found`)
              return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
            }

            // Update generation record
            const { error: updateError } = await supabase
              .from('generations')
              .update({
                status: 'completed',
                result_url: uploadResult.url,
                completed_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
              .eq('id', generationId)

            if (updateError) {
              console.error(`❌ [${requestId}] BYTEDANCE POLL: Failed to update generation:`, updateError)
            }

            // Create media file record
            const { error: mediaFileError } = await supabase
              .from('media_files')
              .insert({
                user_id: profile.id,
                generation_id: generationId,
                filename: `video-${generationId}.mp4`,
                original_filename: `video-${generationId}.mp4`,
                file_path: uploadResult.url,
                file_size: uploadResult.size || 0,
                mime_type: 'video/mp4',
                metadata: {
                  type: 'generated-video',
                  provider: 'bytedance'
                },
                is_public: false
              })

            if (mediaFileError) {
              console.error(`❌ [${requestId}] BYTEDANCE POLL: Failed to create media file:`, mediaFileError)
            }
          }

          return NextResponse.json({
            success: true,
            status: 'completed',
            generationId,
            videoUrl: uploadResult.url,
            message: 'ByteDance video generation completed successfully!'
          })

        } else if (taskStatus.status === 'failed') {
          console.error(`❌ [${requestId}] BYTEDANCE POLL: Task failed`)
          return NextResponse.json({
            success: false,
            status: 'failed',
            error: 'ByteDance video generation failed'
          }, { status: 500 })

        } else {
          console.log(`⏳ [${requestId}] BYTEDANCE POLL: Task still processing...`)
          return NextResponse.json({
            success: true,
            status: 'processing',
            generationId,
            progress: taskStatus.progress,
            message: 'ByteDance video generation in progress...'
          })
        }

      } catch (error) {
        console.error(`❌ [${requestId}] BYTEDANCE POLL: Error:`, error)
        return NextResponse.json({
          success: false,
          status: 'failed',
          error: error instanceof Error ? error.message : 'ByteDance polling failed'
        }, { status: 500 })
      }
    }

    // Handle Google Veo polling (existing logic)
    if (!gcsOutputDirectory) {
      console.log(`⚠️ [${requestId}] GCS POLL: No GCS output directory provided, falling back to processing status`)
      return NextResponse.json({
        success: true,
        status: 'processing',
        message: 'Video generation in progress...'
      })
    }

    // =================================================================
    // --- ULTIMATE SOLUTION: DIRECT GCS BUCKET POLLING ---
    // Instead of relying on Google's broken polling API, we check the
    // storage bucket directly where the video will be created.
    // =================================================================

    console.log(`🗂️ [${requestId}] GCS POLL: Checking bucket for completed video...`)

    // Parse the GCS URI to get bucket name and prefix (folder)
    const gcsUri = gcsOutputDirectory.replace('gs://', '')
    const [bucketName, ...prefixParts] = gcsUri.split('/')
    const prefix = prefixParts.join('/')

    console.log(`🗂️ [${requestId}] GCS POLL: Bucket: ${bucketName}, Prefix: ${prefix}`)

    // Check for video files in the directory
    let files
    try {
      [files] = await storage.bucket(bucketName).getFiles({ prefix })
      console.log(`🗂️ [${requestId}] GCS POLL: Found ${files.length} files in directory`)
    } catch (bucketError) {
      if (bucketError.code === 404) {
        console.error(`❌ [${requestId}] GCS POLL: Bucket '${bucketName}' does not exist!`)
        console.error(`🔧 [${requestId}] GCS POLL: Please create the bucket manually in Google Cloud Console:`)
        console.error(`   - Name: ${bucketName}`)
        console.error(`   - Location: us-central1`)
        console.error(`   - Storage class: Standard`)

        return NextResponse.json({
          success: false,
          status: 'failed',
          error: `GCS bucket '${bucketName}' does not exist. Please create it manually in Google Cloud Console.`,
          bucketSetupInstructions: {
            name: bucketName,
            location: 'us-central1',
            storageClass: 'Standard'
          }
        }, { status: 500 })
      }
      throw bucketError
    }

    // Find the first video file in the directory
    const videoFile = files.find(file =>
      file.name.endsWith('.mp4') ||
      file.name.endsWith('.mov') ||
      file.name.endsWith('.avi')
    )

    if (videoFile) {
      console.log(`✅ [${requestId}] GCS POLL: Video found! File: ${videoFile.name}`)

      // The video is found! Get a temporary, signed URL for the frontend to use.
      const [signedUrl] = await videoFile.getSignedUrl({
        action: 'read',
        expires: Date.now() + 15 * 60 * 1000, // 15 minutes
      })

      console.log(`🔗 [${requestId}] GCS POLL: Generated signed URL for video access`)

      // Update database to mark the generation as completed
      if (!isTestMode) {
        const supabase = createServiceRoleClient()

        // Get user profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('clerk_user_id', userId)
          .single()

        if (!profile) {
          console.error(`❌ [${requestId}] GCS POLL: User profile not found`)
          return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
        }

        // Store GCS path instead of signed URL for better longevity
        const gcsPath = `gs://${bucketName}/${videoFile.name}`

        // Update generation record
        const { error: updateError } = await supabase
          .from('generations')
          .update({
            status: 'completed',
            result_url: gcsPath, // Store GCS path instead of signed URL
            completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            metadata: {
              gcsPath: videoFile.name,
              gcsBucket: bucketName,
              fileSize: videoFile.size,
              completedAt: new Date().toISOString()
            }
          })
          .eq('id', generationId)

        if (updateError) {
          console.error(`❌ [${requestId}] GCS POLL: Failed to update generation:`, updateError)
        } else {
          console.log(`✅ [${requestId}] GCS POLL: Database updated with completion status`)
        }

        // Create media file record
        const { error: mediaFileError } = await supabase
          .from('media_files')
          .insert({
            user_id: profile.id,
            generation_id: generationId,
            filename: `video-${generationId}.mp4`,
            original_filename: `video-${generationId}.mp4`,
            file_path: gcsPath, // Store GCS path instead of signed URL
            file_size: 0, // Size unknown from GCS
            mime_type: 'video/mp4',
            metadata: {
              type: 'generated-video',
              gcsPath: videoFile.name,
              provider: 'google-veo'
            },
            is_public: false
          })

        if (mediaFileError) {
          console.error(`❌ [${requestId}] GCS POLL: Failed to create media file:`, mediaFileError)
        } else {
          console.log(`✅ [${requestId}] GCS POLL: Media file record created`)
        }

        // TODO: Re-enable thumbnail generation after fixing FFmpeg webpack issues
        console.log(`🖼️ [${requestId}] GCS POLL: Thumbnail generation temporarily disabled due to FFmpeg webpack issues`)

        // Placeholder for future thumbnail generation
        // This will be re-enabled once we fix the FFmpeg module loading issues
      }

      return NextResponse.json({
        success: true,
        status: 'completed',
        generationId,
        videoUrl: signedUrl, // Send the direct video URL to the frontend!
        message: 'Video generation completed successfully!'
      })

    } else {
      console.log(`⏳ [${requestId}] GCS POLL: Video not found yet in bucket. Still processing...`)

      // No video file yet, tell the frontend to keep polling.
      return NextResponse.json({
        success: true,
        status: 'processing',
        generationId,
        message: 'Video generation in progress...'
      })
    }

  } catch (error) {
    console.error(`❌ [${requestId}] GCS POLL: Critical error:`, error)
    return NextResponse.json({
      success: false,
      status: 'failed',
      error: error instanceof Error ? error.message : 'Failed to poll storage bucket'
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    error: 'Method not allowed. Use POST to poll video generation status.'
  }, { status: 405 })
}
