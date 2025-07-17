/**
 * Debug Environment Variables API
 * Temporary endpoint to check R2 environment variables
 */

import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Check R2 environment variables (without exposing secrets)
    const envCheck = {
      CLOUDFLARE_R2_ACCESS_KEY_ID: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID ? 
        `${process.env.CLOUDFLARE_R2_ACCESS_KEY_ID.substring(0, 8)}...` : 'MISSING',
      CLOUDFLARE_R2_SECRET_ACCESS_KEY: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY ? 
        `${process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY.substring(0, 8)}...` : 'MISSING',
      CLOUDFLARE_R2_BUCKET_NAME: process.env.CLOUDFLARE_R2_BUCKET_NAME || 'MISSING',
      CLOUDFLARE_R2_ENDPOINT: process.env.CLOUDFLARE_R2_ENDPOINT || 'MISSING',
      CLOUDFLARE_R2_PUBLIC_URL: process.env.CLOUDFLARE_R2_PUBLIC_URL || 'MISSING',
      
      // Check if all required variables are present
      allPresent: !!(
        process.env.CLOUDFLARE_R2_ACCESS_KEY_ID &&
        process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY &&
        process.env.CLOUDFLARE_R2_BUCKET_NAME &&
        process.env.CLOUDFLARE_R2_ENDPOINT
      ),
      
      // Environment info
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: process.env.VERCEL,
      VERCEL_ENV: process.env.VERCEL_ENV,
    }

    return NextResponse.json({
      success: true,
      environment: envCheck,
      timestamp: new Date().toISOString(),
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 })
  }
}
