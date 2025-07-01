/**
 * Subscription Plans API Endpoint for Gensy AI Creative Suite
 * Manages subscription plans and user subscriptions
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { SubscriptionService } from '@/lib/services/subscription'

export async function GET(request: NextRequest) {
  try {
    // Get all available subscription plans
    const plans = await SubscriptionService.getSubscriptionPlans()

    return NextResponse.json({
      success: true,
      plans
    })

  } catch (error) {
    console.error('Error fetching subscription plans:', error)
    return NextResponse.json(
      { error: 'Failed to fetch subscription plans' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { action, planId, subscriptionId } = body

    if (action === 'subscribe') {
      if (!planId) {
        return NextResponse.json(
          { error: 'Plan ID is required' },
          { status: 400 }
        )
      }

      // This would typically be called after successful payment
      // For now, we'll return an error since payment should be handled separately
      return NextResponse.json(
        { error: 'Use payment API to subscribe to plans' },
        { status: 400 }
      )

    } else if (action === 'cancel') {
      if (!subscriptionId) {
        return NextResponse.json(
          { error: 'Subscription ID is required' },
          { status: 400 }
        )
      }

      const result = await SubscriptionService.cancelSubscription(subscriptionId, userId)
      
      if (!result.success) {
        return NextResponse.json(
          { error: result.error || 'Failed to cancel subscription' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Subscription cancelled successfully'
      })

    } else if (action === 'get_current') {
      const subscription = await SubscriptionService.getUserSubscription(userId)
      
      return NextResponse.json({
        success: true,
        subscription
      })

    } else {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('Subscription API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
