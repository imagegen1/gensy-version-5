'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function DevelopmentSuccessPage() {
  const searchParams = useSearchParams()
  const [paymentDetails, setPaymentDetails] = useState({
    orderId: '',
    amount: '',
    plan: ''
  })
  const [creditProcessing, setCreditProcessing] = useState(true)
  const [creditsAdded, setCreditsAdded] = useState(0)
  const [processingError, setProcessingError] = useState('')

  useEffect(() => {
    const orderId = searchParams.get('orderId') || ''
    const amount = searchParams.get('amount') || ''
    const plan = searchParams.get('plan') || ''

    setPaymentDetails({ orderId, amount, plan })

    // Process the development payment and add credits
    if (orderId && amount) {
      processPaymentSuccess(orderId, amount, plan)
    }
  }, [searchParams])

  const processPaymentSuccess = async (orderId: string, amount: string, plan: string) => {
    try {
      setCreditProcessing(true)

      const response = await fetch('/api/payments/process-success', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
          amount: parseFloat(amount),
          plan,
          isDevelopment: true
        }),
      })

      const result = await response.json()

      if (result.success) {
        setCreditsAdded(result.creditsAdded || 0)
      } else {
        setProcessingError(result.error || 'Failed to process payment')
      }
    } catch (error) {
      console.error('Error processing payment:', error)
      setProcessingError('Failed to process payment')
    } finally {
      setCreditProcessing(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-yellow-100 rounded-full flex items-center justify-center">
            <svg className="h-8 w-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            🧪 Development Mode
          </h2>
          
          <p className="mt-2 text-sm text-gray-600">
            Payment simulation completed successfully
          </p>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Details</h3>
          
          <dl className="space-y-3">
            <div>
              <dt className="text-sm font-medium text-gray-500">Order ID</dt>
              <dd className="text-sm text-gray-900 font-mono">{paymentDetails.orderId}</dd>
            </div>
            
            <div>
              <dt className="text-sm font-medium text-gray-500">Amount</dt>
              <dd className="text-sm text-gray-900">₹{paymentDetails.amount}</dd>
            </div>
            
            <div>
              <dt className="text-sm font-medium text-gray-500">Plan</dt>
              <dd className="text-sm text-gray-900 capitalize">{paymentDetails.plan}</dd>
            </div>
            
            <div>
              <dt className="text-sm font-medium text-gray-500">Status</dt>
              <dd className="text-sm text-green-600 font-medium">✅ Simulated Success</dd>
            </div>
          </dl>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Development Mode Active</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>This is a simulated payment for testing purposes. To enable real PhonePe payments:</p>
                <ol className="mt-2 list-decimal list-inside space-y-1">
                  <li>Get PhonePe merchant credentials from PhonePe Business Dashboard</li>
                  <li>Update PHONEPE_CLIENT_ID and PHONEPE_CLIENT_SECRET in .env.local</li>
                  <li>Restart the development server</li>
                </ol>
              </div>
            </div>
          </div>
        </div>

        <div className="flex space-x-4">
          <Link 
            href="/dashboard" 
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md text-center hover:bg-blue-700 transition-colors"
          >
            Go to Dashboard
          </Link>
          <Link 
            href="/pricing" 
            className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-md text-center hover:bg-gray-300 transition-colors"
          >
            Back to Pricing
          </Link>
        </div>
      </div>
    </div>
  )
}
