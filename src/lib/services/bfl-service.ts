/**
 * Black Forest Labs (BFL) Flux Service for Gensy AI Creative Suite
 * Handles AI image generation using BFL Flux models
 */

import { env } from '@/lib/env'

export interface BFLImageGenerationOptions {
  aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3' | '3:4'
  style?: 'realistic' | 'artistic' | 'cartoon' | 'abstract' | 'photographic'
  quality?: 'standard' | 'high' | 'ultra'
  guidanceScale?: number // 1-20, higher values follow prompt more closely
  seed?: number
  width?: number
  height?: number
}

export interface BFLImageEditingOptions {
  aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3' | '3:4'
  seed?: number
  promptUpsampling?: boolean
  safetyTolerance?: number // 0-2, 0 most strict, 2 balanced
  outputFormat?: 'jpeg' | 'png'
  webhookUrl?: string
  webhookSecret?: string
}

export interface BFLImageGenerationResult {
  success: boolean
  imageData?: string // Base64 encoded image data
  imageUrl?: string // Direct URL from BFL (if available)
  error?: string
  metadata?: {
    model: string
    processingTime: number
    parameters: BFLImageGenerationOptions | BFLImageEditingOptions
    taskId?: string
    mode?: 'generation' | 'editing'
  }
}

// Map aspect ratios to BFL format
const ASPECT_RATIO_MAPPING: Record<string, { width: number; height: number }> = {
  '1:1': { width: 1024, height: 1024 },
  '16:9': { width: 1920, height: 1080 },
  '9:16': { width: 1080, height: 1920 },
  '4:3': { width: 1024, height: 768 },
  '3:4': { width: 768, height: 1024 }
}

// Available BFL models
export const BFL_MODELS = {
  'flux-kontext-pro': 'flux-kontext-pro',
  'flux-kontext-max': 'flux-kontext-max',
  'flux-pro-1.1-ultra': 'flux-pro-1.1-ultra',
  'flux-pro-1.1': 'flux-pro-1.1',
  'flux-pro': 'flux-pro',
  'flux-dev': 'flux-dev'
} as const

export type BFLModel = keyof typeof BFL_MODELS

export class BFLService {
  /**
   * Generate an image using BFL Flux API
   */
  static async generateImage(
    prompt: string,
    options: BFLImageGenerationOptions = {},
    model: BFLModel = 'flux-pro'
  ): Promise<BFLImageGenerationResult> {
    const bflRequestId = `bfl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const startTime = Date.now()

    console.log(`🎨 [${bflRequestId}] BFL: Starting image generation`)
    console.log(`📝 [${bflRequestId}] BFL: Input parameters:`, {
      prompt: prompt.substring(0, 100) + (prompt.length > 100 ? '...' : ''),
      promptLength: prompt.length,
      model,
      options
    })

    try {
      // Validate inputs
      if (!prompt || prompt.trim().length === 0) {
        throw new Error('Prompt is required')
      }

      if (!env.BFL_API_KEY) {
        throw new Error('BFL API key not configured')
      }

      // Prepare dimensions
      const dimensions = options.aspectRatio ? 
        ASPECT_RATIO_MAPPING[options.aspectRatio] : 
        { width: options.width || 1024, height: options.height || 1024 }

      // Prepare request payload
      const requestPayload: any = {
        prompt: prompt.trim(),
        width: dimensions.width,
        height: dimensions.height
      }

      // Add optional parameters
      if (options.seed !== undefined) {
        requestPayload.seed = options.seed
      }

      console.log(`🎨 [${bflRequestId}] BFL: Request payload:`, {
        model,
        prompt: requestPayload.prompt.substring(0, 100) + (requestPayload.prompt.length > 100 ? '...' : ''),
        width: requestPayload.width,
        height: requestPayload.height,
        seed: requestPayload.seed
      })

      // Make API call to BFL
      console.log(`🌐 [${bflRequestId}] BFL: Making API call to BFL...`)
      const response = await fetch(`${env.BFL_API_ENDPOINT}/${model}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-key': env.BFL_API_KEY
        },
        body: JSON.stringify(requestPayload)
      })

      console.log(`🌐 [${bflRequestId}] BFL: Response status: ${response.status}`)

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`❌ [${bflRequestId}] BFL: API error:`, {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        })
        throw new Error(`BFL API error: ${response.status} ${response.statusText} - ${errorText}`)
      }

      const result = await response.json()
      console.log(`🎨 [${bflRequestId}] BFL: Initial response:`, {
        id: result.id,
        status: result.status,
        polling_url: result.polling_url
      })

      // Poll for results using the polling URL
      const finalResult = await this.pollForResult(result.polling_url || result.id, bflRequestId)
      
      if (finalResult.success && finalResult.imageUrl) {
        // Download the image and convert to base64
        const imageData = await this.downloadImageAsBase64(finalResult.imageUrl, bflRequestId)
        
        const endTime = Date.now()
        const processingTime = endTime - startTime
        
        console.log(`✅ [${bflRequestId}] BFL: Generation completed in ${processingTime}ms`)
        
        return {
          success: true,
          imageData,
          imageUrl: finalResult.imageUrl,
          metadata: {
            model,
            processingTime,
            parameters: options,
            taskId: result.id
          }
        }
      } else {
        console.error(`❌ [${bflRequestId}] BFL: No image data in final result:`, finalResult)
        return {
          success: false,
          error: finalResult.error || 'No image data received from BFL API'
        }
      }

    } catch (error) {
      const endTime = Date.now()
      const processingTime = endTime - startTime
      
      console.error(`❌ [${bflRequestId}] BFL: Generation failed after ${processingTime}ms:`, error)
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  /**
   * Edit an image using BFL Flux Kontext Pro API
   */
  static async editImage(
    prompt: string,
    inputImageBase64: string,
    options: BFLImageEditingOptions = {}
  ): Promise<BFLImageGenerationResult> {
    const bflRequestId = `bfl_edit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const startTime = Date.now()

    console.log(`🎨 [${bflRequestId}] BFL EDIT: Starting image editing`)
    console.log(`📝 [${bflRequestId}] BFL EDIT: Input parameters:`, {
      prompt: prompt.substring(0, 100) + (prompt.length > 100 ? '...' : ''),
      promptLength: prompt.length,
      hasInputImage: !!inputImageBase64,
      inputImageLength: inputImageBase64 ? inputImageBase64.length : 0,
      options
    })

    try {
      // Validate inputs
      if (!prompt || prompt.trim().length === 0) {
        throw new Error('Edit prompt is required')
      }

      if (!inputImageBase64 || inputImageBase64.trim().length === 0) {
        throw new Error('Input image is required for editing')
      }

      if (!env.BFL_API_KEY) {
        throw new Error('BFL API key not configured')
      }

      // Prepare request payload for image editing
      const requestPayload: any = {
        prompt: prompt.trim(),
        input_image: inputImageBase64
      }

      // Add optional parameters
      if (options.aspectRatio) {
        requestPayload.aspect_ratio = options.aspectRatio
      }

      if (options.seed !== undefined) {
        requestPayload.seed = options.seed
      }

      if (options.promptUpsampling !== undefined) {
        requestPayload.prompt_upsampling = options.promptUpsampling
      }

      if (options.safetyTolerance !== undefined) {
        requestPayload.safety_tolerance = options.safetyTolerance
      }

      if (options.outputFormat) {
        requestPayload.output_format = options.outputFormat
      }

      if (options.webhookUrl) {
        requestPayload.webhook_url = options.webhookUrl
      }

      if (options.webhookSecret) {
        requestPayload.webhook_secret = options.webhookSecret
      }

      console.log(`🎨 [${bflRequestId}] BFL EDIT: Request payload:`, {
        prompt: requestPayload.prompt.substring(0, 100) + (requestPayload.prompt.length > 100 ? '...' : ''),
        aspect_ratio: requestPayload.aspect_ratio,
        seed: requestPayload.seed,
        prompt_upsampling: requestPayload.prompt_upsampling,
        safety_tolerance: requestPayload.safety_tolerance,
        output_format: requestPayload.output_format,
        hasInputImage: !!requestPayload.input_image
      })

      // Make API call to BFL Kontext Pro for image editing
      console.log(`🌐 [${bflRequestId}] BFL EDIT: Making API call to BFL Kontext Pro...`)
      const response = await fetch(`${env.BFL_API_ENDPOINT}/flux-kontext-pro`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-key': env.BFL_API_KEY
        },
        body: JSON.stringify(requestPayload)
      })

      console.log(`🌐 [${bflRequestId}] BFL EDIT: Response status: ${response.status}`)

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`❌ [${bflRequestId}] BFL EDIT: API error:`, {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        })
        throw new Error(`BFL API error: ${response.status} ${response.statusText} - ${errorText}`)
      }

      const result = await response.json()
      console.log(`🎨 [${bflRequestId}] BFL EDIT: Initial response:`, {
        id: result.id,
        status: result.status,
        polling_url: result.polling_url
      })

      // Poll for results using the polling URL
      const finalResult = await this.pollForResult(result.polling_url || result.id, bflRequestId)

      if (finalResult.success && finalResult.imageUrl) {
        // Download the image and convert to base64
        const imageData = await this.downloadImageAsBase64(finalResult.imageUrl, bflRequestId)

        const endTime = Date.now()
        const processingTime = endTime - startTime

        console.log(`✅ [${bflRequestId}] BFL EDIT: Image editing completed in ${processingTime}ms`)

        return {
          success: true,
          imageData,
          imageUrl: finalResult.imageUrl,
          metadata: {
            model: 'flux-kontext-pro',
            processingTime,
            parameters: options,
            taskId: result.id,
            mode: 'editing'
          }
        }
      } else {
        console.error(`❌ [${bflRequestId}] BFL EDIT: No image data in final result:`, finalResult)
        return {
          success: false,
          error: finalResult.error || 'No edited image data received from BFL API'
        }
      }

    } catch (error) {
      const endTime = Date.now()
      const processingTime = endTime - startTime

      console.error(`❌ [${bflRequestId}] BFL EDIT: Image editing failed after ${processingTime}ms:`, error)

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  /**
   * Poll for generation result
   */
  private static async pollForResult(
    pollingUrl: string, 
    requestId: string,
    maxAttempts: number = 60,
    intervalMs: number = 2000
  ): Promise<{ success: boolean; imageUrl?: string; error?: string }> {
    console.log(`🔄 [${requestId}] BFL: Starting polling for result...`)
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        console.log(`🔄 [${requestId}] BFL: Polling attempt ${attempt}/${maxAttempts}`)
        
        const response = await fetch(pollingUrl, {
          method: 'GET',
          headers: {
            'x-key': env.BFL_API_KEY
          }
        })

        if (!response.ok) {
          console.error(`❌ [${requestId}] BFL: Polling error:`, response.status, response.statusText)
          await new Promise(resolve => setTimeout(resolve, intervalMs))
          continue
        }

        const result = await response.json()
        console.log(`🔄 [${requestId}] BFL: Polling result:`, {
          status: result.status,
          progress: result.progress
        })

        if (result.status === 'Ready' && result.result?.sample) {
          console.log(`✅ [${requestId}] BFL: Generation ready!`)
          return {
            success: true,
            imageUrl: result.result.sample
          }
        } else if (result.status === 'Error' || result.status === 'Failed') {
          console.error(`❌ [${requestId}] BFL: Generation failed:`, result)
          return {
            success: false,
            error: `Generation failed: ${result.status}`
          }
        }

        // Wait before next poll
        await new Promise(resolve => setTimeout(resolve, intervalMs))
        
      } catch (error) {
        console.error(`❌ [${requestId}] BFL: Polling attempt ${attempt} failed:`, error)
        if (attempt === maxAttempts) {
          return {
            success: false,
            error: `Polling failed after ${maxAttempts} attempts`
          }
        }
        await new Promise(resolve => setTimeout(resolve, intervalMs))
      }
    }

    return {
      success: false,
      error: `Polling timeout after ${maxAttempts} attempts`
    }
  }

  /**
   * Download image from URL and convert to base64
   */
  private static async downloadImageAsBase64(imageUrl: string, requestId: string): Promise<string> {
    console.log(`⬇️ [${requestId}] BFL: Downloading image from URL...`)
    
    try {
      const response = await fetch(imageUrl)
      if (!response.ok) {
        throw new Error(`Failed to download image: ${response.status} ${response.statusText}`)
      }

      const arrayBuffer = await response.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      const base64 = buffer.toString('base64')
      
      console.log(`✅ [${requestId}] BFL: Image downloaded and converted to base64 (${base64.length} chars)`)
      return base64
      
    } catch (error) {
      console.error(`❌ [${requestId}] BFL: Failed to download image:`, error)
      throw error
    }
  }

  /**
   * Convert a File object to base64 string
   */
  static async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
          const base64 = reader.result.split(',')[1]
          resolve(base64)
        } else {
          reject(new Error('Failed to convert file to base64'))
        }
      }
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsDataURL(file)
    })
  }

  /**
   * Check if a model supports image editing
   */
  static supportsImageEditing(model: BFLModel): boolean {
    return model === 'flux-kontext-pro' || model === 'flux-kontext-max'
  }

  /**
   * Check if BFL service is properly configured
   */
  static isConfigured(): boolean {
    return !!(env.BFL_API_KEY && env.BFL_API_ENDPOINT)
  }
}
