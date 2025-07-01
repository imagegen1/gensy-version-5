/**
 * Presigned Upload URL API Route for Gensy AI Creative Suite
 * Generates presigned URLs for direct client uploads to R2
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getPresignedUploadUrl, generateFileKey, validateFile } from '@/lib/storage/r2-client'
import { getCurrentUser } from '@/lib/auth'

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

    // Get current user
    const userResult = await getCurrentUser()
    if (!userResult.success || !userResult.user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { fileName, contentType, fileSize, prefix = 'uploads' } = body

    if (!fileName || !contentType) {
      return NextResponse.json(
        { error: 'fileName and contentType are required' },
        { status: 400 }
      )
    }

    // Validate file type and size
    const mockFile = {
      name: fileName,
      type: contentType,
      size: fileSize || 0,
    } as File

    const validation = validateFile(mockFile)
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    // Generate unique file key
    const fileKey = generateFileKey(userResult.user.id, fileName, prefix)

    // Get presigned upload URL
    const result = await getPresignedUploadUrl(fileKey, contentType)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      uploadUrl: result.url,
      fileKey,
      fields: result.fields,
      expiresIn: 3600, // 1 hour
    })
  } catch (error) {
    console.error('Presigned upload API error:', error)
    return NextResponse.json(
      { error: 'Failed to generate upload URL' },
      { status: 500 }
    )
  }
}
