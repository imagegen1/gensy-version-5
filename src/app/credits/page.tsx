/**
 * Credit Purchase Page for Gensy AI Creative Suite
 * Allows users to purchase credit packages
 */

'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@clerk/nextjs'
import { CreditPurchase } from '@/components/credits/CreditPurchase'

export default function CreditsPage() {
  const { userId } = useAuth()
  const [currentBalance, setCurrentBalance] = useState(0)

  useEffect(() => {
    if (userId) {
      loadCurrentBalance()
    }
  }, [userId])

  const loadCurrentBalance = async () => {
    try {
      const response = await fetch('/api/user/credits')
      if (response.ok) {
        const data = await response.json()
        setCurrentBalance(data.balance?.current || 0)
      }
    } catch (error) {
      console.error('Failed to load current balance:', error)
    }
  }

  const handlePurchaseComplete = (newBalance: number) => {
    setCurrentBalance(newBalance)
    // Could show success message or redirect
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <CreditPurchase 
        currentBalance={currentBalance}
        onPurchaseComplete={handlePurchaseComplete}
      />
    </div>
  )
}
