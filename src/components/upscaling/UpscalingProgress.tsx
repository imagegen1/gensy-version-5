'use client'

import { useState, useEffect } from 'react'
import { ArrowUpIcon, ClockIcon } from '@heroicons/react/24/outline'

interface UpscalingProgressProps {
  estimatedTime?: number // in seconds
  currentStep?: string
  onCancel?: () => void
}

export function UpscalingProgress({ 
  estimatedTime = 30,
  currentStep = 'Processing image...',
  onCancel 
}: UpscalingProgressProps) {
  const [progress, setProgress] = useState(0)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [stepIndex, setStepIndex] = useState(0)

  const steps = [
    'Analyzing image...',
    'Preparing upscaling...',
    'Processing enhancement...',
    'Applying filters...',
    'Finalizing result...'
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTime(prev => prev + 1)
      
      // Simulate progress based on elapsed time
      const progressPercent = Math.min((elapsedTime / estimatedTime) * 100, 95)
      setProgress(progressPercent)
      
      // Update current step based on progress
      const newStepIndex = Math.floor((progressPercent / 100) * steps.length)
      setStepIndex(Math.min(newStepIndex, steps.length - 1))
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
            <ArrowUpIcon className="h-12 w-12 text-blue-600 animate-pulse" />
            <div className="absolute inset-0 h-12 w-12 border-2 border-blue-200 rounded-full animate-spin border-t-blue-600"></div>
          </div>
        </div>

        {/* Progress Text */}
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Upscaling your image...
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          {currentStep || steps[stepIndex]}
        </p>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
          <div
            className="bg-blue-600 h-3 rounded-full transition-all duration-1000 ease-out relative overflow-hidden"
            style={{ width: `${progress}%` }}
          >
            {/* Animated shine effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-pulse"></div>
          </div>
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

        {/* Step Indicators */}
        <div className="flex justify-center space-x-2 mb-4">
          {steps.map((step, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-colors ${
                index <= stepIndex ? 'bg-blue-500' : 'bg-gray-300'
              }`}
              title={step}
            />
          ))}
        </div>

        {/* Cancel Button */}
        {onCancel && (
          <button
            onClick={onCancel}
            className="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            Cancel upscaling
          </button>
        )}
      </div>

      {/* Processing Info */}
      <div className="mt-6 p-4 bg-blue-50 rounded-md">
        <h4 className="text-sm font-medium text-blue-800 mb-2">💡 Processing Information</h4>
        <div className="text-sm text-blue-700 space-y-1">
          <p>• Higher scale factors require more processing time</p>
          <p>• AI enhancement adds additional analysis steps</p>
          <p>• Large images may take longer to process</p>
        </div>
      </div>
    </div>
  )
}
