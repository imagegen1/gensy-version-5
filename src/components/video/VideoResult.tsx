'use client'

import { useState } from 'react'
import {
  PlayIcon,
  PauseIcon,
  ArrowDownTrayIcon,
  ShareIcon,
  ArrowsPointingOutIcon,
  ClockIcon,
  RectangleStackIcon,
  SparklesIcon
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
import { downloadVideoWithFeedback } from '@/lib/utils/download'

// Helper function to get proxied video URL
const getProxiedVideoUrl = (generationId: string): string => {
  return `/api/video/proxy?id=${encodeURIComponent(generationId)}`
}

interface VideoResultProps {
  videoUrl?: string
  generationId?: string
  prompt: string
  options: {
    duration: number
    aspectRatio: string
    style: string
    quality: string
    provider: string
  }
  metadata?: any
  generation?: any
}

export function VideoResult({
  videoUrl,
  generationId,
  prompt,
  options,
  metadata,
  generation
}: VideoResultProps) {
  // Determine the actual video URL to use
  const actualVideoUrl = generationId ? getProxiedVideoUrl(generationId) : videoUrl

  if (!actualVideoUrl) {
    return (
      <div className="bg-white rounded-lg p-8 text-center">
        <p className="text-gray-500">No video URL or generation ID provided</p>
      </div>
    )
  }
  const [isPlaying, setIsPlaying] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)

  const handlePlayPause = () => {
    const video = document.getElementById('generated-video') as HTMLVideoElement
    if (video) {
      if (isPlaying) {
        video.pause()
      } else {
        video.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const handleDownload = async () => {
    setIsDownloading(true)
    try {
      console.log('🎬 VIDEO DOWNLOAD: Starting download with dynamic naming')

      // Use the new dynamic video naming system
      await downloadVideoWithFeedback(
        {
          url: actualVideoUrl,
          prompt: prompt || 'Generated video',
          model: metadata?.model || metadata?.provider || 'ai-model',
          timestamp: new Date(),
          generationId: generationId,
          format: 'mp4'
        },
        (filename) => {
          console.log('✅ VIDEO DOWNLOAD: Successfully downloaded:', filename)
        },
        (error) => {
          console.error('❌ VIDEO DOWNLOAD: Failed:', error)
        }
      )
    } catch (error) {
      console.error('❌ VIDEO DOWNLOAD: Unexpected error:', error)
    } finally {
      setIsDownloading(false)
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'AI Generated Video',
          text: `Check out this AI-generated video: "${prompt.substring(0, 100)}..."`,
          url: actualVideoUrl,
        })
      } catch (error) {
        console.error('Share failed:', error)
      }
    } else {
      try {
        await navigator.clipboard.writeText(actualVideoUrl)
        // You could show a toast notification here
      } catch (error) {
        console.error('Copy failed:', error)
      }
    }
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDuration = (seconds: number) => {
    return `${seconds}s`
  }

  // Get aspect ratio from options or default to 16:9
  const aspectRatio = options.aspectRatio || '16:9'
  const aspectRatioConfig = getAspectRatioConfig(aspectRatio)
  const layoutConfig = getLayoutConfig(aspectRatio)

  return (
    <>
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden ${layoutConfig.maxWidth} mx-auto`}>
        {/* Dynamic Layout Container */}
        <div className={layoutConfig.containerClasses}>
          {/* Video Player with Responsive Sizing */}
          <div className={layoutConfig.videoClasses}>
            <div className={getResponsiveVideoClasses(aspectRatio)}>
              <video
                id="generated-video"
                className="absolute inset-0 w-full h-full object-contain"
                controls
                loop
                muted
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                poster="/api/placeholder/800/450"
              >
                <source src={actualVideoUrl} type="video/mp4" />
                Your browser does not support the video tag.
              </video>

              {/* Fullscreen Button */}
              <button
                onClick={() => setIsFullscreen(true)}
                className="absolute top-4 right-4 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-opacity"
                title="View fullscreen"
              >
                <ArrowsPointingOutIcon className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Video Info - Adaptive Layout */}
          <div className={`p-6 ${layoutConfig.metadataLayout === 'vertical' ? 'lg:w-80 lg:flex-shrink-0' : ''}`}>
            {/* Prompt */}
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Generated Video</h3>
              <p className="text-gray-700 bg-gray-50 p-3 rounded-md italic text-sm">
                "{prompt}"
              </p>
            </div>

            {/* Metadata with Dynamic Grid */}
            <div className={getMetadataGridClasses(aspectRatio, layoutConfig.metadataLayout)} style={{ marginBottom: '1.5rem' }}>
              <div className="flex items-center">
                <ClockIcon className="h-4 w-4 text-gray-400 mr-2" />
                <div>
                  <span className="text-gray-500">Duration:</span>
                  <span className="ml-1 font-medium">{formatDuration(options.duration)}</span>
                </div>
              </div>

              <div className="flex items-center">
                <RectangleStackIcon className="h-4 w-4 text-gray-400 mr-2" />
                <div>
                  <span className="text-gray-500">Aspect:</span>
                  <span className="ml-1 font-medium">{options.aspectRatio}</span>
                </div>
              </div>

              <div className="flex items-center">
                <SparklesIcon className="h-4 w-4 text-gray-400 mr-2" />
                <div>
                  <span className="text-gray-500">Style:</span>
                  <span className="ml-1 font-medium capitalize">{options.style}</span>
                </div>
              </div>

              <div>
                <span className="text-gray-500">Provider:</span>
                <span className="ml-1 font-medium">{options.provider === 'google-veo' ? 'Google Veo' : 'Replicate Wan'}</span>
              </div>
            </div>

            {/* Additional Metadata */}
            {metadata && (
              <div className={getMetadataGridClasses(aspectRatio, layoutConfig.metadataLayout)} style={{ marginBottom: '1.5rem' }}>
                {metadata.resolution && (
                  <div>
                    <span className="text-gray-500">Resolution:</span>
                    <span className="ml-1 font-medium">
                      {metadata.resolution.width}×{metadata.resolution.height}
                    </span>
                  </div>
                )}

                {metadata.frameRate && (
                  <div>
                    <span className="text-gray-500">Frame Rate:</span>
                    <span className="ml-1 font-medium">{metadata.frameRate} FPS</span>
                  </div>
                )}

                {metadata.fileSize && (
                  <div>
                    <span className="text-gray-500">File Size:</span>
                    <span className="ml-1 font-medium">{formatFileSize(metadata.fileSize)}</span>
                  </div>
                )}

                {metadata.generationTime && (
                  <div>
                    <span className="text-gray-500">Generation Time:</span>
                    <span className="ml-1 font-medium">{Math.round(metadata.generationTime / 1000)}s</span>
                  </div>
                )}
              </div>
            )}

            {/* Actions with Adaptive Layout */}
            <div className={getActionButtonsClasses(aspectRatio)}>
              <div className="text-sm text-gray-500 text-center lg:text-left">
                Quality: {options.quality} • Provider: {options.provider === 'google-veo' ? 'Google Veo' : 'Replicate Wan 2.1'}
              </div>

              <div className="flex items-center space-x-2 justify-center lg:justify-end">
                <button
                  onClick={handleShare}
                  className="flex items-center space-x-1 px-3 py-1 bg-gray-50 text-gray-600 rounded-full text-sm hover:bg-gray-100 transition-colors"
                >
                  <ShareIcon className="h-4 w-4" />
                  <span>Share</span>
                </button>

                <button
                  onClick={handleDownload}
                  disabled={isDownloading}
                  className="flex items-center space-x-1 px-3 py-1 bg-primary-600 text-white rounded-full text-sm hover:bg-primary-700 transition-colors disabled:opacity-50"
                >
                  <ArrowDownTrayIcon className="h-4 w-4" />
                  <span>{isDownloading ? 'Downloading...' : 'Download'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen Modal with Preserved Aspect Ratio */}
      {isFullscreen && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
          <div
            className={`relative ${getModalContainerClasses(aspectRatio)} w-full max-h-full`}
            style={getVideoContainerStyle(aspectRatio, { maxHeight: '90vh' })}
          >
            <video
              className="w-full h-full object-contain"
              controls
              autoPlay
              loop
              muted
            >
              <source src={actualVideoUrl} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
            
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
