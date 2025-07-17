import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

// Define which routes are public (don't require authentication)
const isPublicRoute = createRouteMatcher([
  '/',
  '/auth/sign-in(.*)',
  '/auth/sign-up(.*)',
  '/pricing',
  '/credits',
  '/billing',
  '/analytics',
  '/generate(.*)',
  '/payment(.*)',
  '/features',
  '/contact',
  '/demo',
  '/api/webhooks(.*)',
  '/api/health(.*)',
  '/api/auth(.*)',
  '/api/test(.*)',
  '/not-found'
])

// Define which routes are protected (require authentication)
const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/onboarding(.*)',
  '/settings(.*)',
  '/profile(.*)',
  '/api/generate(.*)',
  '/api/upscale(.*)',
  '/api/convert(.*)',
  '/api/user(.*)',
  '/api/ai-models(.*)',
  '/api/enhance-prompt(.*)',
  '/api/generations(.*)'
])

export default clerkMiddleware((auth, req) => {
  // Allow public routes to pass through
  if (isPublicRoute(req)) {
    return
  }

  // Protect routes that require authentication
  if (isProtectedRoute(req)) {
    auth().protect()
  }
})

export const config = {
  // The following matcher runs middleware on all routes
  // except static assets.
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
}
