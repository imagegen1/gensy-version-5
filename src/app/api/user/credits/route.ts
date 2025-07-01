/**
 * User Credits API Route for Gensy AI Creative Suite
 * Handles user credit operations
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { CreditService } from '@/lib/credits'

export async function GET() {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get credit balance and transaction history
    const [balance, transactions] = await Promise.all([
      CreditService.getCreditBalance(userId),
      CreditService.getTransactionHistory(10, 0, userId)
    ])

    return NextResponse.json({
      success: true,
      balance,
      recent_transactions: transactions,
    })
  } catch (error) {
    console.error('Get credits API error:', error)
    return NextResponse.json(
      { error: 'Failed to get credit information' },
      { status: 500 }
    )
  }
}

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
    const { action, amount, description, generation_id, payment_id } = body

    if (!action || !amount || !description) {
      return NextResponse.json(
        { error: 'Missing required fields: action, amount, description' },
        { status: 400 }
      )
    }

    let result

    switch (action) {
      case 'deduct':
        result = await CreditService.deductCredits(
          amount,
          description,
          generation_id,
          userId
        )
        break

      case 'add':
        result = await CreditService.addCredits(
          amount,
          description,
          'bonus',
          payment_id,
          userId
        )
        break

      case 'purchase':
        result = await CreditService.addCredits(
          amount,
          description,
          'purchase',
          payment_id,
          userId
        )
        break

      default:
        return NextResponse.json(
          { error: 'Invalid action. Must be: deduct, add, or purchase' },
          { status: 400 }
        )
    }

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Credit operation failed' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      new_balance: result.newBalance,
      message: `Successfully ${action}ed ${amount} credits`,
    })
  } catch (error) {
    console.error('Credits API error:', error)
    return NextResponse.json(
      { error: 'Failed to process credit operation' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { required_credits = 1 } = body

    // Check if user has sufficient credits
    const { hasCredits, currentCredits } = await CreditService.hasCredits(
      required_credits,
      userId
    )

    return NextResponse.json({
      success: true,
      has_credits: hasCredits,
      current_credits: currentCredits,
      required_credits,
    })
  } catch (error) {
    console.error('Credit validation API error:', error)
    return NextResponse.json(
      { error: 'Failed to validate credits' },
      { status: 500 }
    )
  }
}
