'use client'

import React, { useState } from 'react'
import { 
  PlayIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  ShareIcon,
  TrashIcon,
  HeartIcon,
  ClockIcon,
  SparklesIcon
} from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid'
import { ImageToVideoConverter } from '../video/ImageToVideoConverter'

interface ImageData {
  id: string
  url: string
  prompt: string
  metadata?: {
    style?: string
    aspectRatio?: string
    model?: string
    seed?: number
    quality?: string
    [key: string]: any
  }
  created_at: string
  isLiked?: boolean
}

interface EnhancedImageCardProps {
  image: ImageData
  onImageClick?: (image: ImageData) => void
  onVideoGenerated?: (video: any) => void
  onLike?: (imageId: string) => void
  onDelete?: (imageId: string) => void
  onShare?: (image: ImageData) => void
  onDownload?: (image: ImageData) => void
  showActions?: boolean
  className?: string
}

export function EnhancedImageCard({
  image,
  onImageClick,
  onVideoGenerated,
  onLike,
  onDelete,
  onShare,
  onDownload,
  showActions = true,
  className = ''
}: EnhancedImageCardProps) {
  const [showVideoConverter, setShowVideoConverter] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleVideoGenerated = (video: any) => {
    setShowVideoConverter(false)
    if (onVideoGenerated) {
      onVideoGenerated(video)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStyleIcon = (style?: string) => {
    const styleIcons: { [key: string]: string } = {
      realistic: '📸',
      artistic: '🎨',
      cartoon: '🎭',
      abstract: '🌀',
      photographic: '📷',
      cinematic: '🎬',
      vintage: '📻',
      watercolor: '🎨'
    }
    return styleIcons[style || 'realistic'] || '🎨'
  }

  return (
    <>
      <div
        className={`group relative bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden transition-all duration-200 hover:shadow-md ${className}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Image Container */}
        <div className="relative aspect-square bg-gray-100">
          <img
            src={image.url}
            alt={image.prompt}
            className="w-full h-full object-cover cursor-pointer transition-transform duration-200 group-hover:scale-105"
            onClick={() => onImageClick?.(image)}
            loading="lazy"
          />

          {/* Overlay Actions */}
          {showActions && isHovered && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <div className="flex items-center space-x-2">
                {/* View Full Size */}
                <button
                  onClick={() => onImageClick?.(image)}
                  className="p-2 bg-white/20 hover:bg-white/30 text-white rounded-full backdrop-blur-sm transition-colors"
                  title="View full size"
                >
                  <EyeIcon className="h-5 w-5" />
                </button>

                {/* Generate Video */}
                <button
                  onClick={() => setShowVideoConverter(true)}
                  className="p-2 bg-primary-600/80 hover:bg-primary-600 text-white rounded-full backdrop-blur-sm transition-colors"
                  title="Generate video from this image"
                >
                  <PlayIcon className="h-5 w-5" />
                </button>

                {/* Download */}
                {onDownload && (
                  <button
                    onClick={() => onDownload(image)}
                    className="p-2 bg-white/20 hover:bg-white/30 text-white rounded-full backdrop-blur-sm transition-colors"
                    title="Download image"
                  >
                    <ArrowDownTrayIcon className="h-5 w-5" />
                  </button>
                )}

                {/* Share */}
                {onShare && (
                  <button
                    onClick={() => onShare(image)}
                    className="p-2 bg-white/20 hover:bg-white/30 text-white rounded-full backdrop-blur-sm transition-colors"
                    title="Share image"
                  >
                    <ShareIcon className="h-5 w-5" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Style Badge */}
          {image.metadata?.style && (
            <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
              <span className="mr-1">{getStyleIcon(image.metadata.style)}</span>
              {image.metadata.style}
            </div>
          )}

          {/* Like Button */}
          {onLike && (
            <button
              onClick={() => onLike(image.id)}
              className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-full backdrop-blur-sm transition-colors"
              title={image.isLiked ? 'Unlike' : 'Like'}
            >
              {image.isLiked ? (
                <HeartSolidIcon className="h-4 w-4 text-red-500" />
              ) : (
                <HeartIcon className="h-4 w-4" />
              )}
            </button>
          )}
        </div>

        {/* Image Info */}
        <div className="p-4">
          {/* Prompt */}
          <p className="text-sm text-gray-900 line-clamp-2 mb-2" title={image.prompt}>
            {image.prompt}
          </p>

          {/* Metadata */}
          <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
            <div className="flex items-center space-x-2">
              <ClockIcon className="h-3 w-3" />
              <span>{formatDate(image.created_at)}</span>
            </div>
            {image.metadata?.model && (
              <span className="bg-gray-100 px-2 py-1 rounded">
                {image.metadata.model}
              </span>
            )}
          </div>

          {/* Action Buttons */}
          {showActions && (
            <div className="flex items-center justify-between">
              <button
                onClick={() => setShowVideoConverter(true)}
                className="flex items-center space-x-1 px-3 py-1.5 bg-primary-50 hover:bg-primary-100 text-primary-700 text-xs font-medium rounded-full transition-colors"
              >
                <PlayIcon className="h-3 w-3" />
                <span>Make Video</span>
              </button>

              <div className="flex items-center space-x-1">
                {/* Additional metadata */}
                {image.metadata?.aspectRatio && (
                  <span className="text-xs text-gray-400">
                    {image.metadata.aspectRatio}
                  </span>
                )}
                
                {onDelete && (
                  <button
                    onClick={() => onDelete(image.id)}
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                    title="Delete image"
                  >
                    <TrashIcon className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
            <div className="flex items-center space-x-2 text-primary-600">
              <div className="w-4 h-4 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm font-medium">Processing...</span>
            </div>
          </div>
        )}
      </div>

      {/* Video Converter Modal */}
      {showVideoConverter && (
        <ImageToVideoConverter
          imageUrl={image.url}
          imagePrompt={image.prompt}
          imageMetadata={image.metadata}
          onClose={() => setShowVideoConverter(false)}
          onVideoGenerated={handleVideoGenerated}
        />
      )}
    </>
  )
}
