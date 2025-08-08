'use client'

import React, { useEffect, useRef, useState } from 'react'
import { VideoConfig, initializeVideo } from '@/lib/video-optimization'

interface OptimizedVideoProps {
  config: VideoConfig
  className?: string
  width?: number
  height?: number
  onCanPlay?: () => void
  onLoadStart?: () => void
  onError?: (error: Event) => void
  style?: React.CSSProperties
  priority?: boolean
}

/**
 * Optimized Video Component for Instant Playback
 * Implements best practices for streaming video delivery
 */
export const OptimizedVideo: React.FC<OptimizedVideoProps> = ({
  config,
  className = '',
  width,
  height,
  onCanPlay,
  onLoadStart,
  onError,
  style,
  priority = false
}) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleCanPlay = () => {
      setIsLoading(false)
      onCanPlay?.()

      // Force play for hero videos (priority videos)
      if (priority && video.paused) {
        video.play().catch((error) => {
          console.warn('Hero video autoplay blocked:', error)
          // Could show play button here as fallback
        })
      }
    }

    const handleLoadStart = () => {
      setIsLoading(true)
      onLoadStart?.()
    }

    const handleError = (error: Event) => {
      setHasError(true)
      setIsLoading(false)
      onError?.(error)
    }

    const handleLoadedData = () => {
      // Force play when data is loaded for priority videos
      if (priority && video.paused) {
        video.play().catch((error) => {
          console.warn('Hero video manual play failed:', error)
        })
      }
    }

    // Add event listeners
    video.addEventListener('canplay', handleCanPlay)
    video.addEventListener('loadstart', handleLoadStart)
    video.addEventListener('error', handleError)
    video.addEventListener('loadeddata', handleLoadedData)

    // Initialize video for optimal playback
    if (priority) {
      initializeVideo(video).catch((error) => {
        console.warn('Failed to initialize priority video:', error)
      })
    }

    return () => {
      video.removeEventListener('canplay', handleCanPlay)
      video.removeEventListener('loadstart', handleLoadStart)
      video.removeEventListener('error', handleError)
      video.removeEventListener('loadeddata', handleLoadedData)
    }
  }, [onCanPlay, onLoadStart, onError, priority])

  return (
    <div className={`relative ${className}`} style={style}>
      <video
        ref={videoRef}
        data-optimized="true"
        id={priority ? 'heroVideo' : undefined}
        autoPlay={config.autoplay}
        loop={config.loop}
        muted={config.muted}
        playsInline={config.playsInline}
        preload={config.preload}
        poster={config.poster}
        width={width || (priority ? 1920 : undefined)}
        height={height || (priority ? 1080 : undefined)}
        className="w-full h-full object-cover"
        style={{
          backgroundColor: '#000',
          ...style
        }}
      >
        {/* WebM first for better compression */}
        <source src={config.webm} type="video/webm" />
        <source src={config.mp4} type="video/mp4" />
        
        {/* Fallback for browsers without video support */}
        <div className="flex items-center justify-center h-full bg-gray-900 text-white">
          <p>Your browser does not support the video tag.</p>
        </div>
      </video>

      {/* Loading indicator */}
      {isLoading && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="text-white text-sm">Loading video...</div>
        </div>
      )}

      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 text-white">
          <div className="text-center">
            <p className="text-sm mb-2">Failed to load video</p>
            <button 
              onClick={() => {
                setHasError(false)
                setIsLoading(true)
                videoRef.current?.load()
              }}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Poster image if provided */}
      {config.poster && (
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ 
            backgroundImage: `url(${config.poster})`,
            display: isLoading ? 'block' : 'none'
          }}
        />
      )}
    </div>
  )
}

export default OptimizedVideo
