/**
 * Credit Validation API Endpoint for Gensy AI Creative Suite
 * Validates if user has enough credits for specific AI services
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { ServicePricingManager } from '@/lib/pricing/service-pricing'
import { CreditService } from '@/lib/credits'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { provider, model_name } = body

    if (!provider || !model_name) {
      return NextResponse.json(
        { error: 'Provider and model name are required' },
        { status: 400 }
      )
    }

    // Get user's current credit balance
    const balance = await CreditService.getCreditBalance(userId)

    // Validate credits for the specific service
    const validation = await ServicePricingManager.validateCreditsForService(
      balance.current || 0,
      provider,
      model_name
    )

    return NextResponse.json({
      success: true,
      validation: {
        hasEnoughCredits: validation.hasEnoughCredits,
        creditsRequired: validation.creditsRequired,
        creditsShort: validation.creditsShort,
        currentBalance: balance.current || 0
      }
    })

  } catch (error) {
    console.error('Error validating credits:', error)
    return NextResponse.json(
      { error: 'Failed to validate credits' },
      { status: 500 }
    )
  }
}
