'use client'

import { useState, useRef } from 'react'
import {
  PlayIcon,
  PauseIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  ArrowsPointingOutIcon,
  ArrowDownTrayIcon,
  ShareIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'
import {
  getVideoContainerClasses,
  getVideoContainerStyle,
  getModalContainerClasses,
  getAspectRatioConfig,
  getLayoutConfig,
  getResponsiveVideoClasses,
  getMetadataGridClasses,
  getActionButtonsClasses
} from '@/lib/utils/aspect-ratio'

interface VideoPlayerProps {
  videoUrl?: string
  generationId?: string
  metadata?: {
    duration?: number
    resolution?: { width: number; height: number }
    fileSize?: number
    aspectRatio?: string
    style?: string
    quality?: string
    provider?: string
  }
  prompt?: string
}

// Helper function to get proxied video URL
const getProxiedVideoUrl = (generationId: string): string => {
  return `/api/video/proxy?id=${encodeURIComponent(generationId)}`
}

export function VideoPlayer({ videoUrl, generationId, metadata, prompt }: VideoPlayerProps) {
  // Determine the actual video URL to use
  const actualVideoUrl = generationId ? getProxiedVideoUrl(generationId) : videoUrl

  if (!actualVideoUrl) {
    return (
      <div className="bg-white rounded-lg p-8 text-center">
        <p className="text-gray-500">No video URL or generation ID provided</p>
      </div>
    )
  }
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(true)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
    }
  }

  const handleMuteToggle = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime)
    }
  }

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration)
    }
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value)
    if (videoRef.current) {
      videoRef.current.currentTime = time
      setCurrentTime(time)
    }
  }

  const handleFullscreen = () => {
    if (videoRef.current) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen()
      }
    }
  }

  const handleDownload = async () => {
    setIsDownloading(true)
    try {
      const response = await fetch(videoUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `gensy-video-${Date.now()}.mp4`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Download failed:', error)
    } finally {
      setIsDownloading(false)
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'AI Generated Video',
          text: prompt ? `"${prompt}"` : 'Check out this AI-generated video!',
          url: videoUrl,
        })
      } catch (error) {
        console.error('Share failed:', error)
      }
    } else {
      try {
        await navigator.clipboard.writeText(videoUrl)
        // Show success message
      } catch (error) {
        console.error('Copy failed:', error)
      }
    }
  }

  const handleRegenerate = () => {
    // This would trigger regeneration with the same prompt
    console.log('Regenerate video with prompt:', prompt)
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Get aspect ratio from metadata or default to 16:9
  const aspectRatio = metadata?.aspectRatio || '16:9'
  const aspectRatioConfig = getAspectRatioConfig(aspectRatio)
  const layoutConfig = getLayoutConfig(aspectRatio)

  return (
    <div className={`bg-white rounded-lg overflow-hidden ${layoutConfig.maxWidth} mx-auto`}>
      {/* Dynamic Layout Container */}
      <div className={layoutConfig.containerClasses}>
        {/* Video Player with Responsive Sizing */}
        <div className={layoutConfig.videoClasses}>
          <div className={getResponsiveVideoClasses(aspectRatio)}>
            <video
              ref={videoRef}
              className="absolute inset-0 w-full h-full object-contain"
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onEnded={() => setIsPlaying(false)}
              loop
              muted={isMuted}
              poster="/api/placeholder/800/450"
            >
              <source src={actualVideoUrl} type="video/mp4" />
              Your browser does not support the video tag.
            </video>

            {/* Custom Controls Overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
              {/* Progress Bar */}
              <div className="mb-3">
                <input
                  type="range"
                  min="0"
                  max={duration || 0}
                  value={currentTime}
                  onChange={handleSeek}
                  className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                />
              </div>

              {/* Control Buttons */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {/* Play/Pause */}
                  <button
                    onClick={handlePlayPause}
                    className="text-white hover:text-gray-300 transition-colors"
                  >
                    {isPlaying ? (
                      <PauseIcon className="h-6 w-6" />
                    ) : (
                      <PlayIcon className="h-6 w-6" />
                    )}
                  </button>

                  {/* Mute/Unmute */}
                  <button
                    onClick={handleMuteToggle}
                    className="text-white hover:text-gray-300 transition-colors"
                  >
                    {isMuted ? (
                      <SpeakerXMarkIcon className="h-5 w-5" />
                    ) : (
                      <SpeakerWaveIcon className="h-5 w-5" />
                    )}
                  </button>

                  {/* Time Display */}
                  <span className="text-white text-sm">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  {/* Fullscreen */}
                  <button
                    onClick={handleFullscreen}
                    className="text-white hover:text-gray-300 transition-colors"
                  >
                    <ArrowsPointingOutIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Video Information - Adaptive Layout */}
        <div className={`p-6 ${layoutConfig.metadataLayout === 'vertical' ? 'lg:w-80 lg:flex-shrink-0' : ''}`}>
          {/* Prompt */}
          {prompt && (
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Prompt</h3>
              <p className="text-gray-700 bg-gray-50 p-3 rounded-md italic text-sm">
                "{prompt}"
              </p>
            </div>
          )}

          {/* Metadata with Dynamic Grid */}
          {metadata && (
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Video Details</h4>
              <div className={getMetadataGridClasses(aspectRatio, layoutConfig.metadataLayout)}>
                {metadata.duration && (
                  <div>
                    <span className="text-gray-500">Duration:</span>
                    <span className="ml-1 font-medium">{metadata.duration}s</span>
                  </div>
                )}

                {metadata.resolution && (
                  <div>
                    <span className="text-gray-500">Resolution:</span>
                    <span className="ml-1 font-medium">
                      {metadata.resolution.width}×{metadata.resolution.height}
                    </span>
                  </div>
                )}

                {metadata.aspectRatio && (
                  <div>
                    <span className="text-gray-500">Aspect Ratio:</span>
                    <span className="ml-1 font-medium">{metadata.aspectRatio}</span>
                  </div>
                )}

                {metadata.fileSize && (
                  <div>
                    <span className="text-gray-500">File Size:</span>
                    <span className="ml-1 font-medium">{formatFileSize(metadata.fileSize)}</span>
                  </div>
                )}

                {metadata.style && (
                  <div>
                    <span className="text-gray-500">Style:</span>
                    <span className="ml-1 font-medium capitalize">{metadata.style}</span>
                  </div>
                )}

                {metadata.quality && (
                  <div>
                    <span className="text-gray-500">Quality:</span>
                    <span className="ml-1 font-medium capitalize">{metadata.quality}</span>
                  </div>
                )}

                {metadata.provider && (
                  <div>
                    <span className="text-gray-500">Provider:</span>
                    <span className="ml-1 font-medium">
                      {metadata.provider === 'google-veo' ? 'Google Veo' : 'Replicate Wan 2.1'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons with Adaptive Layout */}
          <div className={getActionButtonsClasses(aspectRatio)}>
            <div className="flex items-center space-x-3 justify-center lg:justify-start">
              <button
                onClick={handleDownload}
                disabled={isDownloading}
                className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors disabled:opacity-50"
              >
                <ArrowDownTrayIcon className="h-4 w-4" />
                <span>{isDownloading ? 'Downloading...' : 'Download'}</span>
              </button>

              <button
                onClick={handleShare}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
              >
                <ShareIcon className="h-4 w-4" />
                <span>Share</span>
              </button>
            </div>

            {prompt && (
              <button
                onClick={handleRegenerate}
                className="flex items-center space-x-2 px-4 py-2 bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors justify-center lg:justify-start"
              >
                <ArrowPathIcon className="h-4 w-4" />
                <span>Regenerate</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
