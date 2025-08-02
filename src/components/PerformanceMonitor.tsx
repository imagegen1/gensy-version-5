'use client'

import { useEffect } from 'react'

interface PerformanceMetrics {
  fcp?: number // First Contentful Paint
  lcp?: number // Largest Contentful Paint
  fid?: number // First Input Delay
  cls?: number // Cumulative Layout Shift
  ttfb?: number // Time to First Byte
}

export default function PerformanceMonitor() {
  useEffect(() => {
    if (typeof window === 'undefined') return

    const metrics: PerformanceMetrics = {}

    // Measure First Contentful Paint
    const measureFCP = () => {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === 'first-contentful-paint') {
            metrics.fcp = entry.startTime
            console.log('FCP:', entry.startTime)
          }
        }
      })
      observer.observe({ entryTypes: ['paint'] })
    }

    // Measure Largest Contentful Paint
    const measureLCP = () => {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const lastEntry = entries[entries.length - 1]
        metrics.lcp = lastEntry.startTime
        console.log('LCP:', lastEntry.startTime)
      })
      observer.observe({ entryTypes: ['largest-contentful-paint'] })
    }

    // Measure First Input Delay
    const measureFID = () => {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          metrics.fid = (entry as any).processingStart - entry.startTime
          console.log('FID:', metrics.fid)
        }
      })
      observer.observe({ entryTypes: ['first-input'] })
    }

    // Measure Cumulative Layout Shift
    const measureCLS = () => {
      let clsValue = 0
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value
          }
        }
        metrics.cls = clsValue
        console.log('CLS:', clsValue)
      })
      observer.observe({ entryTypes: ['layout-shift'] })
    }

    // Measure Time to First Byte
    const measureTTFB = () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      if (navigation) {
        metrics.ttfb = navigation.responseStart - navigation.requestStart
        console.log('TTFB:', metrics.ttfb)
      }
    }

    // Initialize measurements
    if ('PerformanceObserver' in window) {
      measureFCP()
      measureLCP()
      measureFID()
      measureCLS()
    }
    measureTTFB()

    // Log all metrics after page load
    window.addEventListener('load', () => {
      setTimeout(() => {
        console.log('Performance Metrics:', metrics)
      }, 1000)
    })

    // Cleanup
    return () => {
      // Performance observers are automatically cleaned up
    }
  }, [])

  return null // This component doesn't render anything
}

// Hook for performance monitoring
export function usePerformanceMonitoring() {
  useEffect(() => {
    if (typeof window === 'undefined') return

    const logResourceTiming = () => {
      const resources = performance.getEntriesByType('resource')
      const slowResources = resources.filter(resource => resource.duration > 1000)
      
      if (slowResources.length > 0) {
        console.warn('Slow loading resources:', slowResources)
      }
    }

    const logNavigationTiming = () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      if (navigation) {
        console.log('Navigation Timing:', {
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
          totalTime: navigation.loadEventEnd - navigation.fetchStart
        })
      }
    }

    window.addEventListener('load', () => {
      setTimeout(() => {
        logResourceTiming()
        logNavigationTiming()
      }, 1000)
    })
  }, [])
}
