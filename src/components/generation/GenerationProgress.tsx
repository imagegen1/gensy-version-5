'use client'

import { useState, useEffect } from 'react'
import { SparklesIcon, ClockIcon } from '@heroicons/react/24/outline'

interface GenerationProgressProps {
  estimatedTime?: number // in seconds
  onCancel?: () => void
}

export function GenerationProgress({ 
  estimatedTime = 30, 
  onCancel 
}: GenerationProgressProps) {
  const [progress, setProgress] = useState(0)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [currentStep, setCurrentStep] = useState(0)

  const steps = [
    'Analyzing your prompt...',
    'Preparing AI model...',
    'Generating image...',
    'Processing result...',
    'Almost done...'
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTime(prev => prev + 1)
      
      // Simulate progress based on elapsed time
      const progressPercent = Math.min((elapsedTime / estimatedTime) * 100, 95)
      setProgress(progressPercent)
      
      // Update current step based on progress
      const stepIndex = Math.floor((progressPercent / 100) * steps.length)
      setCurrentStep(Math.min(stepIndex, steps.length - 1))
    }, 1000)

    return () => clearInterval(interval)
  }, [elapsedTime, estimatedTime, steps.length])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="text-center">
        {/* Animated Icon */}
        <div className="flex justify-center mb-4">
          <div className="relative">
            <SparklesIcon className="h-12 w-12 text-primary-600 animate-pulse" />
            <div className="absolute inset-0 h-12 w-12 border-2 border-primary-200 rounded-full animate-spin border-t-primary-600"></div>
          </div>
        </div>

        {/* Progress Text */}
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Creating your image...
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          {steps[currentStep]}
        </p>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
          <div 
            className="bg-primary-600 h-2 rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Progress Stats */}
        <div className="flex items-center justify-center space-x-4 text-sm text-gray-500 mb-4">
          <div className="flex items-center">
            <ClockIcon className="h-4 w-4 mr-1" />
            <span>{formatTime(elapsedTime)} elapsed</span>
          </div>
          <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
          <div>
            <span>{Math.round(progress)}% complete</span>
          </div>
          {estimatedTime > elapsedTime && (
            <>
              <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
              <div>
                <span>~{formatTime(estimatedTime - elapsedTime)} remaining</span>
              </div>
            </>
          )}
        </div>

        {/* Cancel Button */}
        {onCancel && (
          <button
            onClick={onCancel}
            className="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            Cancel generation
          </button>
        )}
      </div>

      {/* Fun Facts */}
      <div className="mt-6 p-4 bg-blue-50 rounded-md">
        <h4 className="text-sm font-medium text-blue-800 mb-2">💡 Did you know?</h4>
        <p className="text-sm text-blue-700">
          Our AI processes millions of parameters to understand your prompt and create a unique image just for you!
        </p>
      </div>
    </div>
  )
}
