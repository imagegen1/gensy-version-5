/**
 * Payment Status Check API Endpoint for Gensy AI Creative Suite
 * Allows checking the status of a payment transaction
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { PhonePeService } from '@/lib/services/phonepe'
import { createServiceRoleClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ transactionId: string }> }
) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { transactionId } = await params

    if (!transactionId) {
      return NextResponse.json(
        { error: 'Transaction ID is required' },
        { status: 400 }
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

    // Get payment record from database
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select(`
        *,
        plan:subscription_plans(name, description)
      `)
      .eq('transaction_id', transactionId)
      .eq('user_id', user.id)
      .single()

    if (paymentError || !payment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      )
    }

    // If payment is already completed or failed, return stored status
    if (payment.status === 'completed' || payment.status === 'failed') {
      return NextResponse.json({
        success: true,
        transactionId,
        status: payment.status,
        amount: payment.amount,
        currency: payment.currency,
        type: payment.type,
        planName: payment.plan?.name,
        creditsReceived: payment.credits_purchased,
        createdAt: payment.created_at,
        completedAt: payment.completed_at,
        gatewayResponse: payment.gateway_response
      })
    }

    // Check status with PhonePe for pending payments
    const statusResult = await PhonePeService.checkPaymentStatus(transactionId)

    if (!statusResult.success) {
      return NextResponse.json({
        success: true,
        transactionId,
        status: 'pending',
        amount: payment.amount,
        currency: payment.currency,
        type: payment.type,
        error: statusResult.error
      })
    }

    // Update payment status based on PhonePe response
    let updatedStatus = payment.status
    let completedAt = payment.completed_at

    if (statusResult.status === 'PAYMENT_SUCCESS') {
      updatedStatus = 'completed'
      completedAt = new Date().toISOString()
    } else if (statusResult.status === 'PAYMENT_FAILED') {
      updatedStatus = 'failed'
    }

    // Update database if status changed
    if (updatedStatus !== payment.status) {
      await supabase
        .from('payments')
        .update({
          status: updatedStatus,
          completed_at: completedAt,
          gateway_response: {
            ...payment.gateway_response,
            latestStatus: statusResult.status,
            lastChecked: new Date().toISOString()
          }
        })
        .eq('id', payment.id)
    }

    return NextResponse.json({
      success: true,
      transactionId,
      status: updatedStatus,
      amount: payment.amount,
      currency: payment.currency,
      type: payment.type,
      planName: payment.plan?.name,
      creditsReceived: payment.credits_purchased,
      createdAt: payment.created_at,
      completedAt: completedAt,
      gatewayStatus: statusResult.status
    })

  } catch (error) {
    console.error('Payment status check error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ transactionId: string }> }
) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { transactionId } = await params
    const body = await request.json()
    const { action } = body

    if (!transactionId) {
      return NextResponse.json(
        { error: 'Transaction ID is required' },
        { status: 400 }
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

    // Get payment record
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('*')
      .eq('transaction_id', transactionId)
      .eq('user_id', user.id)
      .single()

    if (paymentError || !payment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      )
    }

    // Handle different actions
    if (action === 'cancel') {
      // Cancel pending payment
      if (payment.status !== 'pending') {
        return NextResponse.json(
          { error: 'Can only cancel pending payments' },
          { status: 400 }
        )
      }

      await supabase
        .from('payments')
        .update({
          status: 'cancelled',
          gateway_response: {
            ...payment.gateway_response,
            cancelledAt: new Date().toISOString(),
            cancelledBy: 'user'
          }
        })
        .eq('id', payment.id)

      return NextResponse.json({
        success: true,
        message: 'Payment cancelled successfully'
      })

    } else if (action === 'retry') {
      // Retry failed payment
      if (payment.status !== 'failed') {
        return NextResponse.json(
          { error: 'Can only retry failed payments' },
          { status: 400 }
        )
      }

      // Create new payment request
      const paymentRequest = {
        amount: payment.amount,
        userId,
        planId: payment.plan_id,
        type: payment.type as 'subscription' | 'credits',
        description: `Retry: ${payment.type} payment`
      }

      const paymentResult = await PhonePeService.createPaymentRequest(paymentRequest)

      if (!paymentResult.success) {
        return NextResponse.json(
          { error: paymentResult.error || 'Payment retry failed' },
          { status: 500 }
        )
      }

      // Create new payment record
      await supabase
        .from('payments')
        .insert({
          user_id: user.id,
          transaction_id: paymentResult.merchantTransactionId,
          amount: payment.amount,
          type: payment.type,
          status: 'pending',
          plan_id: payment.plan_id,
          credits_purchased: payment.credits_purchased,
          payment_method: 'phonepe',
          gateway_response: {
            merchantTransactionId: paymentResult.merchantTransactionId,
            initiatedAt: new Date().toISOString(),
            retryOf: transactionId
          }
        })

      return NextResponse.json({
        success: true,
        merchantTransactionId: paymentResult.merchantTransactionId,
        paymentUrl: paymentResult.paymentUrl,
        message: 'Payment retry initiated'
      })

    } else {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('Payment action error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
