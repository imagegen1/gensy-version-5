import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

// Force Node.js runtime to ensure proper cookie handling
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get the plan ID from request
    const { planId } = await request.json()
    
    // Return a test checkout URL to verify authentication works
    const testCheckoutUrl = `https://api-preprod.phonepe.com/payments/mock-pay-page?plan=${planId}&user=${userId}`
    
    return NextResponse.json({ 
      checkoutUrl: testCheckoutUrl,
      message: 'Authentication successful - this is a test response',
      userId,
      planId
    })

  } catch (error) {
    console.error('Test API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: (error as Error).message },
      { status: 500 }
    )
  }
}
