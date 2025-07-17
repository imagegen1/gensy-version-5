import { clerkMiddleware } from '@clerk/nextjs/server'

export default clerkMiddleware({
  // Add public routes here, which are accessible to everyone
  // By default, all routes are protected.
  publicRoutes: [
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
  ]
})

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    '/((?!_next|static|favicon.ico|sw.js).*)',
  ],
}
