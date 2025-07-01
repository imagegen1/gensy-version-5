import { NextRequest, NextResponse } from 'next/server'
import { config } from '@/lib/env'
import { TOSClient } from '@/lib/storage/tos-client'

export async function GET(request: NextRequest) {
  try {
    // Create TOS client instance
    const tosClient = new TOSClient()
    
    // Check configuration
    const tosConfig = {
      accessKeyId: config.tos.accessKeyId ? `${config.tos.accessKeyId.substring(0, 10)}...` : 'NOT_SET',
      secretAccessKey: config.tos.secretAccessKey ? `${config.tos.secretAccessKey.substring(0, 10)}...` : 'NOT_SET',
      bucketName: config.tos.bucketName || 'NOT_SET',
      endpoint: config.tos.endpoint || 'NOT_SET',
      region: config.tos.region || 'NOT_SET',
      isConfigured: tosClient.isConfigured()
    }

    return NextResponse.json({
      success: true,
      message: 'TOS Configuration Status',
      config: tosConfig,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('TOS Config Test Error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
