/**
 * Vertex AI Service for Gensy AI Creative Suite
 * Handles AI image generation using Google Vertex AI Imagen API
 */

import { auth, GOOGLE_CLOUD_CONFIG, isGoogleCloudConfigured } from '@/lib/google-cloud'
import { env } from '@/lib/env'

export interface ImageGenerationOptions {
  aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3' | '3:4'
  style?: 'realistic' | 'artistic' | 'cartoon' | 'abstract' | 'photographic'
  quality?: 'standard' | 'high' | 'ultra'
  safetyLevel?: 'block_most' | 'block_some' | 'block_few'
  personGeneration?: 'allow_adult' | 'allow_all' | 'block_all'
  referenceImage?: string // Base64 encoded image
  negativePrompt?: string
  seed?: number
  guidanceScale?: number // 1-20, higher values follow prompt more closely
  model?: string // Model ID to use (e.g., 'imagen-4.0-generate-preview-06-06')
}

export interface ImageGenerationResult {
  success: boolean
  imageUrl?: string
  imageData?: string // Base64 encoded image data
  metadata?: {
    prompt: string
    options: ImageGenerationOptions
    model: string
    generationTime: number
    seed?: number
  }
  error?: string
}

export class VertexAIService {
  /**
   * Generate an image using Vertex AI Imagen API via REST
   */
  static async generateImage(
    prompt: string,
    options: ImageGenerationOptions = {}
  ): Promise<ImageGenerationResult> {
    const vertexRequestId = `vertex_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const startTime = Date.now()

    console.log(`🎨 [${vertexRequestId}] VERTEX AI: Starting image generation`)
    console.log(`📝 [${vertexRequestId}] VERTEX AI: Input parameters:`, {
      prompt: prompt.substring(0, 100) + (prompt.length > 100 ? '...' : ''),
      promptLength: prompt.length,
      options
    })

    try {
      // Check if Google Cloud is configured
      console.log(`🔧 [${vertexRequestId}] VERTEX AI: Checking Google Cloud configuration...`)
      if (!isGoogleCloudConfigured()) {
        console.error(`❌ [${vertexRequestId}] VERTEX AI: Google Cloud configuration check failed`)
        console.error(`❌ [${vertexRequestId}] VERTEX AI: Project ID:`, process.env.GOOGLE_CLOUD_PROJECT_ID)
        console.error(`❌ [${vertexRequestId}] VERTEX AI: Credentials path:`, process.env.GOOGLE_APPLICATION_CREDENTIALS)
        throw new Error('Google Cloud Vertex AI is not configured. Please set up authentication.')
      }

      console.log(`✅ [${vertexRequestId}] VERTEX AI: Google Cloud is configured. Project ID:`, process.env.GOOGLE_CLOUD_PROJECT_ID)

      // Validate prompt
      console.log(`✅ [${vertexRequestId}] VERTEX AI: Validating prompt...`)
      if (!prompt || prompt.trim().length < 3) {
        console.error(`❌ [${vertexRequestId}] VERTEX AI: Prompt too short: ${prompt?.length || 0} characters`)
        throw new Error('Prompt must be at least 3 characters long')
      }

      if (prompt.length > 1000) {
        console.error(`❌ [${vertexRequestId}] VERTEX AI: Prompt too long: ${prompt.length} characters`)
        throw new Error('Prompt must be less than 1000 characters')
      }
      console.log(`✅ [${vertexRequestId}] VERTEX AI: Prompt validation passed`)

      // Set default options
      const defaultOptions: ImageGenerationOptions = {
        aspectRatio: '1:1',
        style: 'realistic',
        quality: 'standard',
        safetyLevel: 'block_some',
        personGeneration: 'allow_adult',
        guidanceScale: 7,
        model: 'imagen-4.0-generate-preview-06-06', // Default to Imagen 4.0
      }

      const finalOptions = { ...defaultOptions, ...options }
      console.log(`⚙️ [${vertexRequestId}] VERTEX AI: Final options:`, finalOptions)

      // Get access token
      console.log(`🔐 [${vertexRequestId}] VERTEX AI: Getting Google Cloud access token...`)
      const authClient = await auth.getClient()
      const accessToken = await authClient.getAccessToken()

      if (!accessToken.token) {
        console.error(`❌ [${vertexRequestId}] VERTEX AI: Failed to get access token`)
        throw new Error('Failed to get access token')
      }
      console.log(`✅ [${vertexRequestId}] VERTEX AI: Access token obtained successfully`)
      console.log(`✅ [${vertexRequestId}] VERTEX AI: Access token obtained successfully`)

      // Prepare the request payload for Imagen 3
      const instanceData: any = {
        prompt: prompt.trim(),
        ...(finalOptions.negativePrompt && { negativePrompt: finalOptions.negativePrompt }),
      }

      // Add reference image if provided (for image-to-image generation)
      if (finalOptions.referenceImage) {
        console.log(`🖼️ [${vertexRequestId}] VERTEX AI: Including reference image in request`)
        instanceData.image = {
          bytesBase64Encoded: finalOptions.referenceImage
        }
      }

      const requestPayload = {
        instances: [instanceData],
        parameters: {
          sampleCount: 1,
          aspectRatio: finalOptions.aspectRatio,
          safetyFilterLevel: finalOptions.safetyLevel,
          personGeneration: finalOptions.personGeneration,
          ...(finalOptions.seed && { seed: finalOptions.seed }),
        }
      }

      console.log(`🎨 [${vertexRequestId}] VERTEX AI: Prepared request payload:`, {
        prompt: prompt.substring(0, 100) + (prompt.length > 100 ? '...' : ''),
        options: finalOptions,
        hasReferenceImage: !!finalOptions.referenceImage,
        referenceImageLength: finalOptions.referenceImage?.length || 0,
        payloadSize: JSON.stringify(requestPayload).length
      })

      // Build dynamic endpoint based on model
      const endpoint = `https://${GOOGLE_CLOUD_CONFIG.location}-aiplatform.googleapis.com/v1/projects/${GOOGLE_CLOUD_CONFIG.projectId}/locations/${GOOGLE_CLOUD_CONFIG.location}/publishers/google/models/${finalOptions.model}:predict`

      // Make the REST API call to Imagen
      console.log(`📡 [${vertexRequestId}] VERTEX AI: Sending request to Imagen API...`)
      console.log(`📡 [${vertexRequestId}] VERTEX AI: Model: ${finalOptions.model}`)
      console.log(`📡 [${vertexRequestId}] VERTEX AI: Endpoint: ${endpoint}`)

      const apiStartTime = Date.now()
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestPayload),
      })
      const apiEndTime = Date.now()

      console.log(`📡 [${vertexRequestId}] VERTEX AI: API response received in ${apiEndTime - apiStartTime}ms`)
      console.log(`📡 [${vertexRequestId}] VERTEX AI: Response status: ${response.status} ${response.statusText}`)

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`❌ [${vertexRequestId}] VERTEX AI: API request failed:`, {
          status: response.status,
          statusText: response.statusText,
          errorText: errorText.substring(0, 500)
        })
        throw new Error(`Imagen API error: ${response.status} - ${errorText}`)
      }

      console.log(`📥 [${vertexRequestId}] VERTEX AI: Parsing response data...`)
      const responseData = await response.json()
      console.log(`📥 [${vertexRequestId}] VERTEX AI: Response structure:`, {
        hasPredictions: !!responseData.predictions,
        predictionsCount: responseData.predictions?.length || 0,
        responseKeys: Object.keys(responseData)
      })

      // Process the response
      if (!responseData.predictions || responseData.predictions.length === 0) {
        console.error(`❌ [${vertexRequestId}] VERTEX AI: No predictions in response:`, responseData)
        throw new Error('No image predictions received from Imagen API')
      }

      const prediction = responseData.predictions[0]
      console.log(`🔍 [${vertexRequestId}] VERTEX AI: Processing prediction:`, {
        hasImageData: !!prediction.bytesBase64Encoded,
        predictionKeys: Object.keys(prediction),
        imageDataLength: prediction.bytesBase64Encoded?.length || 0
      })

      if (!prediction.bytesBase64Encoded) {
        console.error(`❌ [${vertexRequestId}] VERTEX AI: No image data in prediction:`, prediction)
        throw new Error('No image data found in prediction')
      }

      const imageData = prediction.bytesBase64Encoded
      const generationTime = Date.now() - startTime

      console.log(`✅ [${vertexRequestId}] VERTEX AI: Image generation successful!`)
      console.log(`✅ [${vertexRequestId}] VERTEX AI: Generated image data: ${imageData.length} characters`)
      console.log(`✅ [${vertexRequestId}] VERTEX AI: Total generation time: ${generationTime}ms`)

      return {
        success: true,
        imageData,
        metadata: {
          prompt,
          options: finalOptions,
          model: finalOptions.model,
          generationTime,
          seed: finalOptions.seed,
        }
      }

    } catch (error) {
      console.error(`💥 [${vertexRequestId}] VERTEX AI: Image generation error:`, error)
      console.error(`💥 [${vertexRequestId}] VERTEX AI: Error details:`, {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace',
        type: typeof error
      })

      const generationTime = Date.now() - startTime

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        metadata: {
          prompt,
          options,
          model: 'imagen-3.0-generate-001',
          generationTime,
        }
      }
    }
  }

  /**
   * Enhance a prompt using AI
   */
  static async enhancePrompt(prompt: string): Promise<{ success: boolean; enhancedPrompt?: string; error?: string }> {
    try {
      if (!isGoogleCloudConfigured()) {
        throw new Error('Google Cloud Vertex AI is not configured')
      }

      const enhancementPrompt = `
        Enhance this image generation prompt to be more detailed and effective for AI image generation.
        Make it more descriptive, add artistic details, lighting, composition, and style elements.
        Keep the core concept but make it more vivid and specific.

        Original prompt: "${prompt}"

        Enhanced prompt:
      `

      // Import textModel from google-cloud config
      const { textModel } = await import('@/lib/google-cloud')
      const response = await textModel.generateContent(enhancementPrompt)

      if (!response.response.text) {
        throw new Error('No enhanced prompt generated')
      }

      const enhancedPrompt = response.response.text().trim()

      return {
        success: true,
        enhancedPrompt
      }

    } catch (error) {
      console.error('Prompt enhancement error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to enhance prompt'
      }
    }
  }

  /**
   * Get available models and their capabilities
   */
  static async getAvailableModels(type: 'image' | 'video' = 'image') {
    try {
      if (!isGoogleCloudConfigured()) {
        throw new Error('Google Cloud Vertex AI is not configured')
      }

      if (type === 'video') {
        return {
          success: true,
          models: [
            {
              id: 'veo-2.0-generate-001',
              name: 'Google Veo 2.0',
              type: 'video-generation',
              capabilities: ['text-to-video', 'image-to-video', 'frame-to-video', 'ultra-high-quality'],
              maxDuration: 8,
              supportedAspectRatios: ['16:9', '9:16'],
              supportedResolutions: ['720p'],
              provider: 'google-vertex-ai',
              pricing_credits: 15
            },
            {
              id: 'veo-3.0-generate-preview',
              name: 'Google Veo 3.0',
              type: 'video-generation',
              capabilities: ['text-to-video', 'image-to-video', 'audio-generation', 'ultra-high-quality'],
              maxDuration: 8,
              supportedAspectRatios: ['16:9'], // Veo 3 only supports 16:9
              supportedResolutions: ['720p'],
              provider: 'google-vertex-ai',
              pricing_credits: 20
            },
            {
              id: 'veo-3.0-fast-generate-preview',
              name: 'Google Veo 3.0 Fast',
              type: 'video-generation',
              capabilities: ['text-to-video', 'image-to-video', 'audio-generation', 'fast-generation'],
              maxDuration: 8,
              supportedAspectRatios: ['16:9'], // Veo 3 only supports 16:9
              supportedResolutions: ['720p'],
              provider: 'google-vertex-ai',
              pricing_credits: 15
            }
          ]
        }
      }

      return {
        success: true,
        models: [
          {
            id: 'imagen-3.0-generate-001',
            name: 'Imagen 3.0',
            type: 'image-generation',
            capabilities: ['text-to-image', 'style-transfer', 'high-quality-generation'],
            maxResolution: '1536x1536',
            supportedAspectRatios: ['1:1', '16:9', '9:16', '4:3', '3:4'],
          }
        ]
      }

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get models'
      }
    }
  }

  /**
   * Validate image generation request
   */
  static validateGenerationRequest(prompt: string, options: ImageGenerationOptions = {}) {
    const errors: string[] = []

    if (!prompt || typeof prompt !== 'string') {
      errors.push('Prompt is required and must be a string')
    } else {
      if (prompt.trim().length < 3) {
        errors.push('Prompt must be at least 3 characters long')
      }
      if (prompt.length > 1000) {
        errors.push('Prompt must be less than 1000 characters')
      }
    }

    if (options.aspectRatio && !['1:1', '16:9', '9:16', '4:3', '3:4'].includes(options.aspectRatio)) {
      errors.push('Invalid aspect ratio')
    }

    if (options.style && !['realistic', 'artistic', 'cartoon', 'abstract', 'photographic'].includes(options.style)) {
      errors.push('Invalid style')
    }

    if (options.guidanceScale && (options.guidanceScale < 1 || options.guidanceScale > 20)) {
      errors.push('Guidance scale must be between 1 and 20')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }
}
