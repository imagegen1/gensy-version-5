'use client'

import { useState, useEffect } from 'react'
import { PlayIcon, ClockIcon, XMarkIcon } from '@heroicons/react/24/outline'

interface VideoProgressProps {
  progress: number // 0-100
  estimatedTime?: number // in seconds
  currentStep?: string
  onCancel?: () => void
}

export function VideoProgress({ 
  progress,
  estimatedTime = 60,
  currentStep = 'Processing video...',
  onCancel 
}: VideoProgressProps) {
  const [elapsedTime, setElapsedTime] = useState(0)
  const [stepIndex, setStepIndex] = useState(0)

  const steps = [
    'Analyzing prompt...',
    'Preparing video generation...',
    'Rendering frames...',
    'Processing motion...',
    'Applying effects...',
    'Finalizing video...'
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTime(prev => prev + 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    // Update current step based on progress
    const newStepIndex = Math.floor((progress / 100) * steps.length)
    setStepIndex(Math.min(newStepIndex, steps.length - 1))
  }, [progress, steps.length])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`
  }

  const getRemainingTime = () => {
    if (progress === 0) return estimatedTime
    const estimatedTotal = (elapsedTime / progress) * 100
    return Math.max(0, Math.round(estimatedTotal - elapsedTime))
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="text-center">
        {/* Animated Icon */}
        <div className="flex justify-center mb-4">
          <div className="relative">
            <PlayIcon className="h-12 w-12 text-primary-600 animate-pulse" />
            <div className="absolute inset-0 h-12 w-12 border-2 border-primary-200 rounded-full animate-spin border-t-primary-600"></div>
          </div>
        </div>

        {/* Progress Text */}
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Generating your video...
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          {currentStep || steps[stepIndex]}
        </p>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-4 mb-4 overflow-hidden">
          <div 
            className="bg-gradient-to-r from-primary-500 to-primary-600 h-4 rounded-full transition-all duration-1000 ease-out relative"
            style={{ width: `${Math.max(progress, 5)}%` }}
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
          {progress > 0 && getRemainingTime() > 0 && (
            <>
              <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
              <div>
                <span>~{formatTime(getRemainingTime())} remaining</span>
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
                index <= stepIndex ? 'bg-primary-500' : 'bg-gray-300'
              }`}
              title={step}
            />
          ))}
        </div>

        {/* Cancel Button */}
        {onCancel && (
          <button
            onClick={onCancel}
            className="flex items-center justify-center mx-auto text-sm text-red-600 hover:text-red-700 underline"
          >
            <XMarkIcon className="h-4 w-4 mr-1" />
            Cancel Generation
          </button>
        )}
      </div>

      {/* Processing Info */}
      <div className="mt-6 p-4 bg-blue-50 rounded-md">
        <h4 className="text-sm font-medium text-blue-800 mb-2">🎬 Video Generation Process:</h4>
        <div className="text-sm text-blue-700 space-y-1">
          <div className="flex justify-between">
            <span>Current Step:</span>
            <span className="font-medium">{stepIndex + 1} of {steps.length}</span>
          </div>
          <div className="flex justify-between">
            <span>Progress:</span>
            <span className="font-medium">{Math.round(progress)}%</span>
          </div>
          <div className="flex justify-between">
            <span>Estimated Total:</span>
            <span className="font-medium">{formatTime(estimatedTime)}</span>
          </div>
        </div>
      </div>

      {/* Tips */}
      <div className="mt-4 p-4 bg-yellow-50 rounded-md">
        <h4 className="text-sm font-medium text-yellow-800 mb-2">💡 While you wait:</h4>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>• Video generation can take 1-3 minutes depending on complexity</li>
          <li>• Higher quality settings take longer to process</li>
          <li>• You can close this tab and return later - we'll save your progress</li>
          <li>• Try different prompts and styles for varied results</li>
        </ul>
      </div>

      {/* Progress Animation */}
      <div className="mt-4 flex justify-center space-x-1">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2 h-2 bg-primary-400 rounded-full animate-bounce"
            style={{
              animationDelay: `${i * 0.2}s`,
              animationDuration: '1s'
            }}
          />
        ))}
      </div>
    </div>
  )
}
