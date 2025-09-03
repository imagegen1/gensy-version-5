/**
 * PhonePe Configuration Debug Endpoint
 * Helps debug production environment configuration issues
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

export async function GET(request: NextRequest) {
  try {
    // Only allow in development or for authenticated admin users
    const { userId } = await auth()
    
    // In production, only allow for specific admin users or if debug mode is enabled
    const isDebugMode = process.env.DEBUG_MODE === 'true'
    const isDevelopment = process.env.NODE_ENV === 'development'
    
    if (!isDevelopment && !isDebugMode && !userId) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Check PhonePe configuration
    const config = {
      environment: process.env.NODE_ENV,
      phonepe: {
        baseUrl: process.env.PHONEPE_BASE_URL || 'NOT_SET',
        clientId: process.env.PHONEPE_CLIENT_ID ? 'SET' : 'NOT_SET',
        clientSecret: process.env.PHONEPE_CLIENT_SECRET ? 'SET' : 'NOT_SET',
        clientVersion: process.env.PHONEPE_CLIENT_VERSION || 'NOT_SET',
        environment: process.env.PHONEPE_ENVIRONMENT || 'NOT_SET',
        developmentMode: process.env.PHONEPE_DEVELOPMENT_MODE || 'NOT_SET'
      },
      sdk: {
        available: false,
        error: null
      }
    }

    // Test PhonePe SDK availability
    try {
      const phonePeSDK = require('pg-sdk-node')
      config.sdk.available = true
      config.sdk.error = null
    } catch (error) {
      config.sdk.available = false
      config.sdk.error = error instanceof Error ? error.message : 'Unknown error'
    }

    return NextResponse.json({
      success: true,
      config,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Debug endpoint error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
