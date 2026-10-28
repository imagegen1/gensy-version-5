'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'

interface BootstrapLayoutProps {
  children: React.ReactNode
  title: string
  currentPage?: string
}

export default function BootstrapLayout({ children, title, currentPage = '' }: BootstrapLayoutProps) {
  const { isSignedIn } = useAuth()
  const router = useRouter()
  const [assetsLoaded, setAssetsLoaded] = useState(false)

  useEffect(() => {
    // Load JavaScript assets for this component instance
    if (assetsLoaded) return

    // Load JavaScript files
    const loadScript = (src: string) => {
      return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) {
          resolve(true)
          return
        }

        const script = document.createElement('script')
        script.src = src
        script.onload = resolve
        script.onerror = reject
        document.body.appendChild(script)
      })
    }

    const loadScripts = async () => {
      try {
        await loadScript('/ainext-template/assets/js/jquery.min.js')
        await loadScript('/ainext-template/assets/js/bootstrap.bundle.min.js')
        await loadScript('/ainext-template/assets/js/aos.js')
        await loadScript('/ainext-template/assets/js/appear.min.js')
        await loadScript('/ainext-template/assets/js/odometer.min.js')
        await loadScript('/ainext-template/assets/js/owl.carousel.min.js')
        await loadScript('/ainext-template/assets/js/ainext.js')

        setAssetsLoaded(true)
      } catch (error) {
        console.error('Error loading scripts:', error)
      }
    }

    loadScripts()
  }, [])

  return (
    <div>
      {/* Layout Fix CSS */}
      <style dangerouslySetInnerHTML={{
        __html: `
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
        `
      }} />

      {/* Start Navbar Area */}
      <nav className="navbar navbar-expand-lg" id="navbar">
        <div className="container-fluid">
          <a className="navbar-brand" href="/landing-page-2">
            <img src="/ainext-template/assets/img/main logo.svg" alt="Gensy Logo" style={{height: '40px', width: 'auto'}} />
          </a>
          <a className="navbar-toggler text-decoration-none" data-bs-toggle="offcanvas" href="#navbarOffcanvas" role="button" aria-controls="navbarOffcanvas">
            <span className="burger-menu">
              <span className="top-bar"></span>
              <span className="middle-bar"></span>
              <span className="bottom-bar"></span>
            </span>
          </a>
          <div className="collapse navbar-collapse">
            <ul className="navbar-nav">
              <li className="nav-item">
                <a href="/landing-page-2" className={`nav-link ${currentPage === 'home' ? 'active' : ''}`}>
                  Home
                </a>
              </li>
              <li className="nav-item">
                <a href="javascript:void(0)" className={`dropdown-toggle nav-link ${['about', 'team', 'pricing', 'terms', 'privacy', '404'].includes(currentPage) ? 'active' : ''}`}>
                  Pages
                </a>
                <ul className="dropdown-menu">
                  <li className="nav-item">
                    <a href="/about" className={`nav-link ${currentPage === 'about' ? 'active' : ''}`}>
                      About Us
                    </a>
                  </li>
                  <li className="nav-item">
                    <a href="/team" className={`nav-link ${currentPage === 'team' ? 'active' : ''}`}>
                      Team
                    </a>
                  </li>
                  <li className="nav-item">
                    <a href="/pricing" className={`nav-link ${currentPage === 'pricing' ? 'active' : ''}`}>
                      Pricing
                    </a>
                  </li>
                  <li className="nav-item">
                    <a href="/terms-conditions" className={`nav-link ${currentPage === 'terms' ? 'active' : ''}`}>
                      Terms & Conditions
                    </a>
                  </li>
                  <li className="nav-item">
                    <a href="/privacy-policy" className={`nav-link ${currentPage === 'privacy' ? 'active' : ''}`}>
                      Privacy Policy
                    </a>
                  </li>
                  <li className="nav-item">
                    <a href="/not-found" className={`nav-link ${currentPage === '404' ? 'active' : ''}`}>
                      404 Error Page
                    </a>
                  </li>
                </ul>
              </li>
              <li className="nav-item">
                <a href="/portfolio" className={`nav-link ${currentPage === 'portfolio' ? 'active' : ''}`}>
                  Portfolio
                </a>
              </li>
              <li className="nav-item">
                <a href="javascript:void(0)" className={`dropdown-toggle nav-link ${currentPage === 'blog' ? 'active' : ''}`}>
                  Blog
                </a>
                <ul className="dropdown-menu">
                  <li className="nav-item">
                    <a href="/blog" className="nav-link">
                      Blog Grid
                    </a>
                  </li>
                  <li className="nav-item">
                    <a href="/blog" className="nav-link">
                      Blog Right Sidebar
                    </a>
                  </li>
                  <li className="nav-item">
                    <a href="/blog" className="nav-link">
                      Blog Details
                    </a>
                  </li>
                </ul>
              </li>
              <li className="nav-item">
                <a href="/contact" className={`nav-link ${currentPage === 'contact' ? 'active' : ''}`}>
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
                <div className="d-flex gap-3">
                  <button
                    onClick={() => router.push('/auth/sign-in')}
                    className="btn btn-outline-light px-4 py-2"
                    style={{
                      border: '2px solid rgba(255, 255, 255, 0.3)',
                      color: 'white',
                      backgroundColor: 'transparent',
                      borderRadius: '25px',
                      fontWeight: '500',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.5)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent'
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)'
                    }}
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => router.push('/auth/sign-up')}
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
          <a href="/landing-page-2" className="logo d-inline-block">
            <img src="/ainext-template/assets/img/main logo.svg" alt="Gensy Logo" style={{height: '35px', width: 'auto'}} />
          </a>
          <button type="button" className="close-btn bg-transparent position-relative lh-1 p-0 border-0" data-bs-dismiss="offcanvas" aria-label="Close">
            <i className="ri-close-line"></i>
          </button>
        </div>
        <div className="offcanvas-body">
          <ul className="responsive-menu">
            <li className="responsive-menu-list without-icon">
              <a href="/landing-page-2" className={currentPage === 'home' ? 'active' : ''}>Home</a>
            </li>
            <li className="responsive-menu-list">
              <a href="javascript:void(0);">Pages</a>
              <ul className="responsive-menu-items">
                <li><a href="/about">About</a></li>
                <li><a href="/team">Team</a></li>
                <li><a href="/pricing">Pricing</a></li>
                <li><a href="/terms-conditions">Terms Conditions</a></li>
                <li><a href="/privacy-policy">Privacy Policy</a></li>
                <li><a href="/not-found">404 Error Page</a></li>
              </ul>
            </li>
            <li className="responsive-menu-list without-icon">
              <a href="/portfolio">Portfolio</a>
            </li>
            <li className="responsive-menu-list">
              <a href="javascript:void(0);">Blog</a>
              <ul className="responsive-menu-items">
                <li><a href="/blog">Blog</a></li>
                <li><a href="/blog">Blog Right Sidebar</a></li>
                <li><a href="/blog">Blog Details</a></li>
              </ul>
            </li>
            <li className="responsive-menu-list without-icon">
              <a href="/contact">Contact</a>
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
                    onClick={() => router.push('/auth/sign-in')}
                    className="btn btn-outline-light w-100"
                    style={{
                      border: '2px solid rgba(255, 255, 255, 0.3)',
                      color: 'white',
                      backgroundColor: 'transparent',
                      borderRadius: '25px',
                      fontWeight: '500',
                      padding: '10px 20px'
                    }}
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => router.push('/auth/sign-up')}
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

      {/* Page Content */}
      {children}

      {/* Start Footer Area */}
      <footer className="footer-area">
        <div className="container">
          <div className="footer-top-area pt-50 pb-30">
            <div className="row align-items-start">
              <div className="col-lg-4 col-md-6 col-sm-12">
                <div className="single-footer-widget">
                  <a href="/landing-page-2" className="logo">
                    <img src="/ainext-template/assets/img/main logo.svg" alt="Gensy Logo" style={{height: '100px', width: 'auto'}} />
                  </a>
                  <p style={{marginTop: '15px', marginBottom: '20px'}}>The platform for transforming your creative ideas into breathtaking AI-generated videos, art, and images in seconds.</p>
                </div>
              </div>
              <div className="col-lg-2 col-md-3 col-sm-6">
                <div className="single-footer-widget">
                  <h3 style={{marginTop: '15px', marginBottom: '20px'}}>Platform</h3>
                  <ul className="links-list">
                    <li><a href="/">Home</a></li>
                    <li><a href="/pricing">Pricing</a></li>
                    <li><a href="/generate/image">Images</a></li>
                    <li><a href="/video">Videos</a></li>
                  </ul>
                </div>
              </div>
              <div className="col-lg-2 col-md-3 col-sm-6">
                <div className="single-footer-widget">
                  <h3 style={{marginTop: '15px', marginBottom: '20px'}}>Legal</h3>
                  <ul className="links-list">
                    <li><a href="/terms-conditions">Terms & Conditions</a></li>
                    <li><a href="/privacy-policy">Privacy Policy</a></li>
                    <li><a href="/pricing">Payment Method</a></li>
                  </ul>
                </div>
              </div>
              <div className="col-lg-4 col-md-6 col-sm-12">
                <div className="single-footer-widget">
                  <h3 style={{marginTop: '15px', marginBottom: '20px'}}>Company & Contact</h3>
                  <ul className="links-list" style={{lineHeight: '1.9'}}>
                    <li><span style={{color: '#aaa'}}>Company:</span> <strong>Gensy Technologies</strong></li>
                    <li><span style={{color: '#aaa'}}>Founder:</span> <strong>Abirich Vaithiyalingam</strong></li>
                    <li><span style={{color: '#aaa'}}>Developers:</span> <strong>Abirich Vaithiyalingam, Gobinath S</strong></li>
                    <li><span style={{color: '#aaa'}}>Website:</span> <a href="https://gensy.online" style={{color: '#9333ea'}}>Gensy.online</a></li>
                    <li><span style={{color: '#aaa'}}>Email:</span> <a href="mailto:info@gensy.online" style={{color: '#9333ea'}}>info@gensy.online</a></li>
                    <li><span style={{color: '#aaa'}}>Location:</span> 7/10 Abirami Gardens, Salem, Tamil Nadu, India</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          <div className="pr-line"></div>
          <div className="footer-bottom-area text-center py-3">
            <p style={{margin: 0}}>© {new Date().getFullYear()} Gensy. All Rights Reserved.</p>
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
