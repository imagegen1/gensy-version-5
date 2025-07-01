/**
 * Analytics Page for Gensy AI Creative Suite
 * Displays usage analytics and reporting
 */

import { Metadata } from 'next'
import { UsageAnalytics } from '@/components/analytics/UsageAnalytics'

export const metadata: Metadata = {
  title: 'Usage Analytics | Gensy',
  description: 'Track your AI generation usage and credit consumption',
}

export default function AnalyticsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <UsageAnalytics />
    </div>
  )
}
