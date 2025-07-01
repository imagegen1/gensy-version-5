/**
 * Individual File Management API Route for Gensy AI Creative Suite
 * Handles operations on specific files (delete, update metadata)
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { deleteMediaFile, updateMediaFileMetadata } from '@/lib/storage/utils'
import { getCurrentUser } from '@/lib/auth'

interface RouteParams {
  params: Promise<{
    fileId: string
  }>
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
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

    // Get current user
    const userResult = await getCurrentUser()
    if (!userResult.success || !userResult.user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const { fileId } = await params

    if (!fileId) {
      return NextResponse.json(
        { error: 'File ID is required' },
        { status: 400 }
      )
    }

    // Delete the file
    const result = await deleteMediaFile(fileId, userResult.user.id)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'File deleted successfully',
    })
  } catch (error) {
    console.error('Delete file API error:', error)
    return NextResponse.json(
      { error: 'Failed to delete file' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
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

    const { fileId } = await params
    const body = await request.json()

    if (!fileId) {
      return NextResponse.json(
        { error: 'File ID is required' },
        { status: 400 }
      )
    }

    // Extract allowed metadata fields
    const { width, height, duration, isPublic } = body
    const metadata: any = {}

    if (typeof width === 'number') metadata.width = width
    if (typeof height === 'number') metadata.height = height
    if (typeof duration === 'number') metadata.duration = duration
    if (typeof isPublic === 'boolean') metadata.is_public = isPublic

    if (Object.keys(metadata).length === 0) {
      return NextResponse.json(
        { error: 'No valid metadata fields provided' },
        { status: 400 }
      )
    }

    // Update the file metadata
    const result = await updateMediaFileMetadata(fileId, metadata)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      file: result.file,
    })
  } catch (error) {
    console.error('Update file API error:', error)
    return NextResponse.json(
      { error: 'Failed to update file' },
      { status: 500 }
    )
  }
}
