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
  stubMp4?: string  // Ultra-compressed stub for instant loading
  stubWebm?: string // Ultra-compressed stub for instant loading
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
 * Force hero video playback with aggressive loading
 */
export const initializeHeroVideo = (): void => {
  const heroVideo = document.getElementById('heroVideo') as HTMLVideoElement
  if (heroVideo) {
    console.log('🎬 Force-initializing hero video...')

    // Force preload and load
    heroVideo.setAttribute('preload', 'auto')
    heroVideo.load()

    // Set up canplay listener for instant playback
    const handleCanPlay = () => {
      console.log('✅ Hero video can play - starting immediately')
      heroVideo.play().catch((error) => {
        console.warn('Hero video autoplay blocked:', error)
        // Show play button overlay as fallback
        showHeroPlayButton(heroVideo)
      })
      heroVideo.removeEventListener('canplay', handleCanPlay)
    }

    heroVideo.addEventListener('canplay', handleCanPlay)

    // If already ready, play immediately
    if (heroVideo.readyState >= 3) {
      handleCanPlay()
    }
  }
}

/**
 * Show play button overlay for hero video when autoplay is blocked
 */
const showHeroPlayButton = (video: HTMLVideoElement): void => {
  const container = video.parentElement
  if (!container) return

  const playButton = document.createElement('div')
  playButton.innerHTML = `
    <div style="
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(0,0,0,0.8);
      color: white;
      padding: 20px 30px;
      border-radius: 50px;
      cursor: pointer;
      font-size: 18px;
      z-index: 1000;
      backdrop-filter: blur(10px);
    ">
      ▶️ Play Video
    </div>
  `

  playButton.onclick = () => {
    video.play()
    playButton.remove()
  }

  container.appendChild(playButton)
}

/**
 * Implement stub video swap for ultra-fast hero loading
 */
export const initializeHeroWithStub = (config: VideoConfig): void => {
  const heroVideo = document.getElementById('heroVideo') as HTMLVideoElement
  if (!heroVideo || !config.stubMp4) return

  console.log('🎬 Initializing hero with stub video for instant playback...')

  // Start with stub video for instant loading
  const stubSource = document.createElement('source')
  stubSource.src = config.stubWebm || config.stubMp4
  stubSource.type = config.stubWebm ? 'video/webm' : 'video/mp4'

  // Clear existing sources and add stub
  heroVideo.innerHTML = ''
  heroVideo.appendChild(stubSource)

  // Force load and play stub
  heroVideo.setAttribute('preload', 'auto')
  heroVideo.load()

  // When stub starts playing, swap to full video
  const handleStubPlaying = () => {
    console.log('✅ Stub playing - swapping to full hero video...')

    // Remove stub sources
    heroVideo.innerHTML = ''

    // Add full video sources
    const webmSource = document.createElement('source')
    webmSource.src = config.webm
    webmSource.type = 'video/webm'
    heroVideo.appendChild(webmSource)

    const mp4Source = document.createElement('source')
    mp4Source.src = config.mp4
    mp4Source.type = 'video/mp4'
    heroVideo.appendChild(mp4Source)

    // Load and play full video
    heroVideo.load()
    heroVideo.play().catch((error) => {
      console.warn('Full hero video play failed:', error)
    })

    heroVideo.removeEventListener('playing', handleStubPlaying)
  }

  heroVideo.addEventListener('playing', handleStubPlaying, { once: true })

  // Start stub playback
  heroVideo.play().catch((error) => {
    console.warn('Stub video play failed, falling back to full video:', error)
    // Fallback to regular initialization
    initializeHeroVideo()
  })
}

/**
 * Check if stub videos exist and use them, otherwise use regular initialization
 */
export const initializeHeroVideoAdvanced = (config: VideoConfig): void => {
  // Try stub video first for ultra-fast loading
  if (config.stubMp4 || config.stubWebm) {
    // Check if stub files exist
    fetch(config.stubMp4 || config.stubWebm || '', { method: 'HEAD' })
      .then(response => {
        if (response.ok) {
          initializeHeroWithStub(config)
        } else {
          console.log('Stub video not found, using regular initialization')
          initializeHeroVideo()
        }
      })
      .catch(() => {
        console.log('Stub video check failed, using regular initialization')
        initializeHeroVideo()
      })
  } else {
    initializeHeroVideo()
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
    // Force hero video playback first with advanced techniques
    initializeHeroVideoAdvanced(videoConfigs.hero)

    // Then initialize other videos
    initializeAllVideos()
  })
}
