import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Get absolute base URL for the app (server and client safe)
export function getBaseUrl(): string {
  // Prefer explicit environment configuration
  const envUrl = process.env.NEXT_PUBLIC_APP_URL
  if (envUrl && /^https?:\/\//i.test(envUrl)) return envUrl

  // Fallback to window origin on the client
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin
  }

  // Final fallback for server/build environments
  return 'http://localhost:3000'
}
