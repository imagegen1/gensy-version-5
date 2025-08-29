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
  amount: z.number().positive(),
  description: z.string().optional()
})

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
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

    const { type, planId, amount, description } = validationResult.data

    // Validate amount
    const amountValidation = PhonePeService.validateAmount(amount)
    if (!amountValidation.valid) {
      return NextResponse.json(
        { error: amountValidation.error },
        { status: 400 }
      )
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
    console.error('Payment initiation error:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: (error as Error).message },
      { status: 500 }
    )
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
