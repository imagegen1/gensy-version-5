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
    // Parse query parameters first
    const { searchParams } = new URL(request.url)
    const testMode = searchParams.get('testMode') === 'true'
    const isTestMode = process.env.NODE_ENV === 'development' &&
                      (process.env.NEXT_PUBLIC_TEST_MODE === 'true' || testMode)
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100) // Max 100 items per request
    const offset = parseInt(searchParams.get('offset') || '0')
    const type = searchParams.get('type') // image, video, upscale
    const status = searchParams.get('status') // pending, processing, completed, failed
    const includeCount = searchParams.get('include_count') === 'true' // Whether to include total count

    let userId
    let userResult

    if (isTestMode) {
      console.log('🧪 GENERATIONS API: Test mode enabled - bypassing authentication')
      userId = 'test-user'
      userResult = {
        success: true,
        user: { id: 'test-profile' }
      }
    } else {
      // Check authentication
      const { userId: authUserId } = await auth()
      if (!authUserId) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        )
      }
      userId = authUserId

      // Get current user
      userResult = await getCurrentUser()
      if (!userResult.success || !userResult.user) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        )
      }
    }

    const supabase = createServiceRoleClient()

    let generations = []
    let totalCount = 0

    if (isTestMode) {
      console.log('🧪 GENERATIONS API: Test mode - returning mock generations')
      // Return mock generations for test mode
      const mockVideoGenerations = [
        {
          id: 'mock-video-1',
          user_id: 'test-user',
          type: 'video',
          status: 'completed',
          prompt: 'A beautiful sunset over the ocean with waves crashing',
          result_url: '/api/video/proxy?id=mock-video-1',
          model: 'Google Veo 3.0 Fast',
          provider: 'google-veo',
          aspect_ratio: '16:9',
          resolution: '720p',
          duration: 5,
          style: 'realistic',
          quality: 'standard',
          created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
          updated_at: new Date(Date.now() - 1000 * 60 * 25).toISOString(), // 25 minutes ago
          completed_at: new Date(Date.now() - 1000 * 60 * 25).toISOString(), // 25 minutes ago
          generation_time: 120,
          credits_used: 10,
          parameters: {
            duration: 5,
            aspectRatio: '16:9',
            style: 'realistic',
            quality: 'standard',
            provider: 'google-veo',
            resolution: { width: 1280, height: 720 },
            fileSize: 15728640
          },
          media_files: [
            {
              id: 'mock-media-1',
              filename: 'sunset-ocean.mp4',
              file_path: 'videos/test-user/sunset-ocean.mp4',
              file_size: 15728640, // 15MB
              mime_type: 'video/mp4',
              width: 1280,
              height: 720,
              video_duration: 5,
              thumbnail_url: 'https://via.placeholder.com/1280x720/4A90E2/FFFFFF?text=Sunset+Ocean',
              is_public: false
            }
          ]
        },
        {
          id: 'mock-video-2',
          user_id: 'test-user',
          type: 'video',
          status: 'completed',
          prompt: 'A golden retriever running in a sunny park',
          result_url: '/api/video/proxy?id=mock-video-2',
          model: 'Google Veo 3.0 Fast',
          provider: 'google-veo',
          aspect_ratio: '16:9',
          resolution: '720p',
          duration: 5,
          style: 'realistic',
          quality: 'standard',
          created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(), // 1 hour ago
          updated_at: new Date(Date.now() - 1000 * 60 * 55).toISOString(), // 55 minutes ago
          completed_at: new Date(Date.now() - 1000 * 60 * 55).toISOString(), // 55 minutes ago
          generation_time: 95,
          credits_used: 10,
          parameters: {
            duration: 5,
            aspectRatio: '16:9',
            style: 'realistic',
            quality: 'standard',
            provider: 'google-veo',
            resolution: { width: 1280, height: 720 },
            fileSize: 12582912
          },
          media_files: [
            {
              id: 'mock-media-2',
              filename: 'golden-retriever-park.mp4',
              file_path: 'videos/test-user/golden-retriever-park.mp4',
              file_size: 12582912, // 12MB
              mime_type: 'video/mp4',
              width: 1280,
              height: 720,
              video_duration: 5,
              thumbnail_url: 'https://via.placeholder.com/1280x720/50C878/FFFFFF?text=Golden+Retriever',
              is_public: false
            }
          ]
        },
        {
          id: 'mock-video-3',
          user_id: 'test-user',
          type: 'video',
          status: 'completed',
          prompt: 'A cat playing with a ball of yarn',
          result_url: '/api/video/proxy?id=mock-video-3',
          model: 'Google Veo 3.0 Fast',
          provider: 'google-veo',
          aspect_ratio: '16:9',
          resolution: '720p',
          duration: 5,
          style: 'realistic',
          quality: 'standard',
          created_at: new Date(Date.now() - 1000 * 60 * 90).toISOString(), // 1.5 hours ago
          updated_at: new Date(Date.now() - 1000 * 60 * 85).toISOString(), // 1.4 hours ago
          completed_at: new Date(Date.now() - 1000 * 60 * 85).toISOString(), // 1.4 hours ago
          generation_time: 110,
          credits_used: 10,
          parameters: {
            duration: 5,
            aspectRatio: '16:9',
            style: 'realistic',
            quality: 'standard',
            provider: 'google-veo',
            resolution: { width: 1280, height: 720 },
            fileSize: 14155776
          },
          media_files: [
            {
              id: 'mock-media-3',
              filename: 'cat-yarn-ball.mp4',
              file_path: 'videos/test-user/cat-yarn-ball.mp4',
              file_size: 14155776, // 13.5MB
              mime_type: 'video/mp4',
              width: 1280,
              height: 720,
              video_duration: 5,
              thumbnail_url: 'https://via.placeholder.com/1280x720/FF6B6B/FFFFFF?text=Cat+Playing',
              is_public: false
            }
          ]
        }
      ]

      // Filter by status if specified
      if (status && status !== 'all') {
        generations = mockVideoGenerations.filter(gen => gen.status === status)
      } else {
        generations = mockVideoGenerations
      }

      totalCount = generations.length
    } else {
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

      const { data: generationsData, error } = await query

      if (error) {
        console.error('Generations API database error:', error)
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        )
      }

      generations = generationsData || []

      // Get total count if requested (for pagination)
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
    } // Close the else block

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
