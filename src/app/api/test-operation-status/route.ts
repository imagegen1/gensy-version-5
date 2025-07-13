/**
 * Test endpoint to check Google Vertex AI operation status directly
 */

import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const requestId = `op_status_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  console.log(`🔍 [${requestId}] OPERATION STATUS: Starting operation status check`)

  try {
    const body = await request.json()
    const { operationName } = body

    if (!operationName) {
      return NextResponse.json({
        success: false,
        error: 'operationName is required'
      }, { status: 400 })
    }

    console.log(`🔍 [${requestId}] OPERATION STATUS: Checking operation: ${operationName}`)

    // Extract operation ID from the full operation name
    const operationId = operationName.split('/').pop()
    console.log(`🔍 [${requestId}] OPERATION STATUS: Operation ID: ${operationId}`)

    // Use Google Auth to get access token
    const { GoogleAuth } = require('google-auth-library')
    const auth = new GoogleAuth({
      keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
      scopes: ['https://www.googleapis.com/auth/cloud-platform']
    })

    const authClient = await auth.getClient()
    const accessToken = await authClient.getAccessToken()

    if (!accessToken.token) {
      throw new Error('Failed to get access token')
    }

    // Check operation status using Vertex AI API
    const operationUrl = `https://us-central1-aiplatform.googleapis.com/v1/${operationName}`
    console.log(`🔍 [${requestId}] OPERATION STATUS: Checking URL: ${operationUrl}`)

    const response = await fetch(operationUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken.token}`,
        'Content-Type': 'application/json'
      }
    })

    console.log(`🔍 [${requestId}] OPERATION STATUS: Response status: ${response.status}`)

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`❌ [${requestId}] OPERATION STATUS: Error response:`, errorText)
      return NextResponse.json({
        success: false,
        error: `API request failed: ${response.status}`,
        details: errorText
      }, { status: 500 })
    }

    const operationData = await response.json()
    console.log(`🔍 [${requestId}] OPERATION STATUS: Operation data:`, JSON.stringify(operationData, null, 2))

    // Parse the operation status
    const status = {
      name: operationData.name,
      done: operationData.done,
      metadata: operationData.metadata,
      error: operationData.error,
      response: operationData.response
    }

    if (operationData.done) {
      if (operationData.error) {
        console.log(`❌ [${requestId}] OPERATION STATUS: Operation failed with error:`, operationData.error)
        status.result = 'FAILED'
        status.errorMessage = operationData.error.message
      } else if (operationData.response) {
        console.log(`✅ [${requestId}] OPERATION STATUS: Operation completed successfully`)
        status.result = 'SUCCEEDED'
        status.responseData = operationData.response
      } else {
        console.log(`⚠️ [${requestId}] OPERATION STATUS: Operation done but no response or error`)
        status.result = 'UNKNOWN'
      }
    } else {
      console.log(`🔄 [${requestId}] OPERATION STATUS: Operation still running`)
      status.result = 'RUNNING'
    }

    return NextResponse.json({
      success: true,
      operationName,
      operationId,
      status,
      rawData: operationData
    })

  } catch (error) {
    console.error(`❌ [${requestId}] OPERATION STATUS: Error:`, error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Operation Status Check Endpoint',
    usage: 'POST with { "operationName": "projects/.../operations/..." }',
    example: {
      operationName: 'projects/gensy-final-464206/locations/us-central1/publishers/google/models/veo-3.0-fast-generate-preview/operations/e35e0fc7-01c8-4db0-a3c7-143d19b64710'
    }
  })
}
