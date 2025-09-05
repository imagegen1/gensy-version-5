/**
 * PhonePe Payment Callback Handler
 * Handles the redirect after payment completion
 */

import { NextRequest, NextResponse } from 'next/server'
import { PhonePeService } from '@/lib/services/phonepe'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { CreditService } from '@/lib/credits'

// Force Node.js runtime
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams

    // PhonePe sends merchantTransactionId as the primary identifier
    const orderId = searchParams.get('merchantTransactionId') ||
                   searchParams.get('orderId') ||
                   searchParams.get('merchantOrderId') ||
                   searchParams.get('transactionId')

    const status = searchParams.get('status') ||
                  searchParams.get('code') ||
                  searchParams.get('responseCode') ||
                  searchParams.get('state')

    // Log all parameters for debugging
    const allParams = Object.fromEntries(searchParams.entries())
    console.log('Payment callback received:', {
      orderId,
      status,
      allParams,
      url: request.url
    })

    if (!orderId) {
      console.warn('No order ID found in callback parameters:', allParams)

      // If no parameters are provided, this might be a direct callback from PhonePe
      // In this case, PhonePe has successfully processed the payment but doesn't send parameters
      if (Object.keys(allParams).length === 0) {
        console.log('PhonePe callback received with no parameters - treating as successful callback')

        // For now, redirect to a generic success page since PhonePe called our callback
        // In production, you might want to query PhonePe API to get transaction status
        return NextResponse.redirect(new URL('/payment/success?orderId=PHONEPE_CALLBACK&status=callback_received&source=phonepe_direct', request.url))
      }

      // Check if this is a PhonePe callback with different parameter structure
      if (searchParams.has('status') || searchParams.has('code')) {
        console.log('PhonePe callback detected without orderId, redirecting to callback page for manual handling')
        return NextResponse.redirect(new URL(`/payment/callback?${searchParams.toString()}`, request.url))
      }

      return NextResponse.redirect(new URL('/payment/failed?error=missing_order_id', request.url))
    }

    // Check payment status with PhonePe
    try {
      const paymentStatus = await PhonePeService.checkPaymentStatus(orderId)

      console.log('Payment status check result:', paymentStatus)

      if (paymentStatus.success && paymentStatus.status === 'COMPLETED') {
        // Payment successful - process credits and redirect to success page
        try {
          await processSuccessfulPayment(orderId)
          return NextResponse.redirect(new URL(`/payment/success?orderId=${orderId}&status=success&credits_added=true`, request.url))
        } catch (creditError) {
          console.error('❌ Failed to process credits:', creditError)
          return NextResponse.redirect(new URL(`/payment/success?orderId=${orderId}&status=success&credits_error=true`, request.url))
        }
      } else {
        // Payment failed or pending - redirect to failure page with details
        return NextResponse.redirect(new URL(`/payment/failed?orderId=${orderId}&status=${paymentStatus.status || 'unknown'}&reason=${encodeURIComponent(paymentStatus.error || 'Payment not completed')}`, request.url))
      }
    } catch (statusError) {
      console.error('Payment status check failed:', statusError)
      // If status check fails, redirect to callback page for manual verification
      return NextResponse.redirect(new URL(`/payment/callback?transactionId=${orderId}&status=${status || 'unknown'}`, request.url))
    }

  } catch (error) {
    console.error('Payment callback error:', error)
    return NextResponse.redirect(new URL('/payment/failed?error=callback_error', request.url))
  }
}

export async function POST(request: NextRequest) {
  // Handle POST callback if needed
  return GET(request)
}

/**
 * Process successful payment and add credits to user account
 */
async function processSuccessfulPayment(merchantTransactionId: string): Promise<void> {
  const supabase = createServiceRoleClient()

  try {
    console.log('🔄 Processing successful payment:', merchantTransactionId)

    // Find the payment record
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select(`
        *,
        user:profiles!inner(id, clerk_user_id)
      `)
      .eq('gateway_transaction_id', merchantTransactionId)
      .single()

    if (paymentError || !payment) {
      console.error('❌ Payment record not found:', merchantTransactionId, paymentError)
      throw new Error('Payment record not found')
    }

    console.log('✅ Payment record found:', payment.id, 'User:', payment.user.clerk_user_id)

    // Update payment status to completed
    await supabase
      .from('payments')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        metadata: {
          ...payment.metadata,
          status: 'COMPLETED',
          completedAt: new Date().toISOString()
        }
      })
      .eq('id', payment.id)

    console.log('✅ Payment status updated to completed')

    // Process based on payment type
    if (payment.type === 'credits') {
      // Calculate credits based on amount (₹1 = 1 credit for now, adjust as needed)
      const creditsToAdd = Math.floor(payment.amount)

      console.log('💰 Adding credits:', creditsToAdd, 'for user:', payment.user.clerk_user_id)

      // Add credits to user account
      const creditResult = await CreditService.addCredits(
        payment.user.clerk_user_id,
        creditsToAdd,
        `Payment completed - Transaction: ${merchantTransactionId}`
      )

      if (!creditResult.success) {
        throw new Error(`Failed to add credits: ${creditResult.error}`)
      }

      console.log('✅ Credits added successfully:', creditsToAdd, 'New balance:', creditResult.newBalance)

      // Log the credit transaction
      await supabase
        .from('credit_transactions')
        .insert({
          user_id: payment.user.id,
          amount: creditsToAdd,
          type: 'purchase',
          description: `Payment completed - Transaction: ${merchantTransactionId}`,
          payment_id: payment.id,
          created_at: new Date().toISOString()
        })

      console.log('✅ Credit transaction logged')

    } else if (payment.type === 'subscription') {
      // Handle subscription logic here if needed
      console.log('📋 Subscription payment processed:', payment.plan_id)
    }

    console.log('🎉 Payment processing completed successfully')

  } catch (error) {
    console.error('❌ Error processing successful payment:', error)
    throw error
  }
}
