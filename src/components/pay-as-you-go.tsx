'use client'

import React, { useState, useEffect } from 'react'
import { Wallet, Calculator, CreditCard, AlertCircle, CheckCircle, Loader2 } from 'lucide-react'
import { useAuth, SignedIn, SignedOut, SignInButton } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { toast } from 'react-hot-toast'

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
  const MIN_AMOUNT = 2 // Minimum ₹2

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

  // Handle post-authentication credit purchase continuation
  useEffect(() => {
    if (isSignedIn && typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const urlAmount = urlParams.get('amount');
      const action = urlParams.get('action');

      if (urlAmount && action === 'purchase-credits') {
        // Set the amount and clear URL parameters
        setAmount(urlAmount);
        window.history.replaceState({}, '', '/pricing');

        // Show welcome back message
        toast.success('Welcome back! You can now complete your credit purchase.');

        // Scroll to the pay-as-you-go section
        setTimeout(() => {
          const payAsYouGoSection = document.getElementById('pay-as-you-go-section');
          if (payAsYouGoSection) {
            payAsYouGoSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 1000);
      }
    }
  }, [isSignedIn])

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
    if (!validateAmount()) {
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      // Show loading toast
      toast.loading('Initiating payment...', { id: 'credit-payment-init' });

      // Initiate PhonePe payment for credits
      const response = await fetch('/api/payments/initiate', {
        method: 'POST',
        credentials: 'include', // Ensure Clerk cookies are sent
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'credits',
          amount: parseFloat(amount),
          description: `Purchase ${credits.toLocaleString()} credits - Pay as you go`
        }),
      });

      // Handle 401 - session expired, redirect to sign-in
      if (response.status === 401) {
        toast.dismiss('credit-payment-init');
        toast.error('Session expired. Please sign in again.');
        router.push(`/auth/sign-in?redirect=${encodeURIComponent(window.location.href)}`);
        return;
      }

      // Handle other errors
      if (!response.ok) {
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();

      if (result.checkoutUrl) {
        // Dismiss loading toast and show success
        toast.dismiss('credit-payment-init');
        toast.success('Redirecting to payment gateway...');

        // Small delay to show the success message
        setTimeout(() => {
          window.location.href = result.checkoutUrl;
        }, 1000);
      } else {
        throw new Error('Payment URL not received');
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Payment failed to start';
      setError(errorMessage);
      toast.dismiss('credit-payment-init');
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const getExampleCredits = (exampleAmount: number) => {
    return Math.floor(exampleAmount / CREDIT_VALUE_INR)
  }

  return (
    <section id="pay-as-you-go-section" className={`pricing-area pt-100 pb-70 ${className}`}>
      <div className="container">
        <div className="section-title text-center">
          <h2>
            Pay As You{' '}
            <span className="gradient-text">Go</span>
          </h2>
          <p>
            Purchase exactly the credits you need. No monthly commitments, just pay for what you use.
          </p>

          {/* Authentication Notice for Unauthenticated Users */}
          {!isSignedIn && (
            <div className="mt-4 mb-2">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 max-w-lg mx-auto">
                <div className="flex items-center justify-center gap-2 text-blue-800">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium text-sm">Sign in required to purchase credits</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="row justify-content-center">
          <div className="col-lg-6 col-md-12">
            <Card className="relative border-2 border-gray-700 shadow-2xl bg-gray-800 backdrop-blur-sm">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-gradient-to-r from-violet-500 to-purple-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                  Flexible
                </span>
              </div>

              <CardHeader className="text-center pt-8">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-700">
                  <Wallet className="h-6 w-6 text-violet-400" />
                </div>
                <CardTitle className="text-2xl font-bold text-white">Custom Amount</CardTitle>
                <CardDescription className="text-gray-400">
                  Enter any amount above ₹{MIN_AMOUNT} and get credits instantly
                </CardDescription>
                <div className="mt-4">
                  <div className="text-3xl font-bold text-violet-400">
                    ₹{amount || '0'}
                  </div>
                  <div className="text-sm text-gray-400">
                    {credits.toLocaleString()} credits
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="amount" className="text-sm font-medium text-gray-300">
                    Amount (₹)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                      ₹
                    </span>
                    <input
                      id="amount"
                      type="text"
                      className="w-full pl-8 pr-4 py-3 text-lg border-2 border-gray-600 bg-gray-700 text-white rounded-lg focus:border-violet-500 focus:outline-none transition-colors placeholder-gray-400"
                      placeholder="Enter amount"
                      value={amount}
                      onChange={handleAmountChange}
                      disabled={isLoading}
                    />
                  </div>
                  <p className="text-xs text-gray-400">
                    Minimum amount: ₹{MIN_AMOUNT}
                  </p>
                </div>

                {/* Credit Calculation Display */}
                <div className="bg-gray-700 rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Calculator className="h-4 w-4 text-gray-300" />
                    <span className="text-sm font-medium text-gray-300">Credit Calculation</span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-gray-300">
                      <span>Amount:</span>
                      <span className="font-medium">₹{amount || '0'}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-300">
                      <span>Rate:</span>
                      <span className="font-medium">₹{CREDIT_VALUE_INR} per credit</span>
                    </div>
                    <hr className="border-gray-600" />
                    <div className="flex justify-between text-lg font-bold text-violet-400">
                      <span>Credits:</span>
                      <span>{credits.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Error/Success Messages */}
                {error && (
                  <div className="flex items-center gap-2 text-red-400 text-sm bg-red-900/30 p-3 rounded-lg border border-red-700">
                    <AlertCircle className="h-4 w-4" />
                    <span>{error}</span>
                  </div>
                )}

                {success && (
                  <div className="flex items-center gap-2 text-green-400 text-sm bg-green-900/30 p-3 rounded-lg border border-green-700">
                    <CheckCircle className="h-4 w-4" />
                    <span>{success}</span>
                  </div>
                )}
              </CardContent>

              <CardFooter>
                {/* Signed Out - Show Sign In Button */}
                <SignedOut>
                  <button
                    className="w-full py-3 px-6 rounded-lg font-medium transition-colors border-0 bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={() => {
                      const redirectUrl = `/pricing?amount=${amount}&action=purchase-credits`;
                      router.push(`/auth/sign-in?redirect_url=${encodeURIComponent(redirectUrl)}`);
                    }}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Sign In to Purchase Credits
                    </div>
                  </button>
                </SignedOut>

                {/* Signed In - Show Purchase Button */}
                <SignedIn>
                  <button
                    onClick={handlePurchase}
                    disabled={isLoading || !amount || parseFloat(amount) < MIN_AMOUNT}
                    className="w-full py-3 px-6 rounded-lg font-medium transition-colors border-0 bg-violet-600 hover:bg-violet-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Processing Payment...
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        Purchase Credits
                      </div>
                    )}
                  </button>
                </SignedIn>
              </CardFooter>
            </Card>
          </div>

          <div className="col-lg-6 col-md-12">
            <Card className="border-2 border-gray-700 shadow-2xl bg-gray-800 backdrop-blur-sm">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-700">
                  <Calculator className="h-6 w-6 text-violet-400" />
                </div>
                <CardTitle className="text-2xl font-bold text-white">Quick Examples</CardTitle>
                <CardDescription className="text-gray-400">
                  See how much you get for common amounts
                </CardDescription>
                <div className="mt-4">
                  <div className="text-3xl font-bold text-violet-400">
                    ₹50+
                  </div>
                  <div className="text-sm text-gray-400">
                    any amount
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {[
                  { amount: 2, description: 'Minimum amount' },
                  { amount: 10, description: 'Small top-up' },
                  { amount: 50, description: 'Popular choice' },
                  { amount: 100, description: 'Great value' },
                  { amount: 250, description: 'Power user' },
                ].map((example) => (
                  <div
                    key={example.amount}
                    className="flex items-center justify-between p-3 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600 transition-colors border border-gray-600"
                    onClick={() => setAmount(example.amount.toString())}
                  >
                    <div>
                      <div className="font-medium text-white">₹{example.amount}</div>
                      <div className="text-sm text-gray-400">{example.description}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-violet-400">
                        {getExampleCredits(example.amount).toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-400">credits</div>
                    </div>
                  </div>
                ))}
              </CardContent>

              <CardFooter>
                <div className="w-full text-center text-sm text-gray-400">
                  Click any example to use that amount
                </div>
              </CardFooter>
            </Card>
          </div>
        </div>

        {/* Credit Value Information */}
        <div className="row">
          <div className="col-12">
            <div className="text-center mt-5">
              <div className="inline-flex items-center gap-2 bg-gray-800 text-violet-400 px-4 py-2 rounded-full text-sm border border-gray-700">
                <Calculator className="h-4 w-4" />
                <span>1 Credit = ₹{CREDIT_VALUE_INR} • Transparent pricing with no hidden fees</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
