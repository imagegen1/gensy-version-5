/**
 * Database Test Endpoint
 * Tests database schema and Google Cloud Storage credentials
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const requestId = `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  console.log(`🧪 [${requestId}] DATABASE TEST: Starting comprehensive test...`)
  
  const results = {
    database: {
      connection: false,
      schema: {
        generations: false,
        result_url_column: false,
        model_used_column: false
      }
    },
    googleCloud: {
      credentials: false,
      storage: false
    },
    timestamp: new Date().toISOString()
  }

  try {
    // Test 1: Database Connection
    console.log(`🔍 [${requestId}] Testing database connection...`)
    const supabase = createServiceRoleClient()
    
    // Test basic connection
    const { data: connectionTest, error: connectionError } = await supabase
      .from('generations')
      .select('count')
      .limit(1)
    
    if (!connectionError) {
      results.database.connection = true
      console.log(`✅ [${requestId}] Database connection successful`)
    } else {
      console.log(`❌ [${requestId}] Database connection failed:`, connectionError.message)
    }

    // Test 2: Schema Validation
    console.log(`🔍 [${requestId}] Testing database schema...`)

    // First, let's see what columns actually exist by checking a sample record
    const { data: sampleRecord, error: sampleError } = await supabase
      .from('generations')
      .select('*')
      .limit(1)

    console.log(`🔍 [${requestId}] Sample record structure:`, sampleRecord?.[0] ? Object.keys(sampleRecord[0]) : 'No records found')

    // Test generations table structure (using correct column name 'model')
    const { data: schemaTest, error: schemaError } = await supabase
      .from('generations')
      .select('id, result_url, model, user_id, created_at')
      .limit(1)
    
    if (!schemaError) {
      results.database.schema.generations = true
      results.database.schema.result_url_column = true
      results.database.schema.model_used_column = true
      console.log(`✅ [${requestId}] Database schema validation successful`)
    } else {
      console.log(`❌ [${requestId}] Database schema validation failed:`, schemaError.message)

      // Test individual columns
      try {
        const { error: resultUrlError } = await supabase
          .from('generations')
          .select('result_url')
          .limit(1)

        results.database.schema.result_url_column = !resultUrlError

        const { error: modelError } = await supabase
          .from('generations')
          .select('model')
          .limit(1)

        results.database.schema.model_used_column = !modelError
      } catch (err) {
        console.log(`❌ [${requestId}] Individual column tests failed:`, err)
      }
    }

    // Test 3: Google Cloud Credentials
    console.log(`🔍 [${requestId}] Testing Google Cloud credentials...`)
    
    try {
      const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS
      const credentialsBase64 = process.env.GOOGLE_CREDENTIALS_BASE64
      const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID
      const bucket = process.env.GOOGLE_CLOUD_STORAGE_BUCKET
      
      if (credentialsBase64 && projectId && bucket) {
        results.googleCloud.credentials = true
        console.log(`✅ [${requestId}] Google Cloud credentials available`)
        
        // Test credentials parsing
        try {
          const credentialsJsonString = Buffer.from(credentialsBase64, 'base64').toString('utf-8')
          const credentials = JSON.parse(credentialsJsonString)
          
          if (credentials.project_id === projectId) {
            results.googleCloud.storage = true
            console.log(`✅ [${requestId}] Google Cloud credentials valid`)
          } else {
            console.log(`❌ [${requestId}] Google Cloud project ID mismatch`)
          }
        } catch (parseError) {
          console.log(`❌ [${requestId}] Google Cloud credentials parsing failed:`, parseError)
        }
      } else {
        console.log(`❌ [${requestId}] Google Cloud credentials missing:`, {
          hasCredentialsBase64: !!credentialsBase64,
          hasProjectId: !!projectId,
          hasBucket: !!bucket
        })
      }
    } catch (gcError) {
      console.log(`❌ [${requestId}] Google Cloud test failed:`, gcError)
    }

  } catch (error) {
    console.error(`❌ [${requestId}] DATABASE TEST: Comprehensive test failed:`, error)
  }

  console.log(`🧪 [${requestId}] DATABASE TEST: Results:`, results)

  return NextResponse.json({
    success: true,
    requestId,
    results,
    summary: {
      database_healthy: results.database.connection && results.database.schema.generations,
      schema_complete: results.database.schema.result_url_column && results.database.schema.model_used_column,
      google_cloud_ready: results.googleCloud.credentials && results.googleCloud.storage
    }
  })
}
