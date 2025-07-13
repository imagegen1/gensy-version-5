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
  // '/video', // Removed - should require authentication
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
  '/api/enhance-prompt(.*)',
  '/api/generations(.*)'
])

export default clerkMiddleware(async (auth, req) => {
  // Check for test mode
  const isTestMode = process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_TEST_MODE === 'true'

  // Allow public routes
  if (isPublicRoute(req)) {
    return NextResponse.next()
  }

  // Handle protected API routes - require authentication but don't redirect
  if (isProtectedApiRoute(req)) {
    // Allow test mode for development
    if (isTestMode) {
      console.log('🧪 MIDDLEWARE: Allowing test mode request to', req.nextUrl.pathname)
      return NextResponse.next()
    }

    // For non-test mode, protect the route
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    return NextResponse.next()
  }

  // Protect all other routes (unless in test mode)
  if (!isTestMode) {
    await auth.protect()
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
