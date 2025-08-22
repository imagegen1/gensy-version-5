'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/label'
import { Wallet, Calculator, CreditCard, AlertCircle, CheckCircle } from 'lucide-react'
import { useAuth } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'

interface PayAsYouGoProps {
  className?: string
}

export default function PayAsYouGo({ className }: PayAsYouGoProps) {
  const [amount, setAmount] = useState<string>('')
  const [credits, setCredits] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState<string>('')
  const { isSignedIn } = useAuth()
  const router = useRouter()

  // Credit calculation constants (based on existing system)
  const CREDIT_VALUE_INR = 0.02 // ₹0.02 per credit
  const MIN_AMOUNT = 50 // Minimum ₹50

  // Calculate credits based on amount
  useEffect(() => {
    const numAmount = parseFloat(amount)
    if (!isNaN(numAmount) && numAmount > 0) {
      const calculatedCredits = Math.floor(numAmount / CREDIT_VALUE_INR)
      setCredits(calculatedCredits)
    } else {
      setCredits(0)
    }
  }, [amount])

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    // Only allow numbers and decimal point
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setAmount(value)
      setError('')
      setSuccess('')
    }
  }

  const validateAmount = (): boolean => {
    const numAmount = parseFloat(amount)
    
    if (!amount || isNaN(numAmount)) {
      setError('Please enter a valid amount')
      return false
    }
    
    if (numAmount < MIN_AMOUNT) {
      setError(`Minimum amount is ₹${MIN_AMOUNT}`)
      return false
    }
    
    return true
  }

  const handlePurchase = async () => {
    if (!isSignedIn) {
      router.push('/auth/sign-in')
      return
    }

    if (!validateAmount()) {
      return
    }

    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      // Check if payment gateway is integrated
      const response = await fetch('/api/credits/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: parseFloat(amount),
          credits: credits,
          type: 'pay-as-you-go',
          testPurchase: true // For testing until payment gateway is integrated
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        if (result.testMode) {
          // Payment gateway not integrated yet
          setSuccess(`🚧 Payment gateway integration pending. You would purchase ${credits.toLocaleString()} credits for ₹${amount}. This will work once payment gateway is integrated.`)
        } else {
          throw new Error(result.error || 'Payment failed')
        }
      } else {
        setSuccess(`✅ Successfully purchased ${credits.toLocaleString()} credits!`)
        setAmount('')
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed')
    } finally {
      setIsLoading(false)
    }
  }

  const getExampleCredits = (exampleAmount: number) => {
    return Math.floor(exampleAmount / CREDIT_VALUE_INR)
  }

  return (
    <section className={`py-16 ${className}`}>
      <div className="mx-auto max-w-4xl px-6">
        <div className="mx-auto max-w-2xl space-y-6 text-center mb-12">
          <h2 className="text-center text-3xl font-semibold lg:text-4xl">
            Pay As You Go
          </h2>
          <p className="text-gray-600">
            Purchase exactly the credits you need. No monthly commitments, just pay for what you use.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {/* Pay-As-You-Go Card */}
          <Card className="relative border-2 border-violet-200 shadow-lg">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <span className="bg-gradient-to-r from-violet-500 to-purple-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                Flexible
              </span>
            </div>
            
            <CardHeader className="text-center pt-8">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-violet-100">
                <Wallet className="h-6 w-6 text-violet-600" />
              </div>
              <CardTitle className="text-2xl font-bold">Custom Amount</CardTitle>
              <CardDescription>
                Enter any amount above ₹{MIN_AMOUNT} and get credits instantly
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="amount" className="text-sm font-medium">
                  Amount (₹)
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                    ₹
                  </span>
                  <Input
                    id="amount"
                    type="text"
                    placeholder="Enter amount"
                    value={amount}
                    onChange={handleAmountChange}
                    className="pl-8 text-lg"
                    disabled={isLoading}
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Minimum amount: ₹{MIN_AMOUNT}
                </p>
              </div>

              {/* Credit Calculation Display */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Calculator className="h-4 w-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">Credit Calculation</span>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Amount:</span>
                    <span className="font-medium">₹{amount || '0'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Rate:</span>
                    <span className="font-medium">₹{CREDIT_VALUE_INR} per credit</span>
                  </div>
                  <hr className="border-gray-200" />
                  <div className="flex justify-between text-lg font-bold text-violet-600">
                    <span>Credits:</span>
                    <span>{credits.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Error/Success Messages */}
              {error && (
                <div className="flex items-center gap-2 text-red-600 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <span>{error}</span>
                </div>
              )}
              
              {success && (
                <div className="flex items-center gap-2 text-green-600 text-sm">
                  <CheckCircle className="h-4 w-4" />
                  <span>{success}</span>
                </div>
              )}
            </CardContent>

            <CardFooter>
              <Button
                onClick={handlePurchase}
                disabled={isLoading || !amount || parseFloat(amount) < MIN_AMOUNT}
                className="w-full bg-violet-600 hover:bg-violet-700 text-white"
                size="lg"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Processing...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    {isSignedIn ? 'Purchase Credits' : 'Sign In to Purchase'}
                  </div>
                )}
              </Button>
            </CardFooter>
          </Card>

          {/* Examples Card */}
          <Card className="border shadow-lg">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                <Calculator className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle className="text-2xl font-bold">Quick Examples</CardTitle>
              <CardDescription>
                See how much you get for common amounts
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {[
                { amount: 50, description: 'Starter amount' },
                { amount: 100, description: 'Popular choice' },
                { amount: 250, description: 'Great value' },
                { amount: 500, description: 'Power user' },
              ].map((example) => (
                <div
                  key={example.amount}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => setAmount(example.amount.toString())}
                >
                  <div>
                    <div className="font-medium">₹{example.amount}</div>
                    <div className="text-sm text-gray-500">{example.description}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-violet-600">
                      {getExampleCredits(example.amount).toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-500">credits</div>
                  </div>
                </div>
              ))}
            </CardContent>

            <CardFooter>
              <div className="w-full text-center text-sm text-gray-500">
                Click any example to use that amount
              </div>
            </CardFooter>
          </Card>
        </div>

        {/* Credit Value Information */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm">
            <Calculator className="h-4 w-4" />
            <span>1 Credit = ₹{CREDIT_VALUE_INR} • Transparent pricing with no hidden fees</span>
          </div>
        </div>
      </div>
    </section>
  )
}
