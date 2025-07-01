/**
 * PhonePe Webhook Handler for Gensy AI Creative Suite
 * Processes payment notifications and updates subscription/credit status
 */

import { NextRequest, NextResponse } from 'next/server'
import { PhonePeService } from '@/lib/services/phonepe'
import { SubscriptionService } from '@/lib/services/subscription'
import { createServiceRoleClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('X-VERIFY')

    // Verify webhook signature for security
    if (!PhonePeService.verifyWebhookSignature(body, signature || '')) {
      console.error('Invalid webhook signature')
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
    }

    // Parse webhook data
    const webhookData = PhonePeService.parseWebhookData(body)
    if (!webhookData) {
      console.error('Invalid webhook data format')
      return NextResponse.json(
        { error: 'Invalid webhook data' },
        { status: 400 }
      )
    }

    const { merchantTransactionId, transactionId, amount, state, responseCode } = webhookData

    console.log('Processing PhonePe webhook:', {
      merchantTransactionId,
      transactionId,
      amount,
      state,
      responseCode
    })

    const supabase = createServiceRoleClient()

    // Find the payment record
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select(`
        *,
        user:users!inner(id, clerk_user_id)
      `)
      .eq('transaction_id', merchantTransactionId)
      .single()

    if (paymentError || !payment) {
      console.error('Payment record not found:', merchantTransactionId)
      return NextResponse.json(
        { error: 'Payment record not found' },
        { status: 404 }
      )
    }

    // Process based on payment state
    if (state === 'COMPLETED' && responseCode === 'SUCCESS') {
      await handleSuccessfulPayment(payment, transactionId, amount)
    } else if (state === 'FAILED' || responseCode === 'FAILURE') {
      await handleFailedPayment(payment, state, responseCode)
    } else {
      console.log('Payment in intermediate state:', state, responseCode)
      // Update payment status but don't process further
      await supabase
        .from('payments')
        .update({
          status: 'pending',
          gateway_response: {
            ...payment.gateway_response,
            state,
            responseCode,
            transactionId,
            updatedAt: new Date().toISOString()
          }
        })
        .eq('id', payment.id)
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

/**
 * Handle successful payment
 */
async function handleSuccessfulPayment(
  payment: any,
  transactionId: string,
  amount: number
): Promise<void> {
  const supabase = createServiceRoleClient()

  try {
    // Update payment status
    await supabase
      .from('payments')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        gateway_response: {
          ...payment.gateway_response,
          state: 'COMPLETED',
          responseCode: 'SUCCESS',
          transactionId,
          amount,
          completedAt: new Date().toISOString()
        }
      })
      .eq('id', payment.id)

    // Process based on payment type
    if (payment.type === 'subscription') {
      // Create subscription
      const result = await SubscriptionService.createSubscription(
        payment.plan_id,
        payment.transaction_id,
        payment.user.clerk_user_id
      )

      if (!result.success) {
        throw new Error(`Subscription creation failed: ${result.error}`)
      }

      console.log('Subscription created successfully for user:', payment.user.clerk_user_id)

    } else if (payment.type === 'credits') {
      // Find the credit package based on amount
      const creditPackages = SubscriptionService.getCreditPackages()
      const creditPackage = creditPackages.find(pkg => pkg.price === payment.amount)

      if (!creditPackage) {
        throw new Error('Credit package not found for amount: ' + payment.amount)
      }

      // Purchase credits
      const result = await SubscriptionService.purchaseCredits(
        creditPackage.id,
        payment.transaction_id,
        payment.user.clerk_user_id
      )

      if (!result.success) {
        throw new Error(`Credit purchase failed: ${result.error}`)
      }

      console.log('Credits purchased successfully for user:', payment.user.clerk_user_id)
    }

    // Send success notification (could be email, push notification, etc.)
    await sendPaymentSuccessNotification(payment)

  } catch (error) {
    console.error('Error processing successful payment:', error)
    
    // Mark payment as completed but with processing error
    await supabase
      .from('payments')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        gateway_response: {
          ...payment.gateway_response,
          state: 'COMPLETED',
          responseCode: 'SUCCESS',
          transactionId,
          amount,
          processingError: error instanceof Error ? error.message : 'Unknown error',
          completedAt: new Date().toISOString()
        }
      })
      .eq('id', payment.id)

    throw error
  }
}

/**
 * Handle failed payment
 */
async function handleFailedPayment(
  payment: any,
  state: string,
  responseCode: string
): Promise<void> {
  const supabase = createServiceRoleClient()

  try {
    // Update payment status
    await supabase
      .from('payments')
      .update({
        status: 'failed',
        gateway_response: {
          ...payment.gateway_response,
          state,
          responseCode,
          failedAt: new Date().toISOString()
        }
      })
      .eq('id', payment.id)

    console.log('Payment failed for user:', payment.user.clerk_user_id, 'Reason:', responseCode)

    // Send failure notification
    await sendPaymentFailureNotification(payment, responseCode)

  } catch (error) {
    console.error('Error processing failed payment:', error)
    throw error
  }
}

/**
 * Send payment success notification
 */
async function sendPaymentSuccessNotification(payment: any): Promise<void> {
  try {
    // This could integrate with email service, push notifications, etc.
    console.log('Payment success notification sent to user:', payment.user.clerk_user_id)
    
    // For now, just log the notification
    // In production, you would integrate with services like:
    // - SendGrid for email
    // - Firebase for push notifications
    // - Slack for internal notifications
    
  } catch (error) {
    console.error('Error sending payment success notification:', error)
  }
}

/**
 * Send payment failure notification
 */
async function sendPaymentFailureNotification(payment: any, reason: string): Promise<void> {
  try {
    console.log('Payment failure notification sent to user:', payment.user.clerk_user_id, 'Reason:', reason)
    
    // Similar to success notification, this would integrate with notification services
    
  } catch (error) {
    console.error('Error sending payment failure notification:', error)
  }
}

// Handle GET requests (for webhook verification during setup)
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const challenge = searchParams.get('challenge')
  
  if (challenge) {
    return NextResponse.json({ challenge })
  }
  
  return NextResponse.json({ 
    status: 'PhonePe webhook endpoint is active',
    timestamp: new Date().toISOString()
  })
}
