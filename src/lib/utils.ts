import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Get absolute base URL for the app (server and client safe)
export function getBaseUrl(): string {
  // Prefer explicit environment configuration or platform deployment URLs
  const envUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : undefined) ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined) ||
    (process.env.RAILWAY_PUBLIC_DOMAIN ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` : undefined)

  if (envUrl) {
    const formatted = /^https?:\/\//i.test(envUrl) ? envUrl : `https://${envUrl}`
    try {
      return new URL(formatted).origin
    } catch {
      // fallback below
    }
  }

  // Fallback to window origin on the client
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin
  }

  // In production or build environments, use the production domain so sharing previews never point to localhost
  if (process.env.NODE_ENV === 'production' || process.env.VERCEL || process.env.RAILWAY_ENVIRONMENT) {
    return 'https://gensy.online'
  }

  // Canonical domain for social sharing previews
  return 'https://gensy.online'
}
