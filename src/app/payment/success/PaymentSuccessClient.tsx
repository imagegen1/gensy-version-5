'use client'

import Link from 'next/link'

interface PaymentSuccessClientProps {
  timestamp: string
  orderId: string
  amount: string
  plan: string
  transactionId: string
  status: string
}

export default function PaymentSuccessClient({ 
  timestamp, 
  orderId, 
  amount, 
  plan, 
  transactionId, 
  status 
}: PaymentSuccessClientProps) {
  
  // Format timestamp consistently on client
  const formatTimestamp = (isoString: string) => {
    try {
      const date = new Date(isoString)
      return new Intl.DateTimeFormat('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }).format(date)
    } catch {
      return isoString
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Payment Successful!
          </h2>
          
          <p className="mt-2 text-sm text-gray-600">
            Your payment has been processed successfully
          </p>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Details</h3>
          
          <dl className="space-y-3">
            {orderId && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Order ID</dt>
                <dd className="text-sm text-gray-900 font-mono">{orderId}</dd>
              </div>
            )}
            
            {transactionId && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Transaction ID</dt>
                <dd className="text-sm text-gray-900 font-mono">{transactionId}</dd>
              </div>
            )}
            
            {amount && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Amount</dt>
                <dd className="text-sm text-gray-900">₹{amount}</dd>
              </div>
            )}
            
            {plan && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Plan</dt>
                <dd className="text-sm text-gray-900 capitalize">{plan}</dd>
              </div>
            )}
            
            <div>
              <dt className="text-sm font-medium text-gray-500">Status</dt>
              <dd className="text-sm text-green-600 font-medium">✅ Completed</dd>
            </div>
            
            <div>
              <dt className="text-sm font-medium text-gray-500">Date</dt>
              <dd className="text-sm text-gray-900">{formatTimestamp(timestamp)}</dd>
            </div>
          </dl>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">Payment Confirmed</h3>
              <div className="mt-2 text-sm text-green-700">
                <p>Your payment has been successfully processed and your account has been updated.</p>
                <ul className="mt-2 list-disc list-inside space-y-1">
                  <li>You will receive a confirmation email shortly</li>
                  <li>Your subscription is now active</li>
                  <li>You can start using your new plan immediately</li>
                </ul>
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
            href="/billing" 
            className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-md text-center hover:bg-gray-300 transition-colors"
          >
            View Billing
          </Link>
        </div>

        <div className="text-center">
          <p className="text-sm text-gray-500">
            Questions? <Link href="/contact" className="text-blue-600 hover:text-blue-500">Contact Support</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
