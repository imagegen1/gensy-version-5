/**
 * Test Video Generation API Endpoint
 * Simple test endpoint to verify video generation and R2 upload
 */

import { NextRequest, NextResponse } from 'next/server'
import { GoogleVeoService } from '@/lib/services/google-veo'
import { uploadFile } from '@/lib/storage/r2-client'

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 TEST VIDEO: Starting test video generation...')
    
    const body = await request.json()
    const { prompt = 'test video', duration = 5 } = body
    
    console.log('🧪 TEST VIDEO: Generating video with prompt:', prompt)
    
    // Generate video using Google Veo service
    const result = await GoogleVeoService.generateVideo(prompt, {
      duration,
      aspectRatio: '16:9',
      style: 'realistic',
      quality: 'standard',
      resolution: '720p',
      motionIntensity: 'medium',
      frameRate: 24,
      sourceType: 'text-to-video'
    })
    
    console.log('🧪 TEST VIDEO: Generation result:', {
      success: result.success,
      hasVideoData: !!result.videoData,
      videoDataLength: result.videoData ? result.videoData.length : 0,
      error: result.error
    })
    
    if (!result.success || !result.videoData) {
      return NextResponse.json({
        success: false,
        error: result.error || 'Video generation failed'
      }, { status: 500 })
    }
    
    // Convert base64 video data to buffer
    const videoBuffer = Buffer.from(result.videoData, 'base64')
    console.log('🧪 TEST VIDEO: Video buffer size:', videoBuffer.length, 'bytes')
    
    // Upload to R2 storage
    const filename = `test-video-${Date.now()}.mp4`
    const uploadResult = await uploadFile({
      key: `test-videos/${filename}`,
      file: videoBuffer,
      contentType: 'video/mp4',
      metadata: {
        type: 'test-video',
        prompt: prompt.substring(0, 100)
      },
      isPublic: true // Make it public for easy testing
    })
    
    console.log('🧪 TEST VIDEO: Upload result:', {
      success: uploadResult.success,
      url: uploadResult.url,
      size: uploadResult.size,
      error: uploadResult.error
    })
    
    if (!uploadResult.success) {
      return NextResponse.json({
        success: false,
        error: uploadResult.error || 'Upload failed'
      }, { status: 500 })
    }
    
    return NextResponse.json({
      success: true,
      videoUrl: uploadResult.url,
      videoSize: uploadResult.size,
      filename,
      message: 'Test video generated and uploaded successfully'
    })
    
  } catch (error) {
    console.error('🧪 TEST VIDEO: Error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Test video generation endpoint',
    usage: 'POST with { "prompt": "your prompt", "duration": 5 }'
  })
}
