import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Simple middleware with comprehensive error handling for debugging
export async function middleware(request: NextRequest) {
  try {
    console.log('🔍 MIDDLEWARE: Starting middleware for', request.nextUrl.pathname)

    // Check environment variables
    console.log('🔍 MIDDLEWARE: Environment check', {
      hasClerkPublishable: !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
      hasClerkSecret: !!process.env.CLERK_SECRET_KEY,
      nodeEnv: process.env.NODE_ENV,
      vercel: process.env.VERCEL,
    })

    // Define public routes that don't need authentication
    const publicPaths = [
      '/',
      '/auth/sign-in',
      '/auth/sign-up',
      '/pricing',
      '/credits',
      '/billing',
      '/analytics',
      '/generate',
      '/payment',
      '/features',
      '/contact',
      '/demo',
      '/api/webhooks',
      '/api/health',
      '/api/auth',
      '/api/test-video',
      '/api/test',
      '/_next',
      '/favicon.ico',
      '/not-found'
    ]

    // Check if current path is public
    const isPublicPath = publicPaths.some(path =>
      request.nextUrl.pathname.startsWith(path)
    )

    console.log('🔍 MIDDLEWARE: Path check', {
      pathname: request.nextUrl.pathname,
      isPublicPath,
    })

    // For now, allow all requests to pass through
    // We'll add authentication logic after confirming basic middleware works
    console.log('✅ MIDDLEWARE: Allowing request to proceed')
    return NextResponse.next()

  } catch (error: any) {
    console.error('❌ MIDDLEWARE ERROR:', error)

    // Return detailed error information for debugging
    return new NextResponse(
      JSON.stringify({
        message: 'Middleware failed',
        error: error.message,
        stack: error.stack,
        pathname: request.nextUrl.pathname,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
