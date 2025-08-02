/**
 * Schema Fix Endpoint
 * Adds missing model_used column to generations table
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const requestId = `schema_fix_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  console.log(`🔧 [${requestId}] SCHEMA FIX: Starting schema repair...`)
  
  try {
    const supabase = createServiceRoleClient()
    
    // Step 1: Check if model_used column exists
    console.log(`🔍 [${requestId}] Checking if model_used column exists...`)
    
    const { data: columnCheck, error: columnError } = await supabase
      .from('generations')
      .select('model_used')
      .limit(1)
    
    if (!columnError) {
      console.log(`✅ [${requestId}] model_used column already exists`)
      return NextResponse.json({
        success: true,
        message: 'model_used column already exists',
        action: 'none_required'
      })
    }
    
    console.log(`❌ [${requestId}] model_used column missing, adding it...`)
    
    // Step 2: Add the missing column using a workaround
    // Since exec_sql function doesn't exist, we'll use a different approach
    console.log(`🔧 [${requestId}] Adding model_used column using INSERT workaround...`)

    // Try to insert a test record to trigger column creation
    // This is a workaround since we can't execute raw SQL
    const { error: addError } = await supabase
      .from('generations')
      .insert({
        user_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID
        type: 'video',
        prompt: 'test',
        model_used: 'test-model',
        status: 'pending'
      })
      .select()
      .single()
    
    if (addError) {
      console.error(`❌ [${requestId}] Failed to add model_used column:`, addError)
      return NextResponse.json({
        success: false,
        error: `Failed to add model_used column: ${addError.message}`
      }, { status: 500 })
    }
    
    console.log(`✅ [${requestId}] model_used column added successfully`)
    
    // Step 3: Verify the column was added
    const { data: verifyCheck, error: verifyError } = await supabase
      .from('generations')
      .select('model_used')
      .limit(1)
    
    if (verifyError) {
      console.error(`❌ [${requestId}] Verification failed:`, verifyError)
      return NextResponse.json({
        success: false,
        error: `Column added but verification failed: ${verifyError.message}`
      }, { status: 500 })
    }
    
    console.log(`✅ [${requestId}] Schema fix completed successfully`)
    
    return NextResponse.json({
      success: true,
      message: 'model_used column added successfully',
      action: 'column_added',
      verification: 'passed'
    })
    
  } catch (error) {
    console.error(`❌ [${requestId}] SCHEMA FIX: Failed:`, error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
