import { clerkMiddleware } from '@clerk/nextjs/server';

export default clerkMiddleware({
  // Add any routes that should be publicly accessible to everyone.
  // By default, all other routes are protected.
  publicRoutes: ['/']
});

export const config = {
  // This matcher ensures the middleware runs on all routes
  // except for static files and internal Next.js assets.
  matcher: [
    '/((?!.*\\..*|_next).*)',
    '/',
    '/(api|trpc)(.*)'
  ],
};
