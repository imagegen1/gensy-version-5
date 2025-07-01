/**
 * BytePlus ModelArk Service for Gensy AI Creative Suite
 * Handles AI image generation using Bytedance-Seedream-3.0-t2i model
 */

import { env } from '@/lib/env'

export interface BytedanceImageGenerationOptions {
  aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3' | '3:4'
  style?: 'realistic' | 'artistic' | 'cartoon' | 'abstract' | 'photographic'
  quality?: 'standard' | 'high' | 'ultra'
  guidanceScale?: number // 1-20, higher values follow prompt more closely
  watermark?: boolean
  seed?: number
}

export interface BytedanceImageGenerationResult {
  success: boolean
  imageData?: string // Base64 encoded image data
  imageUrl?: string // Direct URL from BytePlus (if available)
  error?: string
  metadata?: {
    model: string
    processingTime: number
    parameters: BytedanceImageGenerationOptions
  }
}

// Map aspect ratios to BytePlus format
const ASPECT_RATIO_MAPPING: Record<string, string> = {
  '1:1': '1024x1024',
  '16:9': '1920x1080',
  '9:16': '1080x1920',
  '4:3': '1024x768',
  '3:4': '768x1024'
}

export class BytedanceService {
  /**
   * Generate an image using BytePlus ModelArk Bytedance-Seedream-3.0-t2i API
   */
  static async generateImage(
    prompt: string,
    options: BytedanceImageGenerationOptions = {}
  ): Promise<BytedanceImageGenerationResult> {
    const bytedanceRequestId = `bytedance_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const startTime = Date.now()

    console.log(`🎨 [${bytedanceRequestId}] BYTEDANCE: Starting image generation`)
    console.log(`📝 [${bytedanceRequestId}] BYTEDANCE: Input parameters:`, {
      prompt: prompt.substring(0, 100) + (prompt.length > 100 ? '...' : ''),
      promptLength: prompt.length,
      options
    })

    try {
      // Validate environment variables
      if (!env.BYTEPLUS_API_KEY || !env.BYTEPLUS_API_ENDPOINT) {
        console.error(`❌ [${bytedanceRequestId}] BYTEDANCE: Missing API configuration`)
        return {
          success: false,
          error: 'BytePlus API configuration is missing'
        }
      }

      // Validate prompt
      if (!prompt || prompt.trim().length === 0) {
        console.error(`❌ [${bytedanceRequestId}] BYTEDANCE: Empty prompt`)
        return {
          success: false,
          error: 'Prompt cannot be empty'
        }
      }

      // Truncate prompt if too long (BytePlus limit is 300 tokens)
      const truncatedPrompt = prompt.length > 1000 ? prompt.substring(0, 1000) : prompt

      // Prepare options with defaults
      const finalOptions: Required<BytedanceImageGenerationOptions> = {
        aspectRatio: options.aspectRatio || '1:1',
        style: options.style || 'realistic',
        quality: options.quality || 'standard',
        guidanceScale: options.guidanceScale || 3,
        watermark: options.watermark !== undefined ? options.watermark : true,
        seed: options.seed || undefined
      }

      console.log(`🎨 [${bytedanceRequestId}] BYTEDANCE: Final options:`, finalOptions)

      // Map aspect ratio to BytePlus format
      const size = ASPECT_RATIO_MAPPING[finalOptions.aspectRatio] || '1024x1024'

      // Prepare request payload
      const requestPayload = {
        model: 'seedream-3-0-t2i-250415',
        prompt: truncatedPrompt,
        response_format: 'url',
        size: size,
        guidance_scale: finalOptions.guidanceScale,
        watermark: finalOptions.watermark,
        ...(finalOptions.seed && { seed: finalOptions.seed })
      }

      console.log(`🎨 [${bytedanceRequestId}] BYTEDANCE: Request payload:`, {
        model: requestPayload.model,
        prompt: requestPayload.prompt.substring(0, 100) + (requestPayload.prompt.length > 100 ? '...' : ''),
        size: requestPayload.size,
        guidance_scale: requestPayload.guidance_scale,
        watermark: requestPayload.watermark
      })

      // Make API call to BytePlus
      console.log(`🌐 [${bytedanceRequestId}] BYTEDANCE: Making API call to BytePlus...`)
      const response = await fetch(`${env.BYTEPLUS_API_ENDPOINT}/images/generations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${env.BYTEPLUS_API_KEY}`
        },
        body: JSON.stringify(requestPayload)
      })

      console.log(`🌐 [${bytedanceRequestId}] BYTEDANCE: API response status:`, response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`❌ [${bytedanceRequestId}] BYTEDANCE: API error:`, {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        })
        return {
          success: false,
          error: `BytePlus API error: ${response.status} ${response.statusText}`
        }
      }

      const result = await response.json()
      console.log(`🎨 [${bytedanceRequestId}] BYTEDANCE: API response:`, {
        hasData: !!result.data,
        dataLength: result.data?.length || 0
      })

      // Extract image URL from response
      if (result.data && result.data.length > 0 && result.data[0].url) {
        const imageUrl = result.data[0].url
        const endTime = Date.now()
        const processingTime = endTime - startTime

        console.log(`✅ [${bytedanceRequestId}] BYTEDANCE: Image generated successfully`)
        console.log(`⏱️ [${bytedanceRequestId}] BYTEDANCE: Processing time: ${processingTime}ms`)
        console.log(`🔗 [${bytedanceRequestId}] BYTEDANCE: Image URL: ${imageUrl}`)

        return {
          success: true,
          imageUrl: imageUrl,
          metadata: {
            model: 'seedream-3-0-t2i-250415',
            processingTime: Math.round(processingTime / 1000),
            parameters: finalOptions
          }
        }
      } else {
        console.error(`❌ [${bytedanceRequestId}] BYTEDANCE: No image data in response:`, result)
        return {
          success: false,
          error: 'No image data received from BytePlus API'
        }
      }

    } catch (error) {
      const endTime = Date.now()
      const processingTime = endTime - startTime
      
      console.error(`❌ [${bytedanceRequestId}] BYTEDANCE: Generation failed after ${processingTime}ms:`, error)
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  /**
   * Check if BytePlus service is properly configured
   */
  static isConfigured(): boolean {
    return !!(env.BYTEPLUS_API_KEY && env.BYTEPLUS_API_ENDPOINT)
  }
}
