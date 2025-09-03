/**
 * PhonePe Integration Test Endpoint
 * 
 * This endpoint tests the PhonePe configuration and API connectivity
 * to help debug payment initiation issues.
 */

import { NextRequest, NextResponse } from 'next/server'
import { PhonePeService } from '@/lib/services/phonepe'
import { auth } from '@clerk/nextjs/server'

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 PhonePe Test Endpoint Called')

    // Check authentication
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({
        error: 'Authentication required for testing'
      }, { status: 401 })
    }

    // Test PhonePe configuration
    const configTest = {
      isConfigured: PhonePeService.isConfigured(),
      environment: process.env.PHONEPE_ENVIRONMENT || 'sandbox',
      baseUrl: process.env.PHONEPE_BASE_URL || 'https://api-preprod.phonepe.com',
      merchantId: process.env.PHONEPE_CLIENT_ID ? '***configured***' : 'missing',
      saltKey: process.env.PHONEPE_CLIENT_SECRET ? '***configured***' : 'missing'
    }

    console.log('📊 PhonePe Configuration Test:', configTest)

    // Test amount validation
    const amountTests = [
      { amount: 1, expected: false },
      { amount: 2, expected: true },
      { amount: 10, expected: true },
      { amount: 50, expected: true },
      { amount: 200001, expected: false }
    ]

    const amountValidationResults = amountTests.map(test => ({
      amount: test.amount,
      expected: test.expected,
      result: PhonePeService.validateAmount(test.amount),
      passed: PhonePeService.validateAmount(test.amount).valid === test.expected
    }))

    console.log('💰 Amount Validation Tests:', amountValidationResults)

    // Test payment request creation (dry run)
    let paymentTestResult = null
    try {
      console.log('🔄 Testing payment request creation...')
      
      const testPaymentRequest = {
        amount: 2, // Minimum amount
        userId: userId,
        type: 'credits' as const,
        description: 'Test payment request'
      }

      // Only test if properly configured
      if (configTest.isConfigured) {
        paymentTestResult = await PhonePeService.createPaymentRequest(testPaymentRequest)
        console.log('✅ Payment test result:', paymentTestResult)
      } else {
        paymentTestResult = {
          success: false,
          error: 'PhonePe not configured - skipping payment test'
        }
      }
    } catch (paymentError) {
      console.error('❌ Payment test failed:', paymentError)
      paymentTestResult = {
        success: false,
        error: paymentError instanceof Error ? paymentError.message : 'Payment test failed'
      }
    }

    // Environment variables check
    const envCheck = {
      PHONEPE_ENVIRONMENT: process.env.PHONEPE_ENVIRONMENT || 'not set',
      PHONEPE_BASE_URL: process.env.PHONEPE_BASE_URL || 'not set',
      PHONEPE_CLIENT_ID: process.env.PHONEPE_CLIENT_ID ? 'configured' : 'missing',
      PHONEPE_CLIENT_SECRET: process.env.PHONEPE_CLIENT_SECRET ? 'configured' : 'missing',
      NODE_ENV: process.env.NODE_ENV || 'not set'
    }

    console.log('🔧 Environment Variables:', envCheck)

    // Return comprehensive test results
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      userId: userId,
      tests: {
        configuration: configTest,
        amountValidation: {
          tests: amountValidationResults,
          allPassed: amountValidationResults.every(test => test.passed)
        },
        paymentRequest: paymentTestResult,
        environment: envCheck
      },
      recommendations: generateRecommendations(configTest, amountValidationResults, paymentTestResult)
    })

  } catch (error) {
    console.error('❌ PhonePe test endpoint error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Test endpoint failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

/**
 * Generate recommendations based on test results
 */
function generateRecommendations(
  configTest: any,
  amountTests: any[],
  paymentTest: any
): string[] {
  const recommendations: string[] = []

  if (!configTest.isConfigured) {
    recommendations.push('❌ PhonePe is not properly configured. Check PHONEPE_CLIENT_ID and PHONEPE_CLIENT_SECRET environment variables.')
  }

  if (configTest.environment === 'sandbox' && configTest.merchantId !== 'missing') {
    recommendations.push('⚠️ Using sandbox environment. Switch to production when ready.')
  }

  if (!amountTests.every(test => test.passed)) {
    recommendations.push('❌ Amount validation tests failed. Check PhonePeService.validateAmount() method.')
  }

  if (paymentTest && !paymentTest.success) {
    if (paymentTest.error?.includes('authentication')) {
      recommendations.push('❌ PhonePe authentication failed. Verify your merchant credentials.')
    } else if (paymentTest.error?.includes('network')) {
      recommendations.push('❌ Network error connecting to PhonePe. Check internet connectivity.')
    } else {
      recommendations.push(`❌ Payment request failed: ${paymentTest.error}`)
    }
  }

  if (recommendations.length === 0) {
    recommendations.push('✅ All tests passed! PhonePe integration appears to be working correctly.')
  }

  return recommendations
}

export async function POST(request: NextRequest) {
  return NextResponse.json({
    error: 'POST method not supported for test endpoint',
    message: 'Use GET method to run PhonePe tests'
  }, { status: 405 })
}
