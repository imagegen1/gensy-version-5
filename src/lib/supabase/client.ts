/**
 * Supabase Browser Client for Gensy AI Creative Suite
 * This client is used for client-side operations in React components
 */

import { createBrowserClient } from '@supabase/ssr'
import { env } from '../env'
import type { Database } from './types'

// Create a singleton browser client
let client: ReturnType<typeof createBrowserClient<Database>> | undefined

export function createClient() {
  // Return existing client if already created
  if (client) {
    return client
  }

  // Create new browser client
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
  const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'

  client = createBrowserClient<Database>(
    supabaseUrl,
    supabaseAnonKey
  )

  return client
}

// Export a lazily-initialized client so importing this module never creates a
// Supabase client at build/import time (env vars may be unavailable then).
export const supabase = new Proxy({} as ReturnType<typeof createClient>, {
  get(_target, prop) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const instance = createClient() as any
    const value = instance[prop]
    return typeof value === 'function' ? value.bind(instance) : value
  },
})

// Type exports for convenience
export type SupabaseClient = ReturnType<typeof createClient>
export type { Database } from './types'
