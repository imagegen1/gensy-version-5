'use client'

import React, { useState } from 'react'
import { 
  PlayIcon,
  SparklesIcon,
  ClockIcon,
  XMarkIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline'
import { VideoOptionsPanel } from './VideoOptionsPanel'
import { VideoProgress } from './VideoProgress'
import { VideoResult } from './VideoResult'
import { useAuth } from '@clerk/nextjs'

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
  jobId?: string
  status?: 'processing' | 'completed' | 'failed'
  videoUrl?: string
  metadata?: any
  creditsUsed?: number
  remainingCredits?: number
  error?: string
  estimatedTime?: number
}

interface ImageToVideoConverterProps {
  imageUrl: string
  imagePrompt: string
  imageMetadata?: any
  onClose: () => void
  onVideoGenerated?: (video: VideoGenerationResult) => void
}

export function ImageToVideoConverter({
  imageUrl,
  imagePrompt,
  imageMetadata,
  onClose,
  onVideoGenerated
}: ImageToVideoConverterProps) {
  const { userId } = useAuth()
  const [prompt, setPrompt] = useState(`Animate this image: ${imagePrompt}`)
  const [options, setOptions] = useState<VideoGenerationOptions>({
    duration: 5,
    aspectRatio: imageMetadata?.aspectRatio || '16:9',
    style: imageMetadata?.style || 'realistic',
    quality: 'standard',
    provider: 'google-veo',
    motionIntensity: 'medium',
    frameRate: 24,
    referenceImage: imageUrl
  })
  const [isGenerating, setIsGenerating] = useState(false)
  const [result, setResult] = useState<VideoGenerationResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState('')
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null)
  const [showOptions, setShowOptions] = useState(false)

  const handleOptionsChange = (newOptions: Partial<VideoGenerationOptions>) => {
    setOptions(prev => ({ ...prev, ...newOptions }))
  }

  const getCreditCost = () => {
    return 5 // Video generation costs 5 credits
  }

  const handleGenerate = async () => {
    if (!prompt || isGenerating) return

    setIsGenerating(true)
    setError(null)
    setResult(null)
    setProgress(0)
    setCurrentStep('Initializing video generation from image...')

    try {
      const response = await fetch('/api/generate/video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          ...options,
          sourceType: 'image-to-video',
          sourceImageUrl: imageUrl,
          sourceImagePrompt: imagePrompt
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Video generation failed')
      }

      setResult(data)

      // If processing, start polling for status
      if (data.status === 'processing' && data.generationId && data.operationName) {
        startStatusPolling(data.generationId, data.operationName)
      } else if (data.status === 'completed') {
        setIsGenerating(false)
        setProgress(100)
        setCurrentStep('Video generation completed!')
        if (onVideoGenerated) {
          onVideoGenerated(data)
        }
      }

    } catch (error) {
      console.error('Video generation error:', error)
      setError(error instanceof Error ? error.message : 'Video generation failed')
      setIsGenerating(false)
    }
  }

  const startStatusPolling = (generationId: string, operationName: string) => {
    setCurrentStep('Processing video from image...')

    const interval = setInterval(async () => {
      try {
        const response = await fetch('/api/generate/video/poll', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            generationId,
            operationName
          })
        })
        const data = await response.json()

        if (data.status === 'completed') {
          clearInterval(interval)
          setPollingInterval(null)
          setIsGenerating(false)
          setProgress(100)
          setCurrentStep('Video generation completed!')
          setResult(prev => prev ? { ...prev, ...data } : data)
          if (onVideoGenerated) {
            onVideoGenerated(data)
          }
        } else if (data.status === 'failed') {
          clearInterval(interval)
          setPollingInterval(null)
          setIsGenerating(false)
          setError(data.error || 'Video generation failed')
        } else {
          // Still processing
          setProgress(data.progress || 0)
          setCurrentStep(data.message || 'Processing video...')
        }

      } catch (error) {
        console.error('Status polling error:', error)
      }
    }, 3000) // Poll every 3 seconds

    setPollingInterval(interval)

    // Clear interval after 15 minutes
    setTimeout(() => {
      if (interval) {
        clearInterval(interval)
        setPollingInterval(null)
        setIsGenerating(false)
        setError('Video generation timeout')
      }
    }, 900000) // 15 minutes
  }

  const handleCancel = async () => {
    if (result?.generationId && pollingInterval) {
      try {
        await fetch(`/api/generate/video/status/${result.generationId}`, {
          method: 'DELETE'
        })
        
        clearInterval(pollingInterval)
        setPollingInterval(null)
        setIsGenerating(false)
        setError('Video generation cancelled')
        
      } catch (error) {
        console.error('Cancel error:', error)
      }
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <PlayIcon className="h-6 w-6 text-primary-600" />
            <h2 className="text-xl font-semibold text-gray-900">Generate Video from Image</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Source Image Preview */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Source Image</h3>
            <div className="flex space-x-4">
              <div className="w-32 h-32 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                <img
                  src={imageUrl}
                  alt="Source image"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-600 mb-2">Original Prompt:</p>
                <p className="text-sm text-gray-900 bg-white p-3 rounded border">{imagePrompt}</p>
              </div>
            </div>
          </div>

          {/* Video Prompt */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Video Description
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe how you want to animate this image..."
              disabled={isGenerating}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              rows={3}
            />
          </div>

          {/* Options Toggle */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowOptions(!showOptions)}
              className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              <Cog6ToothIcon className="h-4 w-4" />
              <span>{showOptions ? 'Hide' : 'Show'} Advanced Options</span>
            </button>
            <div className="text-sm text-gray-600">
              Cost: <span className="font-medium text-primary-600">{getCreditCost()} credits</span>
            </div>
          </div>

          {/* Video Options */}
          {showOptions && (
            <div className="bg-gray-50 rounded-lg p-4">
              <VideoOptionsPanel
                options={options}
                onChange={handleOptionsChange}
                disabled={isGenerating}
              />
            </div>
          )}

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
                <svg className="h-5 w-5 text-red-400 mr-2 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h3 className="text-sm font-medium text-red-800">Video Generation Failed</h3>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
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

          {/* Action Buttons */}
          {!result?.videoUrl && (
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerate}
                disabled={!prompt || isGenerating}
                className="flex items-center px-6 py-2 bg-primary-600 text-white rounded-md font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <SparklesIcon className="h-4 w-4 mr-2" />
                {isGenerating ? 'Generating...' : 'Generate Video'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
