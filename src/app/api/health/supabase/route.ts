/**
 * Supabase Health Check API Route for Gensy AI Creative Suite
 * Tests database connectivity and table access
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createClient()
    const tables = ['profiles', 'generations', 'credit_transactions'] as const
    const tableTests = await Promise.all(
      tables.map(async (table) => {
        const { error } = await supabase.from(table).select('id').limit(1)
        return { table, accessible: !error, error: error?.message }
      })
    )
    const connectionError = tableTests[0]?.error
    const allTablesAccessible = tableTests.every((test) => test.accessible)
    const health = connectionError
      ? {
          status: 'unhealthy' as const,
          details: {
            connection: false,
            error: connectionError,
            timestamp: new Date().toISOString(),
          },
        }
      : {
          status: allTablesAccessible ? 'healthy' as const : 'unhealthy' as const,
          details: {
            connection: true,
            tables: tableTests,
            timestamp: new Date().toISOString(),
          },
        }
    
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
