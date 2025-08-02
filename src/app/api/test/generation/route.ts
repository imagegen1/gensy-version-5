/**
 * Generation Test Endpoint
 * Tests specific generation record
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const generationId = searchParams.get('id')
  
  if (!generationId) {
    return NextResponse.json({ error: 'Generation ID required' }, { status: 400 })
  }
  
  const requestId = `gen_test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  console.log(`🔍 [${requestId}] GENERATION TEST: Checking generation ${generationId}`)
  
  try {
    const supabase = createServiceRoleClient()
    
    // Get the full generation record
    const { data: generation, error } = await supabase
      .from('generations')
      .select('*')
      .eq('id', generationId)
      .single()
    
    if (error) {
      console.log(`❌ [${requestId}] Generation not found:`, error.message)
      return NextResponse.json({
        success: false,
        error: error.message,
        generationId
      }, { status: 404 })
    }
    
    console.log(`✅ [${requestId}] Generation found:`, {
      id: generation.id,
      status: generation.status,
      result_url: generation.result_url,
      model: generation.model,
      created_at: generation.created_at,
      completed_at: generation.completed_at
    })

    return NextResponse.json({
      success: true,
      generation,
      summary: {
        hasResultUrl: !!generation.result_url,
        status: generation.status,
        model: generation.model,
        isCompleted: generation.status === 'completed'
      }
    })
    
  } catch (error) {
    console.error(`❌ [${requestId}] GENERATION TEST: Failed:`, error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
