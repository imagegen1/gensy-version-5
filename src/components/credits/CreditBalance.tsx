'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@clerk/nextjs'
import { CreditCardIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { CreditService, type CreditBalance } from '@/lib/credits'

interface CreditBalanceProps {
  showDetails?: boolean
  className?: string
}

export function CreditBalance({ showDetails = false, className = '' }: CreditBalanceProps) {
  const { userId } = useAuth()
  const [balance, setBalance] = useState<CreditBalance | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (userId) {
      loadBalance()
    }
  }, [userId])

  const loadBalance = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/user/credits')
      if (response.ok) {
        const data = await response.json()
        setBalance(data.balance)
      }
    } catch (error) {
      console.error('Error loading credit balance:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="flex items-center space-x-2">
          <div className="w-5 h-5 bg-gray-300 rounded"></div>
          <div className="w-16 h-4 bg-gray-300 rounded"></div>
        </div>
      </div>
    )
  }

  if (!balance) {
    return null
  }

  const isLowCredits = balance.current < 10
  const isCriticalCredits = balance.current < 3

  return (
    <div className={`${className}`}>
      <div className="flex items-center space-x-2">
        <div className="relative">
          <CreditCardIcon className={`w-5 h-5 ${
            isCriticalCredits ? 'text-red-500' : 
            isLowCredits ? 'text-yellow-500' : 
            'text-blue-500'
          }`} />
          {isCriticalCredits && (
            <ExclamationTriangleIcon className="w-3 h-3 text-red-500 absolute -top-1 -right-1" />
          )}
        </div>
        
        <div className="flex flex-col">
          <span className={`font-semibold ${
            isCriticalCredits ? 'text-red-600' : 
            isLowCredits ? 'text-yellow-600' : 
            'text-gray-900'
          }`}>
            {balance.current} credits
          </span>
          
          {showDetails && (
            <div className="text-xs text-gray-500 space-y-1">
              <div>Earned: {balance.total_earned}</div>
              <div>Used: {balance.total_spent}</div>
            </div>
          )}
        </div>
      </div>

      {isLowCredits && (
        <div className={`mt-2 text-xs ${
          isCriticalCredits ? 'text-red-600' : 'text-yellow-600'
        }`}>
          {isCriticalCredits ? 
            'Critical: Very low credits remaining!' : 
            'Warning: Low credits remaining'
          }
        </div>
      )}
    </div>
  )
}

export function CreditBalanceCard() {
  const { userId } = useAuth()
  const [balance, setBalance] = useState<CreditBalance | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (userId) {
      loadBalance()
    }
  }, [userId])

  const loadBalance = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/user/credits')
      if (response.ok) {
        const data = await response.json()
        setBalance(data.balance)
      }
    } catch (error) {
      console.error('Error loading credit balance:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="w-24 h-6 bg-gray-300 rounded"></div>
          <div className="w-8 h-8 bg-gray-300 rounded"></div>
        </div>
        <div className="mt-4 space-y-2">
          <div className="w-16 h-8 bg-gray-300 rounded"></div>
          <div className="w-32 h-4 bg-gray-300 rounded"></div>
        </div>
      </div>
    )
  }

  if (!balance) {
    return null
  }

  const isLowCredits = balance.current < 10

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Credit Balance</h3>
        <CreditCardIcon className={`w-8 h-8 ${
          isLowCredits ? 'text-yellow-500' : 'text-blue-500'
        }`} />
      </div>
      
      <div className="mt-4">
        <div className="text-3xl font-bold text-gray-900">
          {balance.current}
        </div>
        <div className="text-sm text-gray-500">
          credits available
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
        <div>
          <div className="text-gray-500">Total Earned</div>
          <div className="font-medium text-green-600">+{balance.total_earned}</div>
        </div>
        <div>
          <div className="text-gray-500">Total Used</div>
          <div className="font-medium text-red-600">-{balance.total_spent}</div>
        </div>
      </div>

      {isLowCredits && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <div className="flex">
            <ExclamationTriangleIcon className="w-5 h-5 text-yellow-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Low Credits
              </h3>
              <div className="mt-1 text-sm text-yellow-700">
                Consider purchasing more credits to continue using all features.
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-4">
        <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors">
          Buy More Credits
        </button>
      </div>
    </div>
  )
}
