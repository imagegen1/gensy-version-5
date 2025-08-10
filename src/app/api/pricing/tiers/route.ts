/**
 * Pricing Tiers API Endpoint for Gensy AI Creative Suite
 * Provides subscription pricing tiers and credit packages
 */

import { NextRequest, NextResponse } from 'next/server'
import { SubscriptionService } from '@/lib/services/subscription'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // 'tiers' or 'packages'

    if (type === 'packages') {
      // Get credit packages (pay-as-you-go)
      const packages = SubscriptionService.getCreditPackages()
      return NextResponse.json({ 
        success: true, 
        packages 
      })
    }

    // Get pricing tiers (yearly subscriptions) - default
    const tiers = SubscriptionService.getPricingTiers()
    return NextResponse.json({ 
      success: true, 
      tiers 
    })

  } catch (error) {
    console.error('Error in pricing tiers API:', error)
    return NextResponse.json(
      { error: 'Failed to fetch pricing tiers' },
      { status: 500 }
    )
  }
}
