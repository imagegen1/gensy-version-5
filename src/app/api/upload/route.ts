/**
 * File Upload API Route for Gensy AI Creative Suite
 * Handles file uploads to Cloudflare R2 storage
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { processAndUploadFile } from '@/lib/storage/utils'
import { validateFile } from '@/lib/storage/r2-client'

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

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    const generationId = formData.get('generationId') as string
    const isPublic = formData.get('isPublic') === 'true'
    const prefix = formData.get('prefix') as string

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file
    const validation = validateFile(file)
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    // Process and upload file
    const result = await processAndUploadFile(file, {
      generationId: generationId || undefined,
      isPublic,
      prefix: prefix || 'uploads',
      metadata: {
        uploadedVia: 'api',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      file: {
        id: result.mediaFileId,
        key: result.key,
        url: result.url,
        size: result.size,
        contentType: result.contentType,
        generationId: result.generationId,
      },
    })
  } catch (error) {
    console.error('Upload API error:', error)
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')
    const type = searchParams.get('type')
    const generationId = searchParams.get('generationId')

    const { getUserMediaFiles } = await import('@/lib/storage/utils')
    const { getCurrentUser } = await import('@/lib/auth')

    // Get current user
    const userResult = await getCurrentUser()
    if (!userResult.success || !userResult.user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Get user's media files
    const result = await getUserMediaFiles(userResult.user.id, {
      limit,
      offset,
      type: type || undefined,
      generationId: generationId || undefined,
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      files: result.files,
      pagination: {
        limit,
        offset,
        total: result.files?.length || 0,
      },
    })
  } catch (error) {
    console.error('Get files API error:', error)
    return NextResponse.json(
      { error: 'Failed to get files' },
      { status: 500 }
    )
  }
}
