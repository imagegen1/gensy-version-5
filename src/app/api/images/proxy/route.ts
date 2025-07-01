/**
 * Image Proxy API Route for Gensy AI Creative Suite
 * Serves images from R2 storage with proper CORS headers
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { getSignedDownloadUrl } from '@/lib/storage/r2-client'

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

    if (imageId) {
      // Look up the image by ID
      const { data: mediaFile, error } = await supabase
        .from('media_files')
        .select('file_path, user_id')
        .eq('id', imageId)
        .single()

      if (error || !mediaFile) {
        console.log(`❌ [${requestId}] IMAGE PROXY: Image not found - ID: ${imageId}`)
        return NextResponse.json(
          { error: 'Image not found' },
          { status: 404 }
        )
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

    // Return the image with proper CORS headers
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': imageBuffer.byteLength.toString(),
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Expose-Headers': 'Content-Length, Content-Type',
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
