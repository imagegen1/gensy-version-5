/**
 * Image Proxy API Route for Gensy AI Creative Suite
 * Serves images from R2 storage with proper CORS headers
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { getSignedDownloadUrl } from '@/lib/storage/r2-client'
import { generateImageFilename } from '@/lib/utils/download'

export async function GET(request: NextRequest) {
  const requestId = `image_proxy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  console.log(`🖼️ [${requestId}] IMAGE PROXY: Request received`)

  try {
    // Check authentication
    const { userId } = await auth()
    if (!userId) {
      console.log(`❌ [${requestId}] IMAGE PROXY: Authentication failed`)
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const imageId = searchParams.get('id')
    const key = searchParams.get('key')

    if (!imageId && !key) {
      console.log(`❌ [${requestId}] IMAGE PROXY: Missing image ID or key`)
      return NextResponse.json(
        { error: 'Image ID or key is required' },
        { status: 400 }
      )
    }

    console.log(`🔍 [${requestId}] IMAGE PROXY: Looking up image - ID: ${imageId}, Key: ${key}`)

    const supabase = createServiceRoleClient()

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('clerk_user_id', userId)
      .single()

    if (!profile) {
      console.log(`❌ [${requestId}] IMAGE PROXY: User profile not found`)
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      )
    }

    let fileKey: string
    let generation: any = null // Declare generation variable at function scope for dynamic filename

    if (imageId) {
      // First try to look up by media file ID with generation data
      let { data: mediaFile, error } = await supabase
        .from('media_files')
        .select('file_path, user_id, generation_id')
        .eq('id', imageId)
        .single()

      // If not found by media file ID, try looking up by generation ID
      if (error || !mediaFile) {
        console.log(`🔍 [${requestId}] IMAGE PROXY: Media file not found by ID, trying generation ID...`)
        const { data: mediaFileByGeneration, error: generationError } = await supabase
          .from('media_files')
          .select('file_path, user_id, generation_id')
          .eq('generation_id', imageId)
          .single()

        if (generationError || !mediaFileByGeneration) {
          console.log(`❌ [${requestId}] IMAGE PROXY: Image not found - ID: ${imageId} (tried both media file ID and generation ID)`)
          return NextResponse.json(
            { error: 'Image not found' },
            { status: 404 }
          )
        }

        mediaFile = mediaFileByGeneration
        console.log(`✅ [${requestId}] IMAGE PROXY: Found media file by generation ID`)
      } else {
        console.log(`✅ [${requestId}] IMAGE PROXY: Found media file by media file ID`)
      }

      // If we have a generation_id, fetch the generation data for dynamic filename
      if (mediaFile.generation_id) {
        console.log(`🔍 [${requestId}] IMAGE PROXY: Fetching generation data for dynamic filename...`)

        // First try with all fields for dynamic naming, fallback to basic fields if needed
        let { data: generationData, error: genError } = await supabase
          .from('generations')
          .select('prompt, model_used, created_at')
          .eq('id', mediaFile.generation_id)
          .eq('type', 'image')
          .single()

        // If the query with additional fields fails, try with just the essential fields
        if (genError) {
          console.log(`⚠️ [${requestId}] IMAGE PROXY: Extended query failed, trying basic query - Error: ${genError?.message}`)
          const basicQuery = await supabase
            .from('generations')
            .select('prompt, created_at')
            .eq('id', mediaFile.generation_id)
            .eq('type', 'image')
            .single()

          generationData = basicQuery.data
          genError = basicQuery.error
        }

        if (!genError && generationData) {
          generation = generationData
          console.log(`✅ [${requestId}] IMAGE PROXY: Found generation data for dynamic filename`)
        } else {
          console.log(`⚠️ [${requestId}] IMAGE PROXY: Could not fetch generation data - using fallback filename`)
        }
      }

      // Check if user owns the image
      if (mediaFile.user_id !== profile.id) {
        console.log(`❌ [${requestId}] IMAGE PROXY: Access denied - user does not own image`)
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        )
      }

      // Extract the key from the file_path (remove the signed URL parameters)
      const url = new URL(mediaFile.file_path)
      fileKey = url.pathname.substring(1) // Remove leading slash
    } else {
      // Use the provided key directly
      fileKey = key!
      
      // Verify the user has access to this key (basic security check)
      if (!fileKey.includes(userId) && !fileKey.includes(profile.id)) {
        console.log(`❌ [${requestId}] IMAGE PROXY: Access denied - key does not belong to user`)
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        )
      }
    }

    console.log(`🔗 [${requestId}] IMAGE PROXY: Generating signed URL for key: ${fileKey}`)

    // Generate a fresh signed URL
    const urlResult = await getSignedDownloadUrl(fileKey, 3600) // 1 hour expiry

    if (!urlResult.success || !urlResult.url) {
      console.log(`❌ [${requestId}] IMAGE PROXY: Failed to generate signed URL:`, urlResult.error)
      return NextResponse.json(
        { error: 'Failed to generate image URL' },
        { status: 500 }
      )
    }

    console.log(`📥 [${requestId}] IMAGE PROXY: Fetching image from R2...`)

    // Fetch the image from R2
    const imageResponse = await fetch(urlResult.url)

    if (!imageResponse.ok) {
      console.log(`❌ [${requestId}] IMAGE PROXY: Failed to fetch image from R2:`, imageResponse.status)
      return NextResponse.json(
        { error: 'Failed to fetch image' },
        { status: imageResponse.status }
      )
    }

    // Get the image data
    const imageBuffer = await imageResponse.arrayBuffer()
    const contentType = imageResponse.headers.get('content-type') || 'image/png'

    console.log(`✅ [${requestId}] IMAGE PROXY: Image fetched successfully - Size: ${imageBuffer.byteLength} bytes`)

    // 🖼️ Generate dynamic filename for download (optional, with fallback)
    let dynamicFilename = 'gensy-image.png' // Default fallback

    // Determine file extension from content type
    let fileExtension = 'png'
    if (contentType.includes('jpeg') || contentType.includes('jpg')) {
      fileExtension = 'jpg'
      dynamicFilename = 'gensy-image.jpg'
    } else if (contentType.includes('webp')) {
      fileExtension = 'webp'
      dynamicFilename = 'gensy-image.webp'
    }

    if (imageId && generation) {
      try {
        // Only use dynamic naming if we have the required fields
        if (generation.prompt || generation.model_used) {
          dynamicFilename = generateImageFilename({
            url: '', // Not needed for filename generation
            prompt: generation.prompt || 'Generated image',
            model: generation.model_used || 'ai-model',
            timestamp: generation.created_at ? new Date(generation.created_at) : new Date(),
            format: fileExtension as 'png' | 'jpeg' | 'jpg'
          })
          console.log(`🖼️ [${requestId}] IMAGE PROXY: Generated dynamic filename: ${dynamicFilename}`)
        } else {
          // Fallback to simple naming with image ID
          const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '')
          dynamicFilename = `gensy-image-${imageId.slice(0, 8)}-${timestamp}.${fileExtension}`
          console.log(`🖼️ [${requestId}] IMAGE PROXY: Using fallback filename: ${dynamicFilename}`)
        }
      } catch (error) {
        console.error(`❌ [${requestId}] IMAGE PROXY: Failed to generate dynamic filename:`, error)
        dynamicFilename = `gensy-image-${Date.now()}.${fileExtension}`
      }
    }

    // Return the image with proper CORS headers and dynamic filename
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': imageBuffer.byteLength.toString(),
        'Content-Disposition': `inline; filename="${dynamicFilename}"`, // 🖼️ Dynamic filename for downloads
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Expose-Headers': 'Content-Length, Content-Type, Content-Disposition', // Expose filename header
      },
    })

  } catch (error) {
    console.error(`❌ [${requestId}] IMAGE PROXY: Error:`, error)
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
