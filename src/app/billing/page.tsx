/**
 * Billing Dashboard Page for Gensy AI Creative Suite
 * Displays billing information and subscription management
 */

import { Metadata } from 'next'
import { BillingDashboard } from '@/components/billing/BillingDashboard'

export const metadata: Metadata = {
  title: 'Billing & Subscription | Gensy',
  description: 'Manage your subscription and view payment history',
}

export default function BillingPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <BillingDashboard />
    </div>
  )
}
