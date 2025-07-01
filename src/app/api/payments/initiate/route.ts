/**
 * Payment Initiation API Endpoint for Gensy AI Creative Suite
 * Handles payment request creation for subscriptions and credit purchases
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { z } from 'zod'
import { PhonePeService } from '@/lib/services/phonepe'
import { SubscriptionService } from '@/lib/services/subscription'
import { createServiceRoleClient } from '@/lib/supabase/server'

// Request validation schema
const PaymentInitiationSchema = z.object({
  type: z.enum(['subscription', 'credits']),
  planId: z.string().optional(),
  packageId: z.string().optional(),
  amount: z.number().positive(),
  description: z.string().optional()
})

export async function POST(request: NextRequest) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validationResult = PaymentInitiationSchema.safeParse(body)
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid request data',
          details: validationResult.error.errors
        },
        { status: 400 }
      )
    }

    const { type, planId, packageId, amount, description } = validationResult.data

    // Validate amount
    const amountValidation = PhonePeService.validateAmount(amount)
    if (!amountValidation.valid) {
      return NextResponse.json(
        { error: amountValidation.error },
        { status: 400 }
      )
    }

    // Validate subscription plan or credit package
    if (type === 'subscription') {
      if (!planId) {
        return NextResponse.json(
          { error: 'Plan ID is required for subscription payments' },
          { status: 400 }
        )
      }

      const plan = await SubscriptionService.getSubscriptionPlan(planId)
      if (!plan) {
        return NextResponse.json(
          { error: 'Invalid subscription plan' },
          { status: 400 }
        )
      }

      // Verify amount matches plan price
      if (amount !== plan.price_monthly && amount !== plan.price_yearly) {
        return NextResponse.json(
          { error: 'Amount does not match plan price' },
          { status: 400 }
        )
      }
    } else if (type === 'credits') {
      if (!packageId) {
        return NextResponse.json(
          { error: 'Package ID is required for credit purchases' },
          { status: 400 }
        )
      }

      const creditPackages = SubscriptionService.getCreditPackages()
      const creditPackage = creditPackages.find(pkg => pkg.id === packageId)
      if (!creditPackage) {
        return NextResponse.json(
          { error: 'Invalid credit package' },
          { status: 400 }
        )
      }

      // Verify amount matches package price
      if (amount !== creditPackage.price) {
        return NextResponse.json(
          { error: 'Amount does not match package price' },
          { status: 400 }
        )
      }
    }

    // Create payment request with PhonePe
    const paymentRequest = {
      amount,
      userId,
      planId,
      type,
      description: description || `${type === 'subscription' ? 'Subscription' : 'Credits'} payment`
    }

    const paymentResult = await PhonePeService.createPaymentRequest(paymentRequest)

    if (!paymentResult.success) {
      return NextResponse.json(
        { error: paymentResult.error || 'Payment initiation failed' },
        { status: 500 }
      )
    }

    // Store payment record in database
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

    // Create payment record
    const { error: paymentError } = await supabase
      .from('payments')
      .insert({
        user_id: user.id,
        transaction_id: paymentResult.merchantTransactionId,
        amount,
        type,
        status: 'pending',
        plan_id: planId || null,
        credits_purchased: type === 'credits' ? 
          SubscriptionService.getCreditPackages().find(pkg => pkg.id === packageId)?.credits : null,
        payment_method: 'phonepe',
        gateway_response: {
          merchantTransactionId: paymentResult.merchantTransactionId,
          initiatedAt: new Date().toISOString()
        }
      })

    if (paymentError) {
      console.error('Error storing payment record:', paymentError)
      return NextResponse.json(
        { error: 'Failed to store payment record' },
        { status: 500 }
      )
    }

    // Return payment URL for redirect
    return NextResponse.json({
      success: true,
      merchantTransactionId: paymentResult.merchantTransactionId,
      paymentUrl: paymentResult.paymentUrl,
      amount: PhonePeService.formatAmount(amount * 100),
      type,
      description: paymentRequest.description
    })

  } catch (error) {
    console.error('Payment initiation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

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

    // Get user's payment history
    const { data: payments, error } = await supabase
      .from('payments')
      .select(`
        *,
        plan:subscription_plans(name, description)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      console.error('Error fetching payment history:', error)
      return NextResponse.json(
        { error: 'Failed to fetch payment history' },
        { status: 500 }
      )
    }

    // Format payment data for response
    const formattedPayments = payments?.map(payment => ({
      id: payment.id,
      transactionId: payment.transaction_id,
      amount: payment.amount,
      currency: payment.currency,
      type: payment.type,
      status: payment.status,
      planName: payment.plan?.name,
      creditsReceived: payment.credits_purchased,
      createdAt: payment.created_at,
      completedAt: payment.completed_at
    })) || []

    return NextResponse.json({
      success: true,
      payments: formattedPayments
    })

  } catch (error) {
    console.error('Error fetching payment history:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
