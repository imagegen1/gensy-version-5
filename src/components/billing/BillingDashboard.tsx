'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@clerk/nextjs'
import { 
  CreditCardIcon,
  CalendarIcon,
  ChartBarIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline'
// Remove server-only import - will use API calls instead

interface PaymentHistory {
  id: string
  transactionId: string
  amount: number
  currency: string
  type: 'subscription' | 'credits'
  status: 'completed' | 'failed' | 'pending' | 'cancelled'
  planName?: string
  creditsReceived?: number
  createdAt: string
  completedAt?: string
}

interface SubscriptionStats {
  currentPlan: string
  creditsUsedThisMonth: number
  creditsRemaining: number
  daysUntilRenewal: number
}

export function BillingDashboard() {
  const { userId } = useAuth()
  const [currentSubscription, setCurrentSubscription] = useState<any>(null)
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([])
  const [subscriptionStats, setSubscriptionStats] = useState<SubscriptionStats>({
    currentPlan: 'Free',
    creditsUsedThisMonth: 0,
    creditsRemaining: 0,
    daysUntilRenewal: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    if (userId) {
      loadBillingData()
    }
  }, [userId])

  const loadBillingData = async () => {
    setIsLoading(true)
    try {
      // Load current subscription
      const subResponse = await fetch('/api/subscriptions/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_current' })
      })
      if (subResponse.ok) {
        const subData = await subResponse.json()
        setCurrentSubscription(subData.subscription)
      }

      // Load subscription stats (mock data for now)
      setSubscriptionStats({
        currentPlan: 'Free',
        creditsUsedThisMonth: 0,
        creditsRemaining: 0,
        daysUntilRenewal: 0
      })

      // Load payment history
      const response = await fetch('/api/payments/initiate')
      if (response.ok) {
        const data = await response.json()
        setPaymentHistory(data.payments || [])
      }

    } catch (error) {
      console.error('Failed to load billing data:', error)
      setError('Failed to load billing information')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancelSubscription = async () => {
    if (!currentSubscription) return

    if (confirm('Are you sure you want to cancel your subscription? You will lose access to premium features at the end of your current billing period.')) {
      try {
        const response = await fetch('/api/subscriptions/plans', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'cancel',
            subscriptionId: currentSubscription.id
          })
        })
        const result = await response.json()
        if (result.success) {
          await loadBillingData() // Reload data
        } else {
          setError(result.error || 'Failed to cancel subscription')
        }
      } catch (error) {
        setError('Failed to cancel subscription')
      }
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />
      case 'failed':
        return <XCircleIcon className="h-5 w-5 text-red-500" />
      case 'pending':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />
      case 'cancelled':
        return <XCircleIcon className="h-5 w-5 text-gray-500" />
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-50'
      case 'failed':
        return 'text-red-600 bg-red-50'
      case 'pending':
        return 'text-yellow-600 bg-yellow-50'
      case 'cancelled':
        return 'text-gray-600 bg-gray-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Billing & Subscription</h1>
          <p className="text-gray-600 mt-1">Manage your subscription and view payment history</p>
        </div>
        <div className="flex items-center space-x-3">
          <CreditCardIcon className="h-8 w-8 text-primary-600" />
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-2" />
            <div className="text-red-800">{error}</div>
          </div>
        </div>
      )}

      {/* Current Subscription */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Current Subscription</h2>
        
        {currentSubscription ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Plan</h3>
              <p className="text-2xl font-bold text-gray-900">{currentSubscription.plan?.name}</p>
              <p className="text-gray-600">{currentSubscription.plan?.description}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Status</h3>
              <div className="flex items-center">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  currentSubscription.status === 'active' 
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {currentSubscription.status}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                {currentSubscription.auto_renew ? 'Auto-renewing' : 'Will not renew'}
              </p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Next Billing</h3>
              <p className="text-lg font-semibold text-gray-900">
                {formatDate(currentSubscription.current_period_end)}
              </p>
              <p className="text-sm text-gray-600">
                {subscriptionStats.daysUntilRenewal} days remaining
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">You're currently on the free plan</p>
            <button className="bg-primary-600 text-white px-6 py-2 rounded-md hover:bg-primary-700">
              Upgrade to Premium
            </button>
          </div>
        )}

        {currentSubscription && (
          <div className="mt-6 pt-6 border-t border-gray-200 flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-600">
                Monthly credits: {currentSubscription.plan?.credits_per_month}
              </p>
            </div>
            <div className="space-x-3">
              <button className="text-primary-600 hover:text-primary-700 font-medium">
                Change Plan
              </button>
              <button 
                onClick={handleCancelSubscription}
                className="text-red-600 hover:text-red-700 font-medium"
              >
                Cancel Subscription
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Usage Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <ChartBarIcon className="h-8 w-8 text-blue-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Credits Used</p>
              <p className="text-2xl font-bold text-gray-900">{subscriptionStats.creditsUsedThisMonth}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <CreditCardIcon className="h-8 w-8 text-green-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Credits Remaining</p>
              <p className="text-2xl font-bold text-gray-900">{subscriptionStats.creditsRemaining}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <CalendarIcon className="h-8 w-8 text-purple-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Current Plan</p>
              <p className="text-2xl font-bold text-gray-900">{subscriptionStats.currentPlan}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <ClockIcon className="h-8 w-8 text-orange-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Days Until Renewal</p>
              <p className="text-2xl font-bold text-gray-900">{subscriptionStats.daysUntilRenewal}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Payment History */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Payment History</h2>
          <button className="flex items-center text-primary-600 hover:text-primary-700">
            <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
            Export
          </button>
        </div>

        {paymentHistory.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Transaction
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paymentHistory.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {payment.transactionId}
                        </div>
                        <div className="text-sm text-gray-500">
                          {payment.planName || `${payment.creditsReceived} credits`}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {payment.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(payment.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getStatusIcon(payment.status)}
                        <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                          {payment.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(payment.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button className="text-primary-600 hover:text-primary-900">
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No payment history</h3>
            <p className="text-gray-500">Your payment transactions will appear here</p>
          </div>
        )}
      </div>
    </div>
  )
}
