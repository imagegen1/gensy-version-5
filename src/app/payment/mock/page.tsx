/**
 * Mock Payment Page for Development
 * Simulates PhonePe payment flow for testing
 */

'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import {
  CreditCardIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline'

function MockPaymentContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'success' | 'failed'>('pending')

  const txnId = searchParams.get('txnId')
  const amount = searchParams.get('amount')

  useEffect(() => {
    if (!txnId || !amount) {
      router.push('/')
    }
  }, [txnId, amount, router])

  const handlePayment = async (success: boolean) => {
    setIsProcessing(true)

    try {
      // Simulate payment processing delay
      await new Promise(resolve => setTimeout(resolve, 2000))

      if (success) {
        setPaymentStatus('success')
        
        // Simulate webhook call
        setTimeout(() => {
          router.push('/billing?payment=success')
        }, 2000)
      } else {
        setPaymentStatus('failed')
        
        setTimeout(() => {
          router.push('/billing?payment=failed')
        }, 2000)
      }

    } catch (error) {
      console.error('Mock payment error:', error)
      setPaymentStatus('failed')
    } finally {
      setIsProcessing(false)
    }
  }

  const formatAmount = (amount: string) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(parseFloat(amount))
  }

  if (paymentStatus === 'success') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
          <p className="text-gray-600 mb-6">
            Your payment of {amount && formatAmount(amount)} has been processed successfully.
          </p>
          <div className="text-sm text-gray-500">
            Transaction ID: {txnId}
          </div>
          <div className="mt-6">
            <div className="animate-pulse text-primary-600">
              Redirecting to billing dashboard...
            </div>
          </div>
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
            Your payment of {amount && formatAmount(amount)} could not be processed.
          </p>
          <div className="text-sm text-gray-500">
            Transaction ID: {txnId}
          </div>
          <div className="mt-6">
            <div className="animate-pulse text-red-600">
              Redirecting to billing dashboard...
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <CreditCardIcon className="h-16 w-16 text-primary-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Mock Payment Gateway</h1>
          <p className="text-gray-600">
            This is a development payment simulator
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h2 className="font-semibold text-gray-900 mb-2">Payment Details</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Amount:</span>
              <span className="font-medium">{amount && formatAmount(amount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Transaction ID:</span>
              <span className="font-medium text-xs">{txnId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Payment Method:</span>
              <span className="font-medium">PhonePe (Mock)</span>
            </div>
          </div>
        </div>

        {isProcessing ? (
          <div className="text-center">
            <ClockIcon className="h-8 w-8 text-primary-600 mx-auto mb-4 animate-spin" />
            <p className="text-gray-600">Processing payment...</p>
          </div>
        ) : (
          <div className="space-y-4">
            <button
              onClick={() => handlePayment(true)}
              className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors"
            >
              ✅ Simulate Successful Payment
            </button>
            
            <button
              onClick={() => handlePayment(false)}
              className="w-full bg-red-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-red-700 transition-colors"
            >
              ❌ Simulate Failed Payment
            </button>
            
            <button
              onClick={() => router.push('/billing')}
              className="w-full bg-gray-300 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-400 transition-colors"
            >
              Cancel Payment
            </button>
          </div>
        )}

        <div className="mt-6 text-xs text-gray-500 text-center">
          <p>⚠️ This is a development environment</p>
          <p>No real payments will be processed</p>
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
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Loading Payment</h1>
        <p className="text-gray-600">
          Please wait while we load your payment information...
        </p>
      </div>
    </div>
  )
}

export default function MockPaymentPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <MockPaymentContent />
    </Suspense>
  )
}
