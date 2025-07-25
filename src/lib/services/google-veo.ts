/**
 * Google Veo Video Generation Service for Gensy AI Creative Suite
 * Handles AI video generation using Google Vertex AI Veo API
 */

import { GoogleAuth } from 'google-auth-library'
import { env } from '../env'



export interface VideoGenerationOptions {
  duration?: number // seconds (5-8 for veo-2.0, 8 for veo-3.0)
  aspectRatio?: '16:9' | '9:16'
  style?: 'realistic' | 'artistic' | 'cartoon' | 'cinematic' | 'documentary'
  quality?: 'standard' | 'high' | 'ultra'
  resolution?: '720p' | '1080p' // Resolution support for Veo 3 models
  referenceImage?: string // base64 encoded image
  referenceVideo?: string // base64 encoded video
  motionIntensity?: 'low' | 'medium' | 'high'
  frameRate?: number // fps (24, 30, 60)
  guidanceScale?: number // 1-20
  seed?: number
  sourceType?: 'text-to-video' | 'image-to-video' | 'video-to-video'
  sourceImageUrl?: string
  sourceImagePrompt?: string
  negativePrompt?: string
  enhancePrompt?: boolean
  personGeneration?: 'allow_adult' | 'dont_allow'
  sampleCount?: number // 1-4
  storageUri?: string // GCS bucket URI
  model?: 'veo-2.0-generate-001' | 'veo-3.0-generate-001-preview' | 'veo-3.0-fast-generate-preview'
  generateAudio?: boolean // Required for Veo 3 models
}

export interface VideoGenerationResult {
  success: boolean
  videoData?: string // base64 encoded video data
  videoUrls?: string[] // Cloud Storage URIs
  jobId?: string
  operationName?: string
  gcsOutputDirectory?: string // GCS bucket path where video will be saved
  status?: 'processing' | 'completed' | 'failed'
  metadata?: {
    duration: number
    resolution: { width: number; height: number }
    frameRate: number
    generationTime: number
    fileSize: number
  }
  error?: string
}

export class GoogleVeoService {
  private static auth: GoogleAuth | null = null

  /**
   * Initialize Google Auth
   */
  private static async getAuth(): Promise<GoogleAuth> {
    if (!this.auth) {
      const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS
      const credentialsBase64 = process.env.GOOGLE_CREDENTIALS_BASE64

      if (credentialsBase64) {
        // Production: Use base64 encoded credentials
        console.log('🔐 GOOGLE VEO: Using base64 credentials for authentication')
        const credentials = JSON.parse(Buffer.from(credentialsBase64, 'base64').toString())

        this.auth = new GoogleAuth({
          projectId: this.getProjectId(),
          credentials,
          scopes: ['https://www.googleapis.com/auth/cloud-platform']
        })
      } else if (credentialsPath) {
        // Development: Use credentials file path
        console.log('🔐 GOOGLE VEO: Using credentials file for authentication')
        this.auth = new GoogleAuth({
          projectId: this.getProjectId(),
          keyFilename: credentialsPath,
          scopes: ['https://www.googleapis.com/auth/cloud-platform']
        })
      } else {
        throw new Error('Missing Google credentials: Set either GOOGLE_APPLICATION_CREDENTIALS or GOOGLE_CREDENTIALS_BASE64')
      }
    }
    return this.auth
  }

  /**
   * Get access token for API calls
   */
  private static async getAccessToken(): Promise<string> {
    const auth = await this.getAuth()
    const client = await auth.getClient()
    const accessToken = await client.getAccessToken()

    if (!accessToken.token) {
      throw new Error('Failed to get access token')
    }

    return accessToken.token
  }

  /**
   * Check if Google Cloud is properly configured
   */
  static isConfigured(): boolean {
    return !!(process.env.GOOGLE_CLOUD_PROJECT_ID &&
             (process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.GOOGLE_CREDENTIALS_BASE64))
  }

  /**
   * Get Google Cloud project ID (throws if missing)
   */
  private static getProjectId(): string {
    const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID
    if (!projectId) {
      throw new Error('Missing environment variable: GOOGLE_CLOUD_PROJECT_ID')
    }
    return projectId
  }

  /**
   * Get Google Cloud location (throws if missing)
   */
  private static getLocation(): string {
    const location = process.env.GOOGLE_CLOUD_LOCATION
    if (!location) {
      throw new Error('Missing environment variable: GOOGLE_CLOUD_LOCATION')
    }
    return location
  }

  /**
   * Generate video using Google Vertex AI Veo API
   */
  static async generateVideo(
    prompt: string,
    options: VideoGenerationOptions = {},
    generationId?: string // We now require the generationId to build the path
  ): Promise<VideoGenerationResult & { gcsOutputDirectory?: string }> {
    const startTime = Date.now()
    // FIX #1: Use slice instead of deprecated substr
    const requestId = `veo_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`

    try {
      console.log(`🎬 [${requestId}] GOOGLE VEO: Starting video generation`)

      // Validate inputs
      if (!prompt || prompt.trim().length < 3) {
        throw new Error('Prompt must be at least 3 characters long')
      }

      if (!this.isConfigured()) {
        console.log(`🧪 [${requestId}] GOOGLE VEO: Not configured, using mock generation`)
        console.log(`🧪 [${requestId}] GOOGLE VEO: Configuration check:`, {
          hasProjectId: !!process.env.GOOGLE_CLOUD_PROJECT_ID,
          hasCredentialsFile: !!process.env.GOOGLE_APPLICATION_CREDENTIALS,
          hasCredentialsBase64: !!process.env.GOOGLE_CREDENTIALS_BASE64,
          projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
          credentialsFileLength: process.env.GOOGLE_APPLICATION_CREDENTIALS?.length || 0,
          credentialsBase64Length: process.env.GOOGLE_CREDENTIALS_BASE64?.length || 0
        })
        return await this.generateMockVideo(options)
      }

      // Set default options according to Veo API requirements
      const modelId = options.model || 'veo-2.0-generate-001'
      const isVeo3 = modelId.includes('veo-3.0')
      const isVeo3Fast = modelId.includes('veo-3.0-fast')

      console.log(`🎬 [${requestId}] GOOGLE VEO: Using model: ${modelId} (isVeo3: ${isVeo3}, isVeo3Fast: ${isVeo3Fast})`)

      // Validate Veo 3 access and parameters
      if (isVeo3) {
        console.log(`🔍 [${requestId}] GOOGLE VEO: Veo 3.0 model detected, validating parameters...`)

        // Veo 3.0 has specific requirements
        if (options.duration && options.duration !== 8) {
          console.warn(`⚠️ [${requestId}] GOOGLE VEO: Veo 3.0 only supports 8-second duration, adjusting from ${options.duration}`)
        }
        if (options.aspectRatio && options.aspectRatio !== '16:9') {
          console.warn(`⚠️ [${requestId}] GOOGLE VEO: Veo 3.0 only supports 16:9 aspect ratio, adjusting from ${options.aspectRatio}`)
        }
      }

      const finalOptions: VideoGenerationOptions = {
        // Duration handling: Both Veo 3.0 and Veo 3.0 Fast use 8 seconds as per Studio
        duration: isVeo3 ? 8 : (options.duration || 8),
        aspectRatio: isVeo3 ? '16:9' : (options.aspectRatio === '9:16' ? '9:16' : '16:9'), // Veo 3 only supports 16:9
        resolution: options.resolution || (isVeo3 ? '1080p' : '720p'), // Veo 3 supports 1080p, Veo 2 only 720p
        model: modelId,
        sampleCount: Math.min(options.sampleCount || 1, isVeo3Fast ? 2 : 4), // Veo 3 Fast max 2, others max 4
        enhancePrompt: options.enhancePrompt !== false, // Default to true
        personGeneration: isVeo3 ? 'allow_all' : (options.personGeneration || 'allow_adult'), // Studio uses 'allow_all' for Veo 3
        generateAudio: isVeo3 ? (options.generateAudio !== false) : undefined, // Required for Veo 3, not supported by Veo 2
        seed: options.seed,
        negativePrompt: options.negativePrompt,
        ...options
      }

      console.log(`🎬 [${requestId}] GOOGLE VEO: Using options:`, {
        duration: finalOptions.duration,
        aspectRatio: finalOptions.aspectRatio,
        model: finalOptions.model,
        sampleCount: finalOptions.sampleCount,
        hasReferenceImage: !!finalOptions.referenceImage
      })

      // Get access token
      const accessToken = await this.getAccessToken()

      // =================================================================
      // --- DOCUMENTATION AUDIT FIX: Use correct parameter name ---
      // Based on official Vertex AI Veo documentation analysis:
      // - Parameter name must be "storageUri" (not "outputGcsUri")
      // - Parameter goes in "parameters" section (not "instances")
      // - Format: gs://BUCKET_NAME/SUBDIRECTORY
      // =================================================================

      // Use the correct bucket name from environment variable
      const bucketName = env.GOOGLE_CLOUD_STORAGE_BUCKET
      const gcsOutputDirectory = generationId
        ? `gs://${bucketName}/video-outputs/${generationId}`
        : `gs://${bucketName}/video-outputs/${Date.now()}`

      console.log(`✅ [${requestId}] GOOGLE VEO: Using official storageUri parameter: ${gcsOutputDirectory}`)
      // =================================================================

      // Prepare the request payload according to Veo API specification
      // Based on Vertex AI Studio investigation and official documentation
      const requestPayload = {
        instances: [{
          prompt: prompt,
          ...(finalOptions.referenceImage && {
            image: {
              bytesBase64Encoded: finalOptions.referenceImage,
              mimeType: 'image/jpeg'
            }
          })
        }],
        parameters: {
          // Core parameters - using exact parameter names from Vertex AI Studio
          durationSeconds: isVeo3 ? finalOptions.duration.toString() : finalOptions.duration, // Studio sends as string for Veo 3
          aspectRatio: finalOptions.aspectRatio,
          sampleCount: finalOptions.sampleCount,
          storageUri: gcsOutputDirectory,

          // Resolution parameter - Veo 3 supports 1080p using the resolution parameter (as of July 17, 2025)
          ...(isVeo3 && finalOptions.resolution === '1080p' && {
            resolution: '1080p'
          }),

          // Veo 3.0 specific parameters (required for Veo 3.0 models) - matching Studio exactly
          ...(isVeo3 && {
            generateAudio: true, // Studio always uses true
            personGeneration: finalOptions.personGeneration, // Use the value from finalOptions (now 'allow_all')
            addWatermark: true, // Studio uses true
            includeRaiReason: true // Studio includes this parameter
          }),

          // Veo 2.0 specific parameters
          ...(!isVeo3 && {
            enhancePrompt: finalOptions.enhancePrompt !== false,
            personGeneration: finalOptions.personGeneration === 'dont_allow' ? 'dont_allow' : 'allow_adult'
          }),

          // Optional parameters for all models
          ...(finalOptions.seed && { seed: finalOptions.seed }),
          ...(finalOptions.negativePrompt && { negativePrompt: finalOptions.negativePrompt })
        }
      }

      console.log(`🎬 [${requestId}] GOOGLE VEO: Sending request to Vertex AI...`)
      console.log(`📋 [${requestId}] GOOGLE VEO: Request payload:`, JSON.stringify(requestPayload, null, 2))

      // Make the API call to Vertex AI Veo
      const location = this.getLocation()
      const projectId = this.getProjectId()
      const apiUrl = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${finalOptions.model}:predictLongRunning`

      console.log(`🌐 [${requestId}] GOOGLE VEO: API URL:`, apiUrl)

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestPayload)
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`❌ [${requestId}] GOOGLE VEO: API error:`, {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        })

        // Check if this is a Veo 3.0 access issue
        if (isVeo3 && (response.status === 403 || response.status === 404 || errorText.includes('not found') || errorText.includes('permission'))) {
          console.warn(`🚫 [${requestId}] GOOGLE VEO: Veo 3.0 access not available. This model requires allowlist access.`)
          throw new Error(`Veo 3.0 access not available. This model requires allowlist access. Please apply for access through the Google Cloud Console or use Veo 2.0 instead.`)
        }

        throw new Error(`Vertex AI API error: ${response.status} ${response.statusText} - ${errorText}`)
      }

      const result = await response.json()
      console.log(`✅ [${requestId}] GOOGLE VEO: Request submitted successfully`)
      console.log(`📋 [${requestId}] GOOGLE VEO: Full response:`, JSON.stringify(result, null, 2))
      console.log(`🔄 [${requestId}] GOOGLE VEO: Operation name:`, result.name)



      // =================================================================
      // --- FINAL FIX: CHECK FOR IMMEDIATE COMPLETION ---
      // For very fast operations, Vertex AI might return the result directly.
      // =================================================================
      const immediatePrediction = result.response?.predictions?.[0] || result.predictions?.[0]

      if (immediatePrediction?.bytesBase64Encoded) {
        console.log(`✅ [${requestId}] GOOGLE VEO: Fast completion detected! Bypassing polling.`)
        console.log(`🎥 [${requestId}] GOOGLE VEO: Received immediate base64 video data (${immediatePrediction.bytesBase64Encoded.length} chars)`)
        return {
          success: true,
          status: 'completed',
          videoData: immediatePrediction.bytesBase64Encoded, // Here is the video!
          operationName: result.name,
          jobId: result.name.split('/').pop(),
          metadata: {
            duration: finalOptions.duration || 8,
            resolution: this.getResolutionFromAspectRatio(finalOptions.aspectRatio || '16:9', finalOptions.resolution),
            frameRate: 24,
            generationTime: Date.now() - startTime,
            fileSize: Math.round(immediatePrediction.bytesBase64Encoded.length * 0.75)
          }
        }
      }

      if (immediatePrediction?.gcsUri) {
        console.log(`✅ [${requestId}] GOOGLE VEO: Fast completion detected! Bypassing polling.`)
        console.log(`🎥 [${requestId}] GOOGLE VEO: Received immediate GCS URI:`, immediatePrediction.gcsUri)
        return {
          success: true,
          status: 'completed',
          videoUrls: [immediatePrediction.gcsUri],
          operationName: result.name,
          jobId: result.name.split('/').pop(),
          metadata: {
            duration: finalOptions.duration || 8,
            resolution: this.getResolutionFromAspectRatio(finalOptions.aspectRatio || '16:9', finalOptions.resolution),
            frameRate: 24,
            generationTime: Date.now() - startTime,
            fileSize: 0 // Unknown for GCS URIs
          }
        }
      }
      // --- END OF FINAL FIX ---

      // If no immediate result, return the operation for polling as before.
      console.log(`🔄 [${requestId}] GOOGLE VEO: No immediate result, proceeding with polling`)
      return {
        success: true,
        status: 'processing',
        operationName: result.name,
        jobId: result.name.split('/').pop(), // Extract operation ID
        gcsOutputDirectory, // Add the GCS output directory for bucket polling
        metadata: {
          duration: finalOptions.duration || 8,
          resolution: this.getResolutionFromAspectRatio(finalOptions.aspectRatio || '16:9', finalOptions.resolution),
          frameRate: 24,
          generationTime: Date.now() - startTime,
          fileSize: 0
        }
      }

    } catch (error) {
      console.error(`❌ [${requestId}] GOOGLE VEO: Generation failed:`, error)

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown video generation error',
        metadata: {
          duration: 0,
          resolution: { width: 0, height: 0 },
          frameRate: 0,
          generationTime: Date.now() - startTime,
          fileSize: 0
        }
      }
    }
  }

  /**
   * Multi-Probe Diagnostic Tool for Video Generation Operation Polling
   * Tests 4 different hypotheses about the undocumented API behavior
   */
  static async pollOperation(operationName: string): Promise<VideoGenerationResult> {
    const requestId = `multiprobe_${Date.now()}`
    console.log(`🔬 [${requestId}] VEO MULTI-PROBE: Starting diagnostic poll for ${operationName}`)

    try {
      if (!this.isConfigured()) {
        throw new Error('Google Cloud not configured')
      }

      const accessToken = await this.getAccessToken()
      const projectId = this.getProjectId()
      const location = operationName.split('/')[3]

      const headers = {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
      const headersWithBilling = { ...headers, 'X-Goog-User-Project': projectId }

      const urlsToProbe = [
        // Hypothesis A: The URL we've been using
        {
          name: 'Regional v1 (Current)',
          url: `https://${location}-aiplatform.googleapis.com/v1/${operationName}`,
          headers: headers
        },
        // Hypothesis B: A global v1 endpoint
        {
          name: 'Global v1',
          url: `https://aiplatform.googleapis.com/v1/${operationName}`,
          headers: headers
        },
        // Hypothesis C: A regional BETA endpoint
        {
          name: 'Regional v1beta1',
          url: `https://${location}-aiplatform.googleapis.com/v1beta1/${operationName}`,
          headers: headers
        },
        // Hypothesis D: The original URL with a special billing header
        {
          name: 'Regional v1 + Billing Header',
          url: `https://${location}-aiplatform.googleapis.com/v1/${operationName}`,
          headers: headersWithBilling
        }
      ]

      for (const probe of urlsToProbe) {
        console.log(`📡 [${requestId}] PROBING: ${probe.name} at URL: ${probe.url}`)
        try {
          const response = await fetch(probe.url, { method: 'GET', headers: probe.headers })
          console.log(`📨 [${requestId}] RESPONSE from ${probe.name}: Status ${response.status}`)

          if (response.ok) {
            console.log(`✅ [${requestId}] SUCCESS! Probe "${probe.name}" worked!`)
            const result = await response.json()

            if (result.done) {
              if (result.error) {
                console.error(`❌ [${requestId}] GOOGLE VEO: Operation finished with an error:`, result.error)
                return {
                  success: false,
                  status: 'failed',
                  error: result.error.message || 'Operation failed',
                  operationName
                }
              }
              console.log(`✅ [${requestId}] GOOGLE VEO: Operation completed successfully!`)
              const videoData = result.response?.predictions?.[0]?.bytesBase64Encoded
              if (videoData) {
                console.log(`🎥 [${requestId}] GOOGLE VEO: Received base64 video data (${videoData.length} chars)`)
                return {
                  success: true,
                  status: 'completed',
                  videoData: videoData,
                  operationName,
                  jobId: operationName.split('/').pop()
                }
              }
              console.log(`❌ [${requestId}] GOOGLE VEO: Operation completed but no video data found.`)
              return {
                success: false,
                status: 'failed',
                error: 'Probe succeeded but no video data was found.',
                operationName
              }
            } else {
              console.log(`🔄 [${requestId}] GOOGLE VEO: Operation still processing...`)
              return {
                success: true,
                status: 'processing',
                operationName,
                jobId: operationName.split('/').pop()
              }
            }
          } else {
            const errorText = await response.text()
            console.log(`❌ [${requestId}] FAILED: Probe "${probe.name}" failed with status ${response.status}. Response: ${errorText.substring(0, 200)}...`)
            // If it's not a 404, it's a new clue!
            if (response.status !== 404) {
              throw new Error(`Probe ${probe.name} failed with non-404 status: ${response.status}`)
            }
          }
        } catch (error) {
          console.error(`💥 [${requestId}] CATASTROPHIC FAIL on probe "${probe.name}":`, error)
        }
      }

      // If all probes fail, return the original 404 error
      console.log(`🔍 [${requestId}] ALL PROBES FAILED: Returning 404 error`)
      return {
        success: false,
        status: 'failed',
        error: 'All polling probes failed, primarily with 404 Not Found.',
        operationName
      }

    } catch (error) {
      console.error(`❌ [${requestId}] VEO MULTI-PROBE: Critical failure:`, error)
      return {
        success: false,
        status: 'failed',
        error: error instanceof Error ? error.message : 'A critical error occurred during multi-probe polling.',
        operationName
      }
    }
  }

  /**
   * Generate mock video when Google Veo is not available
   */
  // FIX #2: Removed unused `aiAnalysis` parameter
  private static async generateMockVideo(
    options: VideoGenerationOptions
  ): Promise<VideoGenerationResult> {
    const startTime = Date.now()

    try {
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 2000))

      const resolution = this.getResolutionFromAspectRatio(options.aspectRatio || '16:9', options.resolution)
      const duration = options.duration || 8
      const frameRate = options.frameRate || 24

      // Create a mock video data (base64 encoded placeholder)
      const mockVideoData = this.createMockVideoData(options)

      const processingTime = Date.now() - startTime

      return {
        success: true,
        videoData: mockVideoData,
        status: 'completed',
        metadata: {
          duration,
          resolution,
          frameRate,
          generationTime: processingTime,
          fileSize: Math.round(duration * 1024 * 1024 * 0.5) // Estimate ~0.5MB per second
        }
      }

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Mock video generation failed',
        metadata: {
          duration: 0,
          resolution: { width: 0, height: 0 },
          frameRate: 0,
          generationTime: Date.now() - startTime,
          fileSize: 0
        }
      }
    }
  }

  /**
   * Create mock video data (returns a minimal valid MP4)
   */
  // FIX #3 & #4: Removed unused `prompt` and `resolution` parameters
  private static createMockVideoData(options: VideoGenerationOptions): string {
    const resolution = this.getResolutionFromAspectRatio(options.aspectRatio || '16:9', options.resolution);
    const mp4Data = this.createMinimalMP4(resolution.width, resolution.height, options.duration || 5)
    return Buffer.from(mp4Data).toString('base64')
  }

  // FIX #6: Removed unused createAnimatedSVG method and all its helper methods

  /**
   * Create a minimal MP4 video
   */
  private static createMinimalMP4(_width: number, _height: number, _duration: number): Uint8Array {
    // This mock is static and doesn't actually use the width, height, or duration,
    // but the parameters are kept for future implementations.
    const knownWorkingMP4 = 'AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDEAAAAIZnJlZQAAAr1tZGF0AAACrgYF//+q3EXpvebZSLeWLNgg2SPu73gyNjQgLSBjb3JlIDE2NCByMzEwOCAzMWU5ZjM3IC0gSC4yNjQvTVBFRy00IEFWQyBjb2RlYyAtIENvcHlsZWZ0IDIwMDMtMjAyMyAtIGh0dHA6Ly93d3cudmlkZW9sYW4ub3JnL3gyNjQuaHRtbCAtIG9wdGlvbnM6IGNhYmFjPTEgcmVmPTMgZGVibG9jaz0xOjA6MCBhbmFseXNlPTB4MzoweDExMyBtZT1oZXggc3VibWU9NyBwc3k9MSBwc3lfcmQ9MS4wMDowLjAwIG1peGVkX3JlZj0xIG1lX3JhbmdlPTE2IGNocm9tYV9tZT0xIHRyZWxsaXM9MSA4eDhkY3Q9MSBjcW09MCBkZWFkem9uZT0yMSwxMSBmYXN0X3Bza2lwPTEgY2hyb21hX3FwX29mZnNldD0tMiB0aHJlYWRzPTEgbG9va2FoZWFkX3RocmVhZHM9MSBzbGljZWRfdGhyZWFkcz0wIG5yPTAgZGVjaW1hdGU9MSBpbnRlcmxhY2VkPTAgYmx1cmF5X2NvbXBhdD0wIGNvbnN0cmFpbmVkX2ludHJhPTAgYmZyYW1lcz0zIGJfcHlyYW1pZD0yIGJfYWRhcHQ9MSBiX2JpYXM9MCBkaXJlY3Q9MSB3ZWlnaHRiPTEgb3Blbl9nb3A9MCB3ZWlnaHRwPTIga2V5aW50PTI1MCBrZXlpbnRfbWluPTI1IHNjZW5lY3V0PTQwIGludHJhX3JlZnJlc2g9MCByY19sb29rYWhlYWQ9NDAgcmM9Y3JmIG1idHJlZT0xIGNyZj0yMy4wIHFjb21wPTAuNjAgcXBtaW49MCBxcG1heD02OSBxcHN0ZXA9NCBpcF9yYXRpbz0xLjQwIGFxPTE6MS4wMACAAAABWWWIhAAz//727L4FNf2f0JcRLMXaSnA+KqSAgHc0wAAAAwAAAwAAFgn0I7DkqgAAAAZBmiQYhn/+1oQAAAAJQZ5CeIZ/+1oQAAAACUGeYniGf/taEAAAAAlBnoZ4hn/7WhAAAAA='
    const binaryString = Buffer.from(knownWorkingMP4, 'base64')
    return new Uint8Array(binaryString)
  }



  // FIX #6: Removed all unused helper methods for createAnimatedSVG

  /**
   * Get resolution from aspect ratio and resolution setting
   * Veo 2: 720p only, Veo 3: 720p and 1080p
   */
  private static getResolutionFromAspectRatio(aspectRatio: string, resolution: string = '720p'): { width: number; height: number } {
    const is1080p = resolution === '1080p'

    switch (aspectRatio) {
      case '16:9':
        return is1080p
          ? { width: 1920, height: 1080 } // 1080p landscape
          : { width: 1280, height: 720 }  // 720p landscape
      case '9:16':
        return is1080p
          ? { width: 1080, height: 1920 } // 1080p portrait
          : { width: 720, height: 1280 }  // 720p portrait
      default:
        return is1080p
          ? { width: 1920, height: 1080 } // Default to 1080p landscape
          : { width: 1280, height: 720 }  // Default to 720p landscape
    }
  }

  // FIX #7: Removed unused getGenerationStatus method

  /**
   * Get supported video generation options for Veo API
   */
  static getSupportedOptions(): {
    durations: number[]
    aspectRatios: string[]
    resolutions: string[]
    styles: string[]
    qualities: string[]
    motionIntensities: string[]
    models: string[]
  } {
    return {
      durations: [8], // Veo 3.0 models support 8 seconds (Veo 2.0 supports 5-8, but we focus on Veo 3)
      aspectRatios: ['16:9', '9:16'], // Veo only supports these two aspect ratios
      resolutions: ['720p', '1080p'], // Veo 3 supports both 720p and 1080p
      styles: ['realistic', 'artistic', 'cartoon', 'cinematic', 'documentary'],
      qualities: ['standard', 'high', 'ultra'],
      motionIntensities: ['low', 'medium', 'high'],
      models: ['veo-3.0-generate-001-preview', 'veo-3.0-fast-generate-preview']
    }
  }
}
