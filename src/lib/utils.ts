import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Get the base URL for the application
 * Works in all environments: production, preview, and local development
 */
export const getBaseUrl = (): string => {
  // 1. If you've set a NEXT_PUBLIC_APP_URL, use that (highest priority)
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL
  }

  // 2. VERCEL_URL is provided by Vercel for deployments (auto-generated)
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }

  // 3. Fallback to localhost for local development
  return 'http://localhost:3000'
}

/**
 * Get the full URL for an API endpoint
 */
export const getApiUrl = (path: string): string => {
  const baseUrl = getBaseUrl()
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  return `${baseUrl}${cleanPath}`
}

/**
 * Check if we're running in production
 */
export const isProduction = (): boolean => {
  return process.env.NODE_ENV === 'production'
}

/**
 * Check if we're running on Vercel
 */
export const isVercel = (): boolean => {
  return !!process.env.VERCEL_URL
}
