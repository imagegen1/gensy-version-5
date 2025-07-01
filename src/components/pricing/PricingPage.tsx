'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@clerk/nextjs'
import { 
  CheckIcon,
  SparklesIcon,
  CreditCardIcon,
  StarIcon,
  BoltIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline'
// Remove server-only import - will use API calls instead
interface SubscriptionPlan {
  id: string
  name: string
  description: string
  price_monthly: number
  price_yearly: number
  credits_per_month: number
  features: Record<string, boolean>
  is_active: boolean
  created_at: string
  updated_at: string
}

interface PricingPageProps {
  onSelectPlan?: (planId: string, billingCycle: 'monthly' | 'yearly') => void
}

export function PricingPage({ onSelectPlan }: PricingPageProps) {
  const { userId } = useAuth()
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')
  const [currentSubscription, setCurrentSubscription] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadPlans()
    if (userId) {
      loadCurrentSubscription()
    }
  }, [userId])

  const loadPlans = async () => {
    try {
      const response = await fetch('/api/subscriptions/plans')
      if (response.ok) {
        const data = await response.json()
        setPlans(data.plans || [])
      }
    } catch (error) {
      console.error('Failed to load subscription plans:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadCurrentSubscription = async () => {
    try {
      const response = await fetch('/api/subscriptions/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_current' })
      })
      if (response.ok) {
        const data = await response.json()
        setCurrentSubscription(data.subscription)
      }
    } catch (error) {
      console.error('Failed to load current subscription:', error)
    }
  }

  const handlePlanSelect = (planId: string) => {
    if (onSelectPlan) {
      onSelectPlan(planId, billingCycle)
    }
  }

  const getPrice = (plan: SubscriptionPlan) => {
    return billingCycle === 'monthly' ? plan.price_monthly : plan.price_yearly
  }

  const getMonthlyPrice = (plan: SubscriptionPlan) => {
    return billingCycle === 'monthly' ? plan.price_monthly : plan.price_yearly / 12
  }

  const getSavings = (plan: SubscriptionPlan) => {
    if (billingCycle === 'monthly') return 0
    const monthlyTotal = plan.price_monthly * 12
    const yearlyPrice = plan.price_yearly
    return Math.round(((monthlyTotal - yearlyPrice) / monthlyTotal) * 100)
  }

  const isCurrentPlan = (planId: string) => {
    return currentSubscription?.plan_id === planId
  }

  const getPlanIcon = (planName: string) => {
    const name = planName.toLowerCase()
    if (name.includes('starter') || name.includes('basic')) return SparklesIcon
    if (name.includes('pro') || name.includes('professional')) return BoltIcon
    if (name.includes('enterprise') || name.includes('business')) return ShieldCheckIcon
    return StarIcon
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="bg-white">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl">
            Choose Your Creative Plan
          </h1>
          <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
            Unlock the full power of AI creativity with our flexible subscription plans. 
            Generate unlimited images, videos, and more with premium features.
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="mt-12 flex justify-center">
          <div className="relative bg-gray-100 rounded-lg p-1 flex">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`relative px-6 py-2 text-sm font-medium rounded-md transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`relative px-6 py-2 text-sm font-medium rounded-md transition-all ${
                billingCycle === 'yearly'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Yearly
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Save up to 20%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Free Plan */}
          <div className="relative bg-white border border-gray-200 rounded-2xl shadow-sm p-8">
            <div className="text-center">
              <SparklesIcon className="h-12 w-12 text-gray-400 mx-auto" />
              <h3 className="mt-4 text-2xl font-bold text-gray-900">Free</h3>
              <p className="mt-2 text-gray-500">Perfect for getting started</p>
              <div className="mt-6">
                <span className="text-4xl font-bold text-gray-900">₹0</span>
                <span className="text-gray-500">/month</span>
              </div>
            </div>

            <ul className="mt-8 space-y-4">
              <li className="flex items-start">
                <CheckIcon className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                <span className="text-gray-700">5 credits per month</span>
              </li>
              <li className="flex items-start">
                <CheckIcon className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                <span className="text-gray-700">Basic image generation</span>
              </li>
              <li className="flex items-start">
                <CheckIcon className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                <span className="text-gray-700">Standard quality</span>
              </li>
              <li className="flex items-start">
                <CheckIcon className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                <span className="text-gray-700">Community support</span>
              </li>
            </ul>

            <button
              disabled={!userId || isCurrentPlan('free')}
              className="mt-8 w-full bg-gray-100 text-gray-900 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCurrentPlan('free') ? 'Current Plan' : 'Get Started'}
            </button>
          </div>

          {/* Subscription Plans */}
          {plans.map((plan, index) => {
            const Icon = getPlanIcon(plan.name)
            const isPopular = index === 1 // Make middle plan popular
            const savings = getSavings(plan)

            return (
              <div
                key={plan.id}
                className={`relative bg-white rounded-2xl shadow-sm p-8 ${
                  isPopular
                    ? 'border-2 border-primary-500 ring-1 ring-primary-500'
                    : 'border border-gray-200'
                }`}
              >
                {isPopular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-primary-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="text-center">
                  <Icon className={`h-12 w-12 mx-auto ${
                    isPopular ? 'text-primary-500' : 'text-gray-400'
                  }`} />
                  <h3 className="mt-4 text-2xl font-bold text-gray-900">{plan.name}</h3>
                  <p className="mt-2 text-gray-500">{plan.description}</p>
                  
                  <div className="mt-6">
                    <span className="text-4xl font-bold text-gray-900">
                      ₹{Math.round(getMonthlyPrice(plan))}
                    </span>
                    <span className="text-gray-500">/month</span>
                    {billingCycle === 'yearly' && (
                      <div className="text-sm text-gray-500 mt-1">
                        Billed ₹{getPrice(plan)} yearly
                      </div>
                    )}
                    {savings > 0 && (
                      <div className="text-sm text-green-600 font-medium mt-1">
                        Save {savings}% with yearly billing
                      </div>
                    )}
                  </div>
                </div>

                <ul className="mt-8 space-y-4">
                  <li className="flex items-start">
                    <CheckIcon className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                    <span className="text-gray-700">{plan.credits_per_month} credits per month</span>
                  </li>
                  {Object.entries(plan.features).map(([feature, enabled]) => (
                    enabled && (
                      <li key={feature} className="flex items-start">
                        <CheckIcon className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                        <span className="text-gray-700 capitalize">
                          {feature.replace(/_/g, ' ')}
                        </span>
                      </li>
                    )
                  ))}
                </ul>

                <button
                  onClick={() => handlePlanSelect(plan.id)}
                  disabled={!userId || isCurrentPlan(plan.id)}
                  className={`mt-8 w-full py-3 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    isPopular
                      ? 'bg-primary-600 text-white hover:bg-primary-700'
                      : 'bg-gray-900 text-white hover:bg-gray-800'
                  }`}
                >
                  {isCurrentPlan(plan.id) ? 'Current Plan' : `Choose ${plan.name}`}
                </button>
              </div>
            )
          })}
        </div>

        {/* Features Comparison */}
        <div className="mt-20">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Compare Features
          </h2>
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-4 px-6 font-medium text-gray-900">Features</th>
                  <th className="text-center py-4 px-6 font-medium text-gray-900">Free</th>
                  {plans.map(plan => (
                    <th key={plan.id} className="text-center py-4 px-6 font-medium text-gray-900">
                      {plan.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-100">
                  <td className="py-4 px-6 text-gray-700">Monthly Credits</td>
                  <td className="py-4 px-6 text-center text-gray-500">5</td>
                  {plans.map(plan => (
                    <td key={plan.id} className="py-4 px-6 text-center text-gray-900 font-medium">
                      {plan.credits_per_month}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-4 px-6 text-gray-700">Image Generation</td>
                  <td className="py-4 px-6 text-center">
                    <CheckIcon className="h-5 w-5 text-green-500 mx-auto" />
                  </td>
                  {plans.map(plan => (
                    <td key={plan.id} className="py-4 px-6 text-center">
                      <CheckIcon className="h-5 w-5 text-green-500 mx-auto" />
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-4 px-6 text-gray-700">Video Generation</td>
                  <td className="py-4 px-6 text-center text-gray-400">—</td>
                  {plans.map(plan => (
                    <td key={plan.id} className="py-4 px-6 text-center">
                      {plan.features.video_generation ? (
                        <CheckIcon className="h-5 w-5 text-green-500 mx-auto" />
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-4 px-6 text-gray-700">Priority Support</td>
                  <td className="py-4 px-6 text-center text-gray-400">—</td>
                  {plans.map(plan => (
                    <td key={plan.id} className="py-4 px-6 text-center">
                      {plan.features.priority_support ? (
                        <CheckIcon className="h-5 w-5 text-green-500 mx-auto" />
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-20">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Frequently Asked Questions
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                What are credits?
              </h3>
              <p className="text-gray-600">
                Credits are used to generate images, videos, and other AI content. Different features consume different amounts of credits.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Can I change plans anytime?
              </h3>
              <p className="text-gray-600">
                Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Do unused credits roll over?
              </h3>
              <p className="text-gray-600">
                Unused credits from your subscription roll over to the next month, up to a maximum limit.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Is there a free trial?
              </h3>
              <p className="text-gray-600">
                Yes, all new users get 5 free credits to try our platform. No credit card required.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
