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
  resolution?: '512p' | '720p' | '768p' | '1080p'
  motionIntensity?: 'low' | 'medium' | 'high'
  frameRate?: number // 24-25 fps
  referenceImage?: string // Full data URI for image-to-video (data:image/jpeg;base64,...)
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

// MiniMax model configurations (based on official API documentation)
const MINIMAX_MODELS = {
  'MiniMax-Hailuo-02': {
    id: 'MiniMax-Hailuo-02',
    name: 'MiniMax Hailuo 02',
    description: 'Latest MiniMax video generation model with SOTA instruction following and extreme physics mastery',
    capabilities: ['text-to-video', 'image-to-video'],
    resolutions: ['512p', '768p', '1080p'],
    durations: [6, 10],
    frameRate: 24,
    aspectRatios: ['16:9', '9:16', '1:1'],
    pricing: 0.65,
    // Resolution-specific duration constraints
    resolutionConstraints: {
      '1080p': [6], // 1080p only supports 6s
      '768p': [6, 10], // 768p supports both 6s and 10s
      '512p': [6, 10]  // 512p supports both 6s and 10s
    }
  },
  'T2V-01-Director': {
    id: 'T2V-01-Director',
    name: 'T2V-01 Director',
    description: 'Advanced text-to-video model with director-level control and precision',
    capabilities: ['text-to-video'],
    resolutions: ['720p', '1080p'],
    durations: [5, 10],
    frameRate: 24,
    aspectRatios: ['16:9', '9:16', '1:1'],
    pricing: 0.43
  },
  'I2V-01-Director': {
    id: 'I2V-01-Director',
    name: 'I2V-01 Director',
    description: 'Image-to-video model with director-level control and high-quality motion generation',
    capabilities: ['image-to-video'],
    resolutions: ['720p', '1080p'],
    durations: [5, 10],
    frameRate: 24,
    aspectRatios: ['16:9', '9:16', '1:1'],
    pricing: 0.43
  },
  'T2V-01': {
    id: 'T2V-01',
    name: 'T2V-01',
    description: 'Standard text-to-video generation model with good quality and speed',
    capabilities: ['text-to-video'],
    resolutions: ['720p', '1080p'],
    durations: [5, 10],
    frameRate: 24,
    aspectRatios: ['16:9', '9:16', '1:1'],
    pricing: 0.30
  },
  'I2V-01': {
    id: 'I2V-01',
    name: 'I2V-01',
    description: 'Standard image-to-video generation model with natural motion',
    capabilities: ['image-to-video'],
    resolutions: ['720p', '1080p'],
    durations: [5, 10],
    frameRate: 24,
    aspectRatios: ['16:9', '9:16', '1:1'],
    pricing: 0.30
  },
  'I2V-01-live': {
    id: 'I2V-01-live',
    name: 'I2V-01 Live',
    description: 'Live image-to-video generation with real-time processing capabilities',
    capabilities: ['image-to-video', 'live-generation'],
    resolutions: ['720p', '1080p'],
    durations: [5, 10],
    frameRate: 24,
    aspectRatios: ['16:9', '9:16', '1:1'],
    pricing: 0.35
  },
  'S2V-01': {
    id: 'S2V-01',
    name: 'S2V-01',
    description: 'Speech-to-video generation model that creates videos from audio input',
    capabilities: ['speech-to-video'],
    resolutions: ['720p', '1080p'],
    durations: [5, 10],
    frameRate: 24,
    aspectRatios: ['16:9', '9:16', '1:1'],
    pricing: 0.40
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

      // Select appropriate MiniMax model based on options and modelName
      let selectedModel = modelName || options.model || 'MiniMax-Hailuo-02' // Default to latest model

      // Validate model exists
      if (!MINIMAX_MODELS[selectedModel as keyof typeof MINIMAX_MODELS]) {
        console.warn(`⚠️ [${minimaxRequestId}] MINIMAX VIDEO: Model ${selectedModel} not found, using MiniMax-Hailuo-02`)
        selectedModel = 'MiniMax-Hailuo-02'
      }

      const modelConfig = MINIMAX_MODELS[selectedModel as keyof typeof MINIMAX_MODELS]

      // Determine source type based on model capabilities and options
      let sourceType: 'text-to-video' | 'image-to-video' | 'speech-to-video' = 'text-to-video'

      if (options.referenceImage && modelConfig.capabilities.includes('image-to-video')) {
        sourceType = 'image-to-video'
      } else if (options.referenceImage && !modelConfig.capabilities.includes('image-to-video')) {
        console.warn(`⚠️ [${minimaxRequestId}] MINIMAX VIDEO: Model ${selectedModel} doesn't support image-to-video, using text-to-video`)
        sourceType = 'text-to-video'
      }

      // Set default options based on model capabilities
      const finalOptions: Required<MinimaxVideoGenerationOptions> = {
        duration: options.duration || 5,
        aspectRatio: options.aspectRatio || '16:9',
        style: options.style || 'realistic',
        quality: options.quality || 'standard',
        resolution: options.resolution || '768p',
        motionIntensity: options.motionIntensity || 'medium',
        frameRate: options.frameRate || 24,
        referenceImage: sourceType === 'image-to-video' ? (options.referenceImage || '') : '',
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
      // MiniMax API expects uppercase P format (e.g., "1080P", not "1080p")
      const minimaxResolution = options.resolution.replace('p', 'P')
      console.log(`🎯 [${requestId}] MINIMAX VIDEO: Resolution conversion: ${options.resolution} -> ${minimaxResolution}`)

      // Prepare request payload based on official MiniMax API documentation
      const requestPayload: any = {
        prompt: prompt,
        model: options.model,
        duration: options.duration,
        resolution: minimaxResolution,
        aspect_ratio: options.aspectRatio,
        frame_rate: options.frameRate,
        style: options.style,
        quality: options.quality,
        motion_intensity: options.motionIntensity,
        sample_count: 1,
        enhance_prompt: true,
        seed: options.seed
      }

      // Add first frame image if provided (enables image-to-video generation)
      if (options.referenceImage) {
        // MiniMax expects first_frame_image field with full data URI (per official docs)
        requestPayload.first_frame_image = options.referenceImage

        console.log(`🖼️ [${requestId}] MINIMAX VIDEO: Added first_frame_image for image-to-video generation`)
      }

      console.log(`🌐 [${requestId}] MINIMAX VIDEO: Making API call to MiniMax with model: ${options.model}`)
      console.log(`📦 [${requestId}] MINIMAX VIDEO: Final request payload:`, {
        ...requestPayload,
        first_frame_image: requestPayload.first_frame_image ? '[BASE64_DATA]' : undefined
      })
      const response = await fetch('https://api.minimax.io/v1/video_generation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.minimax.apiKey}`,
          'Cache-Control': 'no-cache'
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

        const response = await fetch(`https://api.minimax.io/v1/query/video_generation?task_id=${taskId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${config.minimax.apiKey}`,
            'Cache-Control': 'no-cache'
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
          file_id: result.file_id
        })

        // Handle different status responses based on official MiniMax API documentation
        if (result.status === 'Success') {
          if (result.file_id) {
            console.log(`✅ [${requestId}] MINIMAX VIDEO: Task completed successfully, getting download URL...`)

            // Get download URL using file_id
            const downloadUrl = await this.getDownloadUrl(result.file_id, requestId)
            if (downloadUrl) {
              return {
                success: true,
                status: 'completed',
                downloadUrl: downloadUrl,
                videoUrl: downloadUrl
              }
            } else {
              return {
                success: false,
                status: 'failed',
                error: 'Failed to get download URL'
              }
            }
          } else {
            console.error(`❌ [${requestId}] MINIMAX VIDEO: Success status but no file_id`)
            return {
              success: false,
              status: 'failed',
              error: 'Success status but no file_id received'
            }
          }
        } else if (result.status === 'Fail') {
          console.error(`❌ [${requestId}] MINIMAX VIDEO: Task failed`)
          return {
            success: false,
            status: 'failed',
            error: 'Video generation failed'
          }
        } else if (result.status === 'Preparing' || result.status === 'Queueing' || result.status === 'Processing') {
          console.log(`⏳ [${requestId}] MINIMAX VIDEO: Task status: ${result.status}`)
          await new Promise(resolve => setTimeout(resolve, pollInterval))
          continue
        } else {
          console.warn(`⚠️ [${requestId}] MINIMAX VIDEO: Unknown status: ${result.status}`)
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
   * Get download URL from file_id
   */
  private static async getDownloadUrl(fileId: string, requestId: string): Promise<string | null> {
    try {
      console.log(`📥 [${requestId}] MINIMAX VIDEO: Getting download URL for file_id: ${fileId}`)

      const response = await fetch(`https://api.minimax.io/v1/files/retrieve?file_id=${fileId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${config.minimax.apiKey}`,
          'Cache-Control': 'no-cache'
        },
        signal: AbortSignal.timeout(30000)
      })

      if (!response.ok) {
        console.error(`❌ [${requestId}] MINIMAX VIDEO: Failed to get download URL:`, response.status)
        return null
      }

      const result = await response.json()
      console.log(`📥 [${requestId}] MINIMAX VIDEO: File retrieve result:`, result)

      if (result.file && result.file.download_url) {
        console.log(`✅ [${requestId}] MINIMAX VIDEO: Got download URL successfully`)
        return result.file.download_url
      } else {
        console.error(`❌ [${requestId}] MINIMAX VIDEO: No download_url in response`)
        return null
      }

    } catch (error) {
      console.error(`❌ [${requestId}] MINIMAX VIDEO: Error getting download URL:`, error)
      return null
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

      // Generate R2 key (path)
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const uploadKey = `videos/minimax-video-${model}-${generationId}-${timestamp}.mp4`

      // Upload to R2
      console.log(`☁️ [${downloadRequestId}] MINIMAX DOWNLOAD: Uploading to R2 with key: ${uploadKey}`)
      const uploadResult = await uploadFile({
        key: uploadKey,
        file: Buffer.from(videoBuffer),
        contentType: 'video/mp4',
        isPublic: true
      })

      if (uploadResult.success && uploadResult.url) {
        console.log(`🎉 [${downloadRequestId}] MINIMAX DOWNLOAD: Upload completed successfully:`, uploadResult.url)
        return {
          success: true,
          url: uploadResult.url,
          size: videoSize
        }
      } else {
        console.error(`❌ [${downloadRequestId}] MINIMAX DOWNLOAD: R2 upload failed:`, uploadResult.error)
        console.log(`🔄 [${downloadRequestId}] MINIMAX DOWNLOAD: Falling back to original download URL`)
        return {
          success: true, // Still consider it successful since we have the video
          url: downloadUrl, // Return original MiniMax download URL as fallback
          size: videoSize,
          error: `R2 upload failed, using original URL: ${uploadResult.error}`
        }
      }

    } catch (error) {
      console.error(`❌ [${downloadRequestId}] MINIMAX DOWNLOAD: Download and upload failed:`, error)
      console.log(`🔄 [${downloadRequestId}] MINIMAX DOWNLOAD: Falling back to original download URL`)
      return {
        success: true, // Still return success with original URL
        url: downloadUrl, // Return original MiniMax download URL as fallback
        error: `Download/upload failed, using original URL: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  /**
   * Get supported options for MiniMax video generation
   */
  static getSupportedOptions() {
    return {
      models: Object.values(MINIMAX_MODELS),
      durations: [5, 10],
      aspectRatios: ['16:9', '9:16', '1:1'],
      styles: ['realistic', 'artistic', 'cartoon', 'cinematic', 'documentary'],
      qualities: ['standard', 'high', 'ultra'],
      resolutions: ['720p', '1080p'],
      motionIntensities: ['low', 'medium', 'high'],
      frameRates: [24, 25],
      sourceTypes: ['text-to-video', 'image-to-video', 'speech-to-video']
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
