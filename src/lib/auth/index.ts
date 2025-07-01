/**
 * Authentication Utilities for Gensy AI Creative Suite
 * Central export file for all authentication-related functionality
 */

// User sync exports
export {
  syncUserProfile,
  getCurrentUser,
  updateUserProfile,
  deleteUserAccount,
  checkUserCredits,
  getUserSubscriptionStatus,
} from './user-sync'

// Re-export Clerk utilities
export { auth, currentUser } from '@clerk/nextjs/server'
export { useAuth, useUser } from '@clerk/nextjs'

// Authentication constants
export const AUTH_CONFIG = {
  signInUrl: '/auth/sign-in',
  signUpUrl: '/auth/sign-up',
  afterSignInUrl: '/dashboard',
  afterSignUpUrl: '/onboarding',
  profileUrl: '/settings/profile',
} as const

// User roles (for future use)
export const USER_ROLES = {
  USER: 'user',
  ADMIN: 'admin',
  MODERATOR: 'moderator',
} as const

// Authentication helpers
export const isAuthenticated = (userId: string | null): boolean => {
  return Boolean(userId)
}

export const redirectToSignIn = () => {
  window.location.href = AUTH_CONFIG.signInUrl
}

export const redirectToDashboard = () => {
  window.location.href = AUTH_CONFIG.afterSignInUrl
}
