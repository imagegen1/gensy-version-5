// Performance optimization utilities

// Register service worker for caching
export const registerServiceWorker = () => {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('SW registered: ', registration)
        })
        .catch((registrationError) => {
          console.log('SW registration failed: ', registrationError)
        })
    })
  }
}

// Preload critical resources
export const preloadCriticalResources = () => {
  if (typeof window === 'undefined') return

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
    document.head.appendChild(link)
  })
}

// Optimize images with lazy loading
export const optimizeImages = () => {
  if (typeof window === 'undefined') return

  // Use Intersection Observer for lazy loading
  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target as HTMLImageElement
        if (img.dataset.src) {
          img.src = img.dataset.src
          img.classList.remove('lazy')
          observer.unobserve(img)
        }
      }
    })
  })

  // Observe all lazy images
  document.querySelectorAll('img[data-src]').forEach(img => {
    imageObserver.observe(img)
  })
}

// Defer non-critical JavaScript
export const deferNonCriticalJS = () => {
  if (typeof window === 'undefined') return

  const nonCriticalScripts = [
    '/ainext-template/assets/js/aos.js',
    '/ainext-template/assets/js/appear.min.js',
    '/ainext-template/assets/js/odometer.min.js',
    '/ainext-template/assets/js/owl.carousel.min.js'
  ]

  // Load scripts after page load
  window.addEventListener('load', () => {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        nonCriticalScripts.forEach(src => {
          const script = document.createElement('script')
          script.src = src
          script.async = true
          document.body.appendChild(script)
        })
      })
    } else {
      setTimeout(() => {
        nonCriticalScripts.forEach(src => {
          const script = document.createElement('script')
          script.src = src
          script.async = true
          document.body.appendChild(script)
        })
      }, 1000)
    }
  })
}

// Optimize CSS delivery
export const optimizeCSSDelivery = () => {
  if (typeof window === 'undefined') return

  const nonCriticalCSS = [
    '/ainext-template/assets/css/owl.carousel.min.css',
    '/ainext-template/assets/css/owl.theme.default.min.css',
    '/ainext-template/assets/css/odometer.min.css',
    '/ainext-template/assets/css/flaticon.css',
    '/ainext-template/assets/css/aos.css'
  ]

  // Load non-critical CSS asynchronously
  const loadCSS = (href: string) => {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = href
    link.media = 'print'
    link.onload = () => { link.media = 'all' }
    document.head.appendChild(link)
  }

  // Load after page is interactive
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      requestIdleCallback(() => {
        nonCriticalCSS.forEach(loadCSS)
      })
    })
  } else {
    requestIdleCallback(() => {
      nonCriticalCSS.forEach(loadCSS)
    })
  }
}

// Performance monitoring
export const trackPerformance = () => {
  if (typeof window === 'undefined') return

  // Track Core Web Vitals
  const trackWebVitals = () => {
    // First Contentful Paint
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name === 'first-contentful-paint') {
          console.log('FCP:', entry.startTime)
        }
      }
    })
    observer.observe({ entryTypes: ['paint'] })

    // Largest Contentful Paint
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      const lastEntry = entries[entries.length - 1]
      console.log('LCP:', lastEntry.startTime)
    })
    lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })

    // Cumulative Layout Shift
    let clsValue = 0
    const clsObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value
        }
      }
      console.log('CLS:', clsValue)
    })
    clsObserver.observe({ entryTypes: ['layout-shift'] })
  }

  // Track when page is fully loaded
  window.addEventListener('load', () => {
    setTimeout(trackWebVitals, 0)
  })
}

// Initialize all performance optimizations
export const initializePerformanceOptimizations = () => {
  registerServiceWorker()
  preloadCriticalResources()
  optimizeCSSDelivery()
  deferNonCriticalJS()
  optimizeImages()
  trackPerformance()
}
