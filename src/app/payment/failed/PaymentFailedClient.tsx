'use client'

import Link from 'next/link'

interface PaymentFailedClientProps {
  timestamp: string
  orderId: string
  status: string
  error: string
  reason: string
}

export default function PaymentFailedClient({ 
  timestamp, 
  orderId, 
  status, 
  error, 
  reason 
}: PaymentFailedClientProps) {
  
  const getErrorMessage = () => {
    switch (error) {
      case 'missing_order_id':
        return 'Payment information is missing. Please try again.'
      case 'callback_error':
        return 'There was an error processing your payment callback.'
      default:
        return reason || 'Your payment could not be processed. Please try again.'
    }
  }

  const getErrorTitle = () => {
    switch (error) {
      case 'missing_order_id':
        return 'Payment Information Missing'
      case 'callback_error':
        return 'Payment Processing Error'
      default:
        return 'Payment Failed'
    }
  }

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
          <div className="mx-auto h-16 w-16 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            {getErrorTitle()}
          </h2>
          
          <p className="mt-2 text-sm text-gray-600">
            {getErrorMessage()}
          </p>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Error Details</h3>
          
          <dl className="space-y-3">
            {orderId && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Order ID</dt>
                <dd className="text-sm text-gray-900 font-mono">{orderId}</dd>
              </div>
            )}
            
            {status && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Status</dt>
                <dd className="text-sm text-gray-900">{status}</dd>
              </div>
            )}
            
            {error && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Error Code</dt>
                <dd className="text-sm text-gray-900">{error}</dd>
              </div>
            )}
            
            <div>
              <dt className="text-sm font-medium text-gray-500">Time</dt>
              <dd className="text-sm text-gray-900">{formatTimestamp(timestamp)}</dd>
            </div>
          </dl>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">What happened?</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>Your payment could not be completed. This could be due to:</p>
                <ul className="mt-2 list-disc list-inside space-y-1">
                  <li>Network connectivity issues</li>
                  <li>Payment gateway errors</li>
                  <li>Invalid payment information</li>
                  <li>Session timeout</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="flex space-x-4">
          <Link 
            href="/pricing" 
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md text-center hover:bg-blue-700 transition-colors"
          >
            Try Again
          </Link>
          <Link 
            href="/dashboard" 
            className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-md text-center hover:bg-gray-300 transition-colors"
          >
            Go to Dashboard
          </Link>
        </div>

        <div className="text-center">
          <p className="text-sm text-gray-500">
            Need help? <Link href="/contact" className="text-blue-600 hover:text-blue-500">Contact Support</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
