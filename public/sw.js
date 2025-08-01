// Service Worker for Landing Page Performance Optimization
const CACHE_NAME = 'gensy-landing-v1'
const STATIC_CACHE_NAME = 'gensy-static-v1'

// Critical resources to cache immediately
const CRITICAL_RESOURCES = [
  '/',
  '/landing-page-2',
  '/ainext-template/assets/css/bootstrap.min.css',
  '/ainext-template/assets/css/style.css',
  '/ainext-template/assets/css/responsive.css',
  '/ainext-template/assets/css/remixicon.min.css',
  '/ainext-template/assets/img/main logo.svg',
  '/ainext-template/assets/js/jquery.min.js',
  '/ainext-template/assets/js/bootstrap.bundle.min.js'
]

// Static assets to cache
const STATIC_RESOURCES = [
  '/ainext-template/assets/css/owl.carousel.min.css',
  '/ainext-template/assets/css/owl.theme.default.min.css',
  '/ainext-template/assets/css/odometer.min.css',
  '/ainext-template/assets/css/flaticon.css',
  '/ainext-template/assets/css/aos.css',
  '/ainext-template/assets/js/aos.js',
  '/ainext-template/assets/js/appear.min.js',
  '/ainext-template/assets/js/odometer.min.js',
  '/ainext-template/assets/js/owl.carousel.min.js',
  '/ainext-template/assets/js/ainext.js'
]

// Install event - cache critical resources
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...')
  
  event.waitUntil(
    Promise.all([
      // Cache critical resources
      caches.open(CACHE_NAME).then((cache) => {
        console.log('Caching critical resources')
        return cache.addAll(CRITICAL_RESOURCES)
      }),
      // Cache static resources
      caches.open(STATIC_CACHE_NAME).then((cache) => {
        console.log('Caching static resources')
        return cache.addAll(STATIC_RESOURCES)
      })
    ]).then(() => {
      // Force activation
      return self.skipWaiting()
    })
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...')
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE_NAME) {
            console.log('Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    }).then(() => {
      // Take control of all clients
      return self.clients.claim()
    })
  )
})

// Fetch event - serve from cache with network fallback
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Only handle GET requests
  if (request.method !== 'GET') return

  // Skip non-HTTP requests
  if (!url.protocol.startsWith('http')) return

  // Skip API requests and authentication
  if (url.pathname.startsWith('/api/') || 
      url.pathname.startsWith('/auth/') ||
      url.pathname.includes('clerk')) {
    return
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        // Serve from cache
        console.log('Serving from cache:', request.url)
        return cachedResponse
      }

      // Network request with caching
      return fetch(request).then((response) => {
        // Don't cache non-successful responses
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response
        }

        // Clone the response
        const responseToCache = response.clone()

        // Determine which cache to use
        const cacheName = CRITICAL_RESOURCES.includes(url.pathname) ? 
          CACHE_NAME : STATIC_CACHE_NAME

        // Cache the response
        caches.open(cacheName).then((cache) => {
          console.log('Caching new resource:', request.url)
          cache.put(request, responseToCache)
        })

        return response
      }).catch(() => {
        // Network failed, try to serve a fallback
        if (request.destination === 'document') {
          return caches.match('/landing-page-2')
        }
        
        // For other resources, just fail
        return new Response('Network error', {
          status: 408,
          headers: { 'Content-Type': 'text/plain' }
        })
      })
    })
  )
})

// Background sync for performance metrics
self.addEventListener('sync', (event) => {
  if (event.tag === 'performance-metrics') {
    event.waitUntil(
      // Send performance metrics to analytics
      console.log('Background sync: performance metrics')
    )
  }
})

// Push notifications (future feature)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json()
    
    event.waitUntil(
      self.registration.showNotification(data.title, {
        body: data.body,
        icon: '/ainext-template/assets/img/main logo.svg',
        badge: '/ainext-template/assets/img/main logo.svg'
      })
    )
  }
})
