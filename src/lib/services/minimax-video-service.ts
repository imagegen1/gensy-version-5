/**
 * MiniMax Hailuo AI Video Service for Gensy AI Creative Suite
 * Handles AI video generation using MiniMax Hailuo models
 */

import { config } from '@/lib/env'
import { uploadFile } from '@/lib/storage/r2-client'

export interface MinimaxVideoGenerationOptions {
  duration?: number // 6-10 seconds depending on model
  aspectRatio?: '16:9' | '9:16' | '1:1'
  style?: 'realistic' | 'artistic' | 'cartoon' | 'cinematic' | 'documentary'
  quality?: 'standard' | 'high' | 'ultra'
  resolution?: '720p' | '768p' | '1080p'
  motionIntensity?: 'low' | 'medium' | 'high'
  frameRate?: number // 24-25 fps
  referenceImage?: string // Base64 encoded image for image-to-video
  sourceType?: 'text-to-video' | 'image-to-video'
  seed?: number
  model?: string // Specific MiniMax model to use
}

export interface MinimaxVideoGenerationResult {
  success: boolean
  status: 'processing' | 'completed' | 'failed'
  taskId?: string
  videoUrl?: string // R2 URL after completion
  videoData?: string // Base64 encoded video data (if immediate)
  error?: string
  metadata?: {
    model: string
    processingTime: number
    duration: number
    resolution: string
    frameRate: number
    fileSize?: number
  }
}

export interface MinimaxTaskStatus {
  success: boolean
  status: 'processing' | 'completed' | 'failed'
  videoUrl?: string
  downloadUrl?: string // Temporary download URL from MiniMax
  error?: string
  progress?: number
}

// MiniMax model configurations (based on actual API documentation)
const MINIMAX_MODELS = {
  'minimax-hailuo-ai': {
    id: 'minimax-hailuo-ai',
    name: 'MiniMax Hailuo AI',
    description: 'Advanced text-to-video generation with high-quality output',
    capabilities: ['text-to-video'],
    resolutions: ['720p', '1080p'],
    durations: [5, 10],
    frameRate: 24,
    aspectRatios: ['16:9', '9:16', '1:1']
  }
} as const

export class MinimaxVideoService {
  private static readonly API_TIMEOUT = 300000 // 5 minutes
  private static readonly MAX_RETRIES = 3
  private static readonly RETRY_DELAY = 2000 // 2 seconds

  /**
   * Generate a video using MiniMax Hailuo API
   */
  static async generateVideo(
    prompt: string,
    options: MinimaxVideoGenerationOptions = {},
    generationId?: string,
    modelName?: string
  ): Promise<MinimaxVideoGenerationResult> {
    const minimaxRequestId = `minimax_video_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const startTime = Date.now()

    console.log(`🎬 [${minimaxRequestId}] MINIMAX VIDEO: Starting video generation`)
    console.log(`📝 [${minimaxRequestId}] MINIMAX VIDEO: Input parameters:`, {
      prompt: prompt.substring(0, 100) + (prompt.length > 100 ? '...' : ''),
      promptLength: prompt.length,
      generationId,
      modelName,
      options: {
        ...options,
        referenceImage: options.referenceImage ? '[BASE64_DATA]' : undefined
      }
    })

    // Check configuration
    console.log(`🔧 [${minimaxRequestId}] MINIMAX VIDEO: Configuration check:`, {
      hasApiKey: !!config.minimax.apiKey,
      apiKeyLength: config.minimax.apiKey?.length || 0,
      apiEndpoint: config.minimax.apiEndpoint,
      r2Configured: config.r2.accessKeyId && config.r2.secretAccessKey && config.r2.bucketName && config.r2.endpoint
    })

    try {
      // Validate environment variables
      if (!config.minimax.apiKey || !config.minimax.apiEndpoint) {
        console.error(`❌ [${minimaxRequestId}] MINIMAX VIDEO: Missing API configuration`)
        return {
          success: false,
          status: 'failed',
          error: 'MiniMax API configuration is missing'
        }
      }

      // Validate prompt
      if (!prompt || prompt.trim().length === 0) {
        console.error(`❌ [${minimaxRequestId}] MINIMAX VIDEO: Empty prompt`)
        return {
          success: false,
          status: 'failed',
          error: 'Prompt cannot be empty'
        }
      }

      // Use the single MiniMax model
      const selectedModel = 'minimax-hailuo-ai'
      const modelConfig = MINIMAX_MODELS[selectedModel]

      // MiniMax API only supports text-to-video currently
      const sourceType = 'text-to-video'
      if (options.referenceImage) {
        console.warn(`⚠️ [${minimaxRequestId}] MINIMAX VIDEO: Image-to-video not supported by MiniMax API, using text-to-video`)
      }

      // Set default options (simplified for MiniMax API)
      const finalOptions: Required<MinimaxVideoGenerationOptions> = {
        duration: options.duration || 5,
        aspectRatio: options.aspectRatio || '16:9',
        style: options.style || 'realistic',
        quality: options.quality || 'standard',
        resolution: options.resolution || '720p',
        motionIntensity: options.motionIntensity || 'medium',
        frameRate: options.frameRate || 24,
        referenceImage: '', // Not supported by current API
        sourceType: 'text-to-video',
        seed: options.seed || Math.floor(Math.random() * 1000000),
        model: selectedModel
      }

      console.log(`🎯 [${minimaxRequestId}] MINIMAX VIDEO: Final options:`, {
        ...finalOptions,
        referenceImage: finalOptions.referenceImage ? '[BASE64_DATA]' : undefined
      })

      // Validate duration and resolution for selected model
      if (!modelConfig.durations.includes(finalOptions.duration)) {
        console.warn(`⚠️ [${minimaxRequestId}] MINIMAX VIDEO: Duration ${finalOptions.duration}s not supported by ${selectedModel}, using ${modelConfig.durations[0]}s`)
        finalOptions.duration = modelConfig.durations[0]
      }

      if (!modelConfig.resolutions.includes(finalOptions.resolution)) {
        console.warn(`⚠️ [${minimaxRequestId}] MINIMAX VIDEO: Resolution ${finalOptions.resolution} not supported by ${selectedModel}, using ${modelConfig.resolutions[0]}`)
        finalOptions.resolution = modelConfig.resolutions[0]
      }

      // Create video generation task
      const taskResult = await this.createVideoGenerationTask(
        prompt,
        finalOptions,
        minimaxRequestId,
        modelConfig
      )

      if (!taskResult.success || !taskResult.taskId) {
        console.error(`❌ [${minimaxRequestId}] MINIMAX VIDEO: Failed to create task:`, taskResult.error)
        return {
          success: false,
          status: 'failed',
          error: taskResult.error || 'Failed to create video generation task'
        }
      }

      console.log(`✅ [${minimaxRequestId}] MINIMAX VIDEO: Task created successfully:`, taskResult.taskId)

      // Poll for completion
      const pollResult = await this.pollTaskCompletion(
        taskResult.taskId,
        minimaxRequestId,
        finalOptions
      )

      if (!pollResult.success) {
        console.error(`❌ [${minimaxRequestId}] MINIMAX VIDEO: Task failed:`, pollResult.error)
        return {
          success: false,
          status: 'failed',
          error: pollResult.error || 'Video generation failed'
        }
      }

      // Download and upload to R2
      if (pollResult.downloadUrl) {
        const uploadResult = await this.downloadAndUploadToR2(
          pollResult.downloadUrl,
          generationId || minimaxRequestId,
          finalOptions,
          selectedModel
        )

        if (uploadResult.success && uploadResult.url) {
          const processingTime = Date.now() - startTime
          console.log(`🎉 [${minimaxRequestId}] MINIMAX VIDEO: Generation completed successfully in ${processingTime}ms`)

          return {
            success: true,
            status: 'completed',
            taskId: taskResult.taskId,
            videoUrl: uploadResult.url,
            metadata: {
              model: selectedModel,
              processingTime,
              duration: finalOptions.duration,
              resolution: finalOptions.resolution,
              frameRate: finalOptions.frameRate,
              fileSize: uploadResult.size
            }
          }
        } else {
          console.error(`❌ [${minimaxRequestId}] MINIMAX VIDEO: Failed to upload to R2:`, uploadResult.error)
          return {
            success: false,
            status: 'failed',
            error: uploadResult.error || 'Failed to upload video to storage'
          }
        }
      }

      console.error(`❌ [${minimaxRequestId}] MINIMAX VIDEO: No download URL received`)
      return {
        success: false,
        status: 'failed',
        error: 'No download URL received from MiniMax'
      }

    } catch (error) {
      const processingTime = Date.now() - startTime
      console.error(`❌ [${minimaxRequestId}] MINIMAX VIDEO: Generation failed after ${processingTime}ms:`, error)
      
      return {
        success: false,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  /**
   * Create video generation task using MiniMax API
   */
  private static async createVideoGenerationTask(
    prompt: string,
    options: Required<MinimaxVideoGenerationOptions>,
    requestId: string,
    modelConfig: typeof MINIMAX_MODELS[keyof typeof MINIMAX_MODELS]
  ): Promise<{ success: boolean; taskId?: string; error?: string }> {
    console.log(`🚀 [${requestId}] MINIMAX VIDEO: Creating generation task...`)

    try {
      // Prepare request payload based on actual MiniMax API documentation
      const requestPayload = {
        prompt: prompt,
        prompt_optimizer: true // Default optimization
      }

      console.log(`🌐 [${requestId}] MINIMAX VIDEO: Making API call to MiniMax...`)
      const response = await fetch('https://gateway.appypie.com/minimax-hailuo-ai/v1/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'Ocp-Apim-Subscription-Key': config.minimax.apiKey
        },
        body: JSON.stringify(requestPayload),
        signal: AbortSignal.timeout(this.API_TIMEOUT)
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`❌ [${requestId}] MINIMAX VIDEO: API call failed:`, {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        })
        return {
          success: false,
          error: `MiniMax API error: ${response.status} ${response.statusText}`
        }
      }

      const result = await response.json()
      console.log(`✅ [${requestId}] MINIMAX VIDEO: Task created:`, result)

      return {
        success: true,
        taskId: result.task_id || result.id
      }

    } catch (error) {
      console.error(`❌ [${requestId}] MINIMAX VIDEO: Failed to create task:`, error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create video generation task'
      }
    }
  }

  /**
   * Poll task completion status
   */
  private static async pollTaskCompletion(
    taskId: string,
    requestId: string,
    options: Required<MinimaxVideoGenerationOptions>
  ): Promise<MinimaxTaskStatus> {
    console.log(`🔄 [${requestId}] MINIMAX VIDEO: Starting to poll task ${taskId}`)

    const maxAttempts = 60 // 5 minutes with 5-second intervals
    const pollInterval = 5000 // 5 seconds

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        console.log(`🔍 [${requestId}] MINIMAX VIDEO: Polling attempt ${attempt}/${maxAttempts}`)

        const response = await fetch('https://gateway.appypie.com/minimax-hailuo-ai-polling/v1/getStatus', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache',
            'Ocp-Apim-Subscription-Key': config.minimax.apiKey
          },
          body: JSON.stringify({ task_id: taskId }),
          signal: AbortSignal.timeout(30000) // 30 second timeout per request
        })

        if (!response.ok) {
          console.warn(`⚠️ [${requestId}] MINIMAX VIDEO: Poll request failed:`, response.status)
          if (attempt === maxAttempts) {
            return {
              success: false,
              status: 'failed',
              error: `Failed to poll task status: ${response.status}`
            }
          }
          await new Promise(resolve => setTimeout(resolve, pollInterval))
          continue
        }

        const result = await response.json()
        console.log(`📊 [${requestId}] MINIMAX VIDEO: Poll result:`, {
          status: result.status,
          progress: result.progress
        })

        // Handle different status responses based on actual MiniMax API response
        if (result.base_resp && result.base_resp.status_code === 0) {
          if (result.file && result.file.download_url) {
            console.log(`✅ [${requestId}] MINIMAX VIDEO: Task completed successfully`)
            return {
              success: true,
              status: 'completed',
              downloadUrl: result.file.download_url,
              videoUrl: result.file.download_url
            }
          } else {
            console.log(`⏳ [${requestId}] MINIMAX VIDEO: Task still processing...`)
            await new Promise(resolve => setTimeout(resolve, pollInterval))
            continue
          }
        } else {
          console.error(`❌ [${requestId}] MINIMAX VIDEO: Task failed:`, result.base_resp?.status_msg || 'Unknown error')
          return {
            success: false,
            status: 'failed',
            error: result.base_resp?.status_msg || 'Video generation failed'
          }
        }

      } catch (error) {
        console.error(`❌ [${requestId}] MINIMAX VIDEO: Poll attempt ${attempt} failed:`, error)
        if (attempt === maxAttempts) {
          return {
            success: false,
            status: 'failed',
            error: error instanceof Error ? error.message : 'Polling failed'
          }
        }
        await new Promise(resolve => setTimeout(resolve, pollInterval))
      }
    }

    console.error(`❌ [${requestId}] MINIMAX VIDEO: Polling timeout after ${maxAttempts} attempts`)
    return {
      success: false,
      status: 'failed',
      error: 'Video generation timeout'
    }
  }

  /**
   * Download video from MiniMax and upload to Cloudflare R2 storage
   */
  static async downloadAndUploadToR2(
    downloadUrl: string,
    generationId: string,
    options: MinimaxVideoGenerationOptions,
    model: string
  ): Promise<{ success: boolean; url?: string; size?: number; error?: string }> {
    const downloadRequestId = `minimax_download_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    console.log(`⬇️ [${downloadRequestId}] MINIMAX DOWNLOAD: Starting video download and R2 upload`)
    console.log(`🔗 [${downloadRequestId}] MINIMAX DOWNLOAD: Download URL:`, downloadUrl.substring(0, 100) + '...')

    try {
      // Download video from MiniMax
      console.log(`📥 [${downloadRequestId}] MINIMAX DOWNLOAD: Downloading video...`)
      const downloadResponse = await fetch(downloadUrl, {
        method: 'GET',
        signal: AbortSignal.timeout(300000) // 5 minute timeout
      })

      if (!downloadResponse.ok) {
        console.error(`❌ [${downloadRequestId}] MINIMAX DOWNLOAD: Download failed:`, downloadResponse.status)
        return {
          success: false,
          error: `Failed to download video: ${downloadResponse.status} ${downloadResponse.statusText}`
        }
      }

      const videoBuffer = await downloadResponse.arrayBuffer()
      const videoSize = videoBuffer.byteLength
      console.log(`✅ [${downloadRequestId}] MINIMAX DOWNLOAD: Video downloaded successfully:`, {
        size: `${(videoSize / 1024 / 1024).toFixed(2)} MB`,
        sizeBytes: videoSize
      })

      // Generate filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const filename = `minimax-video-${model}-${generationId}-${timestamp}.mp4`

      // Upload to R2
      console.log(`☁️ [${downloadRequestId}] MINIMAX DOWNLOAD: Uploading to R2 as ${filename}`)
      const uploadResult = await uploadFile(
        Buffer.from(videoBuffer),
        filename,
        'video/mp4'
      )

      if (uploadResult.success && uploadResult.url) {
        console.log(`🎉 [${downloadRequestId}] MINIMAX DOWNLOAD: Upload completed successfully:`, uploadResult.url)
        return {
          success: true,
          url: uploadResult.url,
          size: videoSize
        }
      } else {
        console.error(`❌ [${downloadRequestId}] MINIMAX DOWNLOAD: R2 upload failed:`, uploadResult.error)
        return {
          success: false,
          error: uploadResult.error || 'Failed to upload to R2'
        }
      }

    } catch (error) {
      console.error(`❌ [${downloadRequestId}] MINIMAX DOWNLOAD: Download and upload failed:`, error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Download and upload failed'
      }
    }
  }

  /**
   * Get supported options for MiniMax video generation
   */
  static getSupportedOptions() {
    return {
      models: Object.values(MINIMAX_MODELS),
      durations: [6, 10],
      aspectRatios: ['16:9', '9:16', '1:1'],
      styles: ['realistic', 'artistic', 'cartoon', 'cinematic', 'documentary'],
      qualities: ['standard', 'high', 'ultra'],
      resolutions: ['720p', '768p', '1080p'],
      motionIntensities: ['low', 'medium', 'high'],
      frameRates: [24, 25],
      sourceTypes: ['text-to-video', 'image-to-video']
    }
  }

  /**
   * Get model configuration by ID
   */
  static getModelConfig(modelId: string) {
    return MINIMAX_MODELS[modelId as keyof typeof MINIMAX_MODELS] || null
  }

  /**
   * Validate options for a specific model
   */
  static validateOptionsForModel(modelId: string, options: MinimaxVideoGenerationOptions): {
    valid: boolean;
    errors: string[];
    adjustedOptions?: MinimaxVideoGenerationOptions;
  } {
    const modelConfig = this.getModelConfig(modelId)
    if (!modelConfig) {
      return {
        valid: false,
        errors: [`Invalid model: ${modelId}`]
      }
    }

    const errors: string[] = []
    const adjustedOptions: MinimaxVideoGenerationOptions = { ...options }

    // Validate source type
    if (options.sourceType && !modelConfig.capabilities.includes(options.sourceType)) {
      errors.push(`Model ${modelId} doesn't support ${options.sourceType}`)
    }

    // Validate and adjust duration
    if (options.duration && !modelConfig.durations.includes(options.duration)) {
      adjustedOptions.duration = modelConfig.durations[0]
      errors.push(`Duration ${options.duration}s not supported, adjusted to ${adjustedOptions.duration}s`)
    }

    // Validate and adjust resolution
    if (options.resolution && !modelConfig.resolutions.includes(options.resolution)) {
      adjustedOptions.resolution = modelConfig.resolutions[0] as any
      errors.push(`Resolution ${options.resolution} not supported, adjusted to ${adjustedOptions.resolution}`)
    }

    // Validate and adjust aspect ratio
    if (options.aspectRatio && !modelConfig.aspectRatios.includes(options.aspectRatio)) {
      adjustedOptions.aspectRatio = '16:9'
      errors.push(`Aspect ratio ${options.aspectRatio} not supported, adjusted to 16:9`)
    }

    return {
      valid: errors.length === 0,
      errors,
      adjustedOptions
    }
  }
}
