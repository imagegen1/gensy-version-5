'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useAuth } from '@clerk/nextjs'
import { 
  PlayIcon,
  SparklesIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { VideoPromptInput } from './VideoPromptInput'
import { VideoOptionsPanel } from './VideoOptionsPanel'
import { ReferenceImageUpload } from './ReferenceImageUpload'
import { VideoProgress } from './VideoProgress'
import { VideoResult } from './VideoResult'
import { CreditIndicator } from '../generation/CreditIndicator'

interface VideoGenerationOptions {
  duration: number
  aspectRatio: '16:9' | '9:16' | '1:1' | '4:3' | '3:4'
  style: 'realistic' | 'artistic' | 'cartoon' | 'cinematic' | 'documentary'
  quality: 'standard' | 'high' | 'ultra'
  provider: 'google-veo' | 'replicate-wan'
  motionIntensity: 'low' | 'medium' | 'high'
  frameRate: number
  referenceImage?: string
  seed?: number
}

interface VideoGenerationResult {
  success: boolean
  generationId?: string
  operationName?: string
  jobId?: string
  status?: 'processing' | 'completed' | 'failed'
  videoUrl?: string
  metadata?: any
  creditsUsed?: number
  remainingCredits?: number
  error?: string
  estimatedTime?: number
}

export function VideoGenerator() {
  const { userId } = useAuth()
  const [prompt, setPrompt] = useState('')
  const [options, setOptions] = useState<VideoGenerationOptions>({
    duration: 5,
    aspectRatio: '16:9',
    style: 'realistic',
    quality: 'standard',
    provider: 'google-veo',
    motionIntensity: 'medium',
    frameRate: 24
  })
  const [isGenerating, setIsGenerating] = useState(false)
  const [result, setResult] = useState<VideoGenerationResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [credits, setCredits] = useState<number>(0)
  const [progress, setProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState('')

  // Use refs for interval management to prevent memory leaks
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const pollingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const retryCountRef = useRef(0)

  // Add state for decoupled polling trigger - UPDATED FOR PROVIDER-AWARE POLLING
  const [pollingTrigger, setPollingTrigger] = useState<{
    generationId: string
    gcsOutputDirectory: string
    provider?: string
    taskId?: string
    timestamp: number
  } | null>(null)

  // Load user credits
  const loadCredits = useCallback(async () => {
    if (userId) {
      try {
        const response = await fetch('/api/user/credits')
        if (response.ok) {
          const data = await response.json()
          setCredits(data.balance?.current || 0)
        }
      } catch (error) {
        console.error('Failed to load credits:', error)
      }
    }
  }, [userId])

  // Centralized cleanup function
  const cleanupPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
      pollingIntervalRef.current = null
    }
    if (pollingTimeoutRef.current) {
      clearTimeout(pollingTimeoutRef.current)
      pollingTimeoutRef.current = null
    }
    retryCountRef.current = 0
  }, [])

  // Load credits on mount and cleanup on unmount
  useEffect(() => {
    loadCredits()

    // Cleanup function for component unmount
    return () => {
      cleanupPolling()
    }
  }, [loadCredits, cleanupPolling])

  // DECOUPLED POLLING TRIGGER - This useEffect watches for polling triggers
  // and starts polling independently of the async handleGenerate function
  useEffect(() => {
    if (pollingTrigger) {
      const { generationId, gcsOutputDirectory, provider, taskId, timestamp } = pollingTrigger
      console.log(`🎯 [decoupled_${timestamp}] FRONTEND: Decoupled polling trigger activated`)
      console.log(`🎯 [decoupled_${timestamp}] FRONTEND: Polling data:`, {
        generationId,
        gcsOutputDirectory,
        provider,
        taskId,
        hasGcsDirectory: !!gcsOutputDirectory,
        gcsDirectoryLength: gcsOutputDirectory?.length || 0
      })

      // Validate we have the required data
      if (!generationId) {
        console.error('❌ [FRONTEND] Missing generationId for polling')
        return
      }

      // Only require gcsOutputDirectory for non-ByteDance providers
      if (!gcsOutputDirectory && provider !== 'bytedance') {
        console.error('❌ [FRONTEND] Missing gcsOutputDirectory for polling')
        return
      }

      // Start polling immediately with optimized settings
      startStatusPolling(generationId, gcsOutputDirectory, provider, taskId)

      // Clear the trigger to prevent re-triggering
      setPollingTrigger(null)
    }
  }, [pollingTrigger])

  const handleOptionsChange = (newOptions: Partial<VideoGenerationOptions>) => {
    setOptions(prev => ({ ...prev, ...newOptions }))
  }

  const handleReferenceImage = (imageData: string) => {
    setOptions(prev => ({ ...prev, referenceImage: imageData }))
  }

  const getCreditCost = () => {
    return 5 // Video generation costs 5 credits
  }

  const handleGenerate = async () => {
    console.log('🎬 [FRONTEND] Starting video generation...')

    if (isGenerating) {
      console.log('❌ [FRONTEND] Already generating, skipping request')
      return
    }

    if (!prompt) {
      console.log('❌ [FRONTEND] No prompt provided')
      return
    }

    cleanupPolling()
    setIsGenerating(true)
    setError(null)
    setResult(null)
    setProgress(0)
    setCurrentStep('Sending request to AI...')

    try {
      console.log('🚀 [FRONTEND] Sending video generation request...')

      const response = await fetch('/api/generate/video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, ...options })
      })

      console.log(`📨 [FRONTEND] Response status: ${response.status}`)

      const data = await response.json()
      console.log('📋 [FRONTEND] Response data:', JSON.stringify(data, null, 2))

      if (!response.ok) {
        throw new Error(data.error || 'API Error')
      }

      // Check if we have all required data for polling
      if (data.status === 'processing' && data.generationId) {
        console.log('🎯 [FRONTEND] Setting up GCS polling with data:', {
          generationId: data.generationId,
          gcsOutputDirectory: data.gcsOutputDirectory,
          hasGcsDirectory: !!data.gcsOutputDirectory
        })

        // Set the polling trigger with all necessary data
        // Only set gcsOutputDirectory for Google providers, not ByteDance
        setPollingTrigger({
          generationId: data.generationId,
          gcsOutputDirectory: data.provider === 'bytedance' ? undefined : (data.gcsOutputDirectory || `gs://gensy-final/video-outputs/${data.generationId}`),
          provider: data.provider,
          taskId: data.taskId,
          timestamp: Date.now()
        })

        console.log('✅ [FRONTEND] GCS polling trigger set successfully')
      } else {
        console.log('⚠️ [FRONTEND] Missing required data for polling:', {
          status: data.status,
          hasGenerationId: !!data.generationId,
          hasGcsDirectory: !!data.gcsOutputDirectory
        })
      }

    } catch (error) {
      console.error('❌ [FRONTEND] Video generation error:', error)
      setError(error instanceof Error ? error.message : 'An unknown error occurred')
      setIsGenerating(false)
    }
  }

  const startStatusPolling = useCallback((generationId: string, gcsOutputDirectory: string, provider?: string, taskId?: string) => {
    const pollingId = `polling_${generationId.slice(-8)}_${Date.now()}`
    console.log(`🚨 [${pollingId}] FRONTEND: STORAGE POLLING started with:`, {
      generationId,
      gcsOutputDirectory,
      provider,
      taskId,
      hasGcsDirectory: !!gcsOutputDirectory,
      gcsDirectoryType: typeof gcsOutputDirectory,
      gcsDirectoryLength: gcsOutputDirectory?.length || 0
    })

    if (provider === 'bytedance') {
      console.log(`🚨 [${pollingId}] FRONTEND: Using ByteDance polling with Cloudflare R2 storage for provider: ${provider}`)
    } else {
      console.log(`🚨 [${pollingId}] FRONTEND: Using GCS bucket polling - bypassing broken Google API`)
    }

    // Validate parameters before starting polling
    if (!generationId) {
      console.error(`❌ [${pollingId}] FRONTEND: Cannot start polling - missing generationId`)
      return
    }

    // Only require gcsOutputDirectory for non-ByteDance providers
    if (!gcsOutputDirectory && provider !== 'bytedance') {
      console.error(`❌ [${pollingId}] FRONTEND: Cannot start polling - missing gcsOutputDirectory`)
      return
    }

    // Clear any existing polling before starting new one
    cleanupPolling()

    setCurrentStep('Processing video (Google Vertex AI is very fast)...')
    retryCountRef.current = 0

    const pollOnce = async (): Promise<boolean> => {
      const attemptNum = retryCountRef.current + 1
      const elapsedTime = Math.round((Date.now() - parseInt(pollingId.split('_')[2])) / 1000)
      console.log(`🔄 [${pollingId}] FRONTEND: Making OPTIMIZED polling request (attempt ${attemptNum}, ${elapsedTime}s elapsed)`)

      try {
        const requestBody = {
          generationId,
          gcsOutputDirectory,
          provider,
          taskId
        }

        console.log(`📤 [${pollingId}] FRONTEND: Sending polling request with body:`, JSON.stringify(requestBody, null, 2))

        const response = await fetch('/api/generate/video/poll', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody)
        })

        console.log(`📨 [${pollingId}] FRONTEND: Polling response status: ${response.status} (${elapsedTime}s elapsed)`)

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const data = await response.json()
        console.log(`📋 [${pollingId}] FRONTEND: Polling response data:`, JSON.stringify(data, null, 2))

        // Reset retry count on successful response
        retryCountRef.current = 0

        if (data.status === 'completed') {
          console.log(`✅ [${pollingId}] FRONTEND: Video generation completed! (${elapsedTime}s total)`)
          cleanupPolling()
          setIsGenerating(false)
          setProgress(100)
          setCurrentStep('Video generation completed!')
          setResult(prev => prev ? { ...prev, ...data } : data)

          // Refresh credits after completion
          loadCredits()

          return true // Stop polling
        } else if (data.status === 'failed') {
          // ENHANCED 404 HANDLING: Check if this is a 404-related failure
          if (data.error && data.error.includes('404')) {
            console.log(`🧹 [${pollingId}] FRONTEND: Got 404 - operation likely completed and cleaned up by Google`)
            console.log(`🧹 [${pollingId}] FRONTEND: Checking database for completion status...`)

            // For 404 errors, check database before marking as failed
            // This handles Google's fast cleanup behavior
            if (elapsedTime < 60) { // Within 60 seconds, treat 404 as "still processing"
              console.log(`⏳ [${pollingId}] FRONTEND: 404 within 60s - treating as potentially completed, continuing polling`)
              setCurrentStep('Video may be completed - checking status...')
              return false // Continue polling
            } else {
              console.log(`❌ [${pollingId}] FRONTEND: 404 after 60s - marking as failed`)
            }
          }

          console.log(`❌ [${pollingId}] FRONTEND: Video generation failed (${elapsedTime}s total)`)
          cleanupPolling()
          setIsGenerating(false)
          setError(data.error || 'Video generation failed')
          return true // Stop polling
        } else {
          // Still processing
          console.log(`⏳ [${pollingId}] FRONTEND: Still processing, progress: ${data.progress} (${elapsedTime}s elapsed)`)
          setProgress(data.progress || Math.min(90, elapsedTime * 3)) // Estimate progress based on time
          setCurrentStep(data.message || `Processing video... (${elapsedTime}s elapsed)`)
          return false // Continue polling
        }

      } catch (error) {
        console.error(`❌ [${pollingId}] FRONTEND: Status polling error (${elapsedTime}s elapsed):`, error)
        retryCountRef.current++

        if (retryCountRef.current >= 8) { // Increased retry limit for Google's fast processing
          console.error(`❌ [${pollingId}] FRONTEND: Max retries (8) reached, stopping polling`)
          cleanupPolling()
          setIsGenerating(false)
          setError('Network error: Unable to check video generation status. Please try again.')
          return true // Stop polling
        }

        console.log(`🔄 [${pollingId}] FRONTEND: Will retry in next polling cycle (${retryCountRef.current}/8)`)
        return false // Continue polling
      }
    }

    // OPTIMIZED POLLING: Immediate first poll with no delay
    console.log(`🚀 [${pollingId}] FRONTEND: Starting IMMEDIATE first poll (0ms delay)`)
    pollOnce().then(shouldStop => {
      if (shouldStop) return

      let pollCount = 0
      const maxFastPolls = 15 // Fast polling for first 15 attempts (15 seconds)

      // Set up AGGRESSIVE interval for Google's fast processing
      const interval = setInterval(async () => {
        pollCount++
        const shouldStop = await pollOnce()

        if (shouldStop && pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current)
          pollingIntervalRef.current = null
          return
        }

        // Implement exponential backoff after fast polling period
        if (pollCount >= maxFastPolls) {
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current)
            pollingIntervalRef.current = null
          }

          // Switch to slower polling (every 5 seconds) after 15 fast polls
          console.log(`⏰ [${pollingId}] FRONTEND: Switching to slower polling (5s interval) after ${maxFastPolls} fast polls`)
          const slowInterval = setInterval(async () => {
            const shouldStop = await pollOnce()
            if (shouldStop && pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current)
              pollingIntervalRef.current = null
            }
          }, 5000) // Slower polling: every 5 seconds

          pollingIntervalRef.current = slowInterval
        }
      }, 1000) // FAST polling: every 1 second for first 15 attempts

      pollingIntervalRef.current = interval
      console.log(`⏰ [${pollingId}] FRONTEND: AGGRESSIVE polling started - 1s interval for first ${maxFastPolls} polls, then 5s interval`)

      // Set timeout for maximum polling duration (5 minutes for Google's fast processing)
      pollingTimeoutRef.current = setTimeout(() => {
        console.log(`⏰ [${pollingId}] FRONTEND: Polling timeout reached (5 minutes) - Google usually completes in seconds`)
        cleanupPolling()
        setIsGenerating(false)
        setError('Video generation timeout - Google Vertex AI usually completes within seconds. Please try again.')
      }, 300000) // 5 minutes (reduced from 15 minutes)
    })
  }, [cleanupPolling, loadCredits])

  const handleCancel = async () => {
    if (result?.generationId && pollingIntervalRef.current) {
      try {
        await fetch(`/api/generate/video/status/${result.generationId}`, {
          method: 'DELETE'
        })

        cleanupPolling()
        setIsGenerating(false)
        setError('Video generation cancelled')

      } catch (error) {
        console.error('Cancel error:', error)
      }
    }
  }

  const canGenerate = prompt && !isGenerating && credits >= getCreditCost()

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center mb-4">
          <PlayIcon className="h-8 w-8 text-primary-600 mr-2" />
          <h1 className="text-3xl font-bold text-gray-900">AI Video Generator</h1>
        </div>
        <p className="text-gray-600">
          Create stunning videos from text descriptions using advanced AI
        </p>
      </div>

      {/* Credit Indicator */}
      <CreditIndicator credits={credits} onRefresh={loadCredits} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Input and Options */}
        <div className="space-y-6">
          {/* Video Prompt */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Video Description</h2>
            <VideoPromptInput
              value={prompt}
              onChange={setPrompt}
              placeholder="Describe the video you want to create..."
              disabled={isGenerating}
            />
          </div>

          {/* Video Options */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Video Options</h2>
            <VideoOptionsPanel
              options={options}
              onChange={handleOptionsChange}
              disabled={isGenerating}
            />
          </div>

          {/* Reference Image Upload */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Reference Image (Optional)</h2>
            <ReferenceImageUpload
              onImageSelect={handleReferenceImage}
              disabled={isGenerating}
            />
          </div>

          {/* Generate Button */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-medium text-gray-700">Credit Cost</h3>
                <p className="text-2xl font-bold text-primary-600">{getCreditCost()} Credits</p>
              </div>
              <button
                onClick={handleGenerate}
                disabled={!canGenerate}
                className="flex items-center px-6 py-3 bg-primary-600 text-white rounded-md font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <SparklesIcon className="h-5 w-5 mr-2" />
                {isGenerating ? 'Generating...' : 'Generate Video'}
              </button>
            </div>
            
            {!canGenerate && credits < getCreditCost() && (
              <div className="text-sm text-red-600">
                Insufficient credits. You need {getCreditCost()} credits but have {credits}.
              </div>
            )}

            {isGenerating && (
              <div className="mt-4">
                <button
                  onClick={handleCancel}
                  className="text-sm text-red-600 hover:text-red-700 underline"
                >
                  Cancel Generation
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Progress and Results */}
        <div className="space-y-6">
          {/* Progress */}
          {isGenerating && (
            <VideoProgress 
              progress={progress}
              estimatedTime={result?.estimatedTime || 60}
              currentStep={currentStep}
              onCancel={handleCancel}
            />
          )}

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-2 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-medium text-red-800">Video Generation Failed</h3>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Success Message */}
          {result && result.success && result.status === 'completed' && (
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <div className="flex">
                <CheckCircleIcon className="h-5 w-5 text-green-400 mr-2 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-medium text-green-800">Video Generated Successfully!</h3>
                  <p className="text-sm text-green-700 mt-1">
                    Used {result.creditsUsed} credits • {result.remainingCredits} remaining
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Result Display */}
          {result && result.videoUrl && (
            <VideoResult
              videoUrl={result.videoUrl}
              prompt={prompt}
              options={options}
              metadata={result.metadata}
              generation={result}
            />
          )}
        </div>
      </div>

      {/* Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <h3 className="text-sm font-medium text-blue-800 mb-2">💡 Tips for best results:</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Be specific and descriptive in your prompts</li>
          <li>• Include details about camera movement, lighting, and mood</li>
          <li>• Use reference images to guide the style and composition</li>
          <li>• Shorter videos (3-5 seconds) generate faster and use fewer resources</li>
          <li>• Experiment with different styles and motion intensities</li>
        </ul>
      </div>
    </div>
  )
}
