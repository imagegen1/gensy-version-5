'use client'

import { useEffect } from 'react'

interface BootstrapLayoutProps {
  children: React.ReactNode
  title: string
  currentPage?: string
}

// Global flag to track if assets are loaded
let assetsLoaded = false

export default function BootstrapLayout({ children, title, currentPage = '' }: BootstrapLayoutProps) {
  useEffect(() => {
    // Only load JavaScript assets once globally (CSS is now loaded in root layout)
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

        assetsLoaded = true
      } catch (error) {
        console.error('Error loading scripts:', error)
      }
    }

    loadScripts()
  }, [])

  return (
    <div>
      {/* Start Navbar Area */}
      <nav className="navbar navbar-expand-lg" id="navbar">
        <div className="container-fluid">
          <a className="navbar-brand" href="/landing-page-2">
            <h2>AiNext</h2>
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
                    <a href="/team-ainext" className={`nav-link ${currentPage === 'team' ? 'active' : ''}`}>
                      Team
                    </a>
                  </li>
                  <li className="nav-item">
                    <a href="/pricing-ainext" className={`nav-link ${currentPage === 'pricing' ? 'active' : ''}`}>
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
                    <a href="/not-found-ainext" className={`nav-link ${currentPage === '404' ? 'active' : ''}`}>
                      404 Error Page
                    </a>
                  </li>
                </ul>
              </li>
              <li className="nav-item">
                <a href="/portfolio-ainext" className={`nav-link ${currentPage === 'portfolio' ? 'active' : ''}`}>
                  Portfolio
                </a>
              </li>
              <li className="nav-item">
                <a href="javascript:void(0)" className={`dropdown-toggle nav-link ${currentPage === 'blog' ? 'active' : ''}`}>
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
                <a href="/contact-ainext" className={`nav-link ${currentPage === 'contact' ? 'active' : ''}`}>
                  Contact Us
                </a>
              </li>
            </ul>
            <div className="nav-btn">
              <a href="/contact-ainext" className="default-btn">
                Get Started
                <i className="ri-arrow-right-line"></i>
              </a>
            </div>
          </div>
        </div>
      </nav>
      {/* End Navbar Area */}

      {/* Start Responsive Navbar Area */}
      <div className="responsive-navbar offcanvas offcanvas-end border-0" data-bs-backdrop="static" tabIndex={-1} id="navbarOffcanvas">
        <div className="offcanvas-header">
          <a href="/landing-page-2" className="logo d-inline-block">
            <h2>AiNext</h2>
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
            <li className="responsive-menu-list">
              <a href="javascript:void(0);">Blog</a>
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
              <a href="/contact-ainext" className="default-btn">
                <i className="ri-arrow-right-line"></i>
                <span>Get Started</span>
              </a>
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
          <div className="footer-top-area pt-100">
            <div className="row">
              <div className="col-lg-4 col-md-6 col-sm-6">
                <div className="single-footer-widget">
                  <a href="/landing-page-2" className="logo">
                    <h2>AiNext</h2>
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
            <p>© Copyright | <a href="https://alhikmahsoft.com" target="_blank">AlHikmahSoft</a> | All Rights Reserved is Proudly </p>
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
