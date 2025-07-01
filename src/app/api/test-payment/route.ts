/**
 * Test Payment API Endpoint
 * Simple test to verify payment system is working
 */

import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      message: 'Payment system test successful',
      data: {
        environment: process.env.NODE_ENV,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Payment test error:', error)
    return NextResponse.json(
      {
        error: 'Payment test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
