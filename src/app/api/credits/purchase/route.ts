/**
 * Credit Purchase API Endpoint for Gensy AI Creative Suite
 * Handles credit purchases without payment gateway integration
 * For testing and manual credit allocation
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { CreditService } from '@/lib/credits'
import { SubscriptionService } from '@/lib/services/subscription'
import { createServiceRoleClient } from '@/lib/supabase/server'

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
    const { packageId, customAmount, customCredits, amount, credits, type, testPurchase = false } = body

    let creditsToAdd = 0
    let amountPaid = 0
    let packageName = ''

    if (type === 'pay-as-you-go' && amount && credits) {
      // Pay-as-you-go purchase
      const CREDIT_VALUE_INR = 0.02 // ₹0.02 per credit
      const MIN_AMOUNT = 50 // Minimum ₹50

      if (amount < MIN_AMOUNT) {
        return NextResponse.json(
          { error: `Minimum amount is ₹${MIN_AMOUNT}` },
          { status: 400 }
        )
      }

      // Validate credit calculation
      const expectedCredits = Math.floor(amount / CREDIT_VALUE_INR)
      if (Math.abs(credits - expectedCredits) > 1) { // Allow 1 credit tolerance for rounding
        return NextResponse.json(
          { error: 'Invalid credit calculation' },
          { status: 400 }
        )
      }

      creditsToAdd = credits
      amountPaid = amount
      packageName = 'Pay-as-you-go'
    } else if (packageId) {
      // Purchase predefined credit package
      const packages = SubscriptionService.getCreditPackages()
      const selectedPackage = packages.find(pkg => pkg.id === packageId)

      if (!selectedPackage) {
        return NextResponse.json(
          { error: 'Invalid package ID' },
          { status: 400 }
        )
      }

      creditsToAdd = selectedPackage.credits
      amountPaid = selectedPackage.price
      packageName = selectedPackage.name
    } else if (customAmount && customCredits) {
      // Custom credit purchase
      creditsToAdd = customCredits
      amountPaid = customAmount
      packageName = 'Custom Purchase'
    } else {
      return NextResponse.json(
        { error: 'Either packageId, customAmount/customCredits, or amount/credits is required' },
        { status: 400 }
      )
    }

    // Validate minimum purchase (different for pay-as-you-go vs packages)
    const minCredits = type === 'pay-as-you-go' ? 100 : 100 // 100 credits = ₹2 for pay-as-you-go
    if (creditsToAdd < minCredits) {
      return NextResponse.json(
        { error: `Minimum purchase is ${minCredits} credits` },
        { status: 400 }
      )
    }

    // For testing purposes, we'll simulate a successful payment
    // In production, this would integrate with a payment gateway
    if (!testPurchase) {
      return NextResponse.json(
        { 
          error: 'Payment gateway not implemented yet. Use testPurchase: true for testing.',
          testMode: true
        },
        { status: 400 }
      )
    }

    // Add credits to user account
    const result = await CreditService.addCredits(
      creditsToAdd,
      `Credit purchase: ${packageName} (₹${amountPaid})`,
      'purchase',
      undefined,
      userId
    )

    if (!result.success) {
      return NextResponse.json(
        { error: 'Failed to add credits to account' },
        { status: 500 }
      )
    }

    // Record the purchase transaction
    const supabase = createServiceRoleClient()
    const { error: transactionError } = await supabase
      .from('credit_transactions')
      .insert({
        user_id: userId,
        amount: creditsToAdd,
        type: 'purchase',
        description: `Credit purchase: ${packageName}`,
        metadata: {
          package_id: packageId,
          package_name: packageName,
          amount_paid_inr: amountPaid,
          test_purchase: testPurchase
        }
      })

    if (transactionError) {
      console.error('Error recording purchase transaction:', transactionError)
      // Don't fail the request, credits were already added
    }

    // Record payment (for admin tracking)
    const { error: paymentError } = await supabase
      .from('payments')
      .insert({
        user_id: userId,
        amount: amountPaid,
        currency: 'INR',
        status: testPurchase ? 'test_completed' : 'completed',
        payment_method: testPurchase ? 'test' : 'unknown',
        description: `Credit purchase: ${packageName}`,
        metadata: {
          credits_purchased: creditsToAdd,
          package_id: packageId,
          package_name: packageName,
          test_purchase: testPurchase
        }
      })

    if (paymentError) {
      console.error('Error recording payment:', paymentError)
      // Don't fail the request, credits were already added
    }

    return NextResponse.json({
      success: true,
      message: 'Credits purchased successfully',
      purchase: {
        credits_added: creditsToAdd,
        amount_paid: amountPaid,
        package_name: packageName,
        new_balance: result.newBalance,
        test_purchase: testPurchase
      }
    })

  } catch (error) {
    console.error('Error processing credit purchase:', error)
    return NextResponse.json(
      { error: 'Failed to process credit purchase' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get available credit packages
    const packages = SubscriptionService.getCreditPackages()
    
    // Get user's current balance
    const balance = await CreditService.getCreditBalance(userId)
    
    return NextResponse.json({
      success: true,
      packages,
      current_balance: balance.current || 0
    })

  } catch (error) {
    console.error('Error fetching credit packages:', error)
    return NextResponse.json(
      { error: 'Failed to fetch credit packages' },
      { status: 500 }
    )
  }
}
