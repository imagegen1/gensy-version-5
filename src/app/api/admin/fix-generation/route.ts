/**
 * Fix Generation Endpoint
 * Manually updates a generation record with the correct result URL
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const requestId = `fix_gen_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  try {
    const { generationId, resultUrl } = await request.json()
    
    if (!generationId || !resultUrl) {
      return NextResponse.json({
        success: false,
        error: 'generationId and resultUrl are required'
      }, { status: 400 })
    }
    
    console.log(`🔧 [${requestId}] FIX GENERATION: Updating ${generationId} with ${resultUrl}`)
    
    const supabase = createServiceRoleClient()
    
    // Update the generation record
    const { error: updateError } = await supabase
      .from('generations')
      .update({
        status: 'completed',
        result_url: resultUrl,
        completed_at: new Date().toISOString()
      })
      .eq('id', generationId)
    
    if (updateError) {
      console.error(`❌ [${requestId}] Failed to update generation:`, updateError)
      return NextResponse.json({
        success: false,
        error: updateError.message
      }, { status: 500 })
    }
    
    console.log(`✅ [${requestId}] Generation updated successfully`)
    
    return NextResponse.json({
      success: true,
      message: 'Generation updated successfully',
      generationId,
      resultUrl
    })
    
  } catch (error) {
    console.error(`❌ [${requestId}] FIX GENERATION: Failed:`, error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
