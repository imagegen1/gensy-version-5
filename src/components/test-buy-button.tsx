'use client'

import { SignedIn, SignedOut, useAuth } from '@clerk/nextjs'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function TestBuyButton({ planId }: { planId: string }) {
  const router = useRouter()
  const { isSignedIn } = useAuth()
  const qs = useSearchParams()
  const [busy, setBusy] = useState(false)

  /* auto-resume after sign-in */
  useEffect(() => {
    if (isSignedIn && qs.get('plan') === planId) buy()
  }, [isSignedIn]) // eslint-disable-line react-hooks/exhaustive-deps

  async function buy() {
    if (!isSignedIn) {
      // bounce to sign-in and come back with ?plan=...
      router.push(
        `/auth/sign-in?redirect_url=${encodeURIComponent(
          `/pricing?plan=${planId}`,
        )}`,
      )
      return
    }

    setBusy(true)
    try {
      const res = await fetch('/api/payments/initiate', {
        method: 'POST',
        credentials: 'include', // <-- THE IMPORTANT LINE
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'subscription',
          planId,
          amount: planId === 'starter' ? 360 : planId === 'pro' ? 937 : 4185,
          description: `${planId.charAt(0).toUpperCase() + planId.slice(1)} Plan Subscription`
        }),
      })

      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const { checkoutUrl } = await res.json()
      router.push(checkoutUrl) // ⇢ PhonePe
    } catch (err: any) {
      alert(err.message ?? 'Something went wrong')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <SignedOut>
        <button onClick={buy} className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700">
          Get Started
        </button>
      </SignedOut>
      <SignedIn>
        <button
          onClick={buy}
          disabled={busy}
          className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {busy ? 'Redirecting…' : 'Get Started'}
        </button>
      </SignedIn>
    </>
  )
}
