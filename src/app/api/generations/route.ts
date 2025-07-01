/**
 * Generations API Route for Gensy AI Creative Suite
 * Handles AI generation requests and history
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getCurrentUser, checkUserCredits } from '@/lib/auth'
import { createServiceRoleClient } from '@/lib/supabase/server'

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

    // Get current user
    const userResult = await getCurrentUser()
    if (!userResult.success || !userResult.user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100) // Max 100 items per request
    const offset = parseInt(searchParams.get('offset') || '0')
    const type = searchParams.get('type') // image, video, upscale
    const status = searchParams.get('status') // pending, processing, completed, failed
    const includeCount = searchParams.get('include_count') === 'true' // Whether to include total count

    const supabase = createServiceRoleClient()

    let query = supabase
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
          video_duration,
          thumbnail_url,
          is_public
        )
      `)
      .eq('user_id', userResult.user.id)
      .order('created_at', { ascending: false })

    // Apply filters
    if (type) {
      query = query.eq('type', type)
    }

    if (status) {
      query = query.eq('status', status)
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: generations, error } = await query

    if (error) {
      console.error('Generations API database error:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    // Get total count if requested (for pagination)
    let totalCount = 0
    if (includeCount) {
      let countQuery = supabase
        .from('generations')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userResult.user.id)

      if (type) {
        countQuery = countQuery.eq('type', type)
      }
      if (status) {
        countQuery = countQuery.eq('status', status)
      }

      const { count } = await countQuery
      totalCount = count || 0
    }

    return NextResponse.json({
      success: true,
      generations: generations || [],
      pagination: {
        limit,
        offset,
        total: includeCount ? totalCount : generations?.length || 0,
        hasMore: includeCount ? (offset + limit < totalCount) : (generations?.length === limit),
      },
    })
  } catch (error) {
    console.error('Get generations API error:', error)
    return NextResponse.json(
      { error: 'Failed to get generations' },
      { status: 500 }
    )
  }
}

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
    const { type, prompt, model_used, credits_required = 1, metadata = {} } = body

    // Validate input
    if (!type || !prompt || !model_used) {
      return NextResponse.json(
        { error: 'type, prompt, and model_used are required' },
        { status: 400 }
      )
    }

    if (!['image', 'video', 'upscale'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid generation type' },
        { status: 400 }
      )
    }

    // Check user credits
    const creditsCheck = await checkUserCredits(credits_required)
    if (!creditsCheck.hasCredits) {
      return NextResponse.json(
        { 
          error: 'Insufficient credits',
          required: credits_required,
          available: creditsCheck.currentCredits,
        },
        { status: 402 }
      )
    }

    const supabase = createServiceRoleClient()

    // Create generation record
    const { data: generation, error: createError } = await supabase
      .from('generations')
      .insert({
        user_id: userResult.user.id,
        type,
        prompt,
        model_used,
        credits_used: credits_required,
        metadata,
        status: 'pending',
      })
      .select()
      .single()

    if (createError) {
      return NextResponse.json(
        { error: createError.message },
        { status: 500 }
      )
    }

    // Deduct credits
    const { error: deductError } = await supabase.rpc('deduct_user_credits', {
      p_user_id: userResult.user.id,
      p_credits_to_deduct: credits_required,
      p_generation_id: generation.id,
      p_description: `${type} generation: ${prompt.substring(0, 50)}...`,
    })

    if (deductError) {
      // If credit deduction fails, delete the generation record
      await supabase
        .from('generations')
        .delete()
        .eq('id', generation.id)

      return NextResponse.json(
        { error: 'Failed to deduct credits' },
        { status: 500 }
      )
    }

    // TODO: Queue the generation job here
    // This would typically involve sending the generation to a background job queue
    // For now, we'll just return the generation record

    return NextResponse.json({
      success: true,
      generation,
      message: 'Generation queued successfully',
    })
  } catch (error) {
    console.error('Create generation API error:', error)
    return NextResponse.json(
      { error: 'Failed to create generation' },
      { status: 500 }
    )
  }
}
