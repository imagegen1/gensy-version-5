/**
 * User Statistics API Route for Gensy AI Creative Suite
 * Provides user usage statistics and analytics
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
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

    const supabase = createServiceRoleClient()

    // Get user profile by clerk_user_id
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, credits')
      .eq('clerk_user_id', userId)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      )
    }

    // User credits are already available in the profile

    // Get generation statistics
    const { data: generations, error: genError } = await supabase
      .from('generations')
      .select('type, status, credits_used, created_at')
      .eq('user_id', profile.id)

    if (genError) {
      console.error('Error getting generations:', genError)
    }

    // Calculate stats from generations
    const totalGenerations = generations?.length || 0
    const imageGenerations = generations?.filter(g => g.type === 'image').length || 0
    const videoGenerations = generations?.filter(g => g.type === 'video').length || 0
    const upscaleGenerations = generations?.filter(g => g.type === 'upscale').length || 0
    const totalCreditsUsed = generations?.reduce((sum, g) => sum + (g.credits_used || 0), 0) || 0

    // Get recent activity (last 5 generations)
    const { data: recentGenerations, error: recentError } = await supabase
      .from('generations')
      .select('id, type, status, created_at, credits_used, prompt')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(5)

    if (recentError) {
      console.error('Error getting recent generations:', recentError)
    }

    // Get favorites count
    const { data: favorites, error: favError } = await supabase
      .from('user_favorites')
      .select('id')
      .eq('user_id', profile.id)

    if (favError) {
      console.error('Error getting favorites:', favError)
    }

    // Calculate monthly statistics
    const now = new Date()
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)

    const allGenerations = generations || []
    const thisMonthGenerations = allGenerations.filter(g =>
      new Date(g.created_at) >= currentMonthStart
    )
    const lastMonthGenerations = allGenerations.filter(g =>
      new Date(g.created_at) >= lastMonthStart && new Date(g.created_at) <= lastMonthEnd
    )

    const stats = {
      images_generated: imageGenerations,
      videos_created: videoGenerations,
      credits_remaining: profile.credits || 0,
      total_generations: totalGenerations,
      this_month: {
        images: thisMonthGenerations.filter(g => g.type === 'image').length,
        videos: thisMonthGenerations.filter(g => g.type === 'video').length,
        credits_used: thisMonthGenerations.reduce((sum, g) => sum + (g.credits_used || 0), 0)
      },
      last_month: {
        images: lastMonthGenerations.filter(g => g.type === 'image').length,
        videos: lastMonthGenerations.filter(g => g.type === 'video').length,
        credits_used: lastMonthGenerations.reduce((sum, g) => sum + (g.credits_used || 0), 0)
      }
    }

    return NextResponse.json({
      success: true,
      stats,
      totalGenerations,
      creditsUsed: totalCreditsUsed,
      creditsRemaining: profile.credits || 0,
      favoriteImages: favorites?.length || 0,
      recentActivity: recentGenerations?.map(gen => ({
        id: gen.id,
        type: gen.type,
        prompt: gen.prompt?.substring(0, 50) + (gen.prompt?.length > 50 ? '...' : ''),
        timestamp: gen.created_at,
        status: gen.status
      })) || []
    })
  } catch (error) {
    console.error('Get stats API error:', error)
    return NextResponse.json(
      { error: 'Failed to get statistics' },
      { status: 500 }
    )
  }
}
