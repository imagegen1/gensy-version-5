/**
 * Google Cloud Authentication Test Endpoint
 * Tests both file-based and Base64 credential methods
 */

import { NextRequest, NextResponse } from 'next/server'
import { getGoogleCloudStatus } from '@/lib/google-cloud'
import { validateGoogleCredentials, getServiceAccountEmail } from '@/lib/google-auth'

export async function GET(request: NextRequest) {
  const testRequestId = `google_auth_test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  console.log(`🧪 [${testRequestId}] GOOGLE AUTH TEST: Starting authentication test`)

  try {
    // Test 1: Check configuration status
    console.log(`🧪 [${testRequestId}] GOOGLE AUTH TEST: Checking configuration...`)
    const status = await getGoogleCloudStatus()

    // Test 2: Validate credentials
    console.log(`🧪 [${testRequestId}] GOOGLE AUTH TEST: Validating credentials...`)
    const validation = await validateGoogleCredentials()

    // Test 3: Get service account email
    let serviceAccountEmail = null
    try {
      serviceAccountEmail = getServiceAccountEmail()
      console.log(`🧪 [${testRequestId}] GOOGLE AUTH TEST: Service account email: ${serviceAccountEmail}`)
    } catch (error) {
      console.error(`🧪 [${testRequestId}] GOOGLE AUTH TEST: Failed to get service account email:`, error)
    }

    const result = {
      success: true,
      testId: testRequestId,
      timestamp: new Date().toISOString(),
      configuration: {
        configured: status.configured,
        method: status.method,
        projectId: status.projectId,
        location: status.location,
        models: status.models,
      },
      validation: {
        valid: validation.valid,
        projectId: validation.projectId,
        serviceAccountEmail: validation.serviceAccountEmail,
        error: validation.error,
      },
      serviceAccount: {
        email: serviceAccountEmail,
      },
      environment: {
        hasBase64Credentials: !!process.env.GOOGLE_CREDENTIALS_BASE64,
        hasFileCredentials: !!process.env.GOOGLE_APPLICATION_CREDENTIALS,
        nodeEnv: process.env.NODE_ENV,
      }
    }

    console.log(`✅ [${testRequestId}] GOOGLE AUTH TEST: Test completed successfully`)
    
    return NextResponse.json(result)

  } catch (error) {
    console.error(`❌ [${testRequestId}] GOOGLE AUTH TEST: Test failed:`, error)
    
    return NextResponse.json({
      success: false,
      testId: testRequestId,
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown test error',
      environment: {
        hasBase64Credentials: !!process.env.GOOGLE_CREDENTIALS_BASE64,
        hasFileCredentials: !!process.env.GOOGLE_APPLICATION_CREDENTIALS,
        nodeEnv: process.env.NODE_ENV,
      }
    }, { status: 500 })
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
