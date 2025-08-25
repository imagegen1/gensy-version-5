'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { heroVideoConfig } from '@/config/hero-video'
import { BeamsBackground } from '@/components/ui/beams-background'
import PerformanceMonitor from '@/components/PerformanceMonitor'
import InteractiveSelector from '@/components/ui/interactive-selector'
import { DemoOne } from '@/components/features/DemoOne'
import OptimizedVideo from '@/components/ui/OptimizedVideo'
import { videoConfigs, initializeAllVideoOptimizations } from '@/lib/video-optimization'
import {
  loadCriticalResources,
  loadNonCriticalResources,
  runWhenIdle,
  measurePerformance
} from '@/lib/performance'
import PayAsYouGo from '@/components/pay-as-you-go'

export default function GensyTemplate() {
  // Check if Clerk is disabled
  const isClerkDisabled = process.env.NEXT_PUBLIC_CLERK_DISABLED === 'true'

  // Mock auth state when Clerk is disabled
  const isSignedIn = isClerkDisabled ? false : (() => {
    try {
      const { useAuth } = require('@clerk/nextjs')
      return useAuth().isSignedIn
    } catch {
      return false
    }
  })()

  const router = useRouter()
  const [videoLoaded, setVideoLoaded] = useState(false)
  const [heroVideoReady, setHeroVideoReady] = useState(false)
  const [showcaseVideosLoaded, setShowcaseVideosLoaded] = useState({
    seedance: false,
    veo: false,
    minimax: false
  })

  // Refs for intersection observer
  const seedanceVideoRef = useRef<HTMLVideoElement>(null)
  const veoVideoRef = useRef<HTMLVideoElement>(null)
  const minimaxVideoRef = useRef<HTMLVideoElement>(null)



  // Progressive video loading strategy with improved error handling
  const loadShowcaseVideo = useCallback((videoRef: React.RefObject<HTMLVideoElement>, videoKey: 'seedance' | 'veo' | 'minimax') => {
    if (!videoRef.current || showcaseVideosLoaded[videoKey]) return

    console.log(`🎬 Loading ${videoKey} video...`)
    const video = videoRef.current

    // Set preload to auto and load the video
    video.preload = 'auto'

    const handleCanPlay = () => {
      console.log(`✅ ${videoKey} video ready`)
      setShowcaseVideosLoaded(prev => ({ ...prev, [videoKey]: true }))
      cleanup()
    }

    const handleError = (e: Event) => {
      console.error(`❌ ${videoKey} video error:`, e)
      // Still mark as loaded to prevent infinite loading
      setShowcaseVideosLoaded(prev => ({ ...prev, [videoKey]: true }))
      cleanup()
    }

    const cleanup = () => {
      video.removeEventListener('canplay', handleCanPlay)
      video.removeEventListener('error', handleError)
    }

    video.addEventListener('canplay', handleCanPlay)
    video.addEventListener('error', handleError)

    // Load the video
    video.load()

    // Return cleanup function
    return cleanup
  }, [showcaseVideosLoaded])

  // Intersection Observer for lazy loading showcase videos
  useEffect(() => {
    if (!heroVideoReady) return // Wait for hero video

    console.log('🔍 Setting up intersection observer for showcase videos')

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const target = entry.target as HTMLElement

            if (target.dataset.video === 'seedance') {
              loadShowcaseVideo(seedanceVideoRef, 'seedance')
            } else if (target.dataset.video === 'veo') {
              loadShowcaseVideo(veoVideoRef, 'veo')
            } else if (target.dataset.video === 'minimax') {
              loadShowcaseVideo(minimaxVideoRef, 'minimax')
            }
          }
        })
      },
      {
        rootMargin: '200px', // Start loading 200px before the video comes into view
        threshold: 0.1
      }
    )

    // Use a small delay to ensure DOM is ready
    const setupObserver = () => {
      const seedanceContainer = document.querySelector('[data-video="seedance"]')
      const veoContainer = document.querySelector('[data-video="veo"]')
      const minimaxContainer = document.querySelector('[data-video="minimax"]')

      if (seedanceContainer) observer.observe(seedanceContainer)
      if (veoContainer) observer.observe(veoContainer)
      if (minimaxContainer) observer.observe(minimaxContainer)
    }

    // Setup observer after a small delay to ensure DOM is ready
    const timeoutId = setTimeout(setupObserver, 100)

    return () => {
      clearTimeout(timeoutId)
      observer.disconnect()
      console.log('🧹 Intersection observer cleaned up')
    }
  }, [heroVideoReady, loadShowcaseVideo])

  // Simplified page initialization - run immediately on mount
  useEffect(() => {
    console.log('🚀 Initializing page resources')

    const initializePage = async () => {
      try {
        // Load critical resources with performance measurement
        measurePerformance('Critical Resources Loading', async () => {
          await loadCriticalResources()
        })

        console.log('✅ Page initialization complete')

        // Load non-critical resources in the background
        runWhenIdle(() => {
          measurePerformance('Non-Critical Resources Loading', () => {
            loadNonCriticalResources()
          })
        })

        // Initialize optimized videos for instant playback
        initializeAllVideoOptimizations()

      } catch (error) {
        console.error('❌ Error initializing page:', error)
      }
    }

    initializePage()
  }, []) // Run once on mount

  return (
    <div className="landing-page loaded">
      <PerformanceMonitor />
      <style dangerouslySetInnerHTML={{
        __html: `
          .landing-page {
            opacity: 1;
            transform: translateY(0);
            transition: all 0.3s ease;
          }

          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }

          @media (min-width: 992px) {
            .navbar-collapse {
              display: flex !important;
              visibility: visible !important;
            }
          }

          /* Hide team carousel elements */
          .team-area,
          .image-courser,
          .courser-item {
            display: none !important;
          }

          /* LAYOUT FIX - Resolve horizontal overflow and right-side whitespace */
          html, body {
            overflow-x: hidden !important;
            max-width: 100vw !important;
          }

          /* Remove problematic max-width constraint */
          @media only screen and (min-width: 992px) and (max-width: 1199px) {
            .container-fluid {
              max-width: none !important;
              width: 100% !important;
              padding-left: 15px !important;
              padding-right: 15px !important;
            }
          }

          /* Reduce excessive padding for large screens */
          @media only screen and (min-width: 1750px) {
            .container-fluid {
              max-width: 100% !important;
              padding-left: 50px !important;
              padding-right: 50px !important;
            }
          }

          /* Ensure container-fluid always uses full width */
          .container-fluid {
            width: 100% !important;
            max-width: 100vw !important;
          }

          /* Video hero section fixes */
          .video-hero-section {
            width: 100vw !important;
            max-width: 100vw !important;
            overflow: hidden !important;
          }

          /* Section fixes */
          section {
            width: 100% !important;
            max-width: 100vw !important;
            overflow-x: hidden !important;
          }

          /* Bootstrap grid fixes */
          .row {
            margin-left: 0 !important;
            margin-right: 0 !important;
            max-width: 100% !important;
          }

          .gradient-signin-button {
            position: relative;
            width: 120px;
            height: 40px;
            background-color: #000;
            display: inline-flex;
            align-items: center;
            color: white;
            justify-content: center;
            border: none;
            padding: 12px 20px;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 500;
            font-size: 14px;
            line-height: 1;
            vertical-align: middle;
            text-decoration: none;
            transition: all 0.3s ease;
          }

          .gradient-signin-button::before {
            content: '';
            position: absolute;
            inset: 0;
            left: -4px;
            top: -1px;
            margin: auto;
            width: 128px;
            height: 48px;
            border-radius: 10px;
            background: linear-gradient(-45deg, #e81cff 0%, #40c9ff 100% );
            z-index: -10;
            pointer-events: none;
            transition: all 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          }

          .gradient-signin-button::after {
            content: "";
            z-index: -1;
            position: absolute;
            inset: 0;
            background: linear-gradient(-45deg, #fc00ff 0%, #00dbde 100% );
            transform: translate3d(0, 0, 0) scale(0.95);
            filter: blur(20px);
          }

          .gradient-signin-button:hover::after {
            filter: blur(30px);
          }

          .gradient-signin-button:hover::before {
            transform: rotate(-180deg);
          }

          .gradient-signin-button:active::before {
            scale: 0.7;
          }
        `
      }} />
        {/* Start Navbar Area */}
        <nav className="navbar navbar-expand-lg mb-nav" id="navbar">
          <div className="container-fluid">
            <a className="navbar-brand" href="index.html">
              <img src="/ainext-template/assets/img/main logo.svg" alt="Gensy Logo" style={{height: '170px', width: 'auto'}} />
            </a>
            <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
              <span className="burger-menu">
                <span className="top-bar"></span>
                <span className="middle-bar"></span>
                <span className="bottom-bar"></span>
              </span>
            </button>
            <div className="collapse navbar-collapse" id="navbarSupportedContent">
              <ul className="navbar-nav me-auto">
                {/* All menu items removed - only Sign In and Sign Up buttons remain */}
              </ul>
              <div className="nav-btn">
                {isSignedIn ? (
                  <button
                    onClick={() => router.push('/dashboard')}
                    className="default-btn"
                  >
                    Dashboard
                    <i className="ri-arrow-right-line"></i>
                  </button>
                ) : (
                  <div className="d-flex gap-3 align-items-center">
                    <button
                      onClick={() => router.push('/auth/sign-in' as any)}
                      className="gradient-signin-button"
                    >
                      Sign In
                    </button>
                    <button
                      onClick={() => router.push('/auth/sign-up' as any)}
                      className="default-btn"
                    >
                      Sign Up
                      <i className="ri-arrow-right-line"></i>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </nav>
        {/* End Navbar Area */}

        {/* Start Responsive Navbar Area */}
        <div className="responsive-navbar offcanvas offcanvas-end border-0" data-bs-backdrop="static" tabIndex={-1} id="navbarOffcanvas">
          <div className="offcanvas-header">
            <a href="index.html" className="logo d-inline-block">
              <img src="/ainext-template/assets/img/main logo.svg" alt="Gensy Logo" style={{height: '140px', width: 'auto'}} />
            </a>
            <button type="button" className="close-btn bg-transparent position-relative lh-1 p-0 border-0" data-bs-dismiss="offcanvas" aria-label="Close">
              <i className="ri-close-line"></i>
            </button>
          </div>
          <div className="offcanvas-body">
            <ul className="responsive-menu">
              {/* All menu items removed - only Sign In and Sign Up buttons remain below */}
            </ul>
            <div className="others-option d-md-flex align-items-center">
              <div className="option-item">
                {isSignedIn ? (
                  <button
                    onClick={() => router.push('/dashboard')}
                    className="default-btn"
                  >
                    <i className="ri-arrow-right-line"></i>
                    <span>Dashboard</span>
                  </button>
                ) : (
                  <div className="d-flex flex-column gap-2">
                    <button
                      onClick={() => router.push('/auth/sign-in' as any)}
                      className="gradient-signin-button w-100"
                      style={{ width: '100%' }}
                    >
                      Sign In
                    </button>
                    <button
                      onClick={() => router.push('/auth/sign-up' as any)}
                      className="default-btn w-100"
                    >
                      <i className="ri-arrow-right-line"></i>
                      <span>Sign Up</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        {/* End Responsive Navbar Area */}

        {/* Start Video Hero Section */}
        <div className="video-hero-section">
          <div className="video-container" style={{
            background: videoLoaded ? 'transparent' : '#050913',
            position: 'relative'
          }}>
            {/* Video loading overlay */}
            {!videoLoaded && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                background: 'linear-gradient(135deg, #050913 0%, #1a1a2e 50%, #16213e 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 2
              }}>
                <div style={{
                  color: 'white',
                  textAlign: 'center',
                  opacity: 0.7
                }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    border: '3px solid rgba(255,255,255,0.3)',
                    borderTop: '3px solid white',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    margin: '0 auto 16px'
                  }}></div>
                  <div style={{ fontSize: '16px', fontWeight: '500' }}>Loading video...</div>
                </div>
              </div>
            )}

            <OptimizedVideo
              config={videoConfigs.hero}
              className="hero-video"
              priority={true}
              style={{
                opacity: videoLoaded ? 1 : 0,
                transition: 'opacity 0.5s ease'
              }}
              onLoadStart={() => {
                console.log('🎬 Hero video loading started')
                setVideoLoaded(false)
                setHeroVideoReady(false)
              }}
              onCanPlay={() => {
                console.log('✅ Hero video can play')
                setVideoLoaded(true)
                setHeroVideoReady(true) // Signal that hero video is ready, showcase videos can start loading
              }}
              onError={(e) => {
                console.error('❌ Hero video error:', e);
                console.log('🔄 Falling back to gradient background');
                setVideoLoaded(true) // Hide loading overlay even on error
                setHeroVideoReady(true) // Allow showcase videos to load even if hero fails
              }}
            />
            {/* Removed all text content - clean video background only */}
          </div>
          <div className="scroll-down">
            <a href="#features">
              <div className="mouse"></div>
            </a>
          </div>
        </div>
        {/* End Video Hero Section */}

        {/* Start Fetuses Area */}
        <section id="features" className="fetuses-area pt-70">
          <div className="container-fluid">
            <div className="row justify-content-center g-0">
              <div className="col-lg-3 col-md-6">
                <div className="single-fetuses-box" data-aos="fade-up" data-aos-duration="1500">
                  <div className="icon">
                    <i className="fi fi-tr-rocket"></i>
                  </div>
                  <h3>ByteDance Seeded 1.0</h3>
                  <p>World's #1 AI video model. Generate cinematic videos from text or images with unmatched quality and realism. Industry-leading performance.</p>
                  <a href="/video">Try Seeded 1.0</a>
                </div>
              </div>

              <div className="col-lg-3 col-md-6">
                <div className="single-fetuses-box" data-aos="fade-up" data-aos-duration="1500">
                  <div className="icon">
                    <i className="fi fi-tr-video-camera"></i>
                  </div>
                  <h3>Google Veo 3.0</h3>
                  <p>World's #2 AI video model. Google's flagship text-to-video AI model for creating high-quality videos from text prompts with advanced understanding.</p>
                  <a href="/video">Try Veo 3.0</a>
                </div>
              </div>

              <div className="col-lg-3 col-md-6">
                <div className="single-fetuses-box" data-aos="fade-up" data-aos-duration="1500">
                  <div className="icon">
                    <i className="fi fi-tr-picture"></i>
                  </div>
                  <h3>MiniMax Hailuo 02</h3>
                  <p>World's #2 AI video model in image-to-video generation. Transform static images into dynamic videos with exceptional motion quality and realistic animations.</p>
                  <a href="/video">Try Hailuo 02</a>
                </div>
              </div>

              <div className="col-lg-3 col-md-6">
                <div className="single-fetuses-box" data-aos="fade-up" data-aos-duration="1500">
                  <div className="icon">
                    <i className="fi fi-tr-apps"></i>
                  </div>
                  <h3>All Premium AI Models</h3>
                  <p>Access 15+ cutting-edge AI models including Flux, Imagen, DALL-E, and more. Complete creative suite for all your AI generation needs.</p>
                  <a href="/video">Explore All Models</a>
                </div>
              </div>
            </div>
          </div>
        </section>
        {/* End Fetuses Area */}

        {/* Start Seedance 1.0 Showcase Area */}
        <BeamsBackground className="about-area ptb-50">
          <div className="container">
            <div className="row" data-aos="fade-up" data-aos-duration="1500" data-video="seedance" style={{
              display: 'flex',
              alignItems: 'center',
              minHeight: '500px'
            }}>
              {/* Video Player - Left Column */}
              <div className="col-lg-6 col-md-6" style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%'
              }}>
                <div className="video-wrapper" style={{ width: '100%', maxWidth: '600px' }}>
                  <div className="video-container" style={{
                    position: 'relative',
                    width: '100%',
                    paddingBottom: '56.25%',
                    height: 0,
                    overflow: 'hidden'
                  }}>
                  <OptimizedVideo
                    config={videoConfigs.seedance}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      borderRadius: '10px',
                      boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                      objectFit: 'cover'
                    }}
                    onLoadStart={() => console.log('🎬 Seedance video loading...')}
                    onCanPlay={() => console.log('✅ Seedance video ready')}
                    onError={(e) => console.error('❌ Seedance video error:', e)}
                  />
                  </div>
                </div>
              </div>

              {/* Content - Right Column */}
              <div className="col-lg-6 col-md-6" style={{
                display: 'flex',
                alignItems: 'center',
                height: '100%'
              }}>
                <div className="content" style={{
                  width: '100%',
                  paddingLeft: '30px'
                }}>
                  <div className="sub-t" style={{ marginTop: '15px' }}>World's #1 AI Video Model</div>
                  <h2 style={{ marginBottom: '20px' }}>ByteDance Seedance 1.0</h2>
                  <p style={{ marginBottom: '25px', fontSize: '16px', lineHeight: '1.6' }}>
                    Experience the world's most advanced AI video generation model. Create stunning cinematic videos from text prompts or transform images into dynamic scenes with unmatched quality and realism.
                  </p>

                  <div className="seedance-features" style={{ marginBottom: '25px' }}>
                    <h4 style={{ marginBottom: '15px', fontSize: '18px', fontWeight: '600' }}>Sample Prompts:</h4>
                    <div className="prompt-examples">
                      <div className="prompt-item" style={{ marginBottom: '10px', fontSize: '14px', lineHeight: '1.5' }}>
                        <strong>Text-to-Video:</strong> "A majestic dragon soaring through misty mountains at sunset"
                      </div>
                      <div className="prompt-item" style={{ marginBottom: '10px', fontSize: '14px', lineHeight: '1.5' }}>
                        <strong>Image-to-Video:</strong> "Transform a portrait into a cinematic close-up with natural movement"
                      </div>
                      <div className="prompt-item" style={{ marginBottom: '10px', fontSize: '14px', lineHeight: '1.5' }}>
                        <strong>Scene Creation:</strong> "Bustling Tokyo street at night with neon lights and rain"
                      </div>
                    </div>
                  </div>



                  <a className="main-btn" href="/video">
                    <span></span>
                    <i className="ri-play-circle-line"></i> Try Seedance 1.0
                  </a>
                </div>
              </div>
            </div>
          </div>
        </BeamsBackground>
        {/* End Seedance 1.0 Showcase Area */}

        {/* Start Google Veo 3.0 Showcase Area */}
        <BeamsBackground className="about-area ptb-50">
          <div className="container">
            <div className="row" data-aos="fade-up" data-aos-duration="1500" data-video="veo" style={{
              display: 'flex',
              alignItems: 'center',
              minHeight: '500px'
            }}>
              {/* Content - Left Column */}
              <div className="col-lg-6 col-md-6" style={{
                display: 'flex',
                alignItems: 'center',
                height: '100%'
              }}>
                <div className="content" style={{
                  width: '100%',
                  paddingRight: '30px'
                }}>
                  <div className="sub-t">World's #2 AI Video Model</div>
                  <h2 style={{ marginBottom: '20px' }}>Google Veo 3.0</h2>
                  <p style={{ marginBottom: '25px', fontSize: '16px', lineHeight: '1.6' }}>
                    Google's flagship text-to-video AI model for creating high-quality videos from text prompts with advanced understanding and cinematic quality output.
                  </p>

                  <div className="seedance-features" style={{ marginBottom: '25px' }}>
                    <h4 style={{ marginBottom: '15px', fontSize: '18px', fontWeight: '600' }}>Sample Prompts:</h4>
                    <div className="prompt-examples">
                      <div className="prompt-item" style={{ marginBottom: '10px', fontSize: '14px', lineHeight: '1.5' }}>
                        <strong>Text-to-Video:</strong> "A serene lake reflecting autumn colors with gentle ripples"
                      </div>
                      <div className="prompt-item" style={{ marginBottom: '10px', fontSize: '14px', lineHeight: '1.5' }}>
                        <strong>Cinematic Scene:</strong> "Time-lapse of a bustling city transitioning from day to night"
                      </div>
                      <div className="prompt-item" style={{ marginBottom: '10px', fontSize: '14px', lineHeight: '1.5' }}>
                        <strong>Nature Scene:</strong> "Waves crashing against rocky cliffs during golden hour"
                      </div>
                    </div>
                  </div>

                  <a className="main-btn" href="/video">
                    <span></span>
                    <i className="ri-play-circle-line"></i> Try Veo 3.0
                  </a>
                </div>
              </div>

              {/* Video Player - Right Column */}
              <div className="col-lg-6 col-md-6" style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%'
              }}>
                <div className="video-wrapper" style={{ width: '100%', maxWidth: '600px' }}>
                  <div className="video-container" style={{
                    position: 'relative',
                    width: '100%',
                    paddingBottom: '56.25%',
                    height: 0,
                    overflow: 'hidden'
                  }}>
                    <OptimizedVideo
                      config={videoConfigs.veo}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        borderRadius: '10px',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                        objectFit: 'cover'
                      }}
                      onLoadStart={() => console.log('🎬 Veo video loading...')}
                      onCanPlay={() => console.log('✅ Veo video ready')}
                      onError={(e) => console.error('❌ Veo video error:', e)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </BeamsBackground>
        {/* End Google Veo 3.0 Showcase Area */}

        {/* Start MiniMax Hailuo AI Showcase Area */}
        <BeamsBackground className="about-area ptb-50">
          <div className="container">
            <div className="row" data-aos="fade-up" data-aos-duration="1500" data-video="minimax" style={{
              display: 'flex',
              alignItems: 'center',
              minHeight: '500px'
            }}>
              {/* Video Player - Left Column */}
              <div className="col-lg-6 col-md-6" style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%'
              }}>
                <div className="video-wrapper" style={{ width: '100%', maxWidth: '600px' }}>
                  <div className="video-container" style={{
                    position: 'relative',
                    width: '100%',
                    paddingBottom: '56.25%',
                    height: 0,
                    overflow: 'hidden'
                  }}>
                    <OptimizedVideo
                      config={videoConfigs.minimax}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        borderRadius: '10px',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                        objectFit: 'cover'
                      }}
                      onLoadStart={() => console.log('🎬 MiniMax video loading...')}
                      onCanPlay={() => console.log('✅ MiniMax video ready')}
                      onError={(e) => console.error('❌ MiniMax video error:', e)}
                    />
                  </div>
                </div>
              </div>

              {/* Content - Right Column */}
              <div className="col-lg-6 col-md-6" style={{
                display: 'flex',
                alignItems: 'center',
                height: '100%'
              }}>
                <div className="content" style={{
                  width: '100%',
                  paddingLeft: '30px'
                }}>
                  <div className="sub-t">World's #2 AI Video Model in Image-to-Video</div>
                  <h2 style={{ marginBottom: '20px' }}>MiniMax Hailuo AI</h2>
                  <p style={{ marginBottom: '25px', fontSize: '16px', lineHeight: '1.6' }}>
                    Transform static images into dynamic videos with exceptional motion quality and realistic animations. Leading the industry in image-to-video generation technology.
                  </p>

                  <div className="seedance-features" style={{ marginBottom: '25px' }}>
                    <h4 style={{ marginBottom: '15px', fontSize: '18px', fontWeight: '600' }}>Sample Prompts:</h4>
                    <div className="prompt-examples">
                      <div className="prompt-item" style={{ marginBottom: '10px', fontSize: '14px', lineHeight: '1.5' }}>
                        <strong>Image-to-Video:</strong> "Animate a portrait with subtle breathing and eye movements"
                      </div>
                      <div className="prompt-item" style={{ marginBottom: '10px', fontSize: '14px', lineHeight: '1.5' }}>
                        <strong>Scene Animation:</strong> "Bring a landscape photo to life with flowing water and swaying trees"
                      </div>
                      <div className="prompt-item" style={{ marginBottom: '10px', fontSize: '14px', lineHeight: '1.5' }}>
                        <strong>Object Motion:</strong> "Add realistic movement to static objects in architectural photos"
                      </div>
                    </div>
                  </div>

                  <a className="main-btn" href="/video">
                    <span></span>
                    <i className="ri-play-circle-line"></i> Try Hailuo AI
                  </a>
                </div>
              </div>
            </div>
          </div>
        </BeamsBackground>
        {/* End MiniMax Hailuo AI Showcase Area */}

        {/* Start Brands Area */}
        <div className="brands-area pt-70 pb-70">
          <div className="container">
            <div className="row justify-content-between align-items-center">
              <div className="col-lg-2 col-md-2 col-6" data-aos="fade-up" data-aos-duration="1000">
                <div className="image">
                  <img src="/ainext-template/assets/img/01.png" alt="image" />
                </div>
              </div>
              <div className="col-lg-2 col-md-2 col-6" data-aos="fade-up" data-aos-duration="1000">
                <div className="image">
                  <img src="/ainext-template/assets/img/02.png" alt="image" />
                </div>
              </div>
              <div className="col-lg-2 col-md-2 col-6" data-aos="fade-up" data-aos-duration="1000">
                <div className="image">
                  <img src="/ainext-template/assets/img/03.png" alt="image" />
                </div>
              </div>
              <div className="col-lg-2 col-md-2 col-6" data-aos="fade-up" data-aos-duration="1000">
                <div className="image">
                  <img src="/ainext-template/assets/img/04.png" alt="image" />
                </div>
              </div>
              <div className="col-lg-2 col-md-2 col-6" data-aos="fade-up" data-aos-duration="1000">
                <div className="image">
                  <img src="/ainext-template/assets/img/05.png" alt="image" />
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* End Brands Area */}

        {/* Start Interactive Selector Section */}
        <BeamsBackground className="w-full h-[800px] flex items-center justify-center">
          <InteractiveSelector />
        </BeamsBackground>
        {/* End Interactive Selector Section */}

        {/* Start Gallery Area */}
        <div className="gallery-area ptb-100">
          <div className="container">
            <div className="gallery-table" data-aos="fade-up" data-aos-duration="1500">
              <div className="section-title">
                <div className="width">
                  <div className="sub-t">Image Generation</div>
                  <h2>Unveil New Creative Horizons with Models</h2>
                </div>

                <ul className="">
                  <li className="item-list play on" data-filter="All">All</li>
                  <li className="item-list play" data-filter="Brand">Brand</li>
                  <li className="item-list play" data-filter="Design">Design</li>
                  <li className="item-list play" data-filter="Motion">Motion</li>
                  <li className="item-list play" data-filter="Printing">Printing</li>
                </ul>

              </div>

              <div className="gallery">
                <div className="item-box All Brand">
                  <img src="/ainext-template/assets/img/gallery/gallery-image1.jpg" alt="image" loading="lazy" />
                </div>
                <div className="item-box All Design">
                  <img src="/ainext-template/assets/img/gallery/gallery-image16.jpg" alt="image" loading="lazy" />
                </div>
                <div className="item-box All Design">
                  <img src="/ainext-template/assets/img/gallery/gallery-image11.jpg" alt="image" loading="lazy" />
                </div>
                <div className="item-box All Printing">
                  <img src="/ainext-template/assets/img/gallery/gallery-image2.jpg" alt="image" loading="lazy" />
                </div>
                <div className="item-box All Printing">
                  <img src="/ainext-template/assets/img/gallery/gallery-image7.jpg" alt="image" loading="lazy" />
                </div>
                <div className="item-box All Printing">
                  <img src="/ainext-template/assets/img/gallery/gallery-image3.jpg" alt="image" loading="lazy" />
                </div>
                <div className="item-box All Printing">
                  <img src="/ainext-template/assets/img/gallery/gallery-image4.jpg" alt="image" loading="lazy" />
                </div>
                <div className="item-box All Brand">
                  <img src="/ainext-template/assets/img/gallery/gallery-image6.jpg" alt="image" loading="lazy" />
                </div>
                <div className="item-box All Motion">
                  <img src="/ainext-template/assets/img/gallery/gallery-image8.jpg" alt="image" loading="lazy" />
                </div>
                <div className="item-box All Design">
                  <img src="/ainext-template/assets/img/gallery/gallery-image15.jpg" alt="image" loading="lazy" />
                </div>
                <div className="item-box All Design">
                  <img src="/ainext-template/assets/img/gallery/gallery-image13.jpg" alt="image" loading="lazy" />
                </div>
                <div className="item-box All Design">
                  <img src="/ainext-template/assets/img/gallery/gallery-image12.jpg" alt="image" loading="lazy" />
                </div>
                <div className="item-box All Design">
                  <img src="/ainext-template/assets/img/gallery/gallery-image17.jpg" alt="image" loading="lazy" />
                </div>
              </div>
              <div className="gallery-btn">
                <a className="main-btn" href="/portfolio"><span></span><i className="ri-function-line"></i> View All Images</a>
              </div>
            </div>
          </div>
        </div>
        {/* End Gallery Area */}

        {/* Pay-As-You-Go Section */}
        <PayAsYouGo />

        {/* Start Pricing Area */}
        <div className="pricing-area pt-100 section-bg">
          <div className="section-title-center">
            <div className="width">
              <div className="sub-t">Best Pricing Plans</div>
              <h2>Choose Your Creative Journey</h2>
              <p>Transparent yearly pricing with no hidden fees. Start creating with AI today!</p>
            </div>
          </div>
          <div className="container">
            <div className="row justify-content-center">
              <div className="col-lg-3 col-md-6">
                <div className="card">
                  <h2 className="card_title"><i className="ri-seedling-line"></i> Starter</h2>
                  <h3 className="pricing">₹360<span className="small">/per year</span></h3>
                  <div className="credits-info">
                    <p className="credits">18,000 Credits</p>
                    <p className="monthly-avg">~1,500/month</p>
                  </div>
                  <hr />
                  <ul className="features">
                    <li>Image Generation</li>
                    <li>Video Generation</li>
                    <li>Image Upscaling</li>
                    <li>Email Support</li>
                  </ul>
                  <a href="/pricing-ainext" className="cta_btn">Get Started</a>
                </div>
              </div>
              <div className="col-lg-3 col-md-6">
                <div className="card active">
                  <div className="popular-badge">Most Popular</div>
                  <h2 className="card_title"><i className="ri-vip-crown-line"></i> Pro</h2>
                  <h3 className="pricing">₹937<span className="small">/per year</span></h3>
                  <div className="credits-info">
                    <p className="credits">46,850 Credits</p>
                    <p className="monthly-avg">~3,904/month</p>
                  </div>
                  <hr />
                  <ul className="features">
                    <li>Advanced Models</li>
                    <li>Priority Processing</li>
                    <li>Priority Support</li>
                    <li>Analytics</li>
                  </ul>
                  <a href="/pricing-ainext" className="cta_btn">Get Started</a>
                </div>
              </div>
              <div className="col-lg-3 col-md-6">
                <div className="card">
                  <h2 className="card_title"><i className="ri-building-line"></i> Business</h2>
                  <h3 className="pricing">₹4,185<span className="small">/per year</span></h3>
                  <div className="credits-info">
                    <p className="credits">209,250 Credits</p>
                    <p className="monthly-avg">~17,437/month</p>
                  </div>
                  <hr />
                  <ul className="features">
                    <li>Premium Models</li>
                    <li>API Access</li>
                    <li>Team Features</li>
                    <li>Dedicated Support</li>
                  </ul>
                  <a href="/pricing-ainext" className="cta_btn">Get Started</a>
                </div>
              </div>
              <div className="col-lg-3 col-md-6">
                <div className="card">
                  <h2 className="card_title"><i className="ri-rocket-line"></i> Enterprise</h2>
                  <h3 className="pricing">₹8,850<span className="small">/per year</span></h3>
                  <div className="credits-info">
                    <p className="credits">442,500 Credits</p>
                    <p className="monthly-avg">~36,875/month</p>
                  </div>
                  <hr />
                  <ul className="features">
                    <li>Unlimited Premium</li>
                    <li>White Label</li>
                    <li>Custom Integration</li>
                    <li>24/7 Support</li>
                  </ul>
                  <a href="/contact-ainext" className="cta_btn">Contact Sales</a>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* End Pricing Area */}



        {/* Start Insta Gallery */}
        <div className="insta-gallery">
          <div className="conatiner-fluid">
            <div className="ins-gallery owl-carousel owl-theme">
              <div className="items">
                <a href="https://www.instagram.com/" target="_blank" >
                  <img src="/ainext-template/assets/img/gallery/insta-1.jpg" alt="image" loading="lazy" />
                  <i className="ri-instagram-line"></i>
                </a>
              </div>
              <div className="items">
                <a href="https://www.instagram.com/" target="_blank" >
                  <img src="/ainext-template/assets/img/gallery/insta-10.jpg" alt="image" loading="lazy" />
                  <i className="ri-instagram-line"></i>
                </a>
              </div>
              <div className="items">
                <a href="https://www.instagram.com/" target="_blank" >
                  <img src="/ainext-template/assets/img/gallery/insta-2.jpg" alt="image" loading="lazy" />
                  <i className="ri-instagram-line"></i>
                </a>
              </div>
              <div className="items">
                <a href="https://www.instagram.com/" target="_blank" >
                  <img src="/ainext-template/assets/img/gallery/insta-3.jpg" alt="image" loading="lazy" />
                  <i className="ri-instagram-line"></i>
                </a>
              </div>
              <div className="items">
                <a href="https://www.instagram.com/" target="_blank" >
                  <img src="/ainext-template/assets/img/gallery/insta-4.jpg" alt="image" loading="lazy" />
                  <i className="ri-instagram-line"></i>
                </a>
              </div>
              <div className="items">
                <a href="https://www.instagram.com/" target="_blank" >
                  <img src="/ainext-template/assets/img/gallery/insta-5.jpg" alt="image" loading="lazy" />
                  <i className="ri-instagram-line"></i>
                </a>
              </div>
              <div className="items">
                <a href="https://www.instagram.com/" target="_blank" >
                  <img src="/ainext-template/assets/img/gallery/insta-6.jpg" alt="image" loading="lazy" />
                  <i className="ri-instagram-line"></i>
                </a>
              </div>
              <div className="items">
                <a href="https://www.instagram.com/" target="_blank" >
                  <img src="/ainext-template/assets/img/gallery/insta-7.jpg" alt="image" loading="lazy" />
                  <i className="ri-instagram-line"></i>
                </a>
              </div>
              <div className="items">
                <a href="https://www.instagram.com/" target="_blank" >
                  <img src="/ainext-template/assets/img/gallery/insta-8.jpg" alt="image" loading="lazy" />
                  <i className="ri-instagram-line"></i>
                </a>
              </div>
              <div className="items">
                <a href="https://www.instagram.com/" target="_blank" >
                  <img src="/ainext-template/assets/img/gallery/insta-9.jpg" alt="image" loading="lazy" />
                  <i className="ri-instagram-line"></i>
                </a>
              </div>
            </div>
          </div>
        </div>
        {/* End Insta Gallery */}

        {/* Start Footer Area */}
        <footer className="footer-area">
          <div className="container">
            <div className="footer-top-area pt-100 pb-70">
              <div className="row align-items-start">
                <div className="col-lg-4 col-md-6 col-sm-12">
                  <div className="single-footer-widget">
                    <a href="/" className="logo">
                      <img src="/ainext-template/assets/img/main logo.svg" alt="Gensy Logo" style={{height: '130px', width: 'auto'}} />
                    </a>
                    <p>The platform for transforming your creative ideas into breathtaking AI-generated videos, art, and images in seconds</p>
                    <ul className="social-links">
                      <li><a href="https://www.facebook.com/" target="_blank"><i className="ri-facebook-fill"></i></a></li>
                      <li><a href="https://www.instagram.com/" target="_blank"><i className="ri-instagram-line"></i></a></li>
                      <li><a href="https://www.linkedin.com/" target="_blank"><i className="ri-linkedin-fill"></i></a></li>
                      <li><a href="https://www.youtube.com/" target="_blank"><i className="ri-youtube-line"></i></a></li>
                    </ul>
                  </div>
                </div>
                <div className="col-lg-4 col-md-3 col-sm-6">
                  <div className="single-footer-widget">
                    <h3>Links</h3>
                    <ul className="links-list">
                      <li><a href="/">Home</a></li>
                      <li><a href="/about">About Us</a></li>
                      <li><a href="/pricing">Pricing</a></li>
                    </ul>
                  </div>
                </div>
                <div className="col-lg-4 col-md-3 col-sm-6">
                  <div className="single-footer-widget">
                    <h3>Legal</h3>
                    <ul className="links-list">
                      <li><a href="/terms-conditions">Terms & Conditions</a></li>
                      <li><a href="/pricing">Payment Method</a></li>
                      <li><a href="/privacy-policy">Privacy Policy</a></li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            <div className="pr-line"></div>
            <div className="footer-bottom-area">
              <p>© Copyright | <a href="https://gensy.io" target="_blank">Gensy</a>  | All Rights Reserved is Proudly </p>
            </div>
          </div>
          <div className="lines">
            <div className="line"></div>
            <div className="line"></div>
            <div className="line"></div>
          </div>
        </footer>
        {/* End Footer Area */}

        {/* Start Top to Bottom */}
        <div id="progress">
          <span id="progress-value"><i className="ri-arrow-up-line"></i></span>
        </div>
        {/* End Top to Bottom */}
    </div>
  )
}
