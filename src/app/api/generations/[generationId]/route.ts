/**
 * Individual Generation API Route for Gensy AI Creative Suite
 * Handles operations on specific generations
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getCurrentUser } from '@/lib/auth'
import { createServiceRoleClient } from '@/lib/supabase/server'

interface RouteParams {
  params: Promise<{
    generationId: string
  }>
}

export async function GET(
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

    const { generationId } = await params
    const supabase = createServiceRoleClient()

    // Get generation with media files
    const { data: generation, error } = await supabase
      .from('generations')
      .select(`
        *,
        media_files (
          id,
          filename,
          file_path,
          file_size,
          mime_type,
          width,
          height,
          duration,
          is_public,
          created_at
        )
      `)
      .eq('id', generationId)
      .eq('user_id', userResult.user.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Generation not found' },
          { status: 404 }
        )
      }
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      generation,
    })
  } catch (error) {
    console.error('Get generation API error:', error)
    return NextResponse.json(
      { error: 'Failed to get generation' },
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

    // Get current user
    const userResult = await getCurrentUser()
    if (!userResult.success || !userResult.user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const { generationId } = await params
    const body = await request.json()
    const { status, result_url, error_message, processing_time_seconds } = body

    // Validate status
    if (status && !['pending', 'processing', 'completed', 'failed'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      )
    }

    const supabase = createServiceRoleClient()

    // Prepare update data
    const updateData: any = {}
    if (status) updateData.status = status
    if (result_url) updateData.result_url = result_url
    if (error_message) updateData.error_message = error_message
    if (processing_time_seconds) updateData.processing_time_seconds = processing_time_seconds
    
    if (status === 'completed' || status === 'failed') {
      updateData.completed_at = new Date().toISOString()
    }

    // Update generation
    const { data: generation, error } = await supabase
      .from('generations')
      .update(updateData)
      .eq('id', generationId)
      .eq('user_id', userResult.user.id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Generation not found' },
          { status: 404 }
        )
      }
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      generation,
    })
  } catch (error) {
    console.error('Update generation API error:', error)
    return NextResponse.json(
      { error: 'Failed to update generation' },
      { status: 500 }
    )
  }
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

    const { generationId } = await params
    const supabase = createServiceRoleClient()

    // Delete generation (cascade will handle related media files)
    const { error } = await supabase
      .from('generations')
      .delete()
      .eq('id', generationId)
      .eq('user_id', userResult.user.id)

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Generation deleted successfully',
    })
  } catch (error) {
    console.error('Delete generation API error:', error)
    return NextResponse.json(
      { error: 'Failed to delete generation' },
      { status: 500 }
    )
  }
}
