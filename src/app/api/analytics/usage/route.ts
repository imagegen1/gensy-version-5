/**
 * Usage Analytics API Endpoint for Gensy AI Creative Suite
 * Provides detailed usage statistics and analytics data
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const period = searchParams.get('period') || 'month'
    const feature = searchParams.get('feature') || 'all'

    const supabase = createServiceRoleClient()

    // Get user record
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_user_id', userId)
      .single()

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Calculate date range based on period
    const endDate = new Date()
    const startDate = new Date()
    
    switch (period) {
      case 'week':
        startDate.setDate(endDate.getDate() - 7)
        break
      case 'month':
        startDate.setDate(endDate.getDate() - 30)
        break
      case 'quarter':
        startDate.setMonth(endDate.getMonth() - 3)
        break
      case 'year':
        startDate.setFullYear(endDate.getFullYear() - 1)
        break
      default:
        startDate.setDate(endDate.getDate() - 30)
    }

    // Get credit transactions (usage data)
    let creditQuery = supabase
      .from('credit_transactions')
      .select('*')
      .eq('user_id', user.id)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: true })

    const { data: creditTransactions, error: creditError } = await creditQuery

    if (creditError) {
      console.error('Error fetching credit transactions:', creditError)
      return NextResponse.json(
        { error: 'Failed to fetch usage data' },
        { status: 500 }
      )
    }

    // Get generations data
    let generationsQuery = supabase
      .from('generations')
      .select('*')
      .eq('user_id', user.id)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: true })

    // Filter by feature if specified
    if (feature !== 'all') {
      generationsQuery = generationsQuery.eq('type', feature)
    }

    const { data: generations, error: generationsError } = await generationsQuery

    if (generationsError) {
      console.error('Error fetching generations:', generationsError)
      return NextResponse.json(
        { error: 'Failed to fetch generations data' },
        { status: 500 }
      )
    }

    // Process the data
    const usageTransactions = creditTransactions?.filter(t => t.type === 'usage') || []
    const totalCreditsUsed = usageTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0)

    // Count generations by type
    const generationsByType = (generations || []).reduce((acc, gen) => {
      acc[gen.type] = (acc[gen.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const totalGenerations = generations?.length || 0
    const imageGenerations = generationsByType.image || 0
    const videoGenerations = generationsByType.video || 0
    const upscalingOperations = generationsByType.upscaling || 0
    const formatConversions = generationsByType.conversion || 0

    // Generate daily usage data
    const dailyUsage = generateDailyUsage(usageTransactions, generations || [], startDate, endDate)

    // Generate monthly usage data (for longer periods)
    const monthlyUsage = generateMonthlyUsage(usageTransactions, generations || [], startDate, endDate)

    // Generate feature usage breakdown
    const featureUsage = generateFeatureUsage(usageTransactions, generations || [])

    const analyticsData = {
      totalCreditsUsed,
      totalGenerations,
      imageGenerations,
      videoGenerations,
      upscalingOperations,
      formatConversions,
      dailyUsage,
      monthlyUsage,
      featureUsage,
      period,
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      }
    }

    return NextResponse.json(analyticsData)

  } catch (error) {
    console.error('Analytics API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function generateDailyUsage(
  creditTransactions: any[],
  generations: any[],
  startDate: Date,
  endDate: Date
): Array<{ date: string; credits: number; generations: number }> {
  const dailyData: Record<string, { credits: number; generations: number }> = {}

  // Initialize all days with zero values
  const currentDate = new Date(startDate)
  while (currentDate <= endDate) {
    const dateKey = currentDate.toISOString().split('T')[0]
    dailyData[dateKey] = { credits: 0, generations: 0 }
    currentDate.setDate(currentDate.getDate() + 1)
  }

  // Aggregate credit usage by day
  creditTransactions.forEach(transaction => {
    const dateKey = transaction.created_at.split('T')[0]
    if (dailyData[dateKey]) {
      dailyData[dateKey].credits += Math.abs(transaction.amount)
    }
  })

  // Aggregate generations by day
  generations.forEach(generation => {
    const dateKey = generation.created_at.split('T')[0]
    if (dailyData[dateKey]) {
      dailyData[dateKey].generations += 1
    }
  })

  return Object.entries(dailyData).map(([date, data]) => ({
    date,
    credits: data.credits,
    generations: data.generations
  }))
}

function generateMonthlyUsage(
  creditTransactions: any[],
  generations: any[],
  startDate: Date,
  endDate: Date
): Array<{ month: string; credits: number; generations: number }> {
  const monthlyData: Record<string, { credits: number; generations: number }> = {}

  // Aggregate credit usage by month
  creditTransactions.forEach(transaction => {
    const date = new Date(transaction.created_at)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = { credits: 0, generations: 0 }
    }
    monthlyData[monthKey].credits += Math.abs(transaction.amount)
  })

  // Aggregate generations by month
  generations.forEach(generation => {
    const date = new Date(generation.created_at)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = { credits: 0, generations: 0 }
    }
    monthlyData[monthKey].generations += 1
  })

  return Object.entries(monthlyData).map(([month, data]) => ({
    month,
    credits: data.credits,
    generations: data.generations
  }))
}

function generateFeatureUsage(
  creditTransactions: any[],
  generations: any[]
): Array<{ feature: string; count: number; credits: number }> {
  const featureData: Record<string, { count: number; credits: number }> = {}

  // Count generations by type
  generations.forEach(generation => {
    const feature = generation.type || 'unknown'
    if (!featureData[feature]) {
      featureData[feature] = { count: 0, credits: 0 }
    }
    featureData[feature].count += 1
  })

  // Aggregate credits by feature (based on generation metadata)
  creditTransactions.forEach(transaction => {
    // Try to extract feature from transaction description or metadata
    const description = transaction.description || ''
    let feature = 'unknown'
    
    if (description.includes('image') || description.includes('Image')) {
      feature = 'image_generation'
    } else if (description.includes('video') || description.includes('Video')) {
      feature = 'video_generation'
    } else if (description.includes('upscal') || description.includes('Upscal')) {
      feature = 'upscaling'
    } else if (description.includes('conversion') || description.includes('format')) {
      feature = 'format_conversion'
    }

    if (!featureData[feature]) {
      featureData[feature] = { count: 0, credits: 0 }
    }
    featureData[feature].credits += Math.abs(transaction.amount)
  })

  return Object.entries(featureData)
    .map(([feature, data]) => ({
      feature,
      count: data.count,
      credits: data.credits
    }))
    .sort((a, b) => b.count - a.count) // Sort by usage count
}
