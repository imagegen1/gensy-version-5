/**
 * Supabase Health Check API Route for Gensy AI Creative Suite
 * Tests database connectivity and table access
 */

import { NextResponse } from 'next/server'
import { healthCheck } from '@/lib/supabase'

export async function GET() {
  try {
    const health = await healthCheck()
    
    return NextResponse.json({
      service: 'Gensy AI Creative Suite',
      component: 'Supabase Database',
      ...health,
      timestamp: new Date().toISOString(),
    }, {
      status: health.status === 'healthy' ? 200 : 503
    })
  } catch (error) {
    return NextResponse.json({
      service: 'Gensy AI Creative Suite',
      component: 'Supabase Database',
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, {
      status: 503
    })
  }
}
