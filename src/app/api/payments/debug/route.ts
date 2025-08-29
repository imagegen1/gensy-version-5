/**
 * Debug endpoint to see what parameters PhonePe actually sends
 */

import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const allParams = Object.fromEntries(searchParams.entries())
  
  console.log('=== PhonePe Debug Callback ===')
  console.log('URL:', request.url)
  console.log('Method:', request.method)
  console.log('Headers:', Object.fromEntries(request.headers.entries()))
  console.log('Search Params:', allParams)
  console.log('==============================')
  
  return NextResponse.json({
    message: 'Debug callback received',
    url: request.url,
    method: request.method,
    searchParams: allParams,
    headers: Object.fromEntries(request.headers.entries())
  })
}

export async function POST(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const allParams = Object.fromEntries(searchParams.entries())
  
  let body = null
  try {
    body = await request.json()
  } catch {
    try {
      body = await request.text()
    } catch {
      body = 'Could not parse body'
    }
  }
  
  console.log('=== PhonePe Debug POST Callback ===')
  console.log('URL:', request.url)
  console.log('Method:', request.method)
  console.log('Headers:', Object.fromEntries(request.headers.entries()))
  console.log('Search Params:', allParams)
  console.log('Body:', body)
  console.log('===================================')
  
  return NextResponse.json({
    message: 'Debug POST callback received',
    url: request.url,
    method: request.method,
    searchParams: allParams,
    body: body,
    headers: Object.fromEntries(request.headers.entries())
  })
}
