// Performance optimization utilities

export interface ResourcePreloadConfig {
  href: string
  as: 'style' | 'script' | 'font' | 'image'
  crossorigin?: 'anonymous' | 'use-credentials'
  type?: string
}

export interface DNSPrefetchConfig {
  domain: string
}

// Preload critical resources
export function preloadResource(config: ResourcePreloadConfig): void {
  if (typeof window === 'undefined') return

  const link = document.createElement('link')
  link.rel = 'preload'
  link.href = config.href
  link.as = config.as
  
  if (config.crossorigin) {
    link.crossOrigin = config.crossorigin
  }
  
  if (config.type) {
    link.type = config.type
  }

  document.head.appendChild(link)
}

// DNS prefetch for external domains
export function dnsPrefetch(domain: string): void {
  if (typeof window === 'undefined') return

  const link = document.createElement('link')
  link.rel = 'dns-prefetch'
  link.href = `//${domain}`
  document.head.appendChild(link)
}

// Preconnect to external domains
export function preconnect(domain: string, crossorigin = false): void {
  if (typeof window === 'undefined') return

  const link = document.createElement('link')
  link.rel = 'preconnect'
  link.href = `//${domain}`
  
  if (crossorigin) {
    link.crossOrigin = 'anonymous'
  }

  document.head.appendChild(link)
}

// Load CSS asynchronously
export function loadCSSAsync(href: string, priority: 'high' | 'low' = 'low'): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      resolve()
      return
    }

    // Check if already loaded
    if (document.querySelector(`link[href="${href}"]`)) {
      resolve()
      return
    }

    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = href
    
    link.addEventListener('load', () => resolve())
    link.addEventListener('error', () => reject(new Error(`Failed to load CSS: ${href}`)))

    if (priority === 'high') {
      document.head.insertBefore(link, document.head.firstChild)
    } else {
      document.head.appendChild(link)
    }
  })
}

// Load script asynchronously
export function loadScriptAsync(src: string, async = true): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      resolve()
      return
    }

    // Check if already loaded
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve()
      return
    }

    const script = document.createElement('script')
    script.src = src
    script.async = async
    
    script.addEventListener('load', () => resolve())
    script.addEventListener('error', () => reject(new Error(`Failed to load script: ${src}`)))

    document.body.appendChild(script)
  })
}

// Defer execution until idle
export function runWhenIdle(callback: () => void, timeout = 5000): void {
  if (typeof window === 'undefined') {
    callback()
    return
  }

  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(callback, { timeout })
  } else {
    setTimeout(callback, 100)
  }
}

// Measure and log performance metrics
export function measurePerformance(name: string, fn: () => void | Promise<void>): void {
  if (typeof window === 'undefined') {
    fn()
    return
  }

  const startTime = performance.now()
  
  const result = fn()
  
  if (result instanceof Promise) {
    result.finally(() => {
      const endTime = performance.now()
      console.log(`${name} took ${endTime - startTime} milliseconds`)
    })
  } else {
    const endTime = performance.now()
    console.log(`${name} took ${endTime - startTime} milliseconds`)
  }
}

// Optimize images with lazy loading
export function setupLazyLoading(): void {
  if (typeof window === 'undefined') return

  const images = document.querySelectorAll('img[data-src]')
  
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement
          img.src = img.dataset.src || ''
          img.classList.remove('lazy')
          imageObserver.unobserve(img)
        }
      })
    })

    images.forEach(img => imageObserver.observe(img))
  } else {
    // Fallback for browsers without IntersectionObserver
    images.forEach(img => {
      const image = img as HTMLImageElement
      image.src = image.dataset.src || ''
    })
  }
}

// Critical resource loading strategy
export async function loadCriticalResources(): Promise<void> {
  const criticalCSS = [
    '/ainext-template/assets/css/bootstrap.min.css',
    '/ainext-template/assets/css/style.css',
    '/ainext-template/assets/css/responsive.css'
  ]

  const criticalScripts = [
    '/ainext-template/assets/js/jquery.min.js',
    '/ainext-template/assets/js/bootstrap.bundle.min.js'
  ]

  // Preload critical resources
  criticalCSS.forEach(href => {
    preloadResource({ href, as: 'style' })
  })

  criticalScripts.forEach(href => {
    preloadResource({ href, as: 'script' })
  })

  // Load critical CSS first
  await Promise.all(criticalCSS.map(href => loadCSSAsync(href, 'high')))
  
  // Load critical scripts
  await Promise.all(criticalScripts.map(src => loadScriptAsync(src)))
}

// Non-critical resource loading
export function loadNonCriticalResources(): void {
  const nonCriticalCSS = [
    '/ainext-template/assets/css/owl.carousel.min.css',
    '/ainext-template/assets/css/owl.theme.default.min.css',
    '/ainext-template/assets/css/remixicon.min.css',
    '/ainext-template/assets/css/odometer.min.css',
    '/ainext-template/assets/css/flaticon.css',
    '/ainext-template/assets/css/aos.css'
  ]

  const nonCriticalScripts = [
    '/ainext-template/assets/js/aos.js',
    '/ainext-template/assets/js/appear.min.js',
    '/ainext-template/assets/js/odometer.min.js',
    '/ainext-template/assets/js/owl.carousel.min.js',
    '/ainext-template/assets/js/ainext.js'
  ]

  // Load non-critical resources when idle
  runWhenIdle(() => {
    nonCriticalCSS.forEach(href => {
      loadCSSAsync(href, 'low').catch(console.warn)
    })
  })

  runWhenIdle(() => {
    nonCriticalScripts.forEach(src => {
      loadScriptAsync(src).catch(console.warn)
    })
  }, 1000)
}
