'use client'

import { useState, useCallback, useEffect } from 'react'
import { useAuth } from '@clerk/nextjs'
import { useDropzone } from 'react-dropzone'
import { 
  ArrowUpIcon,
  PhotoIcon,
  SparklesIcon,
  ArrowDownTrayIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { ImageDropzone } from './ImageDropzone'
import { ImagePreview } from './ImagePreview'
import { ScaleFactorSelector } from './ScaleFactorSelector'
import { EnhancementSelector } from './EnhancementSelector'
import { UpscalingProgress } from './UpscalingProgress'
import { UpscalingResult } from './UpscalingResult'
import { CreditIndicator } from '../generation/CreditIndicator'

interface UpscalingOptions {
  scaleFactor: number
  enhancement: 'none' | 'denoise' | 'sharpen' | 'colorize' | 'ai-enhanced'
  outputFormat: 'png' | 'jpeg' | 'webp'
  quality: number
}

interface UpscalingResultData {
  success: boolean
  generation?: any
  imageUrl?: string
  metadata?: any
  creditsUsed?: number
  remainingCredits?: number
  error?: string
}

export function ImageUpscaler() {
  const { userId } = useAuth()
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [options, setOptions] = useState<UpscalingOptions>({
    scaleFactor: 2,
    enhancement: 'none',
    outputFormat: 'png',
    quality: 90
  })
  const [isUpscaling, setIsUpscaling] = useState(false)
  const [result, setResult] = useState<UpscalingResultData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [credits, setCredits] = useState<number>(0)

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

  // Load credits on mount
  useEffect(() => {
    loadCredits()
  }, [loadCredits])

  const handleImageSelect = (file: File) => {
    setSelectedImage(file)
    setResult(null)
    setError(null)
  }

  const handleImageRemove = () => {
    setSelectedImage(null)
    setResult(null)
    setError(null)
  }

  const handleOptionsChange = (newOptions: Partial<UpscalingOptions>) => {
    setOptions(prev => ({ ...prev, ...newOptions }))
  }

  const getCreditCost = () => {
    return options.enhancement === 'ai-enhanced' ? 3 : 2
  }

  const handleUpscale = async () => {
    if (!selectedImage || isUpscaling) return

    setIsUpscaling(true)
    setError(null)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append('image', selectedImage)
      formData.append('scaleFactor', options.scaleFactor.toString())
      formData.append('enhancement', options.enhancement)
      formData.append('outputFormat', options.outputFormat)
      formData.append('quality', options.quality.toString())

      const response = await fetch('/api/upscale/image', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Upscaling failed')
      }

      setResult(data)
      if (data.remainingCredits !== undefined) {
        setCredits(data.remainingCredits)
      }

    } catch (error) {
      console.error('Upscaling error:', error)
      setError(error instanceof Error ? error.message : 'Upscaling failed')
    } finally {
      setIsUpscaling(false)
    }
  }

  const canUpscale = selectedImage && !isUpscaling && credits >= getCreditCost()

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center mb-4">
          <ArrowUpIcon className="h-8 w-8 text-blue-600 mr-2" />
          <h1 className="text-3xl font-bold text-gray-900">AI Image Upscaler</h1>
        </div>
        <p className="text-gray-600">
          Enhance and upscale your images using advanced AI technology
        </p>
      </div>

      {/* Credit Indicator */}
      <CreditIndicator credits={credits} onRefresh={loadCredits} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Upload and Options */}
        <div className="space-y-6">
          {/* Image Upload */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Upload Image</h2>
            
            {!selectedImage ? (
              <ImageDropzone
                onImageSelect={handleImageSelect}
                acceptedFormats={['image/jpeg', 'image/png', 'image/webp']}
                maxSize={50 * 1024 * 1024} // 50MB
                disabled={isUpscaling}
              />
            ) : (
              <ImagePreview
                image={selectedImage}
                onRemove={handleImageRemove}
                disabled={isUpscaling}
              />
            )}
          </div>

          {/* Upscaling Options */}
          {selectedImage && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Upscaling Options</h2>
              
              <div className="space-y-4">
                <ScaleFactorSelector
                  value={options.scaleFactor}
                  onChange={(scaleFactor) => handleOptionsChange({ scaleFactor })}
                  disabled={isUpscaling}
                />

                <EnhancementSelector
                  value={options.enhancement}
                  onChange={(enhancement) => handleOptionsChange({ enhancement })}
                  disabled={isUpscaling}
                />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Output Format
                    </label>
                    <select
                      value={options.outputFormat}
                      onChange={(e) => handleOptionsChange({ outputFormat: e.target.value as any })}
                      disabled={isUpscaling}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                    >
                      <option value="png">PNG (Lossless)</option>
                      <option value="jpeg">JPEG (Smaller size)</option>
                      <option value="webp">WebP (Modern)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quality: {options.quality}%
                      {options.outputFormat === 'png' && (
                        <span className="text-xs text-gray-500 ml-2">(PNG is lossless)</span>
                      )}
                    </label>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      step="5"
                      value={options.quality}
                      onChange={(e) => handleOptionsChange({ quality: parseInt(e.target.value) })}
                      disabled={isUpscaling}
                      className={`w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider ${
                        options.outputFormat === 'png' ? 'opacity-50' : ''
                      }`}
                    />
                    {options.outputFormat === 'png' && (
                      <p className="text-xs text-gray-500 mt-1">
                        Quality setting doesn't affect PNG files as they use lossless compression
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Button */}
          {selectedImage && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-700">Credit Cost</h3>
                  <p className="text-2xl font-bold text-blue-600">{getCreditCost()} Credits</p>
                </div>
                <button
                  onClick={handleUpscale}
                  disabled={!canUpscale}
                  className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <SparklesIcon className="h-5 w-5 mr-2" />
                  {isUpscaling ? 'Upscaling...' : 'Upscale Image'}
                </button>
              </div>
              
              {!canUpscale && credits < getCreditCost() && (
                <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                  Insufficient credits. You need {getCreditCost()} credits but have {credits}.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column - Progress and Results */}
        <div className="space-y-6">
          {/* Progress */}
          {isUpscaling && (
            <UpscalingProgress 
              estimatedTime={30}
              currentStep="Processing image..."
            />
          )}

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-2 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-medium text-red-800">Upscaling Failed</h3>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Success Message */}
          {result && result.success && (
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <div className="flex">
                <CheckCircleIcon className="h-5 w-5 text-green-400 mr-2 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-medium text-green-800">Image Upscaled Successfully!</h3>
                  <p className="text-sm text-green-700 mt-1">
                    Used {result.creditsUsed} credits • {result.remainingCredits} remaining
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Result Display */}
          {result && result.imageUrl && (
            <UpscalingResult
              upscaledImageUrl={result.imageUrl}
              metadata={result.metadata}
              generation={result.generation}
            />
          )}
        </div>
      </div>

      {/* Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <h3 className="text-sm font-medium text-blue-800 mb-2">💡 Tips for best results:</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Use high-quality source images for better upscaling results</li>
          <li>• Choose PNG format for images with text or sharp edges</li>
          <li>• Use JPEG for photographs to reduce file size</li>
          <li>• AI enhancement works best on natural images and photographs</li>
          <li>• Higher scale factors take more time to process</li>
        </ul>
      </div>
    </div>
  )
}
