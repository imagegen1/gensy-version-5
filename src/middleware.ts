import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Define the routes that are accessible to everyone, including non-logged-in users.
// Updated: Final clean version with proper security
const isPublicRoute = createRouteMatcher([
  '/',
  '/auth/sign-in(.*)',
  '/auth/sign-up(.*)',
  '/pricing',
  '/features',
  '/contact',
  '/api/webhooks(.*)', // Allow webhooks to be accessed publicly
]);

export default clerkMiddleware((auth, req) => {
  // If the route is not public, then it is protected.
  if (!isPublicRoute(req)) {
    // For protected routes, enforce authentication.
    auth().protect();
  }
});

export const config = {
  // This matcher ensures the middleware runs on all routes
  // except for static files and internal Next.js assets.
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};
