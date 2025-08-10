/**
 * Admin Analytics API Endpoint for Gensy AI Creative Suite
 * Provides revenue tracking, profit calculations, and customer analytics
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { ServicePricingManager } from '@/lib/pricing/service-pricing'

// Admin user IDs (in production, use proper role-based access control)
const ADMIN_USER_IDS = ['user_2pqrstu', 'user_admin'] // Replace with actual admin user IDs

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId || !ADMIN_USER_IDS.includes(userId)) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const timeframe = searchParams.get('timeframe') || '30d' // 7d, 30d, 90d, 1y
    const metric = searchParams.get('metric') // revenue, users, usage, profit

    const supabase = createServiceRoleClient()
    
    // Calculate date range
    const endDate = new Date()
    const startDate = new Date()
    
    switch (timeframe) {
      case '7d':
        startDate.setDate(endDate.getDate() - 7)
        break
      case '30d':
        startDate.setDate(endDate.getDate() - 30)
        break
      case '90d':
        startDate.setDate(endDate.getDate() - 90)
        break
      case '1y':
        startDate.setFullYear(endDate.getFullYear() - 1)
        break
      default:
        startDate.setDate(endDate.getDate() - 30)
    }

    const analytics = {
      timeframe,
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      revenue: {},
      users: {},
      usage: {},
      profit: {}
    }

    // Revenue Analytics
    if (!metric || metric === 'revenue') {
      const { data: payments } = await supabase
        .from('payments')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .eq('status', 'completed')

      const totalRevenue = payments?.reduce((sum, payment) => sum + payment.amount, 0) || 0
      const revenueByDay = payments?.reduce((acc, payment) => {
        const date = new Date(payment.created_at).toISOString().split('T')[0]
        acc[date] = (acc[date] || 0) + payment.amount
        return acc
      }, {} as Record<string, number>) || {}

      analytics.revenue = {
        total: totalRevenue,
        by_day: revenueByDay,
        transaction_count: payments?.length || 0,
        average_transaction: payments?.length ? totalRevenue / payments.length : 0
      }
    }

    // User Analytics
    if (!metric || metric === 'users') {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('created_at, credits')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())

      const { data: allProfiles } = await supabase
        .from('profiles')
        .select('credits')

      const newUsers = profiles?.length || 0
      const totalUsers = allProfiles?.length || 0
      const activeUsers = allProfiles?.filter(p => p.credits > 0).length || 0

      analytics.users = {
        new_users: newUsers,
        total_users: totalUsers,
        active_users: activeUsers,
        activation_rate: totalUsers ? (activeUsers / totalUsers) * 100 : 0
      }
    }

    // Usage Analytics
    if (!metric || metric === 'usage') {
      const { data: transactions } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('type', 'deduction')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())

      const totalCreditsUsed = transactions?.reduce((sum, tx) => sum + Math.abs(tx.amount), 0) || 0
      const usageByService = transactions?.reduce((acc, tx) => {
        const service = tx.metadata?.service_type || 'unknown'
        acc[service] = (acc[service] || 0) + Math.abs(tx.amount)
        return acc
      }, {} as Record<string, number>) || {}

      analytics.usage = {
        total_credits_used: totalCreditsUsed,
        by_service: usageByService,
        generation_count: transactions?.length || 0,
        average_credits_per_generation: transactions?.length ? totalCreditsUsed / transactions.length : 0
      }
    }

    // Profit Analytics
    if (!metric || metric === 'profit') {
      const COST_PER_CREDIT = 0.009 // ₹0.009 per credit
      const REVENUE_PER_CREDIT = 0.02 // ₹0.02 per credit

      // Get credit purchases (revenue)
      const { data: creditPurchases } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('type', 'purchase')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())

      // Get credit usage (costs)
      const { data: creditUsage } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('type', 'deduction')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())

      const creditsRevenue = creditPurchases?.reduce((sum, tx) => sum + tx.amount, 0) || 0
      const creditsUsed = creditUsage?.reduce((sum, tx) => sum + Math.abs(tx.amount), 0) || 0
      
      const totalRevenue = creditsRevenue * REVENUE_PER_CREDIT
      const totalCosts = creditsUsed * COST_PER_CREDIT
      const grossProfit = totalRevenue - totalCosts
      const profitMargin = totalRevenue ? (grossProfit / totalRevenue) * 100 : 0

      analytics.profit = {
        total_revenue: totalRevenue,
        total_costs: totalCosts,
        gross_profit: grossProfit,
        profit_margin: profitMargin,
        credits_sold: creditsRevenue,
        credits_used: creditsUsed,
        credit_utilization: creditsRevenue ? (creditsUsed / creditsRevenue) * 100 : 0
      }
    }

    return NextResponse.json({
      success: true,
      analytics
    })

  } catch (error) {
    console.error('Error fetching admin analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId || !ADMIN_USER_IDS.includes(userId)) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { action, data } = body

    const supabase = createServiceRoleClient()

    switch (action) {
      case 'update_pricing':
        // Update service pricing
        const { id, updates } = data
        const success = await ServicePricingManager.updateServicePricing(id, updates)
        
        if (!success) {
          return NextResponse.json(
            { error: 'Failed to update pricing' },
            { status: 500 }
          )
        }

        return NextResponse.json({
          success: true,
          message: 'Pricing updated successfully'
        })

      case 'add_credits':
        // Manually add credits to user account (admin function)
        const { targetUserId, credits, reason } = data
        
        const { error } = await supabase
          .from('credit_transactions')
          .insert({
            user_id: targetUserId,
            amount: credits,
            type: 'admin_adjustment',
            description: `Admin credit adjustment: ${reason}`,
            metadata: {
              admin_user_id: userId,
              reason
            }
          })

        if (error) {
          return NextResponse.json(
            { error: 'Failed to add credits' },
            { status: 500 }
          )
        }

        // Update user's credit balance
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            credits: supabase.raw(`credits + ${credits}`)
          })
          .eq('clerk_user_id', targetUserId)

        if (updateError) {
          return NextResponse.json(
            { error: 'Failed to update user balance' },
            { status: 500 }
          )
        }

        return NextResponse.json({
          success: true,
          message: 'Credits added successfully'
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('Error processing admin action:', error)
    return NextResponse.json(
      { error: 'Failed to process admin action' },
      { status: 500 }
    )
  }
}
