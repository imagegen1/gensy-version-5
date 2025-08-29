import { Suspense } from 'react'
import PaymentFailedClient from './PaymentFailedClient'

interface PageProps {
  searchParams: Promise<{
    orderId?: string
    status?: string
    error?: string
    reason?: string
  }>
}

export default async function PaymentFailedPage({ searchParams }: PageProps) {
  // Generate stable timestamp on server
  const timestamp = new Date().toISOString()

  // Await searchParams in Next.js 15
  const params = await searchParams

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PaymentFailedClient
        timestamp={timestamp}
        orderId={params.orderId || ''}
        status={params.status || ''}
        error={params.error || ''}
        reason={params.reason || ''}
      />
    </Suspense>
  )
}


