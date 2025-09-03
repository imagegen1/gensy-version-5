/**
 * Payment Initiation API Endpoint for Gensy AI Creative Suite
 * Handles payment request creation for subscriptions and credit purchases
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { z } from 'zod'
import { PhonePeService } from '@/lib/services/phonepe'

// Force Node.js runtime to ensure proper cookie handling
export const runtime = 'nodejs'

// Request validation schema
const PaymentInitiationSchema = z.object({
  type: z.enum(['subscription', 'credits']),
  planId: z.string().optional(),
  packageId: z.string().optional(),
  amount: z.number().min(2, 'Minimum amount is ₹2'), // Updated minimum to ₹2
  description: z.string().optional()
})

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Payment initiation API called')

    const { userId } = await auth()
    if (!userId) {
      console.log('❌ No user ID found in auth')
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    console.log('✅ User authenticated:', userId)

    // Parse and validate request body
    let body
    try {
      body = await request.json()
      console.log('📝 Request body:', body)
    } catch (parseError) {
      console.error('❌ Failed to parse request body:', parseError)
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }

    const validationResult = PaymentInitiationSchema.safeParse(body)

    if (!validationResult.success) {
      console.log('❌ Validation failed:', validationResult.error.errors)
      return NextResponse.json(
        {
          error: 'Invalid request data',
          details: validationResult.error.errors
        },
        { status: 400 }
      )
    }

    const { type, planId, amount, description } = validationResult.data
    console.log('✅ Validation passed:', { type, planId, amount, description })

    // Validate amount
    const amountValidation = PhonePeService.validateAmount(amount)
    if (!amountValidation.valid) {
      console.log('❌ Amount validation failed:', amountValidation.error)
      return NextResponse.json(
        { error: amountValidation.error },
        { status: 400 }
      )
    }

    console.log('✅ Amount validation passed')

    // Create payment request with PhonePe
    const paymentRequest = {
      amount,
      userId,
      planId,
      type,
      description: description || `${type === 'subscription' ? 'Subscription' : 'Credits'} payment`
    }

    console.log('🔄 Creating PhonePe payment request:', paymentRequest)

    let paymentResult
    try {
      paymentResult = await PhonePeService.createPaymentRequest(paymentRequest)
      console.log('📊 PhonePe service result:', paymentResult)
    } catch (phonepeError) {
      console.error('❌ PhonePe service error:', phonepeError)
      return NextResponse.json(
        {
          error: 'Payment service error',
          message: phonepeError instanceof Error ? phonepeError.message : 'Unknown PhonePe error',
          debug: process.env.NODE_ENV === 'development' ? phonepeError : undefined
        },
        { status: 500 }
      )
    }

    if (!paymentResult.success) {
      console.log('❌ Payment result failed:', paymentResult.error)
      return NextResponse.json(
        { error: paymentResult.error || 'Payment initiation failed' },
        { status: 500 }
      )
    }

    console.log('✅ Payment result successful')

    // Log payment initiation for debugging
    console.log('Payment initiated:', {
      userId,
      merchantTransactionId: paymentResult.merchantTransactionId,
      orderId: paymentResult.orderId,
      amount,
      type,
      planId
    })

    // Return payment URL for redirect
    return NextResponse.json({
      success: true,
      checkoutUrl: paymentResult.paymentUrl,
      merchantTransactionId: paymentResult.merchantTransactionId,
      orderId: paymentResult.orderId,
      amount: amount,
      type,
      description: paymentRequest.description
    })

  } catch (error) {
    console.error('❌ Payment initiation error:', error)

    // Ensure we always return JSON, never HTML
    const errorResponse = {
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      debug: process.env.NODE_ENV === 'development' ? {
        stack: error instanceof Error ? error.stack : undefined,
        name: error instanceof Error ? error.name : undefined
      } : undefined
    }

    return NextResponse.json(errorResponse, {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    })
  }
}

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      message: 'Payment history endpoint - not implemented',
      userId
    })

  } catch (error) {
    console.error('Error fetching payment history:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
