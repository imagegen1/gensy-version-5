'use client'

import { useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { 
  CreditCardIcon,
  SparklesIcon,
  BoltIcon,
  FireIcon,
  GiftIcon,
  CheckIcon
} from '@heroicons/react/24/outline'
// Remove server-only import - will use static data
interface CreditPackage {
  id: string
  name: string
  credits: number
  price: number
  bonus_percentage: number
  description: string
}

interface CreditPurchaseProps {
  onPurchaseComplete?: (newBalance: number) => void
  currentBalance?: number
}

export function CreditPurchase({ onPurchaseComplete, currentBalance = 0 }: CreditPurchaseProps) {
  const { userId } = useAuth()
  const [selectedPackage, setSelectedPackage] = useState<string>('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string>('')

  const creditPackages: CreditPackage[] = [
    {
      id: 'starter',
      name: 'Starter Pack',
      credits: 25,
      price: 4.99,
      bonus_percentage: 0,
      description: 'Perfect for trying out premium features'
    },
    {
      id: 'value',
      name: 'Value Pack',
      credits: 60,
      price: 9.99,
      bonus_percentage: 20,
      description: 'Great value with 20% bonus credits'
    },
    {
      id: 'power',
      name: 'Power Pack',
      credits: 150,
      price: 19.99,
      bonus_percentage: 50,
      description: 'Best for heavy users with 50% bonus'
    },
    {
      id: 'mega',
      name: 'Mega Pack',
      credits: 350,
      price: 39.99,
      bonus_percentage: 75,
      description: 'Maximum value with 75% bonus credits'
    }
  ]

  const getPackageIcon = (packageId: string) => {
    switch (packageId) {
      case 'starter': return SparklesIcon
      case 'value': return BoltIcon
      case 'power': return FireIcon
      case 'mega': return GiftIcon
      default: return CreditCardIcon
    }
  }

  const getPackageColor = (packageId: string) => {
    switch (packageId) {
      case 'starter': return 'blue'
      case 'value': return 'green'
      case 'power': return 'purple'
      case 'mega': return 'orange'
      default: return 'gray'
    }
  }

  const handlePurchase = async (creditPackage: CreditPackage) => {
    if (!userId) {
      setError('Please sign in to purchase credits')
      return
    }

    setIsProcessing(true)
    setError('')

    try {
      // Initiate payment
      const response = await fetch('/api/payments/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'credits',
          packageId: creditPackage.id,
          amount: creditPackage.price,
          description: `Purchase ${creditPackage.name} - ${creditPackage.credits} credits`
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
      console.error('Credit purchase error:', error)
      setError(error instanceof Error ? error.message : 'Purchase failed')
    } finally {
      setIsProcessing(false)
    }
  }

  const getTotalCredits = (creditPackage: CreditPackage) => {
    const bonusCredits = Math.floor(creditPackage.credits * (creditPackage.bonus_percentage / 100))
    return creditPackage.credits + bonusCredits
  }

  const getCreditValue = (creditPackage: CreditPackage) => {
    return (creditPackage.price / getTotalCredits(creditPackage)).toFixed(2)
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <CreditCardIcon className="h-8 w-8 text-primary-600 mr-2" />
          <h1 className="text-3xl font-bold text-gray-900">Purchase Credits</h1>
        </div>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Buy credits to unlock premium AI features. Generate more images, videos, and creative content with our flexible credit packages.
        </p>
        
        {/* Current Balance */}
        <div className="mt-6 inline-flex items-center bg-primary-50 px-4 py-2 rounded-full">
          <SparklesIcon className="h-5 w-5 text-primary-600 mr-2" />
          <span className="text-primary-700 font-medium">
            Current Balance: {currentBalance} credits
          </span>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-800">{error}</div>
        </div>
      )}

      {/* Credit Packages */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {creditPackages.map((creditPackage, index) => {
          const Icon = getPackageIcon(creditPackage.id)
          const color = getPackageColor(creditPackage.id)
          const totalCredits = getTotalCredits(creditPackage)
          const isPopular = index === 1 // Make second package popular
          const isSelected = selectedPackage === creditPackage.id

          return (
            <div
              key={creditPackage.id}
              className={`relative bg-white rounded-xl shadow-sm border-2 p-6 cursor-pointer transition-all hover:shadow-md ${
                isPopular
                  ? 'border-primary-500 ring-2 ring-primary-100'
                  : isSelected
                  ? `border-${color}-500`
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setSelectedPackage(creditPackage.id)}
            >
              {isPopular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-primary-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                    Best Value
                  </span>
                </div>
              )}

              <div className="text-center">
                <Icon className={`h-12 w-12 mx-auto mb-4 ${
                  isPopular ? 'text-primary-500' : `text-${color}-500`
                }`} />
                
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {creditPackage.name}
                </h3>
                
                <div className="mb-4">
                  <div className="text-3xl font-bold text-gray-900">
                    ₹{creditPackage.price}
                  </div>
                  <div className="text-sm text-gray-500">
                    ₹{getCreditValue(creditPackage)} per credit
                  </div>
                </div>

                <div className="space-y-2 mb-6">
                  <div className="flex items-center justify-center">
                    <span className="text-2xl font-bold text-gray-900">
                      {totalCredits}
                    </span>
                    <span className="text-gray-500 ml-1">credits</span>
                  </div>
                  
                  {creditPackage.bonus_percentage > 0 && (
                    <div className="text-sm text-green-600 font-medium">
                      +{creditPackage.bonus_percentage}% bonus credits
                    </div>
                  )}
                </div>

                <p className="text-sm text-gray-600 mb-6">
                  {creditPackage.description}
                </p>

                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handlePurchase(creditPackage)
                  }}
                  disabled={isProcessing || !userId}
                  className={`w-full py-3 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    isPopular
                      ? 'bg-primary-600 text-white hover:bg-primary-700'
                      : 'bg-gray-900 text-white hover:bg-gray-800'
                  }`}
                >
                  {isProcessing ? 'Processing...' : 'Purchase Now'}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Credit Usage Guide */}
      <div className="bg-gray-50 rounded-xl p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          How Credits Work
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-blue-600">2</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Image Generation</h3>
            <p className="text-gray-600 text-sm">
              Generate high-quality AI images with various styles and resolutions
            </p>
          </div>
          
          <div className="text-center">
            <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-purple-600">5</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Video Generation</h3>
            <p className="text-gray-600 text-sm">
              Create stunning AI videos with advanced motion and effects
            </p>
          </div>
          
          <div className="text-center">
            <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-green-600">2</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Image Upscaling</h3>
            <p className="text-gray-600 text-sm">
              Enhance and upscale images with AI-powered algorithms
            </p>
          </div>
        </div>
      </div>

      {/* Benefits */}
      <div className="mt-12 bg-white rounded-xl border border-gray-200 p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          Why Choose Our Credits?
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-start">
            <CheckIcon className="h-6 w-6 text-green-500 mt-1 mr-3 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">No Expiration</h3>
              <p className="text-gray-600 text-sm">
                Your credits never expire. Use them whenever you want.
              </p>
            </div>
          </div>
          
          <div className="flex items-start">
            <CheckIcon className="h-6 w-6 text-green-500 mt-1 mr-3 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Instant Access</h3>
              <p className="text-gray-600 text-sm">
                Credits are added to your account immediately after purchase.
              </p>
            </div>
          </div>
          
          <div className="flex items-start">
            <CheckIcon className="h-6 w-6 text-green-500 mt-1 mr-3 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Flexible Usage</h3>
              <p className="text-gray-600 text-sm">
                Use credits for any feature - images, videos, upscaling, and more.
              </p>
            </div>
          </div>
          
          <div className="flex items-start">
            <CheckIcon className="h-6 w-6 text-green-500 mt-1 mr-3 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Bonus Credits</h3>
              <p className="text-gray-600 text-sm">
                Get bonus credits with larger packages for better value.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Security Notice */}
      <div className="mt-8 text-center text-sm text-gray-500">
        <p>
          🔒 Secure payments powered by PhonePe. Your payment information is encrypted and secure.
        </p>
      </div>
    </div>
  )
}
