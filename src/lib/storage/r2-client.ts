/**
 * Cloudflare R2 Storage Client for Gensy AI Creative Suite
 * S3-compatible storage client for media files
 */

import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand, CreateMultipartUploadCommand, UploadPartCommand, CompleteMultipartUploadCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { lookup } from 'mime-types'
import { env } from '../env'

// Create R2 client with optimized settings for video uploads
const r2Client = new S3Client({
  region: 'auto',
  endpoint: env.CLOUDFLARE_R2_ENDPOINT,
  credentials: {
    accessKeyId: env.CLOUDFLARE_R2_ACCESS_KEY_ID,
    secretAccessKey: env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
  },
  // Optimize for large file uploads
  requestHandler: {
    requestTimeout: 300000, // 5 minutes timeout for large uploads
    connectionTimeout: 30000, // 30 seconds connection timeout
  },
  maxAttempts: 3, // Retry failed uploads
})

export interface UploadOptions {
  key: string
  file: File | Buffer
  contentType?: string
  metadata?: Record<string, string>
  isPublic?: boolean
}

export interface UploadResult {
  success: boolean
  key?: string
  url?: string
  error?: string
  size?: number
  contentType?: string
}

/**
 * Upload large files using multipart upload for better performance
 */
async function uploadLargeFile(
  requestId: string,
  key: string,
  buffer: Buffer,
  contentType: string,
  metadata: Record<string, string>,
  isPublic: boolean
): Promise<void> {
  const PART_SIZE = 10 * 1024 * 1024 // 10MB per part
  const totalParts = Math.ceil(buffer.length / PART_SIZE)

  console.log(`🔄 [${requestId}] R2 MULTIPART: Starting multipart upload with ${totalParts} parts`)

  // Initialize multipart upload
  const createCommand = new CreateMultipartUploadCommand({
    Bucket: env.CLOUDFLARE_R2_BUCKET_NAME,
    Key: key,
    ContentType: contentType,
    Metadata: {
      ...metadata,
      uploadedAt: new Date().toISOString(),
      size: buffer.length.toString(),
      multipart: 'true',
    },
    ...(isPublic && { ACL: 'public-read' }),
  })

  const createResponse = await r2Client.send(createCommand)
  const uploadId = createResponse.UploadId!

  try {
    // Upload parts in parallel (limited concurrency)
    const parts: { ETag: string; PartNumber: number }[] = []
    const CONCURRENT_UPLOADS = 3 // Limit concurrent uploads to avoid overwhelming

    for (let i = 0; i < totalParts; i += CONCURRENT_UPLOADS) {
      const batch = []

      for (let j = 0; j < CONCURRENT_UPLOADS && i + j < totalParts; j++) {
        const partNumber = i + j + 1
        const start = (i + j) * PART_SIZE
        const end = Math.min(start + PART_SIZE, buffer.length)
        const partData = buffer.slice(start, end)

        batch.push(uploadPart(requestId, key, uploadId, partNumber, partData))
      }

      const batchResults = await Promise.all(batch)
      parts.push(...batchResults)

      console.log(`🔄 [${requestId}] R2 MULTIPART: Completed ${Math.min(i + CONCURRENT_UPLOADS, totalParts)}/${totalParts} parts`)
    }

    // Complete multipart upload
    const completeCommand = new CompleteMultipartUploadCommand({
      Bucket: env.CLOUDFLARE_R2_BUCKET_NAME,
      Key: key,
      UploadId: uploadId,
      MultipartUpload: {
        Parts: parts.sort((a, b) => a.PartNumber - b.PartNumber),
      },
    })

    await r2Client.send(completeCommand)
    console.log(`✅ [${requestId}] R2 MULTIPART: Upload completed successfully`)

  } catch (error) {
    console.error(`❌ [${requestId}] R2 MULTIPART: Upload failed, aborting...`, error)
    // Abort multipart upload on failure
    // Note: AbortMultipartUploadCommand would be imported if needed
    throw error
  }
}

/**
 * Upload a single part for multipart upload
 */
async function uploadPart(
  requestId: string,
  key: string,
  uploadId: string,
  partNumber: number,
  data: Buffer
): Promise<{ ETag: string; PartNumber: number }> {
  const command = new UploadPartCommand({
    Bucket: env.CLOUDFLARE_R2_BUCKET_NAME,
    Key: key,
    UploadId: uploadId,
    PartNumber: partNumber,
    Body: data,
  })

  const response = await r2Client.send(command)
  return {
    ETag: response.ETag!,
    PartNumber: partNumber,
  }
}

/**
 * Upload a file to Cloudflare R2
 */
export async function uploadFile(options: UploadOptions): Promise<UploadResult> {
  const r2RequestId = `r2_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  console.log(`☁️ [${r2RequestId}] R2 STORAGE: Starting file upload`)
  console.log(`📝 [${r2RequestId}] R2 STORAGE: Upload options:`, {
    key: options.key,
    fileType: options.file instanceof File ? 'File' : 'Buffer',
    fileName: options.file instanceof File ? options.file.name : 'Buffer',
    contentType: options.contentType,
    isPublic: options.isPublic,
    metadataKeys: Object.keys(options.metadata || {})
  })

  try {
    const { key, file, contentType, metadata = {}, isPublic = false } = options

    // Determine content type
    console.log(`🔍 [${r2RequestId}] R2 STORAGE: Determining content type...`)
    let finalContentType = contentType
    if (!finalContentType) {
      if (file instanceof File) {
        finalContentType = file.type || lookup(file.name) || 'application/octet-stream'
      } else {
        finalContentType = lookup(key) || 'application/octet-stream'
      }
    }
    console.log(`🔍 [${r2RequestId}] R2 STORAGE: Final content type: ${finalContentType}`)

    // Get file buffer
    console.log(`📦 [${r2RequestId}] R2 STORAGE: Processing file data...`)
    let buffer: Buffer
    let size: number

    if (file instanceof File) {
      console.log(`📦 [${r2RequestId}] R2 STORAGE: Converting File to Buffer...`)
      const arrayBuffer = await file.arrayBuffer()
      buffer = Buffer.from(arrayBuffer)
      size = file.size
      console.log(`📦 [${r2RequestId}] R2 STORAGE: File converted - size: ${size} bytes`)
    } else {
      console.log(`📦 [${r2RequestId}] R2 STORAGE: Using provided Buffer...`)
      buffer = file
      size = buffer.length
      console.log(`📦 [${r2RequestId}] R2 STORAGE: Buffer ready - size: ${size} bytes`)
    }

    // Choose upload method based on file size
    const MULTIPART_THRESHOLD = 50 * 1024 * 1024 // 50MB threshold for multipart upload
    const uploadStartTime = Date.now()

    if (size > MULTIPART_THRESHOLD) {
      console.log(`☁️ [${r2RequestId}] R2 STORAGE: Large file detected (${Math.round(size / 1024 / 1024)}MB), using multipart upload...`)
      await uploadLargeFile(r2RequestId, key, buffer, finalContentType, metadata, isPublic)
    } else {
      console.log(`☁️ [${r2RequestId}] R2 STORAGE: Standard upload for ${Math.round(size / 1024 / 1024 * 100) / 100}MB file...`)
      const command = new PutObjectCommand({
        Bucket: env.CLOUDFLARE_R2_BUCKET_NAME,
        Key: key,
        Body: buffer,
        ContentType: finalContentType,
        Metadata: {
          ...metadata,
          uploadedAt: new Date().toISOString(),
          size: size.toString(),
        },
        // Set public read if specified
        ...(isPublic && { ACL: 'public-read' }),
      })

      await r2Client.send(command)
    }

    const uploadEndTime = Date.now()
    const uploadTime = uploadEndTime - uploadStartTime
    const speedMBps = Math.round(size / 1024 / 1024 / (uploadTime / 1000) * 100) / 100
    console.log(`☁️ [${r2RequestId}] R2 STORAGE: Upload completed in ${uploadTime}ms (${speedMBps}MB/s)`)

    // Generate URL
    console.log(`🔗 [${r2RequestId}] R2 STORAGE: Generating access URL...`)
    const url = isPublic
      ? `${env.CLOUDFLARE_R2_PUBLIC_URL}/${key}`
      : await getSignedUrl(r2Client, new GetObjectCommand({
          Bucket: env.CLOUDFLARE_R2_BUCKET_NAME,
          Key: key,
        }), { expiresIn: 3600 }) // 1 hour

    console.log(`🔗 [${r2RequestId}] R2 STORAGE: URL generated:`, {
      isPublic,
      url: url.substring(0, 100) + (url.length > 100 ? '...' : ''),
      urlLength: url.length
    })

    const result = {
      success: true,
      key,
      url,
      size,
      contentType: finalContentType,
    }

    console.log(`✅ [${r2RequestId}] R2 STORAGE: Upload successful!`)
    console.log(`✅ [${r2RequestId}] R2 STORAGE: Final result:`, {
      success: result.success,
      key: result.key,
      size: result.size,
      contentType: result.contentType,
      hasUrl: !!result.url
    })

    return result
  } catch (error) {
    console.error(`💥 [${r2RequestId}] R2 STORAGE: Upload failed:`, error)
    console.error(`💥 [${r2RequestId}] R2 STORAGE: Error details:`, {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace',
      type: typeof error
    })
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    }
  }
}

/**
 * Get a signed URL for a file
 */
export async function getSignedDownloadUrl(
  key: string, 
  expiresIn: number = 3600
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const command = new GetObjectCommand({
      Bucket: env.CLOUDFLARE_R2_BUCKET_NAME,
      Key: key,
    })

    const url = await getSignedUrl(r2Client, command, { expiresIn })

    return { success: true, url }
  } catch (error) {
    console.error('Error generating signed URL:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate URL',
    }
  }
}

/**
 * Delete a file from R2
 */
export async function deleteFile(key: string): Promise<{ success: boolean; error?: string }> {
  try {
    const command = new DeleteObjectCommand({
      Bucket: env.CLOUDFLARE_R2_BUCKET_NAME,
      Key: key,
    })

    await r2Client.send(command)

    return { success: true }
  } catch (error) {
    console.error('Error deleting file from R2:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Delete failed',
    }
  }
}

/**
 * Check if a file exists in R2
 */
export async function fileExists(key: string): Promise<{ exists: boolean; metadata?: any; error?: string }> {
  try {
    const command = new HeadObjectCommand({
      Bucket: env.CLOUDFLARE_R2_BUCKET_NAME,
      Key: key,
    })

    const response = await r2Client.send(command)

    return {
      exists: true,
      metadata: {
        size: response.ContentLength,
        contentType: response.ContentType,
        lastModified: response.LastModified,
        metadata: response.Metadata,
      },
    }
  } catch (error: any) {
    if (error.name === 'NotFound') {
      return { exists: false }
    }

    console.error('Error checking file existence:', error)
    return {
      exists: false,
      error: error instanceof Error ? error.message : 'Check failed',
    }
  }
}

/**
 * Generate a presigned upload URL for direct client uploads
 */
export async function getPresignedUploadUrl(
  key: string,
  contentType: string,
  expiresIn: number = 3600
): Promise<{ success: boolean; url?: string; fields?: Record<string, string>; error?: string }> {
  try {
    const command = new PutObjectCommand({
      Bucket: env.CLOUDFLARE_R2_BUCKET_NAME,
      Key: key,
      ContentType: contentType,
    })

    const url = await getSignedUrl(r2Client, command, { expiresIn })

    return { 
      success: true, 
      url,
      fields: {
        'Content-Type': contentType,
      },
    }
  } catch (error) {
    console.error('Error generating presigned upload URL:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate upload URL',
    }
  }
}

/**
 * Generate a unique file key with timestamp and random suffix
 */
export function generateFileKey(
  userId: string,
  originalName: string,
  prefix: string = 'uploads'
): string {
  const timestamp = Date.now()
  const randomSuffix = Math.random().toString(36).substring(2, 8)
  const extension = originalName.split('.').pop()
  const baseName = originalName.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9]/g, '_')
  
  return `${prefix}/${userId}/${timestamp}_${randomSuffix}_${baseName}.${extension}`
}

/**
 * Validate file type and size
 */
export function validateFile(
  file: File,
  allowedTypes: string[] = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4'],
  maxSize: number = 50 * 1024 * 1024 // 50MB
): { valid: boolean; error?: string } {
  // Check file size
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size exceeds ${Math.round(maxSize / 1024 / 1024)}MB limit`,
    }
  }

  // Check file type
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type ${file.type} is not allowed. Allowed types: ${allowedTypes.join(', ')}`,
    }
  }

  return { valid: true }
}

/**
 * Legacy alias for uploadFile function
 * Used by API routes that expect uploadToR2 function name
 */
export async function uploadToR2(
  fileBuffer: Buffer,
  fileName: string,
  contentType?: string,
  metadata?: Record<string, string>
): Promise<UploadResult> {
  const r2RequestId = `r2_legacy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  console.log(`☁️ [${r2RequestId}] R2 STORAGE: Legacy uploadToR2 called - redirecting to uploadFile`)

  return uploadFile({
    key: fileName,
    file: fileBuffer,
    contentType,
    metadata,
    isPublic: true // Default to public for legacy compatibility
  })
}

export { r2Client }
