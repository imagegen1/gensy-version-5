'use client'

import { useEffect } from 'react'

interface OptimizedLayoutProps {
  children: React.ReactNode
}

export default function OptimizedLayout({ children }: OptimizedLayoutProps) {
  useEffect(() => {
    // Preload critical resources
    const preloadCriticalResources = () => {
      const resources = [
        { href: '/ainext-template/assets/css/bootstrap.min.css', as: 'style' },
        { href: '/ainext-template/assets/css/style.css', as: 'style' },
        { href: '/ainext-template/assets/js/jquery.min.js', as: 'script' },
        { href: '/ainext-template/assets/js/bootstrap.bundle.min.js', as: 'script' }
      ]

      resources.forEach(({ href, as }) => {
        const link = document.createElement('link')
        link.rel = 'preload'
        link.as = as
        link.href = href
        if (as === 'style') {
          link.onload = () => {
            link.rel = 'stylesheet'
          }
        }
        document.head.appendChild(link)
      })
    }

    // DNS prefetch for external resources
    const dnsPrefetch = () => {
      const domains = [
        'fonts.googleapis.com',
        'fonts.gstatic.com'
      ]

      domains.forEach(domain => {
        const link = document.createElement('link')
        link.rel = 'dns-prefetch'
        link.href = `//${domain}`
        document.head.appendChild(link)
      })
    }

    preloadCriticalResources()
    dnsPrefetch()
  }, [])

  return (
    <>
      {/* Critical CSS inlined for fastest loading */}
      <style dangerouslySetInnerHTML={{
        __html: `
          /* Critical above-the-fold styles */
          * { margin: 0; padding: 0; box-sizing: border-box; }
          
          body {
            font-family: 'Raleway', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            background: #050913;
            overflow-x: hidden;
          }
          
          .loading-container {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: #050913;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
          }
          
          .spinner {
            width: 40px;
            height: 40px;
            border: 3px solid rgba(255,255,255,0.3);
            border-top: 3px solid white;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }
          
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          .landing-page.loading {
            opacity: 0;
            transform: translateY(20px);
          }
          
          .landing-page.loaded {
            opacity: 1;
            transform: translateY(0);
            transition: all 0.6s ease;
          }
          
          /* Hero section critical styles */
          .hero-section {
            position: relative;
            height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #050913;
            overflow: hidden;
          }
          
          .navbar {
            position: fixed;
            top: 0;
            width: 100%;
            z-index: 1000;
            background: rgba(5, 9, 19, 0.95);
            backdrop-filter: blur(10px);
            transition: all 0.3s ease;
          }
        `
      }} />
      {children}
    </>
  )
}
