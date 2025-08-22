'use client'

import React, { useState, useEffect } from 'react'
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
    <section className={`pricing-area pt-100 pb-70 ${className}`}>
      <div className="container">
        <div className="section-title text-center">
          <h2>
            Pay As You{' '}
            <span className="gradient-text">Go</span>
          </h2>
          <p>
            Purchase exactly the credits you need. No monthly commitments, just pay for what you use.
          </p>
        </div>

        <div className="row justify-content-center">
          <div className="col-lg-6 col-md-12">
            <div className="single-pricing-table">
              <div className="pricing-header">
                <div className="popular-text">
                  <i className="ri-vip-crown-line"></i>
                  <span>Flexible</span>
                </div>
                <h3>Custom Amount</h3>
                <div className="price">
                  <span className="currency">₹</span>
                  <span className="amount">{amount || '0'}</span>
                  <span className="duration">/ {credits.toLocaleString()} credits</span>
                </div>
                <p>Enter any amount above ₹{MIN_AMOUNT} and get credits instantly</p>
              </div>

              <div className="pricing-features">
                <div className="form-group mb-4">
                  <label htmlFor="amount" className="form-label">
                    Amount (₹)
                  </label>
                  <div className="input-group">
                    <span className="input-group-text">₹</span>
                    <input
                      id="amount"
                      type="text"
                      className="form-control"
                      placeholder="Enter amount"
                      value={amount}
                      onChange={handleAmountChange}
                      disabled={isLoading}
                      style={{
                        fontSize: '1.1rem',
                        padding: '12px 16px',
                        border: '2px solid rgba(255, 255, 255, 0.1)',
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        color: 'white',
                        borderRadius: '8px'
                      }}
                    />
                  </div>
                  <small className="form-text text-muted">
                    Minimum amount: ₹{MIN_AMOUNT}
                  </small>
                </div>

                <div className="credit-calculation-box" style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  padding: '20px',
                  marginBottom: '20px'
                }}>
                  <div className="d-flex align-items-center mb-3">
                    <Calculator className="me-2" style={{width: '16px', height: '16px'}} />
                    <span className="fw-medium">Credit Calculation</span>
                  </div>
                  
                  <div className="calculation-details">
                    <div className="d-flex justify-content-between mb-2">
                      <span>Amount:</span>
                      <span className="fw-medium">₹{amount || '0'}</span>
                    </div>
                    <div className="d-flex justify-content-between mb-2">
                      <span>Rate:</span>
                      <span className="fw-medium">₹{CREDIT_VALUE_INR} per credit</span>
                    </div>
                    <hr style={{borderColor: 'rgba(255, 255, 255, 0.2)'}} />
                    <div className="d-flex justify-content-between">
                      <span className="fs-5 fw-bold">Credits:</span>
                      <span className="fs-5 fw-bold text-primary">{credits.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="alert alert-danger d-flex align-items-center" role="alert">
                    <AlertCircle className="me-2" style={{width: '16px', height: '16px'}} />
                    <span>{error}</span>
                  </div>
                )}
                
                {success && (
                  <div className="alert alert-success d-flex align-items-center" role="alert">
                    <CheckCircle className="me-2" style={{width: '16px', height: '16px'}} />
                    <span>{success}</span>
                  </div>
                )}
              </div>

              <div className="pricing-btn">
                <button
                  onClick={handlePurchase}
                  disabled={isLoading || !amount || parseFloat(amount) < MIN_AMOUNT}
                  className="default-btn w-100"
                  style={{
                    opacity: (isLoading || !amount || parseFloat(amount) < MIN_AMOUNT) ? 0.6 : 1,
                    cursor: (isLoading || !amount || parseFloat(amount) < MIN_AMOUNT) ? 'not-allowed' : 'pointer'
                  }}
                >
                  {isLoading ? (
                    <>
                      <div className="spinner-border spinner-border-sm me-2" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="me-2" style={{width: '16px', height: '16px'}} />
                      {isSignedIn ? 'Purchase Credits' : 'Sign In to Purchase'}
                      <i className="ri-arrow-right-line"></i>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="col-lg-6 col-md-12">
            <div className="single-pricing-table">
              <div className="pricing-header">
                <h3>Quick Examples</h3>
                <div className="price">
                  <span className="currency">₹</span>
                  <span className="amount">50+</span>
                  <span className="duration">/ any amount</span>
                </div>
                <p>See how much you get for common amounts</p>
              </div>

              <div className="pricing-features">
                <div className="examples-list">
                  {[
                    { amount: 50, description: 'Starter amount' },
                    { amount: 100, description: 'Popular choice' },
                    { amount: 250, description: 'Great value' },
                    { amount: 500, description: 'Power user' },
                  ].map((example) => (
                    <div
                      key={example.amount}
                      className="example-item d-flex justify-content-between align-items-center p-3 mb-3 cursor-pointer"
                      onClick={() => setAmount(example.amount.toString())}
                      style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                      }}
                    >
                      <div>
                        <div className="fw-medium">₹{example.amount}</div>
                        <div className="text-muted small">{example.description}</div>
                      </div>
                      <div className="text-end">
                        <div className="fw-bold text-primary">
                          {getExampleCredits(example.amount).toLocaleString()}
                        </div>
                        <div className="text-muted small">credits</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pricing-btn">
                <div className="text-center text-muted small">
                  Click any example to use that amount
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="row">
          <div className="col-12">
            <div className="text-center mt-5">
              <div className="d-inline-flex align-items-center gap-2 px-4 py-2 rounded-pill" style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: 'rgba(255, 255, 255, 0.9)'
              }}>
                <Calculator style={{width: '16px', height: '16px'}} />
                <span>1 Credit = ₹{CREDIT_VALUE_INR} • Transparent pricing with no hidden fees</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
