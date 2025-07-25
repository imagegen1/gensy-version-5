import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { Storage } from '@google-cloud/storage'
import { Sanitizer } from '@/lib/security'

// Initialize Google Cloud Storage with proper authentication
function createGoogleCloudStorage() {
  const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS
  const credentialsBase64 = process.env.GOOGLE_CREDENTIALS_BASE64

  if (credentialsBase64) {
    // Production: Use base64 encoded credentials
    console.log('🔐 VIDEO PROXY: Using base64 credentials for authentication')
    const credentials = JSON.parse(Buffer.from(credentialsBase64, 'base64').toString())

    return new Storage({
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
      credentials
    })
  } else if (credentialsPath) {
    // Development: Use credentials file path
    console.log('🔐 VIDEO PROXY: Using credentials file for authentication')
    return new Storage({
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
      keyFilename: credentialsPath
    })
  } else {
    throw new Error('Missing Google credentials: Set either GOOGLE_APPLICATION_CREDENTIALS or GOOGLE_CREDENTIALS_BASE64')
  }
}

const storage = createGoogleCloudStorage()

// Helper function to generate fresh signed URL
async function generateSignedUrl(bucketName: string, filePath: string): Promise<string> {
  try {
    const options = {
      version: 'v4' as const,
      action: 'read' as const,
      expires: Date.now() + 15 * 60 * 1000, // URL expires in 15 minutes
    }

    const [url] = await storage
      .bucket(bucketName)
      .file(filePath)
      .getSignedUrl(options)

    return url
  } catch (error) {
    console.error('Error generating signed URL:', error)
    throw error
  }
}

// Helper function to extract GCS path from URL
function extractGcsPath(url: string): { bucket: string; filePath: string } | null {
  try {
    // Handle different GCS URL formats:
    // 1. https://storage.googleapis.com/bucket-name/path/to/file
    // 2. gs://bucket-name/path/to/file
    // 3. https://storage.cloud.google.com/bucket-name/path/to/file

    if (url.startsWith('gs://')) {
      const withoutProtocol = url.substring(5) // Remove 'gs://'
      const firstSlashIndex = withoutProtocol.indexOf('/')
      if (firstSlashIndex === -1) return null

      return {
        bucket: withoutProtocol.substring(0, firstSlashIndex),
        filePath: withoutProtocol.substring(firstSlashIndex + 1)
      }
    }

    const urlObj = new URL(url)
    if (urlObj.hostname === 'storage.googleapis.com' || urlObj.hostname === 'storage.cloud.google.com') {
      const pathParts = urlObj.pathname.substring(1).split('/') // Remove leading '/'
      if (pathParts.length < 2) return null

      return {
        bucket: pathParts[0],
        filePath: pathParts.slice(1).join('/')
      }
    }

    return null
  } catch (error) {
    console.error('Error extracting GCS path:', error)
    return null
  }
}

export async function GET(request: NextRequest) {
  const requestId = `video_proxy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  console.log(`🎬 [${requestId}] VIDEO PROXY: Request received`)

  try {
    // Get query parameters first
    const { searchParams } = new URL(request.url)
    const generationId = searchParams.get('id')
    const directUrl = searchParams.get('url')
    const testMode = searchParams.get('testMode') === 'true'

    // Check for test mode
    const isTestMode = process.env.NODE_ENV === 'development' &&
                      (process.env.NEXT_PUBLIC_TEST_MODE === 'true' || testMode)

    let userId
    if (isTestMode) {
      console.log(`🧪 [${requestId}] VIDEO PROXY: Test mode enabled - bypassing authentication`)
      userId = 'test-user'
    } else {
      // Check authentication
      const { userId: authUserId } = await auth()
      if (!authUserId) {
        console.log(`❌ [${requestId}] VIDEO PROXY: Authentication failed`)
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        )
      }
      userId = authUserId
    }

    if (!generationId && !directUrl) {
      console.log(`❌ [${requestId}] VIDEO PROXY: Missing generation ID or URL`)
      return NextResponse.json(
        { error: 'Generation ID or URL is required' },
        { status: 400 }
      )
    }

    console.log(`🔍 [${requestId}] VIDEO PROXY: Looking up video - ID: ${generationId}, URL: ${directUrl}`)

    const supabase = createServiceRoleClient()

    console.log(`🔍 [${requestId}] VIDEO PROXY: Authenticated user ID: ${userId}`)

    let profile
    if (isTestMode) {
      console.log(`🧪 [${requestId}] VIDEO PROXY: Test mode - using mock profile`)
      profile = { id: 'test-profile' }
    } else {
      // Get user profile to map Clerk user ID to Supabase profile ID
      const { data: profileData } = await supabase
        .from('profiles')
        .select('id')
        .eq('clerk_user_id', userId)
        .single()

      if (!profileData) {
        console.log(`❌ [${requestId}] VIDEO PROXY: User profile not found for Clerk ID: ${userId}`)
        return NextResponse.json(
          { error: 'User profile not found' },
          { status: 404 }
        )
      }
      profile = profileData
    }

    console.log(`🔍 [${requestId}] VIDEO PROXY: Profile ID: ${profile.id}`)
    console.log(`🔍 [${requestId}] VIDEO PROXY: Generation ID format check:`, {
      generationId,
      isUUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(generationId || ''),
      length: generationId?.length || 0,
      startsWithVideo: generationId?.startsWith('video_') || false
    })

    let videoUrl: string

    if (generationId) {
      let generation

      if (isTestMode && generationId.startsWith('test-generation-')) {
        console.log(`🧪 [${requestId}] VIDEO PROXY: Test mode - looking up video in GCS directly`)
        // For test mode, try to find the video directly in GCS
        try {
          const { Storage } = require('@google-cloud/storage')
          const testStorage = createGoogleCloudStorage()

          const bucket = testStorage.bucket('gensy-final')
          const prefix = `video-outputs/${generationId}/`

          console.log(`🗂️ [${requestId}] VIDEO PROXY: Checking GCS bucket for prefix: ${prefix}`)
          const [files] = await bucket.getFiles({ prefix })

          if (files.length > 0) {
            const videoFile = files.find(file => file.name.endsWith('.mp4'))
            if (videoFile) {
              console.log(`✅ [${requestId}] VIDEO PROXY: Found test video file: ${videoFile.name}`)
              // Generate a signed URL for the video
              const [signedUrl] = await videoFile.getSignedUrl({
                action: 'read',
                expires: Date.now() + 60 * 60 * 1000, // 1 hour
              })

              generation = {
                result_url: signedUrl,
                user_id: profile.id // Allow access in test mode
              }
            }
          }
        } catch (error) {
          console.error(`❌ [${requestId}] VIDEO PROXY: Error accessing GCS:`, error)
        }
      } else {
        // Look up the video by generation ID in database
        const { data: generationData, error } = await supabase
          .from('generations')
          .select('result_url, user_id')
          .eq('id', generationId)
          .eq('type', 'video')
          .single()

        if (error || !generationData) {
          console.log(`❌ [${requestId}] VIDEO PROXY: Generation not found - ID: ${generationId}, Error: ${error?.message}`)
          return NextResponse.json(
            { error: 'Video generation not found' },
            { status: 404 }
          )
        }
        generation = generationData
      }

      if (!generation) {
        console.log(`❌ [${requestId}] VIDEO PROXY: Generation not found - ID: ${generationId}`)
        return NextResponse.json(
          { error: 'Video generation not found' },
          { status: 404 }
        )
      }

      console.log(`🔍 [${requestId}] VIDEO PROXY: Found generation - user_id: ${generation.user_id}, profile_id: ${profile.id}`)

      // Check if user owns the generation (generations table stores profile ID)
      if (!isTestMode && generation.user_id !== profile.id) {
        console.log(`❌ [${requestId}] VIDEO PROXY: Access denied - user does not own generation`)
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        )
      }

      if (!generation.result_url) {
        console.log(`❌ [${requestId}] VIDEO PROXY: No video URL available for generation`)
        return NextResponse.json(
          { error: 'Video not available' },
          { status: 404 }
        )
      }

      // Check if this is a GCS URL that needs a fresh signed URL
      const gcsPath = extractGcsPath(generation.result_url)
      if (gcsPath) {
        console.log(`🔄 [${requestId}] VIDEO PROXY: Generating fresh signed URL for GCS path: ${gcsPath.bucket}/${gcsPath.filePath}`)
        try {
          videoUrl = await generateSignedUrl(gcsPath.bucket, gcsPath.filePath)
          console.log(`✅ [${requestId}] VIDEO PROXY: Fresh signed URL generated successfully`)
        } catch (error) {
          console.error(`❌ [${requestId}] VIDEO PROXY: Failed to generate signed URL:`, error)
          return NextResponse.json(
            { error: 'Failed to generate video access URL' },
            { status: 500 }
          )
        }
      } else {
        // Not a GCS URL, use as-is (e.g., R2 URLs)
        videoUrl = generation.result_url
        console.log(`📋 [${requestId}] VIDEO PROXY: Using stored URL directly (non-GCS)`)
      }
    } else {
      // Use the provided URL directly with robust security validation
      try {
        videoUrl = Sanitizer.validateUrl(directUrl!, 'storage')
        console.log(`✅ [${requestId}] VIDEO PROXY: Direct URL validated successfully`)
      } catch (error) {
        console.log(`❌ [${requestId}] VIDEO PROXY: Invalid or unsafe URL - ${error}`)
        return NextResponse.json(
          { error: 'Invalid or unsafe video URL' },
          { status: 400 }
        )
      }
    }

    console.log(`📥 [${requestId}] VIDEO PROXY: Fetching video from: ${videoUrl}`)

    // Fetch the video from Google Cloud Storage
    const videoResponse = await fetch(videoUrl, {
      headers: {
        'User-Agent': 'Gensy-Video-Player/1.0',
      },
    })

    if (!videoResponse.ok) {
      console.log(`❌ [${requestId}] VIDEO PROXY: Failed to fetch video:`, videoResponse.status, videoResponse.statusText)
      return NextResponse.json(
        { error: 'Failed to fetch video' },
        { status: videoResponse.status }
      )
    }

    // Get the video content
    const videoBuffer = await videoResponse.arrayBuffer()
    const contentType = videoResponse.headers.get('content-type') || 'video/mp4'
    const contentLength = videoResponse.headers.get('content-length')

    console.log(`✅ [${requestId}] VIDEO PROXY: Video fetched successfully - Size: ${videoBuffer.byteLength} bytes`)

    // Return the video with proper CORS headers
    return new NextResponse(videoBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': contentLength || videoBuffer.byteLength.toString(),
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Expose-Headers': 'Content-Length, Content-Type',
        'Accept-Ranges': 'bytes',
      },
    })

  } catch (error) {
    console.error(`❌ [${requestId}] VIDEO PROXY: Error:`, error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  })
}
