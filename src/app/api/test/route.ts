/**
 * Test API Endpoint
 * Simple test to verify payment system is working
 */

import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      message: 'Test API working',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Test error:', error)
    return NextResponse.json(
      { 
        error: 'Test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
