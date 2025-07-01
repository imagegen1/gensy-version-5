/**
 * Database Utilities for Gensy AI Creative Suite
 * Central export file for all database-related functionality
 */

// Migration exports
export {
  runMigrations,
  validateSchema,
  seedDatabase,
  resetDatabase,
  createMigrationsTable,
  getAppliedMigrations,
  applyMigration,
} from './migrations'

// Re-export Supabase utilities
export * from '../supabase'

// Database configuration
export const DATABASE_CONFIG = {
  maxConnections: 20,
  connectionTimeout: 30000,
  idleTimeout: 600000,
  retryAttempts: 3,
  retryDelay: 1000,
} as const

// Database constants
export const TABLES = {
  USERS: 'users',
  SUBSCRIPTION_PLANS: 'subscription_plans',
  USER_SUBSCRIPTIONS: 'user_subscriptions',
  GENERATIONS: 'generations',
  MEDIA_FILES: 'media_files',
  CREDIT_TRANSACTIONS: 'credit_transactions',
  PAYMENTS: 'payments',
  GENERATION_HISTORY: 'generation_history',
  USER_PREFERENCES: 'user_preferences',
  API_KEYS: 'api_keys',
  USAGE_ANALYTICS: 'usage_analytics',
} as const

export const GENERATION_TYPES = {
  IMAGE: 'image',
  VIDEO: 'video',
  UPSCALE: 'upscale',
} as const

export const GENERATION_STATUSES = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const

export const SUBSCRIPTION_STATUSES = {
  ACTIVE: 'active',
  CANCELLED: 'cancelled',
  EXPIRED: 'expired',
  PENDING: 'pending',
} as const

export const PAYMENT_STATUSES = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded',
} as const
