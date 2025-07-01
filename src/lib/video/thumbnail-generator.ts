/**
 * Video Thumbnail Generator Service
 * Extracts frames from videos and generates thumbnails for gallery display
 */

import ffmpeg from 'fluent-ffmpeg'
import ffmpegPath from 'ffmpeg-static'
import sharp from 'sharp'
import { uploadFile } from '@/lib/storage/r2-client'
import { createServiceRoleClient } from '@/lib/supabase/server'
import fs from 'fs'
import path from 'path'
import os from 'os'

// Set FFmpeg path
if (ffmpegPath) {
  ffmpeg.setFfmpegPath(ffmpegPath)
}

export interface ThumbnailOptions {
  width?: number
  height?: number
  quality?: number
  timestamp?: number // seconds into video to extract frame
}

export interface ThumbnailResult {
  success: boolean
  thumbnailUrl?: string
  error?: string
  metadata?: {
    width: number
    height: number
    fileSize: number
    format: string
  }
}

/**
 * Generate thumbnail from video URL
 */
export async function generateVideoThumbnail(
  videoUrl: string,
  generationId: string,
  aspectRatio: string = '16:9',
  options: ThumbnailOptions = {}
): Promise<ThumbnailResult> {
  const requestId = `thumb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  console.log(`🖼️ [${requestId}] THUMBNAIL: Starting thumbnail generation for ${generationId}`)

  try {
    // Calculate optimal thumbnail dimensions based on aspect ratio
    const dimensions = calculateThumbnailDimensions(aspectRatio, options)
    console.log(`📐 [${requestId}] THUMBNAIL: Target dimensions: ${dimensions.width}x${dimensions.height}`)

    // Create temporary file paths
    const tempDir = os.tmpdir()
    const tempVideoPath = path.join(tempDir, `video_${generationId}.mp4`)
    const tempThumbnailPath = path.join(tempDir, `thumbnail_${generationId}.jpg`)

    try {
      // Download video to temporary file
      console.log(`⬇️ [${requestId}] THUMBNAIL: Downloading video from ${videoUrl}`)
      await downloadVideoToFile(videoUrl, tempVideoPath)

      // Extract frame using FFmpeg
      console.log(`🎬 [${requestId}] THUMBNAIL: Extracting frame at ${options.timestamp || 1}s`)
      await extractVideoFrame(tempVideoPath, tempThumbnailPath, options.timestamp || 1)

      // Process thumbnail with Sharp
      console.log(`🖼️ [${requestId}] THUMBNAIL: Processing thumbnail with Sharp`)
      const processedThumbnail = await processThumbailWithSharp(
        tempThumbnailPath,
        dimensions,
        options.quality || 85
      )

      // Upload to Cloudflare R2
      const thumbnailFilename = `thumbnails/thumbnail-${generationId}.jpg`
      console.log(`☁️ [${requestId}] THUMBNAIL: Uploading to R2: ${thumbnailFilename}`)
      
      const uploadResult = await uploadFile(processedThumbnail, {
        filename: thumbnailFilename,
        contentType: 'image/jpeg',
        metadata: {
          generationId,
          aspectRatio,
          width: dimensions.width,
          height: dimensions.height,
          type: 'video-thumbnail'
        },
        isPublic: true
      })

      if (!uploadResult.success) {
        throw new Error(`Failed to upload thumbnail: ${uploadResult.error}`)
      }

      console.log(`✅ [${requestId}] THUMBNAIL: Successfully generated and uploaded thumbnail`)

      return {
        success: true,
        thumbnailUrl: uploadResult.url,
        metadata: {
          width: dimensions.width,
          height: dimensions.height,
          fileSize: processedThumbnail.length,
          format: 'jpeg'
        }
      }

    } finally {
      // Clean up temporary files
      try {
        if (fs.existsSync(tempVideoPath)) fs.unlinkSync(tempVideoPath)
        if (fs.existsSync(tempThumbnailPath)) fs.unlinkSync(tempThumbnailPath)
        console.log(`🧹 [${requestId}] THUMBNAIL: Cleaned up temporary files`)
      } catch (cleanupError) {
        console.warn(`⚠️ [${requestId}] THUMBNAIL: Failed to clean up temp files:`, cleanupError)
      }
    }

  } catch (error) {
    console.error(`❌ [${requestId}] THUMBNAIL: Generation failed:`, error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}

/**
 * Calculate optimal thumbnail dimensions based on aspect ratio
 */
function calculateThumbnailDimensions(
  aspectRatio: string,
  options: ThumbnailOptions
): { width: number; height: number } {
  // Default base width for thumbnails
  const baseWidth = options.width || 300

  switch (aspectRatio) {
    case '16:9':
      return {
        width: baseWidth,
        height: Math.round(baseWidth * (9 / 16))
      }
    case '9:16':
      return {
        width: Math.round(baseWidth * (9 / 16)),
        height: baseWidth
      }
    case '1:1':
      return {
        width: baseWidth,
        height: baseWidth
      }
    case '4:3':
      return {
        width: baseWidth,
        height: Math.round(baseWidth * (3 / 4))
      }
    default:
      // Default to 16:9 if unknown aspect ratio
      return {
        width: baseWidth,
        height: Math.round(baseWidth * (9 / 16))
      }
  }
}

/**
 * Download video from URL to local file
 */
async function downloadVideoToFile(videoUrl: string, outputPath: string): Promise<void> {
  const response = await fetch(videoUrl)
  if (!response.ok) {
    throw new Error(`Failed to download video: ${response.status} ${response.statusText}`)
  }

  const buffer = await response.arrayBuffer()
  fs.writeFileSync(outputPath, Buffer.from(buffer))
}

/**
 * Extract frame from video using FFmpeg
 */
function extractVideoFrame(
  videoPath: string,
  outputPath: string,
  timestamp: number
): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .seekInput(timestamp)
      .frames(1)
      .output(outputPath)
      .on('end', () => {
        console.log('FFmpeg frame extraction completed')
        resolve()
      })
      .on('error', (error) => {
        console.error('FFmpeg error:', error)
        reject(new Error(`FFmpeg extraction failed: ${error.message}`))
      })
      .run()
  })
}

/**
 * Process thumbnail with Sharp for optimization
 */
async function processThumbailWithSharp(
  inputPath: string,
  dimensions: { width: number; height: number },
  quality: number
): Promise<Buffer> {
  return await sharp(inputPath)
    .resize(dimensions.width, dimensions.height, {
      fit: 'cover',
      position: 'center'
    })
    .jpeg({
      quality,
      progressive: true,
      mozjpeg: true
    })
    .toBuffer()
}

/**
 * Update media file record with thumbnail URL
 */
export async function updateMediaFileWithThumbnail(
  generationId: string,
  thumbnailUrl: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createServiceRoleClient()

    const { error } = await supabase
      .from('media_files')
      .update({ thumbnail_url: thumbnailUrl })
      .eq('generation_id', generationId)

    if (error) {
      console.error('Failed to update media file with thumbnail:', error)
      return { success: false, error: error.message }
    }

    console.log(`✅ Updated media file with thumbnail URL for generation ${generationId}`)
    return { success: true }

  } catch (error) {
    console.error('Error updating media file:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Generate thumbnail for existing video (batch processing)
 */
export async function generateThumbnailForExistingVideo(
  generationId: string,
  videoUrl: string,
  aspectRatio: string = '16:9'
): Promise<ThumbnailResult> {
  console.log(`🔄 THUMBNAIL: Processing existing video ${generationId}`)

  const result = await generateVideoThumbnail(videoUrl, generationId, aspectRatio)

  if (result.success && result.thumbnailUrl) {
    // Update database with thumbnail URL
    await updateMediaFileWithThumbnail(generationId, result.thumbnailUrl)
  }

  return result
}
