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
  VideoCameraIcon
} from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid'

// Helper function to get proxied video URL
const getProxiedVideoUrl = (generationId: string): string => {
  return `/api/video/proxy?id=${encodeURIComponent(generationId)}`
}

interface VideoData {
  id: string
  url: string
  prompt: string
  metadata?: {
    duration?: number
    aspectRatio?: string
    style?: string
    quality?: string
    provider?: string
    resolution?: { width: number; height: number }
    [key: string]: any
  }
  created_at: string
  isLiked?: boolean
  thumbnail?: string
  duration?: number
}

interface VideoCardProps {
  video: VideoData
  onVideoClick?: (video: VideoData) => void
  onLike?: (videoId: string) => void
  onDelete?: (videoId: string) => void
  onShare?: (video: VideoData) => void
  onDownload?: (video: VideoData) => void
  showActions?: boolean
  className?: string
}

export function VideoCard({
  video,
  onVideoClick,
  onLike,
  onDelete,
  onShare,
  onDownload,
  showActions = true,
  className = ''
}: VideoCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [videoError, setVideoError] = useState(false)

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDuration = (seconds: number) => {
    if (seconds < 60) {
      return `${seconds}s`
    }
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const getStyleIcon = (style?: string) => {
    const styleIcons: { [key: string]: string } = {
      realistic: '📸',
      artistic: '🎨',
      cartoon: '🎭',
      cinematic: '🎬',
      documentary: '📹'
    }
    return styleIcons[style || 'realistic'] || '🎬'
  }

  const getQualityBadge = (quality?: string) => {
    const qualityColors: { [key: string]: string } = {
      standard: 'bg-gray-100 text-gray-700',
      high: 'bg-blue-100 text-blue-700',
      ultra: 'bg-purple-100 text-purple-700'
    }
    return qualityColors[quality || 'standard'] || qualityColors.standard
  }

  return (
    <div
      className={`group relative bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden transition-all duration-200 hover:shadow-md ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Video Container */}
      <div className="relative aspect-video bg-gray-100">
        {videoError ? (
          <div className="w-full h-full flex items-center justify-center bg-gray-200">
            <div className="text-center text-gray-500">
              <VideoCameraIcon className="h-8 w-8 mx-auto mb-2" />
              <p className="text-sm">Video unavailable</p>
            </div>
          </div>
        ) : (
          <video
            className="w-full h-full object-cover cursor-pointer"
            muted
            preload="metadata"
            poster={video.thumbnail}
            onClick={() => onVideoClick?.(video)}
            onError={(e) => {
              console.error('🎬 VIDEO CARD: Error loading video:', video.id, e)
              setVideoError(true)
            }}
          >
            <source src={getProxiedVideoUrl(video.id)} type="video/mp4" />
          </video>
        )}

        {/* Play Overlay */}
        {!videoError && (
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <div className="flex items-center space-x-2">
              {/* Play Button */}
              <button
                onClick={() => onVideoClick?.(video)}
                className="p-3 bg-white/20 hover:bg-white/30 text-white rounded-full backdrop-blur-sm transition-colors"
                title="Play video"
              >
                <PlayIcon className="h-6 w-6" />
              </button>

              {/* Additional Actions */}
              {showActions && isHovered && (
                <>
                  {/* Download */}
                  {onDownload && (
                    <button
                      onClick={() => onDownload(video)}
                      className="p-2 bg-white/20 hover:bg-white/30 text-white rounded-full backdrop-blur-sm transition-colors"
                      title="Download video"
                    >
                      <ArrowDownTrayIcon className="h-4 w-4" />
                    </button>
                  )}

                  {/* Share */}
                  {onShare && (
                    <button
                      onClick={() => onShare(video)}
                      className="p-2 bg-white/20 hover:bg-white/30 text-white rounded-full backdrop-blur-sm transition-colors"
                      title="Share video"
                    >
                      <ShareIcon className="h-4 w-4" />
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Style Badge */}
        {video.metadata?.style && (
          <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
            <span className="mr-1">{getStyleIcon(video.metadata.style)}</span>
            {video.metadata.style}
          </div>
        )}

        {/* Quality Badge */}
        {video.metadata?.quality && (
          <div className={`absolute top-2 right-12 text-xs px-2 py-1 rounded-full ${getQualityBadge(video.metadata.quality)}`}>
            {video.metadata.quality.toUpperCase()}
          </div>
        )}

        {/* Like Button */}
        {onLike && (
          <button
            onClick={() => onLike(video.id)}
            className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-full backdrop-blur-sm transition-colors"
            title={video.isLiked ? 'Unlike' : 'Like'}
          >
            {video.isLiked ? (
              <HeartSolidIcon className="h-4 w-4 text-red-500" />
            ) : (
              <HeartIcon className="h-4 w-4" />
            )}
          </button>
        )}

        {/* Duration Badge */}
        <div className="absolute bottom-2 right-2 bg-black/75 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
          {formatDuration(video.duration || video.metadata?.duration || 5)}
        </div>

        {/* Provider Badge */}
        {video.metadata?.provider && (
          <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
            {video.metadata.provider === 'google-veo' ? 'Veo' : 
             video.metadata.provider === 'replicate-wan' ? 'Runway' : 
             video.metadata.provider}
          </div>
        )}
      </div>

      {/* Video Info */}
      <div className="p-4">
        {/* Prompt */}
        <p className="text-sm text-gray-900 line-clamp-2 mb-2" title={video.prompt}>
          {video.prompt}
        </p>

        {/* Metadata */}
        <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
          <div className="flex items-center space-x-2">
            <ClockIcon className="h-3 w-3" />
            <span>{formatDate(video.created_at)}</span>
          </div>
          {video.metadata?.resolution && (
            <span className="bg-gray-100 px-2 py-1 rounded">
              {video.metadata.resolution.width}×{video.metadata.resolution.height}
            </span>
          )}
        </div>

        {/* Technical Details */}
        <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
          <div className="flex items-center space-x-3">
            {video.metadata?.aspectRatio && (
              <span>{video.metadata.aspectRatio}</span>
            )}
            {video.metadata?.frameRate && (
              <span>{video.metadata.frameRate}fps</span>
            )}
          </div>
          {video.metadata?.motionIntensity && (
            <span className="capitalize">{video.metadata.motionIntensity} motion</span>
          )}
        </div>

        {/* Action Buttons */}
        {showActions && (
          <div className="flex items-center justify-between">
            <button
              onClick={() => onVideoClick?.(video)}
              className="flex items-center space-x-1 px-3 py-1.5 bg-primary-50 hover:bg-primary-100 text-primary-700 text-xs font-medium rounded-full transition-colors"
            >
              <PlayIcon className="h-3 w-3" />
              <span>Watch</span>
            </button>

            <div className="flex items-center space-x-1">
              {onDelete && (
                <button
                  onClick={() => onDelete(video.id)}
                  className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                  title="Delete video"
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
  )
}
