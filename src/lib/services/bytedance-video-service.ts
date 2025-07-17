/**
 * ByteDance Video Service for Gensy AI Creative Suite
 * Handles AI video generation using Seedream-1.0-lite-t2v model via BytePlus ModelArk API
 */

import { config } from '@/lib/env'
import { uploadFile } from '@/lib/storage/r2-client'

export interface BytedanceVideoGenerationOptions {
  duration?: number // 5-10 seconds
  aspectRatio?: '16:9' | '9:16' | '1:1'
  style?: 'realistic' | 'artistic' | 'cartoon' | 'cinematic' | 'documentary'
  quality?: 'standard' | 'high' | 'ultra'
  resolution?: '480p' | '720p' | '1080p'
  motionIntensity?: 'low' | 'medium' | 'high'
  frameRate?: number // 24-30 fps
  referenceImage?: string // Base64 encoded image for image-to-video
  sourceType?: 'text-to-video' | 'image-to-video'
  seed?: number
  guidanceScale?: number // 1-20, higher values follow prompt more closely
  negativePrompt?: string
}

export interface BytedanceVideoGenerationResult {
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

export interface BytedanceTaskStatus {
  success: boolean
  status: 'processing' | 'completed' | 'failed'
  videoUrl?: string
  downloadUrl?: string // Temporary download URL from BytePlus
  error?: string
  progress?: number
}

// Map resolution and aspect ratio to BytePlus format
const getVideoSize = (resolution: string, aspectRatio: string): string => {
  const resolutionMap: Record<string, Record<string, string>> = {
    '480p': {
      '16:9': '854x480',
      '9:16': '480x854',
      '1:1': '480x480'
    },
    '720p': {
      '16:9': '1280x720',
      '9:16': '720x1280',
      '1:1': '720x720'
    },
    '1080p': {
      '16:9': '1920x1080',
      '9:16': '1080x1920',
      '1:1': '1080x1080'
    }
  }

  return resolutionMap[resolution]?.[aspectRatio] || '1280x720' // Default to 720p 16:9
}

export class BytedanceVideoService {
  private static readonly TEXT_TO_VIDEO_MODEL = 'seedance-1-0-lite-t2v-250428' // Text-to-video model
  private static readonly IMAGE_TO_VIDEO_MODEL = 'seedance-1-0-lite-i2v-250428' // Image-to-video model
  private static readonly PRO_MODEL = 'seedance-1-0-pro-250528' // Pro model (supports both T2V and I2V)
  private static readonly API_TIMEOUT = 300000 // 5 minutes
  private static readonly POLL_INTERVAL = 5000 // 5 seconds
  private static readonly MAX_POLL_ATTEMPTS = 60 // 5 minutes total

  /**
   * Determine which ByteDance model to use based on model name and source type
   */
  private static selectModel(modelName?: string, sourceType?: string, hasReferenceImage?: boolean): string {
    // If specific model is requested, use it
    if (modelName) {
      if (modelName.includes('pro') || modelName.includes('250528')) {
        return this.PRO_MODEL
      }
      if (modelName.includes('i2v') || modelName.includes('image-to-video')) {
        return this.IMAGE_TO_VIDEO_MODEL
      }
      if (modelName.includes('t2v') || modelName.includes('text-to-video')) {
        return this.TEXT_TO_VIDEO_MODEL
      }
    }

    // Default selection based on source type or reference image
    if (sourceType === 'image-to-video' || hasReferenceImage) {
      return this.IMAGE_TO_VIDEO_MODEL
    }

    return this.TEXT_TO_VIDEO_MODEL
  }

  /**
   * Detect image format from base64 data
   * BytePlus supports: JPEG (JPG), PNG, WEBP, BMP, TIFF, GIF
   */
  private static detectImageFormat(base64Data: string): string {
    // Remove any existing data URL prefix if present
    const cleanBase64 = base64Data.replace(/^data:image\/[^;]+;base64,/, '')

    try {
      // Decode the first few bytes to check the file signature
      const binaryString = atob(cleanBase64.substring(0, 20))
      const bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }

      // Check file signatures (magic numbers)
      if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) {
        return 'jpeg'
      } else if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) {
        return 'png'
      } else if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46) {
        return 'webp'
      } else if (bytes[0] === 0x42 && bytes[1] === 0x4D) {
        return 'bmp'
      } else if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) {
        return 'gif'
      } else if ((bytes[0] === 0x49 && bytes[1] === 0x49) || (bytes[0] === 0x4D && bytes[1] === 0x4D)) {
        return 'tiff'
      }

      // Default to jpeg if format cannot be detected
      console.warn('🔍 Could not detect image format from base64 data, defaulting to jpeg')
      return 'jpeg'

    } catch (error) {
      console.error('🔍 Error detecting image format:', error)
      return 'jpeg' // Default fallback
    }
  }

  /**
   * Generate a video using BytePlus ModelArk Seedream API
   */
  static async generateVideo(
    prompt: string,
    options: BytedanceVideoGenerationOptions = {},
    generationId?: string,
    modelName?: string
  ): Promise<BytedanceVideoGenerationResult> {
    const bytedanceRequestId = `bytedance_video_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const startTime = Date.now()

    console.log(`🎬 [${bytedanceRequestId}] BYTEDANCE VIDEO: Starting video generation`)
    console.log(`📝 [${bytedanceRequestId}] BYTEDANCE VIDEO: Input parameters:`, {
      prompt: prompt.substring(0, 100) + (prompt.length > 100 ? '...' : ''),
      promptLength: prompt.length,
      generationId,
      options: {
        ...options,
        referenceImage: options.referenceImage ? '[BASE64_DATA]' : undefined
      }
    })

    // Check configuration
    console.log(`🔧 [${bytedanceRequestId}] BYTEDANCE VIDEO: Configuration check:`, {
      hasApiKey: !!config.byteplus.apiKey,
      apiKeyLength: config.byteplus.apiKey?.length || 0,
      apiEndpoint: config.byteplus.apiEndpoint,
      r2Configured: config.r2.accessKeyId && config.r2.secretAccessKey && config.r2.bucketName && config.r2.endpoint
    })

    try {
      // Validate environment variables
      if (!config.byteplus.apiKey || !config.byteplus.apiEndpoint) {
        console.error(`❌ [${bytedanceRequestId}] BYTEDANCE VIDEO: Missing API configuration`)
        return {
          success: false,
          status: 'failed',
          error: 'BytePlus API configuration is missing'
        }
      }

      // Validate prompt
      if (!prompt || prompt.trim().length === 0) {
        console.error(`❌ [${bytedanceRequestId}] BYTEDANCE VIDEO: Empty prompt`)
        return {
          success: false,
          status: 'failed',
          error: 'Prompt cannot be empty'
        }
      }

      // Set default options
      const finalOptions: Required<BytedanceVideoGenerationOptions> = {
        duration: options.duration || 5,
        aspectRatio: options.aspectRatio || '16:9',
        style: options.style || 'realistic',
        quality: options.quality || 'standard',
        resolution: options.resolution || '720p',
        motionIntensity: options.motionIntensity || 'medium',
        frameRate: options.frameRate || 24,
        sourceType: options.sourceType || (options.referenceImage ? 'image-to-video' : 'text-to-video'),
        seed: options.seed || Math.floor(Math.random() * 1000000),
        guidanceScale: options.guidanceScale || 7.5,
        referenceImage: options.referenceImage || '',
        negativePrompt: options.negativePrompt || ''
      }

      // Prepare enhanced prompt with BytePlus ModelArk parameters
      // According to BytePlus documentation, parameters are appended to the prompt with -- syntax
      // IMPORTANT: I2V (image-to-video) and T2V (text-to-video) have different parameter requirements
      let enhancedPrompt = prompt.trim()

      // Determine if this is image-to-video or text-to-video
      const isImageToVideo = !!finalOptions.referenceImage

      // Add resolution parameter (--resolution for I2V, --rs for T2V)
      if (isImageToVideo) {
        enhancedPrompt += ` --resolution ${finalOptions.resolution}`
      } else {
        enhancedPrompt += ` --rs ${finalOptions.resolution}`
      }

      // Add duration parameter (--duration for I2V, --dur for T2V)
      if (isImageToVideo) {
        enhancedPrompt += ` --duration ${finalOptions.duration}`
      } else {
        enhancedPrompt += ` --dur ${finalOptions.duration}`
      }

      // Add aspect ratio parameter - CRITICAL: I2V only supports --ratio adaptive
      if (isImageToVideo) {
        // For image-to-video, BytePlus only supports adaptive ratio
        enhancedPrompt += ` --ratio adaptive`
      } else {
        // For text-to-video, we can specify aspect ratios
        const aspectRatioMap: { [key: string]: string } = {
          '16:9': '16:9',
          '9:16': '9:16',
          '1:1': '1:1'
        }
        const aspectRatio = aspectRatioMap[finalOptions.aspectRatio] || '16:9'
        enhancedPrompt += ` --rt ${aspectRatio}`
      }

      // Add camera fixed parameter (--camerafixed for I2V, --cf for T2V)
      if (isImageToVideo) {
        enhancedPrompt += ` --camerafixed false`
      } else {
        enhancedPrompt += ` --cf false`

        // Add frame rate parameter (only for T2V)
        enhancedPrompt += ` --fps ${finalOptions.frameRate}`

        // Add watermark parameter (only for T2V)
        enhancedPrompt += ` --wm true`
      }

      console.log(`🎬 [${bytedanceRequestId}] BYTEDANCE VIDEO: Enhanced prompt with parameters:`, enhancedPrompt)

      // Prepare request payload following BytePlus ModelArk Video Generation API format
      // Based on documentation: https://docs.byteplus.com/en/docs/ModelArk/1366799
      const content = [
        {
          type: 'text',
          text: enhancedPrompt
        }
      ]

      // Add image if provided (for image-to-video)
      // Note: BytePlus requires images to be at least 300px wide
      // Supported formats: JPEG (JPG), PNG, WEBP, BMP, TIFF, GIF
      if (finalOptions.referenceImage) {
        // Check if the referenceImage already includes the data URL prefix
        let imageUrl: string

        if (finalOptions.referenceImage.startsWith('data:image/')) {
          // Already has data URL prefix, use as-is
          imageUrl = finalOptions.referenceImage
        } else {
          // Detect image format from base64 data and create proper data URL
          const imageFormat = this.detectImageFormat(finalOptions.referenceImage)
          imageUrl = `data:image/${imageFormat};base64,${finalOptions.referenceImage}`
        }

        console.log(`🖼️ [${bytedanceRequestId}] BYTEDANCE VIDEO: Image format detected and formatted for BytePlus API`)

        content.push({
          type: 'image_url',
          image_url: {
            url: imageUrl
          }
        })
      }

      // Select the appropriate model based on model name, source type, or reference image
      const selectedModel = this.selectModel(
        modelName,
        finalOptions.sourceType,
        !!finalOptions.referenceImage
      )

      console.log(`🎬 [${bytedanceRequestId}] BYTEDANCE VIDEO: Selected model: ${selectedModel} (requested: ${modelName || 'auto'}, sourceType: ${finalOptions.sourceType || 'auto'}, hasImage: ${!!finalOptions.referenceImage})`)

      const requestPayload = {
        model: selectedModel,
        content: content
      }

      console.log(`🎬 [${bytedanceRequestId}] BYTEDANCE VIDEO: Request payload summary:`, {
        model: requestPayload.model,
        originalPrompt: prompt.substring(0, 100) + (prompt.length > 100 ? '...' : ''),
        enhancedPrompt: enhancedPrompt.substring(0, 150) + (enhancedPrompt.length > 150 ? '...' : ''),
        duration: finalOptions.duration,
        resolution: finalOptions.resolution,
        aspectRatio: finalOptions.aspectRatio,
        contentTypes: requestPayload.content.map(c => c.type),
        hasImage: requestPayload.content.some(c => c.type === 'image_url')
      })

      // Make API call to BytePlus ModelArk (following the same pattern as image generation)
      console.log(`🌐 [${bytedanceRequestId}] BYTEDANCE VIDEO: Making API call to BytePlus...`)
      console.log(`🌐 [${bytedanceRequestId}] BYTEDANCE VIDEO: Request payload:`, JSON.stringify(requestPayload, null, 2))

      // TEMPORARY: Mock response for testing while API key is being configured
      const ENABLE_MOCK_RESPONSE = false

      if (ENABLE_MOCK_RESPONSE) {
        console.log(`🧪 [${bytedanceRequestId}] BYTEDANCE VIDEO: Using mock response for testing`)

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 2000))

        // Return mock async response (similar to Google Veo pattern)
        return {
          success: true,
          status: 'processing',
          taskId: `mock_task_${Date.now()}`,
          jobId: `mock_job_${Date.now()}`,
          operationName: `mock_operation_${Date.now()}`,
          message: 'Video generation started successfully (mock response)',
          metadata: {
            duration: finalOptions.duration,
            resolution: {
              width: parseInt(getVideoSize(finalOptions.resolution, finalOptions.aspectRatio).split('x')[0]),
              height: parseInt(getVideoSize(finalOptions.resolution, finalOptions.aspectRatio).split('x')[1])
            },
            frameRate: finalOptions.frameRate,
            generationTime: 2000,
            fileSize: 0
          }
        }
      }

      const response = await fetch(`${config.byteplus.apiEndpoint}/contents/generations/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.byteplus.apiKey}`
        },
        body: JSON.stringify(requestPayload),
        signal: AbortSignal.timeout(this.API_TIMEOUT)
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`❌ [${bytedanceRequestId}] BYTEDANCE VIDEO: API call failed:`, {
          status: response.status,
          statusText: response.statusText,
          error: errorText,
          url: `${config.byteplus.apiEndpoint}/contents/generations/tasks`,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.byteplus.apiKey?.substring(0, 10)}...`
          }
        })

        // Try to parse error response
        let errorMessage = `BytePlus API error: ${response.status} ${response.statusText}`
        try {
          const errorJson = JSON.parse(errorText)
          if (errorJson.error && errorJson.error.message) {
            errorMessage = errorJson.error.message
          }
        } catch (e) {
          // Use default error message
        }

        return {
          success: false,
          status: 'failed',
          error: errorMessage
        }
      }

      const result = await response.json()
      console.log(`📋 [${bytedanceRequestId}] BYTEDANCE VIDEO: API response:`, {
        hasId: !!result.id,
        hasTaskId: !!result.task_id,
        status: result.status,
        hasVideoUrl: !!result.video_url,
        hasData: !!result.data
      })

      // BytePlus ModelArk Video Generation API returns task information directly
      // Expected format: { id: "task_id", status: "processing", video_url?: "...", data?: {...} }
      if (!result.id && !result.task_id) {
        throw new Error('No task ID returned from BytePlus API')
      }

      const taskId = result.id || result.task_id
      console.log(`📋 [${bytedanceRequestId}] BYTEDANCE VIDEO: Task created:`, {
        taskId: taskId,
        status: result.status,
        hasVideoUrl: !!result.video_url,
        hasData: !!result.data
      })

      // Check if we got immediate video URL (completed immediately)
      if (result.status === 'completed' && result.video_url) {
        console.log(`✅ [${bytedanceRequestId}] BYTEDANCE VIDEO: Immediate completion detected!`)

        // Upload to Cloudflare R2 storage
        console.log(`🚀 [${bytedanceRequestId}] BYTEDANCE VIDEO: Starting immediate R2 upload...`)
        const r2UploadResult = await this.uploadVideoToR2(
          result.video_url,
          generationId || bytedanceRequestId,
          finalOptions,
          selectedModel,
          bytedanceRequestId
        )

        if (!r2UploadResult.success) {
          return {
            success: false,
            status: 'failed',
            error: `Failed to upload video to R2: ${r2UploadResult.error}`
          }
        }

        const endTime = Date.now()
        return {
          success: true,
          status: 'completed',
          videoUrl: r2UploadResult.url,
          videoData: result.data,
          metadata: {
            model: selectedModel,
            processingTime: endTime - startTime,
            duration: finalOptions.duration,
            resolution: finalOptions.resolution,
            frameRate: finalOptions.frameRate,
            fileSize: r2UploadResult.size
          }
        }
      }

      // Handle async processing (most common case)
      console.log(`⏳ [${bytedanceRequestId}] BYTEDANCE VIDEO: Async processing started with task ID: ${taskId}`)
      return {
        success: true,
        status: 'processing',
        taskId: taskId,
        metadata: {
          model: selectedModel,
          processingTime: 0,
          duration: finalOptions.duration,
          resolution: finalOptions.resolution,
          frameRate: finalOptions.frameRate
        }
      }

    } catch (error) {
      const endTime = Date.now()
      const processingTime = endTime - startTime
      
      console.error(`❌ [${bytedanceRequestId}] BYTEDANCE VIDEO: Generation failed after ${processingTime}ms:`, error)
      
      return {
        success: false,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  /**
   * Poll for task completion status
   */
  static async pollTaskStatus(taskId: string): Promise<BytedanceTaskStatus> {
    const pollRequestId = `bytedance_poll_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    console.log(`🔄 [${pollRequestId}] BYTEDANCE POLL: Checking task status for ${taskId}`)

    try {
      if (!config.byteplus.apiKey || !config.byteplus.apiEndpoint) {
        return {
          success: false,
          status: 'failed',
          error: 'BytePlus API configuration is missing'
        }
      }

      const response = await fetch(`${config.byteplus.apiEndpoint}/contents/generations/tasks/${taskId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.byteplus.apiKey}`
        }
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`❌ [${pollRequestId}] BYTEDANCE POLL: API call failed:`, {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        })
        return {
          success: false,
          status: 'failed',
          error: `BytePlus API error: ${response.status} ${response.statusText}`
        }
      }

      const result = await response.json()
      console.log(`📋 [${pollRequestId}] BYTEDANCE POLL: Task status:`, {
        taskId,
        status: result.status,
        hasContent: !!result.content,
        hasVideoUrl: !!(result.content?.video_url),
        progress: result.progress
      })

      // BytePlus response format: { status: "succeeded", content: { video_url: "..." } }
      const videoUrl = result.content?.video_url || result.video_url

      return {
        success: true,
        status: result.status,
        videoUrl: videoUrl,
        downloadUrl: videoUrl, // For BytePlus, video_url is the download URL
        progress: result.progress
      }

    } catch (error) {
      console.error(`❌ [${pollRequestId}] BYTEDANCE POLL: Polling failed:`, error)
      return {
        success: false,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown polling error'
      }
    }
  }

  /**
   * Download video from BytePlus and upload to Cloudflare R2 storage (Optimized)
   */
  static async downloadAndUploadToR2(
    downloadUrl: string,
    generationId: string,
    options: BytedanceVideoGenerationOptions,
    model: string
  ): Promise<{ success: boolean; url?: string; size?: number; error?: string }> {
    const downloadRequestId = `bytedance_download_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    console.log(`⬇️ [${downloadRequestId}] BYTEDANCE DOWNLOAD: Starting optimized video download and R2 upload`)

    try {
      // Start download with streaming
      console.log(`⬇️ [${downloadRequestId}] BYTEDANCE DOWNLOAD: Initiating streaming download from BytePlus...`)
      const downloadStartTime = Date.now()

      const response = await fetch(downloadUrl, {
        headers: {
          'Accept': 'video/mp4,video/*,*/*',
          'User-Agent': 'Gensy-Video-Downloader/1.0'
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to download video: ${response.status} ${response.statusText}`)
      }

      // Get content length for progress tracking
      const contentLength = response.headers.get('content-length')
      const expectedSize = contentLength ? parseInt(contentLength) : null

      console.log(`⬇️ [${downloadRequestId}] BYTEDANCE DOWNLOAD: Starting download, expected size: ${expectedSize ? `${Math.round(expectedSize / 1024 / 1024 * 100) / 100}MB` : 'unknown'}`)

      // Convert response to buffer (optimized for memory)
      const videoBuffer = Buffer.from(await response.arrayBuffer())
      const downloadEndTime = Date.now()
      const downloadTime = downloadEndTime - downloadStartTime

      console.log(`⬇️ [${downloadRequestId}] BYTEDANCE DOWNLOAD: Download completed in ${downloadTime}ms, actual size: ${Math.round(videoBuffer.length / 1024 / 1024 * 100) / 100}MB`)

      // Upload to Cloudflare R2 with optimized settings
      return await this.uploadVideoToR2(videoBuffer, generationId, options, model, downloadRequestId)

    } catch (error) {
      console.error(`❌ [${downloadRequestId}] BYTEDANCE DOWNLOAD: Download and upload failed:`, error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown download error'
      }
    }
  }

  /**
   * Upload video data to Cloudflare R2 storage (Optimized)
   */
  private static async uploadVideoToR2(
    videoData: string | Buffer,
    generationId: string,
    options: BytedanceVideoGenerationOptions,
    model: string,
    parentRequestId?: string
  ): Promise<{ success: boolean; url?: string; size?: number; error?: string }> {
    const uploadRequestId = parentRequestId ? `${parentRequestId}_r2_upload` : `r2_upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    console.log(`☁️ [${uploadRequestId}] R2 UPLOAD: Starting optimized video upload to Cloudflare R2`)

    try {
      // Convert to buffer if needed
      const buffer = typeof videoData === 'string'
        ? Buffer.from(videoData, 'base64')
        : videoData

      // Generate R2 key following the same pattern as images
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const key = `videos/bytedance/${generationId}/${timestamp}.mp4`

      console.log(`☁️ [${uploadRequestId}] R2 UPLOAD: Uploading ${Math.round(buffer.length / 1024 / 1024 * 100) / 100}MB to key: ${key}`)

      // Upload to Cloudflare R2 with optimized settings
      const uploadStartTime = Date.now()
      const uploadResult = await uploadFile({
        key,
        file: buffer,
        contentType: 'video/mp4',
        metadata: {
          generationId,
          model: model,
          duration: options.duration?.toString() || '5',
          resolution: options.resolution || '720p',
          aspectRatio: options.aspectRatio || '16:9',
          provider: 'bytedance',
          uploadedAt: new Date().toISOString(),
          optimized: 'true'
        },
        isPublic: true // Make videos public for easy access
      })
      const uploadEndTime = Date.now()
      const uploadTime = uploadEndTime - uploadStartTime

      console.log(`☁️ [${uploadRequestId}] R2 UPLOAD: Upload completed in ${uploadTime}ms (${Math.round(buffer.length / 1024 / uploadTime * 1000)}KB/s)`)

      if (uploadResult.success) {
        console.log(`✅ [${uploadRequestId}] R2 UPLOAD: Upload successful`)
        return {
          success: true,
          url: uploadResult.url,
          size: uploadResult.size
        }
      } else {
        console.error(`❌ [${uploadRequestId}] R2 UPLOAD: Upload failed:`, uploadResult.error)
        return {
          success: false,
          error: uploadResult.error
        }
      }

    } catch (error) {
      console.error(`❌ [${uploadRequestId}] R2 UPLOAD: Upload error:`, error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown upload error'
      }
    }
  }

  /**
   * Check if ByteDance video service is properly configured
   */
  static isConfigured(): boolean {
    return !!(config.byteplus.apiKey && config.byteplus.apiEndpoint)
  }

  /**
   * Get supported options for ByteDance video generation
   */
  static getSupportedOptions() {
    return {
      durations: [5, 10], // ByteDance Seedream supports 5 and 10 seconds
      aspectRatios: ['16:9', '9:16', '1:1'],
      styles: ['realistic', 'artistic', 'cartoon', 'cinematic', 'documentary'],
      qualities: ['standard', 'high', 'ultra'],
      resolutions: ['480p', '720p', '1080p'],
      motionIntensities: ['low', 'medium', 'high'],
      frameRates: [24, 25, 30],
      sourceTypes: ['text-to-video', 'image-to-video'],
      models: [
        {
          id: this.TEXT_TO_VIDEO_MODEL,
          name: 'Seedance Lite T2V',
          description: 'Text-to-video generation',
          capabilities: ['text-to-video']
        },
        {
          id: this.IMAGE_TO_VIDEO_MODEL,
          name: 'Seedance Lite I2V',
          description: 'Image-to-video generation',
          capabilities: ['image-to-video']
        },
        {
          id: this.PRO_MODEL,
          name: 'Seedance Pro',
          description: 'Enhanced quality text-to-video and image-to-video generation',
          capabilities: ['text-to-video', 'image-to-video'],
          features: ['enhanced-quality', 'pro-features', 'camera-controls']
        }
      ]
    }
  }

  /**
   * Poll task status for ByteDance video generation
   */
  static async pollTaskStatus(taskId: string): Promise<{
    success: boolean
    status: 'processing' | 'completed' | 'failed'
    progress?: number
    downloadUrl?: string
    error?: string
  }> {
    const bytedanceRequestId = `bytedance_poll_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
    console.log(`🔥 [${bytedanceRequestId}] BYTEDANCE POLL: Checking task status for: ${taskId}`)

    try {
      // TEMPORARY: Mock polling response for testing while API key is being configured
      const ENABLE_MOCK_POLLING = false

      if (ENABLE_MOCK_POLLING) {
        console.log(`🧪 [${bytedanceRequestId}] BYTEDANCE POLL: Using mock polling response`)

        // Simulate different states based on task age
        const taskAge = Date.now() - parseInt(taskId.replace('mock_task_', ''))

        if (taskAge < 10000) { // First 10 seconds - processing
          return {
            success: true,
            status: 'processing',
            progress: Math.min(90, Math.floor(taskAge / 100))
          }
        } else { // After 10 seconds - completed
          return {
            success: true,
            status: 'completed',
            downloadUrl: 'https://example.com/mock-video.mp4' // Mock URL
          }
        }
      }

      // Use imported config

      // BytePlus ModelArk task status endpoint - correct path
      const response = await fetch(`${config.byteplus.apiEndpoint}/contents/generations/tasks/${taskId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${config.byteplus.apiKey}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`❌ [${bytedanceRequestId}] BYTEDANCE POLL: API error:`, {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        })
        throw new Error(`API error: ${response.status} ${response.statusText}`)
      }

      const result = await response.json()
      console.log(`📋 [${bytedanceRequestId}] BYTEDANCE POLL: Task status:`, {
        status: result.status,
        progress: result.progress,
        hasResult: !!result.result,
        hasVideoUrl: !!result.video_url,
        hasDownloadUrl: !!result.download_url,
        hasContent: !!result.content,
        contentType: result.content ? typeof result.content : 'undefined',
        contentKeys: result.content && typeof result.content === 'object' ? Object.keys(result.content) : [],
        resultKeys: result.result ? Object.keys(result.result) : [],
        allKeys: Object.keys(result)
      })

      // Map BytePlus status to our format
      let status: 'processing' | 'completed' | 'failed'
      if (result.status === 'completed' || result.status === 'success' || result.status === 'succeeded') {
        status = 'completed'
      } else if (result.status === 'failed' || result.status === 'error') {
        status = 'failed'
      } else {
        status = 'processing'
      }

      // Extract video URL from various possible locations in the response
      let downloadUrl = null

      // Check multiple possible locations for the video URL
      if (result.result?.video_url) {
        downloadUrl = result.result.video_url
      } else if (result.video_url) {
        downloadUrl = result.video_url
      } else if (result.content && typeof result.content === 'object') {
        // Check if content is an array or object
        if (Array.isArray(result.content)) {
          // Look for video URL in content array
          for (const item of result.content) {
            if (item.video_url || item.url) {
              downloadUrl = item.video_url || item.url
              break
            }
          }
        } else if (result.content.video_url || result.content.url) {
          downloadUrl = result.content.video_url || result.content.url
        }
      }

      console.log(`📋 [${bytedanceRequestId}] BYTEDANCE POLL: Extracted downloadUrl:`, downloadUrl)

      return {
        success: true,
        status,
        progress: result.progress || 0,
        downloadUrl
      }

    } catch (error) {
      console.error(`❌ [${bytedanceRequestId}] BYTEDANCE POLL: Failed:`, error)
      return {
        success: false,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Polling failed'
      }
    }
  }

}
