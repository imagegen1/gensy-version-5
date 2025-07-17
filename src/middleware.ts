import { clerkMiddleware } from '@clerk/nextjs/server';

export default clerkMiddleware({
  // Add all routes that should be accessible to non-logged-in users.
  // All other routes will be protected by default.
  publicRoutes: [
    '/',
    '/auth/sign-in(.*)',
    '/auth/sign-up(.*)',
    '/pricing',
    '/features',
    '/contact',
    '/api/webhooks(.*)',
  ],
});

export const config = {
  // This matcher ensures the middleware runs on all routes
  // except for static files and internal Next.js assets.
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};
