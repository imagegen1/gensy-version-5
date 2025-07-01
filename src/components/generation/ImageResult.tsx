'use client'

import { useState } from 'react'
import Image from 'next/image'
import {
  ShareIcon,
  HeartIcon,
  ArrowsPointingOutIcon,
  ClockIcon,
  SparklesIcon,
  DocumentDuplicateIcon
} from '@heroicons/react/24/outline'
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid'

interface ImageResultProps {
  imageUrl: string
  prompt: string
  metadata?: {
    generationTime?: number
    aspectRatio?: string
    style?: string
    quality?: string
    model?: string
  }
  generation?: any
}

export function ImageResult({ 
  imageUrl, 
  prompt, 
  metadata,
  generation 
}: ImageResultProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  // Download functionality removed

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Generated Image',
          text: `Check out this AI-generated image: "${prompt}"`,
          url: imageUrl,
        })
      } catch (error) {
        console.error('Share failed:', error)
      }
    } else {
      // Fallback: copy URL to clipboard
      try {
        await navigator.clipboard.writeText(imageUrl)
        // You could show a toast notification here
      } catch (error) {
        console.error('Copy failed:', error)
      }
    }
  }

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(prompt)
      // You could show a toast notification here
    } catch (error) {
      console.error('Copy failed:', error)
    }
  }

  const formatTime = (ms?: number) => {
    if (!ms) return 'Unknown'
    const seconds = Math.round(ms / 1000)
    return seconds < 60 ? `${seconds}s` : `${Math.round(seconds / 60)}m`
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {/* Image Display */}
        <div className="relative group">
          <div className="aspect-square w-full max-w-2xl mx-auto bg-gray-100">
            <Image
              src={imageUrl}
              alt={prompt}
              width={1024}
              height={1024}
              className="w-full h-full object-contain"
              priority
            />
          </div>
          
          {/* Overlay Actions */}
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
            <button
              onClick={() => setIsFullscreen(true)}
              className="bg-white bg-opacity-90 hover:bg-opacity-100 text-gray-800 p-2 rounded-full shadow-lg transition-all"
            >
              <ArrowsPointingOutIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Image Info and Actions */}
        <div className="p-6">
          {/* Prompt */}
          <div className="mb-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-sm font-medium text-gray-700 mb-1">Prompt</h3>
                <p className="text-gray-900 text-sm leading-relaxed">{prompt}</p>
              </div>
              <button
                onClick={handleCopyPrompt}
                className="ml-2 p-1 text-gray-400 hover:text-gray-600"
                title="Copy prompt"
              >
                <DocumentDuplicateIcon className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Metadata */}
          {metadata && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
              {metadata.style && (
                <div>
                  <span className="text-gray-500">Style:</span>
                  <span className="ml-1 font-medium capitalize">{metadata.style}</span>
                </div>
              )}
              {metadata.aspectRatio && (
                <div>
                  <span className="text-gray-500">Ratio:</span>
                  <span className="ml-1 font-medium">{metadata.aspectRatio}</span>
                </div>
              )}
              {metadata.quality && (
                <div>
                  <span className="text-gray-500">Quality:</span>
                  <span className="ml-1 font-medium capitalize">{metadata.quality}</span>
                </div>
              )}
              {metadata.generationTime && (
                <div className="flex items-center">
                  <ClockIcon className="h-3 w-3 text-gray-400 mr-1" />
                  <span className="text-gray-500">Time:</span>
                  <span className="ml-1 font-medium">{formatTime(metadata.generationTime)}</span>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setIsLiked(!isLiked)}
                className={`flex items-center space-x-1 px-3 py-1 rounded-full text-sm transition-colors ${
                  isLiked 
                    ? 'bg-red-50 text-red-600' 
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                {isLiked ? (
                  <HeartIconSolid className="h-4 w-4" />
                ) : (
                  <HeartIcon className="h-4 w-4" />
                )}
                <span>{isLiked ? 'Liked' : 'Like'}</span>
              </button>
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
              src={imageUrl}
              alt={prompt}
              width={1024}
              height={1024}
              className="max-w-full max-h-full object-contain"
            />
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
