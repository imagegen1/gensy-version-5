'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@clerk/nextjs'
import { z } from 'zod'
import { 
  SparklesIcon, 
  PhotoIcon, 
  ArrowDownTrayIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'
import { PromptInput } from './PromptInput'
import { GenerationOptions } from './GenerationOptions'
import { GenerationProgress } from './GenerationProgress'
import { ImageResult } from './ImageResult'
import { CreditIndicator } from './CreditIndicator'

interface GenerationResult {
  success: boolean
  generation?: any
  imageUrl?: string
  metadata?: any
  creditsUsed?: number
  remainingCredits?: number
  error?: string
}

interface GenerationOptions {
  aspectRatio: '1:1' | '16:9' | '9:16' | '4:3' | '3:4'
  style: 'realistic' | 'artistic' | 'cartoon' | 'abstract' | 'photographic'
  quality: 'standard' | 'high' | 'ultra'
  guidanceScale: number
}

export function ImageGenerator() {
  const { userId } = useAuth()
  const [prompt, setPrompt] = useState('')
  const [negativePrompt, setNegativePrompt] = useState('')
  const [options, setOptions] = useState<GenerationOptions>({
    aspectRatio: '1:1',
    style: 'realistic',
    quality: 'standard',
    guidanceScale: 7
  })
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationResult, setGenerationResult] = useState<GenerationResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [credits, setCredits] = useState<number>(0)

  // Load user credits
  useEffect(() => {
    if (userId) {
      loadCredits()
    }
  }, [userId])

  const loadCredits = async () => {
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

  const handleGenerate = async () => {
    // Validate prompt length (API requires minimum 3 characters)
    if (!prompt.trim() || prompt.trim().length < 3 || isGenerating) {
      setError('Please enter a prompt with at least 3 characters')
      return
    }

    // Validate prompt length (API has maximum 1000 characters)
    if (prompt.trim().length > 1000) {
      setError('Prompt must be less than 1000 characters')
      return
    }

    setIsGenerating(true)
    setError(null)
    setGenerationResult(null)

    try {
      const response = await fetch('/api/generate/image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          negativePrompt: negativePrompt.trim() || undefined,
          ...options
        }),
      })

      let data
      try {
        data = await response.json()
      } catch (parseError) {
        console.error('Failed to parse response:', parseError)
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      if (!response.ok) {
        // Handle validation errors with more specific messages
        if (data.details && Array.isArray(data.details)) {
          const validationErrors = data.details.map((detail: any) => detail.message).join(', ')
          throw new Error(`Validation error: ${validationErrors}`)
        }
        throw new Error(data.error || 'Generation failed')
      }

      setGenerationResult(data)
      if (data.remainingCredits !== undefined) {
        setCredits(data.remainingCredits)
      }

    } catch (error) {
      console.error('Generation error:', error)
      setError(error instanceof Error ? error.message : 'Generation failed')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleRegenerate = () => {
    if (generationResult) {
      setGenerationResult(null)
      handleGenerate()
    }
  }

  const canGenerate = prompt.trim().length >= 3 && !isGenerating && credits > 0

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center mb-4">
          <SparklesIcon className="h-8 w-8 text-primary-600 mr-2" />
          <h1 className="text-3xl font-bold text-gray-900">AI Image Generator</h1>
        </div>
        <p className="text-gray-600">
          Create stunning images from text descriptions using advanced AI
        </p>
      </div>

      {/* Credit Indicator */}
      <CreditIndicator credits={credits} onRefresh={loadCredits} />

      {/* Main Generation Interface */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {/* Prompt Input */}
        <div className="space-y-4">
          <PromptInput
            prompt={prompt}
            onPromptChange={setPrompt}
            negativePrompt={negativePrompt}
            onNegativePromptChange={setNegativePrompt}
            disabled={isGenerating}
          />

          {/* Generation Options */}
          <GenerationOptions
            options={options}
            onOptionsChange={setOptions}
            disabled={isGenerating}
          />

          {/* Generate Button */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              {prompt.length}/1000 characters
            </div>
            <div className="flex space-x-3">
              {generationResult && (
                <button
                  onClick={handleRegenerate}
                  disabled={!canGenerate}
                  className="flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ArrowPathIcon className="h-4 w-4 mr-2" />
                  Regenerate
                </button>
              )}
              <button
                onClick={handleGenerate}
                disabled={!canGenerate}
                className="flex items-center px-6 py-2 bg-primary-600 text-white rounded-md font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <SparklesIcon className="h-4 w-4 mr-2" />
                {isGenerating ? 'Generating...' : 'Generate Image'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Generation Progress */}
      {isGenerating && (
        <GenerationProgress />
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-2 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-red-800">Generation Failed</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Generation Result */}
      {generationResult && generationResult.success && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-4">
          <div className="flex">
            <CheckCircleIcon className="h-5 w-5 text-green-400 mr-2 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-green-800">Image Generated Successfully!</h3>
              <p className="text-sm text-green-700 mt-1">
                Used {generationResult.creditsUsed} credits • {generationResult.remainingCredits} remaining
              </p>
            </div>
          </div>
        </div>
      )}

      {generationResult && generationResult.imageUrl && (
        <ImageResult
          imageUrl={generationResult.imageUrl}
          prompt={prompt}
          metadata={generationResult.metadata}
          generation={generationResult.generation}
        />
      )}

      {/* Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <h3 className="text-sm font-medium text-blue-800 mb-2">💡 Tips for better results:</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Be specific about style, lighting, and composition</li>
          <li>• Include details about colors, mood, and atmosphere</li>
          <li>• Use negative prompts to exclude unwanted elements</li>
          <li>• Try different aspect ratios for different use cases</li>
        </ul>
      </div>
    </div>
  )
}
