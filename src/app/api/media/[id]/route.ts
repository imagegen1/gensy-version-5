/**
 * Media File Proxy API Route for Gensy AI Creative Suite
 * Serves media files with proper authentication and access control
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { env } from '@/lib/env'

// Create R2 client
const r2Client = new S3Client({
  region: 'auto',
  endpoint: env.CLOUDFLARE_R2_ENDPOINT,
  credentials: {
    accessKeyId: env.CLOUDFLARE_R2_ACCESS_KEY_ID,
    secretAccessKey: env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
  },
})

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  const requestId = `media_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  try {
    console.log(`📸 [${requestId}] MEDIA API: Starting media file request`)

    // Check authentication
    const { userId } = await auth()
    if (!userId) {
      console.log(`❌ [${requestId}] MEDIA API: Unauthorized - no userId`)
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log(`✅ [${requestId}] MEDIA API: Authentication successful - userId: ${userId}`)

    const { id: mediaFileId } = await params
    console.log(`📋 [${requestId}] MEDIA API: Media file ID: ${mediaFileId}`)

    const supabase = createServiceRoleClient()

    // Get user profile
    console.log(`👤 [${requestId}] MEDIA API: Fetching user profile...`)
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('clerk_user_id', userId)
      .single()

    if (!profile) {
      console.log(`❌ [${requestId}] MEDIA API: User profile not found`)
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      )
    }

    console.log(`✅ [${requestId}] MEDIA API: User profile found - profileId: ${profile.id}`)

    // Get media file
    console.log(`🔍 [${requestId}] MEDIA API: Fetching media file...`)
    const { data: mediaFile, error } = await supabase
      .from('media_files')
      .select('*')
      .eq('id', mediaFileId)
      .eq('user_id', profile.id)
      .single()

    if (error || !mediaFile) {
      console.log(`❌ [${requestId}] MEDIA API: Media file not found - ID: ${mediaFileId}`)
      return NextResponse.json(
        { error: 'Media file not found' },
        { status: 404 }
      )
    }

    console.log(`✅ [${requestId}] MEDIA API: Media file found:`, {
      id: mediaFile.id,
      filename: mediaFile.filename,
      mimeType: mediaFile.mime_type,
      fileSize: mediaFile.file_size,
      isPublic: mediaFile.is_public
    })

    // Always generate fresh signed URLs instead of using potentially expired ones
    let r2Key = mediaFile.file_path

    // If the file_path is a signed URL, extract the key from it
    if (r2Key && r2Key.startsWith('http')) {
      console.log(`🔄 [${requestId}] MEDIA API: Extracting R2 key from signed URL`)
      try {
        const url = new URL(r2Key)
        const pathParts = url.pathname.split('/')
        // Extract the key (everything after the bucket name)
        r2Key = pathParts.slice(1).join('/')
        console.log(`📝 [${requestId}] MEDIA API: Extracted R2 key: ${r2Key}`)
      } catch (error) {
        console.error(`❌ [${requestId}] MEDIA API: Failed to extract R2 key from URL:`, error)
        return NextResponse.json(
          { error: 'Invalid file path' },
          { status: 400 }
        )
      }
    }

    // Remove leading slash if present
    if (r2Key && r2Key.startsWith('/')) {
      r2Key = r2Key.substring(1)
    }

    console.log(`☁️ [${requestId}] MEDIA API: Generating fresh signed URL for R2 key: ${r2Key}`)

    // Generate a new signed URL with longer expiration
    const command = new GetObjectCommand({
      Bucket: env.CLOUDFLARE_R2_BUCKET_NAME,
      Key: r2Key,
    })

    const signedUrl = await getSignedUrl(r2Client, command, { expiresIn: 7200 }) // 2 hours

    console.log(`✅ [${requestId}] MEDIA API: Fresh signed URL generated successfully`)
    console.log(`🔗 [${requestId}] MEDIA API: Redirecting to: ${signedUrl.substring(0, 100)}...`)

    // Redirect to the fresh signed URL
    return NextResponse.redirect(signedUrl)

  } catch (error) {
    console.error(`💥 [${requestId}] MEDIA API: Error:`, error)
    return NextResponse.json(
      { error: 'Failed to serve media file' },
      { status: 500 }
    )
  }
}
