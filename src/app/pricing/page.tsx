/**
 * Pricing Page for Gensy AI Creative Suite
 * Displays subscription plans and handles plan selection
 */

'use client'

import { useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { PricingPage } from '@/components/pricing/PricingPage'

export default function PricingPageRoute() {
  const { userId } = useAuth()
  const router = useRouter()
  const [isProcessing, setIsProcessing] = useState(false)

  const handlePlanSelect = async (planId: string, billingCycle: 'monthly' | 'yearly') => {
    if (!userId) {
      router.push('/sign-in?redirect_url=/pricing')
      return
    }

    setIsProcessing(true)

    try {
      // Get plan details first
      const plansResponse = await fetch('/api/subscriptions/plans')
      const plansData = await plansResponse.json()
      const selectedPlan = plansData.plans?.find((p: any) => p.id === planId)

      if (!selectedPlan) {
        throw new Error('Selected plan not found')
      }

      const amount = billingCycle === 'monthly' 
        ? selectedPlan.price_monthly 
        : selectedPlan.price_yearly

      // Initiate payment
      const response = await fetch('/api/payments/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'subscription',
          planId,
          amount,
          description: `${selectedPlan.name} subscription (${billingCycle})`
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Payment initiation failed')
      }

      if (data.paymentUrl) {
        // Redirect to payment page
        window.location.href = data.paymentUrl
      } else {
        throw new Error('Payment URL not received')
      }

    } catch (error) {
      console.error('Plan selection error:', error)
      alert(error instanceof Error ? error.message : 'Failed to process plan selection')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {isProcessing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 flex items-center space-x-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <span className="text-gray-900">Processing your selection...</span>
          </div>
        </div>
      )}
      
      <PricingPage onSelectPlan={handlePlanSelect} />
    </div>
  )
}
