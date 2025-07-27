/**
 * Prompt Enhancement API Endpoint for Gensy AI Creative Suite
 * Enhances user prompts for better AI image generation
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { z } from 'zod'

// Request validation schema
const enhancePromptSchema = z.object({
  prompt: z.string().min(3, 'Prompt must be at least 3 characters').max(500, 'Prompt too long'),
})

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validationResult = enhancePromptSchema.safeParse(body)
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid request data',
          details: validationResult.error.errors
        },
        { status: 400 }
      )
    }

    const { prompt } = validationResult.data

    // Check if Google Cloud is configured before using VertexAI
    const { isGoogleCloudConfigured } = await import('@/lib/google-auth')

    if (!isGoogleCloudConfigured()) {
      return NextResponse.json(
        { error: 'Google Cloud Vertex AI is not configured' },
        { status: 503 }
      )
    }

    // Dynamically import and enhance the prompt
    const { VertexAIService } = await import('@/lib/services/vertex-ai')
    const result = await VertexAIService.enhancePrompt(prompt)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to enhance prompt' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      originalPrompt: prompt,
      enhancedPrompt: result.enhancedPrompt,
    })

  } catch (error) {
    console.error('Prompt enhancement API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
