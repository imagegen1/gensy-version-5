/**
 * Test Google Veo API Integration
 * Direct test of Veo 3.0 Fast model
 */

import { NextRequest, NextResponse } from 'next/server'
import { GoogleVeoService } from '@/lib/services/google-veo'

export async function POST(request: NextRequest) {
  const requestId = `test_veo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  console.log(`🧪 [${requestId}] VEO TEST: Starting direct Veo API test`)

  try {
    const body = await request.json()
    const { prompt = 'superman is talking in mic that "i am ironman nice to have you all here lets join our hands with marvel"' } = body

    console.log(`🧪 [${requestId}] VEO TEST: Testing with prompt: "${prompt}"`)

    // Test Veo 3.0 Fast model directly
    const options = {
      duration: 8,
      aspectRatio: '16:9' as const,
      style: 'realistic' as const,
      quality: 'standard' as const,
      resolution: '720p' as const,
      motionIntensity: 'medium' as const,
      frameRate: 24,
      sourceType: 'text-to-video' as const,
      model: 'veo-3.0-fast-generate-preview',
      sampleCount: 1,
      enhancePrompt: false // Use prompt as-is for testing
    }

    console.log(`🧪 [${requestId}] VEO TEST: Using options:`, options)

    const result = await GoogleVeoService.generateVideo(prompt, options, requestId)

    console.log(`🧪 [${requestId}] VEO TEST: Result:`, {
      success: result.success,
      hasVideoData: !!result.videoData,
      hasVideoUrls: !!result.videoUrls,
      hasOperationName: !!result.operationName,
      error: result.error,
      metadata: result.metadata
    })

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error || 'Veo API test failed',
        details: result
      }, { status: 500 })
    }

    // If we have an operation name, it means async processing
    if (result.operationName) {
      return NextResponse.json({
        success: true,
        status: 'processing',
        operationName: result.operationName,
        message: 'Video generation started successfully. Use the operation name to check status.',
        testInstructions: {
          checkStatus: `Use the operation name to poll for completion`,
          operationName: result.operationName
        }
      })
    }

    // If we have immediate video data
    if (result.videoData || result.videoUrls) {
      return NextResponse.json({
        success: true,
        status: 'completed',
        hasVideoData: !!result.videoData,
        hasVideoUrls: !!result.videoUrls,
        videoDataSize: result.videoData ? result.videoData.length : 0,
        videoUrls: result.videoUrls,
        metadata: result.metadata
      })
    }

    return NextResponse.json({
      success: false,
      error: 'Unexpected response format from Veo API',
      details: result
    }, { status: 500 })

  } catch (error) {
    console.error(`❌ [${requestId}] VEO TEST: Error:`, error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Veo API Test Endpoint',
    usage: 'POST with { "prompt": "your test prompt" }',
    example: {
      prompt: 'superman is talking in mic that "i am ironman nice to have you all here lets join our hands with marvel"'
    }
  })
}
