'use client'

import { useEffect } from 'react'

export default function PerformanceMonitor() {
  useEffect(() => {
    // Only run in development
    if (process.env.NODE_ENV !== 'development') return

    const measurePerformance = () => {
      // Wait for page to be fully loaded
      if (document.readyState === 'complete') {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
        
        if (navigation) {
          const metrics = {
            'DNS Lookup': navigation.domainLookupEnd - navigation.domainLookupStart,
            'TCP Connection': navigation.connectEnd - navigation.connectStart,
            'Request': navigation.responseStart - navigation.requestStart,
            'Response': navigation.responseEnd - navigation.responseStart,
            'DOM Processing': navigation.domContentLoadedEventEnd - navigation.responseEnd,
            'Load Complete': navigation.loadEventEnd - navigation.loadEventStart,
            'Total Load Time': navigation.loadEventEnd - navigation.navigationStart,
            'First Contentful Paint': 0,
            'Largest Contentful Paint': 0
          }

          // Get paint metrics
          const paintEntries = performance.getEntriesByType('paint')
          paintEntries.forEach(entry => {
            if (entry.name === 'first-contentful-paint') {
              metrics['First Contentful Paint'] = entry.startTime
            }
          })

          // Get LCP if available
          if ('PerformanceObserver' in window) {
            try {
              const observer = new PerformanceObserver((list) => {
                const entries = list.getEntries()
                const lastEntry = entries[entries.length - 1]
                if (lastEntry) {
                  metrics['Largest Contentful Paint'] = lastEntry.startTime
                  console.group('🚀 Landing Page Performance Metrics')
                  Object.entries(metrics).forEach(([key, value]) => {
                    const time = typeof value === 'number' ? Math.round(value) : value
                    const color = time < 1000 ? 'green' : time < 2000 ? 'orange' : 'red'
                    console.log(`%c${key}: ${time}ms`, `color: ${color}`)
                  })
                  console.groupEnd()
                }
              })
              observer.observe({ entryTypes: ['largest-contentful-paint'] })
            } catch (e) {
              // LCP not supported
            }
          }

          // Log basic metrics immediately
          setTimeout(() => {
            console.group('🚀 Landing Page Performance Metrics')
            Object.entries(metrics).forEach(([key, value]) => {
              if (value > 0) {
                const time = Math.round(value)
                const color = time < 1000 ? 'green' : time < 2000 ? 'orange' : 'red'
                console.log(`%c${key}: ${time}ms`, `color: ${color}`)
              }
            })
            console.groupEnd()

            // Performance recommendations
            const totalTime = metrics['Total Load Time']
            if (totalTime > 3000) {
              console.warn('⚠️ Page load time is over 3 seconds. Consider optimizing.')
            } else if (totalTime > 1000) {
              console.info('ℹ️ Page load time is good but could be improved.')
            } else {
              console.log('✅ Excellent page load time!')
            }
          }, 100)
        }
      } else {
        // Wait for load complete
        window.addEventListener('load', measurePerformance, { once: true })
      }
    }

    measurePerformance()
  }, [])

  return null
}

// Utility function to preload critical resources
export const preloadCriticalResources = () => {
  const criticalResources = [
    { href: '/ainext-template/assets/img/main logo.svg', as: 'image' },
    { href: '/ainext-template/assets/css/bootstrap.min.css', as: 'style' },
    { href: '/ainext-template/assets/css/style.css', as: 'style' },
    { href: '/ainext-template/assets/js/jquery.min.js', as: 'script' }
  ]

  criticalResources.forEach(resource => {
    const link = document.createElement('link')
    link.rel = 'preload'
    link.href = resource.href
    link.as = resource.as
    if (resource.as === 'style') {
      link.onload = () => {
        link.rel = 'stylesheet'
      }
    }
    document.head.appendChild(link)
  })
}

// Resource hints for better loading
export const addResourceHints = () => {
  const hints = [
    { rel: 'dns-prefetch', href: '//fonts.googleapis.com' },
    { rel: 'dns-prefetch', href: '//fonts.gstatic.com' },
    { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: 'anonymous' }
  ]

  hints.forEach(hint => {
    const link = document.createElement('link')
    link.rel = hint.rel
    link.href = hint.href
    if (hint.crossorigin) {
      link.crossOrigin = hint.crossorigin
    }
    document.head.appendChild(link)
  })
}
