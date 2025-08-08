'use client'

import React, { useEffect, useRef, useState } from 'react'

interface HLSVideoProps {
  src: string
  poster?: string
  className?: string
  autoplay?: boolean
  muted?: boolean
  loop?: boolean
  playsInline?: boolean
  onCanPlay?: () => void
  onError?: (error: any) => void
  style?: React.CSSProperties
}

/**
 * HLS Video Player for Ultra-Fast Segmented Streaming
 * Uses hls.js for browsers that don't natively support HLS
 */
export const HLSVideo: React.FC<HLSVideoProps> = ({
  src,
  poster,
  className = '',
  autoplay = true,
  muted = true,
  loop = true,
  playsInline = true,
  onCanPlay,
  onError,
  style
}) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [hlsInstance, setHlsInstance] = useState<any>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const initializeHLS = async () => {
      try {
        // Check if browser supports HLS natively
        if (video.canPlayType('application/vnd.apple.mpegurl')) {
          console.log('🎬 Using native HLS support')
          video.src = src
          return
        }

        // Use hls.js for browsers without native support
        const { default: Hls } = await import('hls.js')
        
        if (Hls.isSupported()) {
          console.log('🎬 Using hls.js for HLS playback')
          
          const hls = new Hls({
            startLevel: 0, // Start with lowest quality for instant playback
            maxBufferLength: 10, // Small buffer for fast start
            maxMaxBufferLength: 20,
            lowLatencyMode: true
          })
          
          hls.loadSource(src)
          hls.attachMedia(video)
          
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            console.log('✅ HLS manifest parsed - starting playback')
            if (autoplay) {
              video.play().catch((error) => {
                console.warn('HLS autoplay blocked:', error)
                onError?.(error)
              })
            }
          })
          
          hls.on(Hls.Events.ERROR, (event, data) => {
            console.error('❌ HLS error:', data)
            onError?.(data)
            setHasError(true)
          })
          
          setHlsInstance(hls)
        } else {
          console.warn('⚠️ HLS not supported, falling back to direct video')
          video.src = src.replace('.m3u8', '.mp4') // Fallback to MP4
        }
      } catch (error) {
        console.error('❌ Failed to load HLS:', error)
        onError?.(error)
        setHasError(true)
      }
    }

    const handleCanPlay = () => {
      setIsLoading(false)
      onCanPlay?.()
    }

    const handleError = (error: Event) => {
      setHasError(true)
      setIsLoading(false)
      onError?.(error)
    }

    video.addEventListener('canplay', handleCanPlay)
    video.addEventListener('error', handleError)

    initializeHLS()

    return () => {
      video.removeEventListener('canplay', handleCanPlay)
      video.removeEventListener('error', handleError)
      
      // Cleanup HLS instance
      if (hlsInstance) {
        hlsInstance.destroy()
      }
    }
  }, [src, autoplay, onCanPlay, onError])

  return (
    <div className={`relative ${className}`} style={style}>
      <video
        ref={videoRef}
        autoPlay={autoplay}
        muted={muted}
        loop={loop}
        playsInline={playsInline}
        poster={poster}
        preload="auto"
        className="w-full h-full object-cover"
        style={{
          backgroundColor: '#000',
          ...style
        }}
      />

      {/* Loading indicator */}
      {isLoading && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="text-white text-sm">Loading HLS stream...</div>
        </div>
      )}

      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 text-white">
          <div className="text-center">
            <p className="text-sm mb-2">Failed to load HLS stream</p>
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
    </div>
  )
}

export default HLSVideo
