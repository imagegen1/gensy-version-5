'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function TestPaymentPage() {
  const [loading, setLoading] = useState(false)
  const [testResult, setTestResult] = useState<any>(null)
  const [paymentData, setPaymentData] = useState({
    amount: 2,
    type: 'credits',
    description: 'Test payment'
  })

  const runPhonePeTest = async () => {
    setLoading(true)
    setTestResult(null)

    try {
      console.log('🧪 Running PhonePe configuration test...')
      
      const response = await fetch('/api/payments/test-phonepe', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const result = await response.json()
      console.log('📊 Test result:', result)
      setTestResult(result)

    } catch (error) {
      console.error('❌ Test failed:', error)
      setTestResult({
        success: false,
        error: 'Test request failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setLoading(false)
    }
  }

  const testPaymentInitiation = async () => {
    setLoading(true)
    setTestResult(null)

    try {
      console.log('💳 Testing payment initiation...', paymentData)
      
      const response = await fetch('/api/payments/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(paymentData)
      })

      const result = await response.json()
      console.log('💰 Payment initiation result:', result)
      
      if (result.success && result.checkoutUrl) {
        setTestResult({
          ...result,
          message: 'Payment URL generated successfully! In production, user would be redirected to PhonePe.'
        })
      } else {
        setTestResult(result)
      }

    } catch (error) {
      console.error('❌ Payment initiation failed:', error)
      setTestResult({
        success: false,
        error: 'Payment initiation failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">PhonePe Payment Integration Test</h1>
          <p className="text-muted-foreground mt-2">
            Test and debug PhonePe payment integration
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Configuration Test */}
          <Card>
            <CardHeader>
              <CardTitle>🔧 Configuration Test</CardTitle>
              <CardDescription>
                Test PhonePe configuration and connectivity
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={runPhonePeTest} 
                disabled={loading}
                className="w-full"
              >
                {loading ? 'Testing...' : 'Run Configuration Test'}
              </Button>
            </CardContent>
          </Card>

          {/* Payment Initiation Test */}
          <Card>
            <CardHeader>
              <CardTitle>💳 Payment Initiation Test</CardTitle>
              <CardDescription>
                Test payment request creation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="amount">Amount (₹)</Label>
                <Input
                  id="amount"
                  type="number"
                  min="2"
                  max="200000"
                  value={paymentData.amount}
                  onChange={(e) => setPaymentData({
                    ...paymentData,
                    amount: parseFloat(e.target.value) || 2
                  })}
                />
              </div>

              <div>
                <Label htmlFor="type">Payment Type</Label>
                <Select
                  value={paymentData.type}
                  onValueChange={(value) => setPaymentData({
                    ...paymentData,
                    type: value
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="credits">Credits</SelectItem>
                    <SelectItem value="subscription">Subscription</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={paymentData.description}
                  onChange={(e) => setPaymentData({
                    ...paymentData,
                    description: e.target.value
                  })}
                />
              </div>

              <Button 
                onClick={testPaymentInitiation} 
                disabled={loading}
                className="w-full"
              >
                {loading ? 'Testing...' : 'Test Payment Initiation'}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Test Results */}
        {testResult && (
          <Card>
            <CardHeader>
              <CardTitle>
                {testResult.success ? '✅ Test Results' : '❌ Test Results'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {testResult.success ? (
                <Alert>
                  <AlertDescription>
                    {testResult.message || 'Test completed successfully!'}
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert variant="destructive">
                  <AlertDescription>
                    <strong>Error:</strong> {testResult.error || 'Test failed'}
                    {testResult.message && (
                      <div className="mt-2">
                        <strong>Details:</strong> {testResult.message}
                      </div>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              <div className="mt-4">
                <Label>Full Test Results:</Label>
                <Textarea
                  value={JSON.stringify(testResult, null, 2)}
                  readOnly
                  className="mt-2 font-mono text-sm"
                  rows={15}
                />
              </div>

              {testResult.tests?.configuration && (
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <h4 className="font-semibold mb-2">Configuration Status:</h4>
                  <ul className="space-y-1 text-sm">
                    <li>✅ Configured: {testResult.tests.configuration.isConfigured ? 'Yes' : 'No'}</li>
                    <li>🌍 Environment: {testResult.tests.configuration.environment}</li>
                    <li>🔑 Merchant ID: {testResult.tests.configuration.merchantId}</li>
                    <li>🔐 Salt Key: {testResult.tests.configuration.saltKey}</li>
                  </ul>
                </div>
              )}

              {testResult.recommendations && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold mb-2">Recommendations:</h4>
                  <ul className="space-y-1 text-sm">
                    {testResult.recommendations.map((rec: string, index: number) => (
                      <li key={index}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}

              {testResult.checkoutUrl && (
                <div className="mt-4 p-4 bg-green-50 rounded-lg">
                  <h4 className="font-semibold mb-2">Payment URL Generated:</h4>
                  <p className="text-sm break-all">{testResult.checkoutUrl}</p>
                  <Button 
                    className="mt-2" 
                    onClick={() => window.open(testResult.checkoutUrl, '_blank')}
                  >
                    Open Payment Page (Test)
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>📋 Debug Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm space-y-2">
              <p><strong>Environment:</strong> {process.env.NODE_ENV}</p>
              <p><strong>Timestamp:</strong> {new Date().toISOString()}</p>
              <p><strong>User Agent:</strong> {navigator.userAgent}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
