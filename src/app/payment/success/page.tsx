import { Suspense } from 'react'
import PaymentSuccessClient from './PaymentSuccessClient'

interface PageProps {
  searchParams: Promise<{
    orderId?: string
    amount?: string
    plan?: string
    transactionId?: string
    status?: string
  }>
}

export default async function PaymentSuccessPage({ searchParams }: PageProps) {
  // Generate stable timestamp on server
  const timestamp = new Date().toISOString()

  // Await searchParams in Next.js 15
  const params = await searchParams

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PaymentSuccessClient
        timestamp={timestamp}
        orderId={params.orderId || ''}
        amount={params.amount || ''}
        plan={params.plan || ''}
        transactionId={params.transactionId || ''}
        status={params.status || ''}
      />
    </Suspense>
  )
}


