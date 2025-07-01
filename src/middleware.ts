import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

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
  '/api/test-video(.*)'
])

const isProtectedApiRoute = createRouteMatcher([
  '/api/generate(.*)',
  '/api/upscale(.*)',
  '/api/convert(.*)',
  '/api/user(.*)',
  '/api/ai-models(.*)',
  '/api/enhance-prompt(.*)'
])

const isOnboardingRoute = createRouteMatcher(['/onboarding'])

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth()

  // Allow public routes
  if (isPublicRoute(req)) {
    return NextResponse.next()
  }

  // Handle protected API routes - require authentication but don't redirect
  if (isProtectedApiRoute(req)) {
    if (!userId) {
      // Check if this is a test mode request
      if (req.method === 'POST') {
        try {
          const body = await req.clone().json()
          if (body.testMode === true) {
            console.log('🧪 MIDDLEWARE: Allowing test mode request to', req.nextUrl.pathname)
            return NextResponse.next()
          }
        } catch (error) {
          // If we can't parse the body, continue with normal auth check
        }
      }

      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    return NextResponse.next()
  }

  // Protect all other routes with redirect
  await auth.protect()

  // Handle authenticated user routing
  if (userId) {
    const url = req.nextUrl.clone()

    // Redirect to onboarding if user is new and not already on onboarding
    if (url.pathname === '/dashboard' && !isOnboardingRoute(req)) {
      // Check if user needs onboarding (this will be handled by the dashboard page)
      return NextResponse.next()
    }

    // Allow onboarding routes for authenticated users
    if (isOnboardingRoute(req)) {
      return NextResponse.next()
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
