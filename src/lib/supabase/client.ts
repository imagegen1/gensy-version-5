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
  client = createBrowserClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

  return client
}

// Export the client for direct use
export const supabase = createClient()

// Type exports for convenience
export type SupabaseClient = ReturnType<typeof createClient>
export type { Database } from './types'
