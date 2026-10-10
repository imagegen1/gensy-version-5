import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse, type NextRequest } from 'next/server'

// Public routes accessible without authentication
const isPublicRoute = createRouteMatcher([
  '/',
  '/auth/sign-in(.*)',
  '/auth/sign-up(.*)',
  '/pricing(.*)',
  '/pricing-ainext(.*)',
  '/pricing-old(.*)',
  '/features(.*)',
  '/contact(.*)',
  '/contact-ainext(.*)',
  '/landing-page-2(.*)',
  '/about(.*)',
  '/team-ainext(.*)',
  '/terms-conditions(.*)',
  '/privacy-policy(.*)',
  '/not-found-ainext(.*)',
  '/portfolio-ainext(.*)',
  '/blog-ainext(.*)',
  '/api/webhooks(.*)',
  '/api/health(.*)',
  '/api/debug(.*)',
])

const hasClerkKeys = Boolean(
  (process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || process.env.CLERK_PUBLISHABLE_KEY) &&
  process.env.CLERK_SECRET_KEY
)

let clerkHandler: any = null
if (hasClerkKeys) {
  try {
    clerkHandler = clerkMiddleware(async (auth, req) => {
      if (!isPublicRoute(req)) {
        await auth.protect()
      }
    })
  } catch (error) {
    console.warn('⚠️ Clerk middleware initialization warning:', error)
  }
}

export default async function middleware(req: NextRequest, event: any) {
  // If Clerk keys are not configured or middleware failed to initialize,
  // allow the request through so the site never shows a 500 Internal Server Error.
  if (!hasClerkKeys || !clerkHandler) {
    return NextResponse.next()
  }

  try {
    return await clerkHandler(req, event)
  } catch (error) {
    console.error('Middleware auth error:', error)
    // Fail gracefully: don't crash public routes with a 500 error
    if (isPublicRoute(req)) {
      return NextResponse.next()
    }
    const signInUrl = new URL('/auth/sign-in', req.url)
    return NextResponse.redirect(signInUrl)
  }
}

export const config = {
  // This matcher ensures the middleware runs on all routes
  // except for static files and internal Next.js assets.
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};
