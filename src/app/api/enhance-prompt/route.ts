/**
 * Prompt Enhancement API Endpoint for Gensy AI Creative Suite
 * Enhances user prompts using OpenRouter's DeepSeek-R1 model
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { z } from 'zod'

// Request validation schema
const enhancePromptSchema = z.object({
  prompt: z.string().min(3, 'Prompt must be at least 3 characters').max(1000, 'Prompt too long'),
  context: z.string().optional(), // Optional context to specify the type of generation
  type: z.enum(['image', 'video']).optional(), // Type of generation (image or video)
  testMode: z.boolean().optional() // For testing without authentication
})

// Response types
interface EnhancePromptResponse {
  success: boolean
  enhancedPrompt?: string
  originalLength?: number
  enhancedLength?: number
  truncated?: boolean
  error?: string
}

export async function POST(request: NextRequest) {
  const requestId = `enhance_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  console.log(`🚀 [${requestId}] PROMPT ENHANCEMENT REQUEST STARTED`)
  console.log(`📝 [${requestId}] Timestamp: ${new Date().toISOString()}`)

  try {
    // Parse request body first to check for test mode
    console.log(`📥 [${requestId}] Parsing request body...`)
    const body = await request.json()
    const isTestMode = body.testMode === true

    let userId
    if (isTestMode) {
      console.log(`🧪 [${requestId}] Test mode enabled - bypassing authentication`)
      userId = 'test-user'
    } else {
      // Check authentication
      console.log(`🔐 [${requestId}] Checking authentication...`)
      const { userId: authUserId } = await auth()
      if (!authUserId) {
        console.log(`❌ [${requestId}] Authentication failed - no userId`)
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 401 }
        )
      }
      userId = authUserId
      console.log(`✅ [${requestId}] Authentication successful - userId: ${userId}`)
    }

    console.log(`📋 [${requestId}] Request body received:`, {
      prompt: body.prompt?.substring(0, 100) + (body.prompt?.length > 100 ? '...' : ''),
      promptLength: body.prompt?.length,
      testMode: isTestMode
    })

    const validationResult = enhancePromptSchema.safeParse(body)

    if (!validationResult.success) {
      console.log(`❌ [${requestId}] Request validation failed:`, validationResult.error.errors)
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request data',
          details: validationResult.error.errors
        },
        { status: 400 }
      )
    }
    console.log(`✅ [${requestId}] Request validation successful`)

    const { prompt, context, type } = validationResult.data

    // Determine the generation type based on explicit type parameter or context
    const generationType = type || context || 'image' // Default to image if not specified
    const isVideoGeneration = generationType === 'video'
    const isImageGeneration = generationType === 'image'

    console.log(`🎯 [${requestId}] Generation type detected: ${generationType}`)
    console.log(`🎯 [${requestId}] Is video generation: ${isVideoGeneration}`)
    console.log(`🎯 [${requestId}] Is image generation: ${isImageGeneration}`)

    // Prepare the enhanced prompt for API call - add context if needed
    let promptForEnhancement = prompt.trim()

    if (isVideoGeneration) {
      // For video generation, add video context if not already present
      const needsVideoContext = !prompt.toLowerCase().includes('video') &&
                                !prompt.toLowerCase().includes('motion') &&
                                !prompt.toLowerCase().includes('movement') &&
                                !prompt.toLowerCase().includes('animation') &&
                                !prompt.toLowerCase().includes('cinematic')

      if (needsVideoContext) {
        promptForEnhancement = `${prompt.trim()}, for video generation`
        console.log(`🎬 [${requestId}] Added video generation context to prompt`)
        console.log(`🎬 [${requestId}] Original prompt: "${prompt.trim()}"`)
        console.log(`🎬 [${requestId}] Enhanced prompt for API: "${promptForEnhancement}"`)
      } else {
        console.log(`🎬 [${requestId}] Using original prompt (already has video context): "${promptForEnhancement}"`)
      }
    } else {
      // For image generation, add image context if not already present
      const needsImageContext = !prompt.toLowerCase().includes('generate') &&
                                !prompt.toLowerCase().includes('create') &&
                                !prompt.toLowerCase().includes('image') &&
                                !prompt.toLowerCase().includes('picture') &&
                                !prompt.toLowerCase().includes('photo')

      if (needsImageContext) {
        promptForEnhancement = `${prompt.trim()}, generate image`
        console.log(`🎨 [${requestId}] Added image generation context to prompt`)
        console.log(`🎨 [${requestId}] Original prompt: "${prompt.trim()}"`)
        console.log(`🎨 [${requestId}] Enhanced prompt for API: "${promptForEnhancement}"`)
      } else {
        console.log(`🎨 [${requestId}] Using original prompt (already has image context): "${promptForEnhancement}"`)
      }
    }

    // Check OpenRouter API key
    const openRouterApiKey = process.env.OPENROUTER_API_KEY
    if (!openRouterApiKey) {
      console.error(`❌ [${requestId}] OpenRouter API key not configured`)
      return NextResponse.json(
        { success: false, error: 'Service configuration error' },
        { status: 500 }
      )
    }

    // Prepare the enhancement request
    console.log(`🤖 [${requestId}] Preparing OpenRouter request for ${generationType} generation...`)

    // Create context-aware system prompt
    const systemPrompt = isVideoGeneration
      ? `You are an expert AI video generation prompt enhancer. Your task is to take a basic prompt and enhance it to be more detailed, descriptive, and cinematically specific while maintaining the original intent.

Guidelines for video enhancement:
- Add specific details about camera movement, motion, timing, and cinematic techniques
- Include details about lighting, atmosphere, scene transitions, and visual flow
- Describe character movements, object interactions, and environmental dynamics
- Add cinematic elements like camera angles, shot types, and visual storytelling
- Maintain the core subject and intent of the original prompt
- Make the description vivid and motion-focused
- Keep the enhanced prompt under 920 characters
- Do not add any explanations, just return the enhanced prompt
- Remove any generic phrases like "for video generation" or "create video" from the final result
- Focus on descriptive motion and cinematic elements rather than generation commands

Original prompt: "${prompt}"`
      : `You are an expert AI image generation prompt enhancer. Your task is to take a basic prompt and enhance it to be more detailed, descriptive, and visually specific while maintaining the original intent.

Guidelines for image enhancement:
- Add specific details about style, lighting, composition, colors, and atmosphere
- Include artistic techniques, camera angles, and visual elements that would improve the image
- Maintain the core subject and intent of the original prompt
- Make the description vivid and painterly
- Keep the enhanced prompt under 920 characters
- Do not add any explanations, just return the enhanced prompt
- Remove any generic phrases like "generate image" or "create image" from the final result
- Focus on descriptive visual elements rather than generation commands

Original prompt: "${prompt}"`

    const openRouterPayload = {
      model: "deepseek/deepseek-r1",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: isVideoGeneration
            ? `Enhance this prompt for AI video generation: "${promptForEnhancement}"`
            : `Enhance this prompt for AI image generation: "${promptForEnhancement}"`
        }
      ],
      max_tokens: 300,
      temperature: 0.7,
      top_p: 0.9,
      stream: false
    }

    console.log(`📡 [${requestId}] Sending request to OpenRouter...`)
    const startTime = Date.now()

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterApiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': 'Gensy AI Creative Suite'
      },
      body: JSON.stringify(openRouterPayload)
    })

    const endTime = Date.now()
    console.log(`📡 [${requestId}] OpenRouter response received in ${endTime - startTime}ms`)
    console.log(`📡 [${requestId}] Response status: ${response.status} ${response.statusText}`)

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`❌ [${requestId}] OpenRouter API error:`, errorText)
      return NextResponse.json(
        { success: false, error: 'Enhancement service temporarily unavailable' },
        { status: 500 }
      )
    }

    const openRouterResponse = await response.json()
    console.log(`📋 [${requestId}] OpenRouter response structure:`, {
      hasChoices: !!openRouterResponse.choices,
      choicesLength: openRouterResponse.choices?.length,
      hasUsage: !!openRouterResponse.usage
    })

    if (!openRouterResponse.choices || openRouterResponse.choices.length === 0) {
      console.error(`❌ [${requestId}] No choices in OpenRouter response`)
      return NextResponse.json(
        { success: false, error: 'No enhancement generated' },
        { status: 500 }
      )
    }

    let enhancedPrompt = openRouterResponse.choices[0].message?.content?.trim()

    // Log the raw response for debugging
    console.log(`🔍 [${requestId}] Raw OpenRouter response:`, {
      hasChoices: !!openRouterResponse.choices,
      choicesLength: openRouterResponse.choices?.length,
      messageContent: openRouterResponse.choices?.[0]?.message?.content,
      contentLength: openRouterResponse.choices?.[0]?.message?.content?.length
    })

    if (!enhancedPrompt) {
      console.error(`❌ [${requestId}] Empty enhanced prompt - falling back to original`)
      // Fallback: return the original prompt with some basic enhancement
      enhancedPrompt = `${prompt.trim()}, detailed, high quality, professional photography style, vibrant colors, sharp focus`
      console.log(`🔄 [${requestId}] Using fallback enhancement: "${enhancedPrompt}"`)
    }

    // Clean up the enhanced prompt - remove any generation commands that might have been added
    const cleanupPatterns = isVideoGeneration ? [
      // Video-specific cleanup patterns
      /,?\s*for\s+video\s+generation\s*,?/gi,
      /,?\s*generate\s+video\s*,?/gi,
      /,?\s*create\s+video\s*,?/gi,
      /,?\s*make\s+video\s*,?/gi,
      /,?\s*produce\s+video\s*,?/gi,
      /,?\s*video\s+generation\s*,?/gi,
      /,?\s*generate\s*,?$/gi,
      /,?\s*create\s*,?$/gi
    ] : [
      // Image-specific cleanup patterns
      /,?\s*generate\s+image\s*,?/gi,
      /,?\s*create\s+image\s*,?/gi,
      /,?\s*make\s+image\s*,?/gi,
      /,?\s*produce\s+image\s*,?/gi,
      /,?\s*generate\s*,?$/gi,
      /,?\s*create\s*,?$/gi
    ]

    for (const pattern of cleanupPatterns) {
      enhancedPrompt = enhancedPrompt.replace(pattern, '')
    }

    // Clean up any double commas or trailing/leading commas and spaces
    enhancedPrompt = enhancedPrompt
      .replace(/,\s*,/g, ',')
      .replace(/^,\s*/, '')
      .replace(/,\s*$/, '')
      .trim()

    console.log(`🧹 [${requestId}] Cleaned enhanced prompt:`, {
      beforeCleanup: openRouterResponse.choices[0].message?.content?.substring(0, 100),
      afterCleanup: enhancedPrompt.substring(0, 100)
    })

    console.log(`✅ [${requestId}] Enhancement generated:`, {
      originalLength: prompt.length,
      enhancedLength: enhancedPrompt.length,
      enhancedPreview: enhancedPrompt.substring(0, 100) + (enhancedPrompt.length > 100 ? '...' : '')
    })

    // Truncate if necessary (keep 80 character buffer from 1000 limit)
    let truncated = false
    if (enhancedPrompt.length > 920) {
      console.log(`⚠️ [${requestId}] Enhanced prompt too long, truncating...`)
      
      // Try to truncate at sentence boundaries
      const sentences = enhancedPrompt.split(/[.!?]+/)
      let truncatedPrompt = ''
      
      for (const sentence of sentences) {
        const testPrompt = truncatedPrompt + sentence + '.'
        if (testPrompt.length <= 920) {
          truncatedPrompt = testPrompt
        } else {
          break
        }
      }
      
      // If no complete sentences fit, do a hard truncate
      if (truncatedPrompt.length < 100) {
        truncatedPrompt = enhancedPrompt.substring(0, 917) + '...'
      }
      
      enhancedPrompt = truncatedPrompt
      truncated = true
      
      console.log(`✂️ [${requestId}] Prompt truncated to ${enhancedPrompt.length} characters`)
    }

    const result: EnhancePromptResponse = {
      success: true,
      enhancedPrompt,
      originalLength: prompt.length,
      enhancedLength: enhancedPrompt.length,
      truncated
    }

    console.log(`🎉 [${requestId}] PROMPT ENHANCEMENT COMPLETED SUCCESSFULLY!`)
    console.log(`📤 [${requestId}] Sending response:`, {
      success: result.success,
      originalLength: result.originalLength,
      enhancedLength: result.enhancedLength,
      truncated: result.truncated
    })

    return NextResponse.json(result)

  } catch (error) {
    console.error(`💥 [${requestId}] Enhancement error:`, error)
    console.error(`💥 [${requestId}] Stack trace:`, error instanceof Error ? error.stack : 'No stack trace')
    
    return NextResponse.json(
      { success: false, error: 'Enhancement service error' },
      { status: 500 }
    )
  }
}
