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

// MiniMax model configurations
const MINIMAX_MODELS = {
  'hailuo-02': {
    id: 'hailuo-02',
    name: 'MiniMax Hailuo 02',
    description: 'Text-to-Video & Image-to-Video with SOTA instruction following',
    capabilities: ['text-to-video', 'image-to-video'],
    resolutions: ['1080p', '768p'],
    durations: [6, 10],
    frameRate: 24,
    aspectRatios: ['16:9', '9:16', '1:1']
  },
  't2v-01-director': {
    id: 't2v-01-director',
    name: 'T2V-01-Director',
    description: 'Text-to-Video with enhanced precision shot control',
    capabilities: ['text-to-video'],
    resolutions: ['720p'],
    durations: [6],
    frameRate: 25,
    aspectRatios: ['16:9', '9:16', '1:1']
  },
  'i2v-01-director': {
    id: 'i2v-01-director',
    name: 'I2V-01-Director',
    description: 'Image-to-Video with enhanced precision shot control',
    capabilities: ['image-to-video'],
    resolutions: ['720p'],
    durations: [6],
    frameRate: 25,
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

      // Determine model to use
      const selectedModel = modelName || options.model || 'hailuo-02'
      const modelConfig = MINIMAX_MODELS[selectedModel as keyof typeof MINIMAX_MODELS]
      
      if (!modelConfig) {
        console.error(`❌ [${minimaxRequestId}] MINIMAX VIDEO: Invalid model: ${selectedModel}`)
        return {
          success: false,
          status: 'failed',
          error: `Invalid model: ${selectedModel}`
        }
      }

      // Validate source type compatibility
      const sourceType = options.sourceType || 'text-to-video'
      if (!modelConfig.capabilities.includes(sourceType)) {
        console.error(`❌ [${minimaxRequestId}] MINIMAX VIDEO: Model ${selectedModel} doesn't support ${sourceType}`)
        return {
          success: false,
          status: 'failed',
          error: `Model ${selectedModel} doesn't support ${sourceType}`
        }
      }

      // Set default options based on model capabilities
      const finalOptions: Required<MinimaxVideoGenerationOptions> = {
        duration: options.duration || modelConfig.durations[0],
        aspectRatio: options.aspectRatio || '16:9',
        style: options.style || 'realistic',
        quality: options.quality || 'standard',
        resolution: options.resolution || modelConfig.resolutions[0],
        motionIntensity: options.motionIntensity || 'medium',
        frameRate: options.frameRate || modelConfig.frameRate,
        referenceImage: options.referenceImage || '',
        sourceType: sourceType,
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
      // Prepare request payload based on MiniMax API documentation
      const requestPayload: any = {
        model: options.model,
        prompt: prompt,
        // Add model-specific parameters here based on MiniMax API docs
      }

      // Add image for image-to-video models
      if (options.sourceType === 'image-to-video' && options.referenceImage) {
        requestPayload.image = options.referenceImage
      }

      console.log(`🌐 [${requestId}] MINIMAX VIDEO: Making API call to MiniMax...`)
      const response = await fetch(`${config.minimax.apiEndpoint}/video_generation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.minimax.apiKey}`
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

        const response = await fetch(`${config.minimax.apiEndpoint}/video_generation/${taskId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${config.minimax.apiKey}`
          },
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

        // Handle different status responses based on MiniMax API
        if (result.status === 'completed' || result.status === 'success') {
          console.log(`✅ [${requestId}] MINIMAX VIDEO: Task completed successfully`)
          return {
            success: true,
            status: 'completed',
            downloadUrl: result.video_url || result.download_url,
            videoUrl: result.video_url
          }
        } else if (result.status === 'failed' || result.status === 'error') {
          console.error(`❌ [${requestId}] MINIMAX VIDEO: Task failed:`, result.error || result.message)
          return {
            success: false,
            status: 'failed',
            error: result.error || result.message || 'Video generation failed'
          }
        } else if (result.status === 'processing' || result.status === 'pending') {
          console.log(`⏳ [${requestId}] MINIMAX VIDEO: Task still processing... (${result.progress || 'unknown'}%)`)
          await new Promise(resolve => setTimeout(resolve, pollInterval))
          continue
        } else {
          console.warn(`⚠️ [${requestId}] MINIMAX VIDEO: Unknown status:`, result.status)
          await new Promise(resolve => setTimeout(resolve, pollInterval))
          continue
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
