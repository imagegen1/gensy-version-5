/**
 * Payment Callback Page for Gensy AI Creative Suite
 * Handles payment completion and status updates
 */

'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

function PaymentCallbackContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [paymentStatus, setPaymentStatus] = useState<'checking' | 'success' | 'failed' | 'error'>('checking')
  const [paymentDetails, setPaymentDetails] = useState<any>(null)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    const transactionId = searchParams.get('transactionId') || searchParams.get('txnId')
    const status = searchParams.get('status')
    
    if (transactionId) {
      checkPaymentStatus(transactionId)
    } else if (status) {
      // Handle direct status from PhonePe
      handleDirectStatus(status)
    } else {
      setPaymentStatus('error')
      setError('No transaction information found')
    }
  }, [searchParams])

  const checkPaymentStatus = async (transactionId: string) => {
    try {
      const response = await fetch(`/api/payments/status/${transactionId}`)
      const data = await response.json()

      if (response.ok) {
        setPaymentDetails(data)
        
        if (data.status === 'completed') {
          setPaymentStatus('success')
        } else if (data.status === 'failed') {
          setPaymentStatus('failed')
        } else {
          // Still pending, check again after a delay
          setTimeout(() => checkPaymentStatus(transactionId), 3000)
        }
      } else {
        setPaymentStatus('error')
        setError(data.error || 'Failed to check payment status')
      }
    } catch (error) {
      console.error('Payment status check error:', error)
      setPaymentStatus('error')
      setError('Failed to verify payment status')
    }
  }

  const handleDirectStatus = (status: string) => {
    if (status === 'success' || status === 'SUCCESS') {
      setPaymentStatus('success')
    } else if (status === 'failed' || status === 'FAILED') {
      setPaymentStatus('failed')
    } else {
      setPaymentStatus('error')
      setError(`Unknown payment status: ${status}`)
    }
  }

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount)
  }

  const handleContinue = () => {
    if (paymentStatus === 'success') {
      router.push('/billing?payment=success')
    } else {
      router.push('/billing?payment=failed')
    }
  }

  const handleRetry = () => {
    if (paymentDetails?.transactionId) {
      // Redirect to retry payment
      router.push(`/pricing?retry=${paymentDetails.transactionId}`)
    } else {
      router.push('/pricing')
    }
  }

  if (paymentStatus === 'checking') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <ClockIcon className="h-16 w-16 text-primary-600 mx-auto mb-4 animate-spin" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Verifying Payment</h1>
          <p className="text-gray-600 mb-6">
            Please wait while we confirm your payment status...
          </p>
          <div className="animate-pulse text-primary-600">
            This may take a few moments
          </div>
        </div>
      </div>
    )
  }

  if (paymentStatus === 'success') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
          <p className="text-gray-600 mb-6">
            Thank you for your purchase. Your payment has been processed successfully.
          </p>

          {paymentDetails && (
            <div className="bg-green-50 rounded-lg p-4 mb-6 text-left">
              <h3 className="font-semibold text-green-900 mb-2">Payment Details</h3>
              <div className="space-y-1 text-sm text-green-800">
                <div className="flex justify-between">
                  <span>Amount:</span>
                  <span className="font-medium">{formatAmount(paymentDetails.amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Type:</span>
                  <span className="font-medium capitalize">{paymentDetails.type}</span>
                </div>
                {paymentDetails.planName && (
                  <div className="flex justify-between">
                    <span>Plan:</span>
                    <span className="font-medium">{paymentDetails.planName}</span>
                  </div>
                )}
                {paymentDetails.creditsReceived && (
                  <div className="flex justify-between">
                    <span>Credits:</span>
                    <span className="font-medium">{paymentDetails.creditsReceived}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Transaction ID:</span>
                  <span className="font-medium text-xs">{paymentDetails.transactionId}</span>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={handleContinue}
            className="w-full bg-primary-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-primary-700 transition-colors"
          >
            Continue to Dashboard
          </button>
        </div>
      </div>
    )
  }

  if (paymentStatus === 'failed') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <XCircleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Failed</h1>
          <p className="text-gray-600 mb-6">
            We couldn't process your payment. Please try again or contact support if the issue persists.
          </p>

          {paymentDetails && (
            <div className="bg-red-50 rounded-lg p-4 mb-6 text-left">
              <h3 className="font-semibold text-red-900 mb-2">Payment Details</h3>
              <div className="space-y-1 text-sm text-red-800">
                <div className="flex justify-between">
                  <span>Amount:</span>
                  <span className="font-medium">{formatAmount(paymentDetails.amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Transaction ID:</span>
                  <span className="font-medium text-xs">{paymentDetails.transactionId}</span>
                </div>
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span className="font-medium capitalize">{paymentDetails.status}</span>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={handleRetry}
              className="w-full bg-primary-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-primary-700 transition-colors"
            >
              Try Again
            </button>
            
            <button
              onClick={handleContinue}
              className="w-full bg-gray-300 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-400 transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <ExclamationTriangleIcon className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Error</h1>
        <p className="text-gray-600 mb-6">
          {error || 'An unexpected error occurred while processing your payment.'}
        </p>

        <div className="space-y-3">
          <button
            onClick={() => router.push('/pricing')}
            className="w-full bg-primary-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-primary-700 transition-colors"
          >
            Back to Pricing
          </button>
          
          <button
            onClick={() => router.push('/billing')}
            className="w-full bg-gray-300 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-400 transition-colors"
          >
            View Billing
          </button>
        </div>
      </div>
    </div>
  )
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <ClockIcon className="h-16 w-16 text-primary-600 mx-auto mb-4 animate-spin" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Loading Payment Status</h1>
        <p className="text-gray-600">
          Please wait while we load your payment information...
        </p>
      </div>
    </div>
  )
}

export default function PaymentCallbackPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <PaymentCallbackContent />
    </Suspense>
  )
}
