'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { heroVideoConfig } from '@/config/hero-video'
import { BeamsBackground } from '@/components/ui/beams-background'
import PerformanceMonitor from '@/components/PerformanceMonitor'
import InteractiveSelector from '@/components/ui/interactive-selector'
import {
  loadCriticalResources,
  loadNonCriticalResources,
  runWhenIdle,
  measurePerformance
} from '@/lib/performance'

export default function AiNextTemplate() {
  const { isSignedIn } = useAuth()
  const router = useRouter()
  const [isLoaded, setIsLoaded] = useState(false)
  const [videoLoaded, setVideoLoaded] = useState(false)



  useEffect(() => {
    let isMounted = true

    const initializePage = async () => {
      try {
        // Load critical resources with performance measurement
        measurePerformance('Critical Resources Loading', async () => {
          await loadCriticalResources()
        })

        if (!isMounted) return

        // Set initial load state
        setIsLoaded(true)

        // Load non-critical resources in the background
        runWhenIdle(() => {
          measurePerformance('Non-Critical Resources Loading', () => {
            loadNonCriticalResources()
          })
        })

        // Resources loaded successfully

      } catch (error) {
        console.error('Error initializing page:', error)
        if (isMounted) {
          setIsLoaded(true) // Don't block the UI on errors
        }
      }
    }

    initializePage()

    return () => {
      isMounted = false
    }
  }, [])

  return (
    <div className={`landing-page ${isLoaded ? 'loaded' : 'loading'}`}>
      <PerformanceMonitor />
      <style dangerouslySetInnerHTML={{
        __html: `
          .landing-page.loading {
            opacity: 0;
            transform: translateY(20px);
          }

          .landing-page.loaded {
            opacity: 1;
            transform: translateY(0);
            transition: all 0.6s ease;
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
                <li className="nav-item">
                  <a href="/landing-page-2" className="nav-link active">
                    Home
                  </a>
                </li>
                <li className="nav-item">
                  <a href="javascript:void(0)" className="dropdown-toggle nav-link">
                    Pages
                  </a>
                  <ul className="dropdown-menu">
                    <li className="nav-item">
                      <a href="/about" className="nav-link">
                        About Us
                      </a>
                    </li>
                    <li className="nav-item">
                      <a href="/team-ainext" className="nav-link">
                        Team
                      </a>
                    </li>
                    <li className="nav-item">
                      <a href="/pricing-ainext" className="nav-link">
                        Pricing
                      </a>
                    </li>
                    <li className="nav-item">
                      <a href="/terms-conditions" className="nav-link">
                        Terms & Conditions
                      </a>
                    </li>
                    <li className="nav-item">
                      <a href="/privacy-policy" className="nav-link">
                        Privacy Policy
                      </a>
                    </li>
                    <li className="nav-item">
                      <a href="/not-found-ainext" className="nav-link">
                        404 Error Page
                      </a>
                    </li>
                  </ul>
                </li>
                <li className="nav-item">
                  <a href="/portfolio-ainext" className="nav-link">
                    Portfolio
                  </a>
                </li>
                <li className="nav-item">
                  <a href="javascript:void(0)" className="dropdown-toggle nav-link">
                    Blog
                  </a>
                  <ul className="dropdown-menu">
                    <li className="nav-item">
                      <a href="/blog-ainext" className="nav-link">
                        Blog Grid
                      </a>
                    </li>
                    <li className="nav-item">
                      <a href="/blog-ainext" className="nav-link">
                        Blog Right Sidebar
                      </a>
                    </li>
                    <li className="nav-item">
                      <a href="/blog-ainext" className="nav-link">
                        Blog Details
                      </a>
                    </li>
                  </ul>
                </li>
                <li className="nav-item">
                  <a href="/contact-ainext" className="nav-link">
                    Contact Us
                  </a>
                </li>
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
              <li className="responsive-menu-list without-icon">
                <a href="/landing-page-2" className="active">Home</a>
              </li>
              <li className="responsive-menu-list"><a href="javascript:void(0);" >Pages</a>
                <ul className="responsive-menu-items">
                  <li><a href="/about">About</a></li>
                  <li><a href="/team-ainext">Team</a></li>
                  <li><a href="/pricing-ainext">Pricing</a></li>
                  <li><a href="/terms-conditions">Terms Conditions</a></li>
                  <li><a href="/privacy-policy">Privacy Policy</a></li>
                  <li><a href="/not-found-ainext">404 Error Page</a></li>
                </ul>
              </li>
              <li className="responsive-menu-list without-icon">
                <a href="/portfolio-ainext">Portfolio</a>
              </li>

              <li className="responsive-menu-list"><a href="javascript:void(0);">Blog</a>
                <ul className="responsive-menu-items">
                  <li><a href="/blog-ainext">Blog</a></li>
                  <li><a href="/blog-ainext">Blog Right Sidebar</a></li>
                  <li><a href="/blog-ainext">Blog Details</a></li>
                </ul>
              </li>
              <li className="responsive-menu-list without-icon">
                <a href="/contact-ainext">Contact</a>
              </li>
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

            <video
              autoPlay
              muted
              loop
              playsInline
              className="hero-video"
              preload="auto"
              style={{
                opacity: videoLoaded ? 1 : 0,
                transition: 'opacity 0.5s ease'
              }}
              onLoadStart={() => {
                console.log('🎬 Video loading started:', heroVideoConfig.videoSrc)
                setVideoLoaded(false)
              }}
              onCanPlay={() => {
                console.log('✅ Video can play')
                setVideoLoaded(true)
              }}
              onPlay={() => console.log('▶️ Video started playing')}
              onError={(e) => {
                console.error('❌ Video error:', e);
                console.log('🔄 Falling back to gradient background');
                setVideoLoaded(true) // Hide loading overlay even on error
                // Fallback to gradient background if video fails to load
                const videoElement = e.target as HTMLVideoElement;
                videoElement.style.display = 'none';
                const container = videoElement.parentElement;
                if (container) {
                  container.style.background = 'linear-gradient(135deg, #050913 0%, #1a1a2e 50%, #16213e 100%)';
                }
              }}
              onLoadedData={() => {
                console.log('📊 Video data loaded');
                setVideoLoaded(true)
                // Force play if autoplay didn't work
                const video = document.querySelector('.hero-video') as HTMLVideoElement;
                if (video && video.paused) {
                  video.play().catch(e => console.log('Manual play failed:', e));
                }
              }}
            >
              <source src={heroVideoConfig.videoSrc} type="video/mp4" />
              <source src={heroVideoConfig.videoSrc} type="video/webm" />
              Your browser does not support the video tag.
            </video>
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
            <div className="row" data-aos="fade-up" data-aos-duration="1500" style={{
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
                  <video
                    controls
                    autoPlay
                    muted
                    loop
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
                  >
                    <source src="/videos/seedream.mp4.mp4" type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
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
            <div className="row" data-aos="fade-up" data-aos-duration="1500" style={{
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
                    <video
                      controls
                      autoPlay
                      muted
                      loop
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
                    >
                      <source src="/videos/veo 3.mp4.mp4" type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
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
            <div className="row" data-aos="fade-up" data-aos-duration="1500" style={{
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
                    <video
                      controls
                      autoPlay
                      muted
                      loop
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
                    >
                      <source src="/videos/minimax.mp4.mp4" type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
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
        <div className="w-full h-min-screen">
          <InteractiveSelector />
        </div>
        {/* End Interactive Selector Section */}

        {/* Start Features Section */}
        <div className="features-section ptb-100 bg-light">
          <div className="container">
            <div className="row">
              <div className="col-lg-12">
                <div className="section-title text-center mb-5">
                  <div className="sub-t">Why Choose Gensy</div>
                  <h2>Powerful Features for Creative Professionals</h2>
                  <p>Discover the advanced capabilities that make Gensy the ultimate AI creative platform</p>
                </div>
              </div>
            </div>

            <div className="row">
              <div className="col-lg-4 col-md-6 mb-4">
                <div className="single-feature-box" data-aos="fade-up" data-aos-duration="1500">
                  <div className="icon mb-3">
                    <i className="ri-rocket-line" style={{fontSize: '40px', color: '#667eea'}}></i>
                  </div>
                  <h4 className="mb-3">Lightning Fast</h4>
                  <p>Generate high-quality content in seconds with our optimized AI infrastructure and cutting-edge models.</p>
                </div>
              </div>

              <div className="col-lg-4 col-md-6 mb-4">
                <div className="single-feature-box" data-aos="fade-up" data-aos-duration="1700">
                  <div className="icon mb-3">
                    <i className="ri-shield-check-line" style={{fontSize: '40px', color: '#667eea'}}></i>
                  </div>
                  <h4 className="mb-3">Enterprise Security</h4>
                  <p>Your data is protected with enterprise-grade security, encryption, and privacy controls you can trust.</p>
                </div>
              </div>

              <div className="col-lg-4 col-md-6 mb-4">
                <div className="single-feature-box" data-aos="fade-up" data-aos-duration="1900">
                  <div className="icon mb-3">
                    <i className="ri-palette-line" style={{fontSize: '40px', color: '#667eea'}}></i>
                  </div>
                  <h4 className="mb-3">Multiple AI Models</h4>
                  <p>Access 15+ cutting-edge AI models including Flux, Imagen, DALL-E, ByteDance Seeded, and Google Veo.</p>
                </div>
              </div>

              <div className="col-lg-4 col-md-6 mb-4">
                <div className="single-feature-box" data-aos="fade-up" data-aos-duration="2100">
                  <div className="icon mb-3">
                    <i className="ri-download-cloud-line" style={{fontSize: '40px', color: '#667eea'}}></i>
                  </div>
                  <h4 className="mb-3">Easy Export</h4>
                  <p>Download your creations in multiple formats with dynamic naming and organize your creative library.</p>
                </div>
              </div>

              <div className="col-lg-4 col-md-6 mb-4">
                <div className="single-feature-box" data-aos="fade-up" data-aos-duration="2300">
                  <div className="icon mb-3">
                    <i className="ri-team-line" style={{fontSize: '40px', color: '#667eea'}}></i>
                  </div>
                  <h4 className="mb-3">Team Collaboration</h4>
                  <p>Work together with your team, share projects, and manage creative workflows seamlessly.</p>
                </div>
              </div>

              <div className="col-lg-4 col-md-6 mb-4">
                <div className="single-feature-box" data-aos="fade-up" data-aos-duration="2500">
                  <div className="icon mb-3">
                    <i className="ri-settings-3-line" style={{fontSize: '40px', color: '#667eea'}}></i>
                  </div>
                  <h4 className="mb-3">Advanced Controls</h4>
                  <p>Fine-tune your generations with advanced parameters, styles, and quality settings for perfect results.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* End Features Section */}

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
                  <img src="/ainext-template/assets/img/gallery/gallery-image1.jpg" alt="image" />
                </div>
                <div className="item-box All Design">
                  <img src="/ainext-template/assets/img/gallery/gallery-image16.jpg" alt="image" />
                </div>
                <div className="item-box All Design">
                  <img src="/ainext-template/assets/img/gallery/gallery-image11.jpg" alt="image" />
                </div>
                <div className="item-box All Printing">
                  <img src="/ainext-template/assets/img/gallery/gallery-image2.jpg" alt="image" />
                </div>
                <div className="item-box All Printing">
                  <img src="/ainext-template/assets/img/gallery/gallery-image7.jpg" alt="image" />
                </div>
                <div className="item-box All Printing">
                  <img src="/ainext-template/assets/img/gallery/gallery-image3.jpg" alt="image" />
                </div>
                <div className="item-box All Printing">
                  <img src="/ainext-template/assets/img/gallery/gallery-image4.jpg" alt="image" />
                </div>
                <div className="item-box All Brand">
                  <img src="/ainext-template/assets/img/gallery/gallery-image6.jpg" alt="image" />
                </div>
                <div className="item-box All Motion">
                  <img src="/ainext-template/assets/img/gallery/gallery-image8.jpg" alt="image" />
                </div>
                <div className="item-box All Design">
                  <img src="/ainext-template/assets/img/gallery/gallery-image15.jpg" alt="image" />
                </div>
                <div className="item-box All Design">
                  <img src="/ainext-template/assets/img/gallery/gallery-image13.jpg" alt="image" />
                </div>
                <div className="item-box All Design">
                  <img src="/ainext-template/assets/img/gallery/gallery-image12.jpg" alt="image" />
                </div>
                <div className="item-box All Design">
                  <img src="/ainext-template/assets/img/gallery/gallery-image17.jpg" alt="image" />
                </div>
              </div>
              <div className="gallery-btn">
                <a className="main-btn" href="/portfolio-ainext"><span></span><i className="ri-function-line"></i> View All Images</a>
              </div>
            </div>
          </div>
        </div>
        {/* End Gallery Area */}

        {/* Start Testimonial Area */}
        <div className="testimonial-area ptb-100">
          <div className="container">
            <div className="testimonial-content owl-carousel owl-theme">
              <div className="testimonial-item">
                <ul>
                  <li><i className="ri-star-s-fill"></i></li>
                  <li><i className="ri-star-s-fill"></i></li>
                  <li><i className="ri-star-s-fill"></i></li>
                  <li><i className="ri-star-s-fill"></i></li>
                  <li><i className="ri-star-s-fill"></i></li>
                </ul>
                <p>It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout. The point of using</p>
                <h4>Aloin Lden</h4>
                <span>Web Developer</span>
              </div>
              <div className="testimonial-item">
                <ul>
                  <li><i className="ri-star-s-fill"></i></li>
                  <li><i className="ri-star-s-fill"></i></li>
                  <li><i className="ri-star-s-fill"></i></li>
                  <li><i className="ri-star-s-fill"></i></li>
                  <li><i className="ri-star-s-fill"></i></li>
                </ul>
                <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit. In aut, tempora iste quidem ipsa eos. Mollitia, illo, nisi laboriosam nostrum</p>
                <h4>Jacob Daniels</h4>
                <span>Engineer</span>
              </div>
            </div>
            <div className="user">
              <img src="/ainext-template/assets/img/user-1.jpg" alt="image" />
            </div>
            <div className="user">
              <img src="/ainext-template/assets/img/user-2.jpg" alt="image" />
            </div>
            <div className="user">
              <img src="/ainext-template/assets/img/user-3.jpg" alt="image" />
            </div>
            <div className="user">
              <img src="/ainext-template/assets/img/user-4.jpg" alt="image" />
            </div>
          </div>
          <div className="star"></div>
          <div className="star"></div>
          <div className="star"></div>
          <div className="star"></div>
          <div className="star"></div>
        </div>
        {/* End Testimonial Area */}

        {/* Start Pricing Area */}
        <div className="pricing-area pt-100 section-bg">
          <div className="section-title-center">
            <div className="width">
              <div className="sub-t">Best Pricing Plans</div>
              <h2>Our Pricing Plans</h2>
            </div>
          </div>
          <div className="container">
            <div className="row justify-content-center">
              <div className="col-lg-4 col-md-6">
                <div className="card">
                  <h2 className="card_title"><i className="ri-vip-crown-line"></i> Student</h2>
                  <h3 className="pricing">$20<span className="small">/per month</span></h3>
                  <hr />
                  <ul className="features">
                    <li>One account</li>
                    <li>Unlimited Projects</li>
                    <li>Download prototypes</li>
                  </ul>
                  <a href="/contact-ainext" className="cta_btn">Buy Now</a>
                </div>
              </div>
              <div className="col-lg-4 col-md-6">
                <div className="card active">
                  <h2 className="card_title"><i className="ri-vip-crown-line"></i> Personal</h2>
                  <h3 className="pricing">$39<span className="small">/per month</span></h3>
                  <hr />
                  <ul className="features">
                    <li>One account</li>
                    <li>Unlimited Projects</li>
                    <li>Download prototypes</li>
                  </ul>
                  <a href="/contact-ainext" className="cta_btn">Buy Now</a>
                </div>
              </div>
              <div className="col-lg-4 col-md-6">
                <div className="card">
                  <h2 className="card_title"><i className="ri-vip-crown-line"></i> Family</h2>
                  <h3 className="pricing">$60<span className="small">/per month</span></h3>
                  <hr />
                  <ul className="features">
                    <li>One account</li>
                    <li>Unlimited Projects</li>
                    <li>Download prototypes</li>
                  </ul>
                  <a href="/contact-ainext" className="cta_btn">Buy Now</a>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* End Pricing Area */}

        {/* Start Article Area */}
        <div className="article-area ptb-100">
          <div className="container">
            <div className="row">
              <div className="col-lg-4">
                <div className="section-title">
                  <div className="width">
                    <div className="sub-t">Our Latest News</div>
                    <h2>Latest News & Articles</h2>
                    <a className="main-btn" href="/blog-ainext"><span></span><i className="ri-pencil-line"></i> See More</a>
                  </div>
                </div>
              </div>
              <div className="col-lg-8">
                <div className="article-content owl-carousel owl-theme">
                  <div className="item">
                    <img src="/ainext-template/assets/img/blogs/artical-1.jpg" alt="image" />
                    <div className="pop-content">
                      <h3><a href="/blog-ainext">The actual history of machine intelligence</a></h3>
                      <ul>
                        <li>March 18, 2022</li>
                        <li><span>0</span>Comments</li>
                      </ul>
                    </div>
                    <a href="/blog-ainext">
                      <div className="go-corner">
                        <div className="go-arrow">
                          <i className="ri-arrow-right-up-line"></i>
                        </div>
                      </div>
                    </a>
                  </div>
                  <div className="item">
                    <img src="/ainext-template/assets/img/blogs/artical-3.jpg" alt="image" />
                    <div className="pop-content">
                      <h3><a href="/blog-ainext">The actual history of machine intelligence</a></h3>
                      <ul>
                        <li>March 18, 2022</li>
                        <li><span>0</span>Comments</li>
                      </ul>
                    </div>
                    <a href="/blog-ainext">
                      <div className="go-corner">
                        <div className="go-arrow">
                          <i className="ri-arrow-right-up-line"></i>
                        </div>
                      </div>
                    </a>
                  </div>
                  <div className="item">
                    <img src="/ainext-template/assets/img/blogs/artical-2.jpg" alt="image" />
                    <div className="pop-content">
                      <h3><a href="/blog-ainext">The actual history of machine intelligence</a></h3>
                      <ul>
                        <li>March 18, 2022</li>
                        <li><span>0</span>Comments</li>
                      </ul>
                    </div>
                    <a href="/blog-ainext">
                      <div className="go-corner">
                        <div className="go-arrow">
                          <i className="ri-arrow-right-up-line"></i>
                        </div>
                      </div>
                    </a>
                  </div>
                  <div className="item">
                    <img src="/ainext-template/assets/img/blogs/artical-4.jpg" alt="image" />
                    <div className="pop-content">
                      <h3><a href="/blog-ainext">The actual history of machine intelligence</a></h3>
                      <ul>
                        <li>March 18, 2022</li>
                        <li><span>0</span>Comments</li>
                      </ul>
                    </div>
                    <a href="/blog-ainext">
                      <div className="go-corner">
                        <div className="go-arrow">
                          <i className="ri-arrow-right-up-line"></i>
                        </div>
                      </div>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* End Article Area */}

        {/* Start Insta Gallery */}
        <div className="insta-gallery">
          <div className="conatiner-fluid">
            <div className="ins-gallery owl-carousel owl-theme">
              <div className="items">
                <a href="https://www.instagram.com/" target="_blank" >
                  <img src="/ainext-template/assets/img/gallery/insta-1.jpg" alt="image" />
                  <i className="ri-instagram-line"></i>
                </a>
              </div>
              <div className="items">
                <a href="https://www.instagram.com/" target="_blank" >
                  <img src="/ainext-template/assets/img/gallery/insta-10.jpg" alt="image" />
                  <i className="ri-instagram-line"></i>
                </a>
              </div>
              <div className="items">
                <a href="https://www.instagram.com/" target="_blank" >
                  <img src="/ainext-template/assets/img/gallery/insta-2.jpg" alt="image" />
                  <i className="ri-instagram-line"></i>
                </a>
              </div>
              <div className="items">
                <a href="https://www.instagram.com/" target="_blank" >
                  <img src="/ainext-template/assets/img/gallery/insta-3.jpg" alt="image" />
                  <i className="ri-instagram-line"></i>
                </a>
              </div>
              <div className="items">
                <a href="https://www.instagram.com/" target="_blank" >
                  <img src="/ainext-template/assets/img/gallery/insta-4.jpg" alt="image" />
                  <i className="ri-instagram-line"></i>
                </a>
              </div>
              <div className="items">
                <a href="https://www.instagram.com/" target="_blank" >
                  <img src="/ainext-template/assets/img/gallery/insta-5.jpg" alt="image" />
                  <i className="ri-instagram-line"></i>
                </a>
              </div>
              <div className="items">
                <a href="https://www.instagram.com/" target="_blank" >
                  <img src="/ainext-template/assets/img/gallery/insta-6.jpg" alt="image" />
                  <i className="ri-instagram-line"></i>
                </a>
              </div>
              <div className="items">
                <a href="https://www.instagram.com/" target="_blank" >
                  <img src="/ainext-template/assets/img/gallery/insta-7.jpg" alt="image" />
                  <i className="ri-instagram-line"></i>
                </a>
              </div>
              <div className="items">
                <a href="https://www.instagram.com/" target="_blank" >
                  <img src="/ainext-template/assets/img/gallery/insta-8.jpg" alt="image" />
                  <i className="ri-instagram-line"></i>
                </a>
              </div>
              <div className="items">
                <a href="https://www.instagram.com/" target="_blank" >
                  <img src="/ainext-template/assets/img/gallery/insta-9.jpg" alt="image" />
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
            <div className="footer-top-area pt-100">
              <div className="row">
                <div className="col-lg-4 col-md-6 col-sm-6">
                  <div className="single-footer-widget">
                    <a href="index.html" className="logo">
                      <img src="/ainext-template/assets/img/main logo.svg" alt="Gensy Logo" style={{height: '130px', width: 'auto'}} />
                    </a>
                    <p>Lorem ipsum amet, consectetur adipiscing elit. Suspendis varius enim eros elementum tristique. Duis cursus.</p>
                    <ul className="social-links">
                      <li><a href="https://www.facebook.com/" target="_blank"><i className="ri-facebook-fill"></i></a></li>
                      <li><a href="https://www.instagram.com/" target="_blank"><i className="ri-instagram-line"></i></a></li>
                      <li><a href="https://www.linkedin.com/" target="_blank"><i className="ri-linkedin-fill"></i></a></li>
                      <li><a href="https://www.youtube.com/" target="_blank"><i className="ri-youtube-line"></i></a></li>
                    </ul>
                  </div>
                </div>
                <div className="col-lg-2 col-md-6 col-sm-6">
                  <div className="single-footer-widget pl-5">
                    <h3>Links</h3>
                    <ul className="links-list">
                      <li><a href="/landing-page-2">Home</a></li>
                      <li><a href="/about">About Us</a></li>
                      <li><a href="/pricing-ainext">Pricing</a></li>
                      <li><a href="/blog-ainext">Blog</a></li>
                      <li><a href="/contact-ainext">Contact Us</a></li>
                    </ul>
                  </div>
                </div>
                <div className="col-lg-2 col-md-6 col-sm-6">
                  <div className="single-footer-widget">
                    <h3>Legal</h3>
                    <ul className="links-list">
                      <li><a href="/terms-conditions">Legal</a></li>
                      <li><a href="/terms-conditions">Terms of Use</a></li>
                      <li><a href="/terms-conditions">Terms & Conditions</a></li>
                      <li><a href="/pricing-ainext">Payment Method</a></li>
                      <li><a href="/privacy-policy">Privacy Policy</a></li>
                    </ul>
                  </div>
                </div>
                <div className="col-lg-4 col-md-6 col-sm-6">
                  <div className="single-footer-widget">
                    <h3>Newsletter</h3>
                    <div className="footer-newsletter-info">
                      <p>Join over <span>68,000</span> people getting our emails Lorem ipsum dolor sit amet consectet </p>
                      <form className="newsletter-form" data-toggle="validator">
                        <label><i className='bx bx-envelope-open'></i></label>
                        <input type="text" className="input-newsletter" placeholder="Enter your email address" name="EMAIL" required autoComplete="off" />
                        <button type="submit" className="default-btn"><i className="ri-send-plane-line"></i> Subscribe Now</button>
                        <div id="validator-newsletter2" className="form-result"></div>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="pr-line"></div>
            <div className="footer-bottom-area">
              <p>© Copyright | <a href="https://alhikmahsoft.com" target="_blank">AlHikmahSoft</a>  | All Rights Reserved is Proudly </p>
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
