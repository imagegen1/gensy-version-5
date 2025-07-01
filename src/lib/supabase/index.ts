/**
 * Supabase Integration for Gensy AI Creative Suite
 * Central export file for all Supabase-related functionality
 */

// Client exports
export { createClient, supabase } from './client'
export type { SupabaseClient } from './client'

// Server exports
export { 
  createClient as createServerClient,
  createServiceRoleClient 
} from './server'
export type { 
  SupabaseServerClient,
  SupabaseServiceRoleClient 
} from './server'

// Type exports
export type { Database } from './types'

// Utility exports
export {
  testConnection,
  getUserByClerkId,
  upsertUser,
  getUserCredits,
  updateUserCredits,
  getUserGenerations,
  createGeneration,
  updateGenerationStatus,
  healthCheck,
} from './utils'

// Re-export commonly used types
export type {
  Database,
} from './types'

// Constants
export const SUPABASE_CONFIG = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL,
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
} as const
