'use client'

import { useState } from 'react'
import Image from 'next/image'
import {
  ShareIcon,
  ArrowsPointingOutIcon,
  ClockIcon
} from '@heroicons/react/24/outline'

interface UpscalingResultProps {
  upscaledImageUrl: string
  metadata?: {
    originalSize?: { width: number; height: number; fileSize: number }
    upscaledSize?: { width: number; height: number; fileSize: number }
    scaleFactor?: number
    processingTime?: number
    enhancement?: string
  }
  generation?: any
}

export function UpscalingResult({
  upscaledImageUrl,
  metadata,
  generation
}: UpscalingResultProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Upscaled Image',
          text: `Check out this upscaled image (${metadata?.scaleFactor}x)`,
          url: upscaledImageUrl,
        })
      } catch (error) {
        console.error('Share failed:', error)
      }
    } else {
      try {
        await navigator.clipboard.writeText(upscaledImageUrl)
      } catch (error) {
        console.error('Copy failed:', error)
      }
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatTime = (ms?: number) => {
    if (!ms) return 'Unknown'
    const seconds = Math.round(ms / 1000)
    return seconds < 60 ? `${seconds}s` : `${Math.round(seconds / 60)}m`
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Upscaling Result</h3>
            <button
              onClick={() => setIsFullscreen(true)}
              className="p-1 text-gray-600 hover:text-gray-800"
              title="View fullscreen"
            >
              <ArrowsPointingOutIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Upscaled Image Display */}
        <div className="relative">
          <div className="relative aspect-video bg-gray-100">
            <Image
              src={upscaledImageUrl}
              alt="Upscaled"
              fill
              className="object-contain"
            />
            <div className="absolute bottom-2 left-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-sm">
              Upscaled {metadata?.scaleFactor}x
            </div>
          </div>
        </div>

        {/* Metadata and Actions */}
        <div className="p-6">
          {/* Statistics */}
          {metadata && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 text-sm">
              {metadata.scaleFactor && (
                <div>
                  <span className="text-gray-500">Scale Factor:</span>
                  <span className="ml-1 font-medium">{metadata.scaleFactor}x</span>
                </div>
              )}
              {metadata.originalSize && metadata.upscaledSize && (
                <div>
                  <span className="text-gray-500">Resolution:</span>
                  <span className="ml-1 font-medium">
                    {metadata.originalSize.width}×{metadata.originalSize.height} → {metadata.upscaledSize.width}×{metadata.upscaledSize.height}
                  </span>
                </div>
              )}
              {metadata.originalSize && metadata.upscaledSize && (
                <div>
                  <span className="text-gray-500">File Size:</span>
                  <span className="ml-1 font-medium">
                    {formatFileSize(metadata.originalSize.fileSize)} → {formatFileSize(metadata.upscaledSize.fileSize)}
                  </span>
                </div>
              )}
              {metadata.processingTime && (
                <div className="flex items-center">
                  <ClockIcon className="h-3 w-3 text-gray-400 mr-1" />
                  <span className="text-gray-500">Time:</span>
                  <span className="ml-1 font-medium">{formatTime(metadata.processingTime)}</span>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <div className="text-sm text-gray-500">
              Enhancement: {metadata?.enhancement || 'none'}
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleShare}
                className="flex items-center space-x-1 px-3 py-1 bg-gray-50 text-gray-600 rounded-full text-sm hover:bg-gray-100 transition-colors"
              >
                <ShareIcon className="h-4 w-4" />
                <span>Share</span>
              </button>
              
              {/* Download button removed */}
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen Modal */}
      {isFullscreen && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
          <div className="relative max-w-full max-h-full">
            <Image
              src={upscaledImageUrl}
              alt="Upscaled"
              width={1200}
              height={800}
              className="object-contain max-w-full max-h-full"
            />
            <div className="absolute bottom-4 left-4 bg-black bg-opacity-75 text-white px-3 py-2 rounded">
              Upscaled {metadata?.scaleFactor}x
            </div>
            <button
              onClick={() => setIsFullscreen(false)}
              className="absolute top-4 right-4 bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-2 rounded-full"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  )
}
