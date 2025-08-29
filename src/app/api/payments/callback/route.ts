/**
 * PhonePe Payment Callback Handler
 * Handles the redirect after payment completion
 */

import { NextRequest, NextResponse } from 'next/server'
import { PhonePeService } from '@/lib/services/phonepe'

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
        // Payment successful - redirect to success page
        return NextResponse.redirect(new URL(`/payment/success?orderId=${orderId}&status=success`, request.url))
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
