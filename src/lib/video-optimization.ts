/**
 * Video Optimization Utilities
 * Handles instant video playback and streaming optimizations
 */

export interface VideoConfig {
  webm: string
  mp4: string
  poster?: string
  autoplay?: boolean
  loop?: boolean
  muted?: boolean
  playsInline?: boolean
  preload?: 'none' | 'metadata' | 'auto'
}

export const videoConfigs: Record<string, VideoConfig> = {
  hero: {
    webm: '/videos/hailuo-ai-video-02.webm',
    mp4: '/videos/hailuo-ai-video-02.mp4',
    poster: '/images/hero-poster.jpg',
    autoplay: true,
    loop: true,
    muted: true,
    playsInline: true,
    preload: 'auto'
  },
  seedance: {
    webm: '/videos/seedream.webm',
    mp4: '/videos/seedream.mp4',
    autoplay: true,
    loop: true,
    muted: true,
    playsInline: true,
    preload: 'auto'
  },
  veo: {
    webm: '/videos/veo 3.webm',
    mp4: '/videos/veo 3.mp4',
    autoplay: true,
    loop: true,
    muted: true,
    playsInline: true,
    preload: 'auto'
  },
  minimax: {
    webm: '/videos/minimax.webm',
    mp4: '/videos/minimax.mp4',
    autoplay: true,
    loop: true,
    muted: true,
    playsInline: true,
    preload: 'auto'
  }
}

/**
 * Optimized Video Component Props
 */
export interface OptimizedVideoProps {
  config: VideoConfig
  className?: string
  width?: number
  height?: number
  onCanPlay?: () => void
  onLoadStart?: () => void
  onError?: (error: Event) => void
  style?: React.CSSProperties
}

/**
 * Initialize video for instant playback
 */
export const initializeVideo = (video: HTMLVideoElement): Promise<void> => {
  return new Promise((resolve, reject) => {
    const handleCanPlay = () => {
      video.removeEventListener('canplay', handleCanPlay)
      video.removeEventListener('error', handleError)
      
      // Attempt to play
      video.play()
        .then(() => resolve())
        .catch((error) => {
          console.warn('Video autoplay blocked:', error)
          resolve() // Don't reject, just resolve without autoplay
        })
    }

    const handleError = (error: Event) => {
      video.removeEventListener('canplay', handleCanPlay)
      video.removeEventListener('error', handleError)
      reject(error)
    }

    video.addEventListener('canplay', handleCanPlay)
    video.addEventListener('error', handleError)

    // If video is already ready
    if (video.readyState >= 3) {
      handleCanPlay()
    }
  })
}

/**
 * Batch initialize multiple videos
 */
export const initializeAllVideos = (): void => {
  const videos = document.querySelectorAll('video[data-optimized]')
  
  videos.forEach((video) => {
    const videoElement = video as HTMLVideoElement
    initializeVideo(videoElement).catch((error) => {
      console.warn('Failed to initialize video:', error)
    })
  })
}

/**
 * Check if video format is supported
 */
export const getPreferredVideoFormat = (config: VideoConfig): string => {
  const video = document.createElement('video')
  
  // Check WebM support first (usually better compression)
  if (video.canPlayType('video/webm; codecs="vp9,opus"') === 'probably' || 
      video.canPlayType('video/webm') === 'maybe') {
    return config.webm
  }
  
  // Fallback to MP4
  return config.mp4
}

/**
 * Preload video metadata for faster startup
 */
export const preloadVideoMetadata = (src: string): Promise<HTMLVideoElement> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    video.preload = 'metadata'
    video.muted = true
    
    video.addEventListener('loadedmetadata', () => resolve(video), { once: true })
    video.addEventListener('error', reject, { once: true })
    
    video.src = src
  })
}

/**
 * Create optimized video element
 */
export const createOptimizedVideo = (config: VideoConfig, options: Partial<OptimizedVideoProps> = {}): HTMLVideoElement => {
  const video = document.createElement('video')
  
  // Set attributes for optimal streaming
  video.setAttribute('data-optimized', 'true')
  video.autoplay = config.autoplay ?? false
  video.loop = config.loop ?? false
  video.muted = config.muted ?? true
  video.playsInline = config.playsInline ?? true
  video.preload = config.preload ?? 'auto'
  
  // Add CSS classes
  if (options.className) {
    video.className = options.className
  }
  
  // Set dimensions
  if (options.width) video.width = options.width
  if (options.height) video.height = options.height
  
  // Add sources (WebM first for better compression)
  const webmSource = document.createElement('source')
  webmSource.src = config.webm
  webmSource.type = 'video/webm'
  video.appendChild(webmSource)
  
  const mp4Source = document.createElement('source')
  mp4Source.src = config.mp4
  mp4Source.type = 'video/mp4'
  video.appendChild(mp4Source)
  
  // Add event listeners
  if (options.onCanPlay) {
    video.addEventListener('canplay', options.onCanPlay)
  }
  
  if (options.onLoadStart) {
    video.addEventListener('loadstart', options.onLoadStart)
  }
  
  if (options.onError) {
    video.addEventListener('error', options.onError)
  }
  
  return video
}

/**
 * Force hero video playback on DOM ready
 */
export const initializeHeroVideo = (): void => {
  const heroVideo = document.getElementById('heroVideo') as HTMLVideoElement
  if (heroVideo) {
    heroVideo.play().catch((error) => {
      console.warn('Hero video autoplay blocked:', error)
      // Could show a play button overlay as fallback
      // showPlayButton(heroVideo)
    })
  }
}

/**
 * DOM ready handler for video initialization
 */
export const onDOMReady = (callback: () => void): void => {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', callback)
  } else {
    callback()
  }
}

/**
 * Initialize all video optimizations on DOM ready
 */
export const initializeAllVideoOptimizations = (): void => {
  onDOMReady(() => {
    // Force hero video playback first
    initializeHeroVideo()

    // Then initialize other videos
    initializeAllVideos()
  })
}
