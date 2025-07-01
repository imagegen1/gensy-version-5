/**
 * Database Migration Utilities for Gensy AI Creative Suite
 * Handles database schema creation and updates
 */

import { createServiceRoleClient } from '../supabase/server'
import fs from 'fs'
import path from 'path'

export interface Migration {
  id: string
  name: string
  sql: string
  applied_at?: string
}

/**
 * Get the service role client for admin operations
 */
function getAdminClient() {
  return createServiceRoleClient()
}

/**
 * Create migrations table if it doesn't exist
 */
export async function createMigrationsTable() {
  const supabase = getAdminClient()
  
  const { error } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS migrations (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        sql TEXT NOT NULL,
        applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `
  })

  if (error) {
    throw new Error(`Failed to create migrations table: ${error.message}`)
  }
}

/**
 * Get list of applied migrations
 */
export async function getAppliedMigrations(): Promise<Migration[]> {
  const supabase = getAdminClient()
  
  const { data, error } = await supabase
    .from('migrations')
    .select('*')
    .order('applied_at', { ascending: true })

  if (error) {
    throw new Error(`Failed to get applied migrations: ${error.message}`)
  }

  return data || []
}

/**
 * Apply a single migration
 */
export async function applyMigration(migration: Omit<Migration, 'applied_at'>) {
  const supabase = getAdminClient()
  
  // Check if migration is already applied
  const { data: existing } = await supabase
    .from('migrations')
    .select('id')
    .eq('id', migration.id)
    .single()

  if (existing) {
    console.log(`Migration ${migration.id} already applied, skipping...`)
    return
  }

  // Execute the migration SQL
  const { error: sqlError } = await supabase.rpc('exec_sql', {
    sql: migration.sql
  })

  if (sqlError) {
    throw new Error(`Failed to execute migration ${migration.id}: ${sqlError.message}`)
  }

  // Record the migration as applied
  const { error: recordError } = await supabase
    .from('migrations')
    .insert({
      id: migration.id,
      name: migration.name,
      sql: migration.sql
    })

  if (recordError) {
    throw new Error(`Failed to record migration ${migration.id}: ${recordError.message}`)
  }

  console.log(`✅ Applied migration: ${migration.id} - ${migration.name}`)
}

/**
 * Run all pending migrations
 */
export async function runMigrations() {
  try {
    console.log('🚀 Starting database migrations for Gensy...')
    
    // Ensure migrations table exists
    await createMigrationsTable()
    
    // Get applied migrations
    const appliedMigrations = await getAppliedMigrations()
    const appliedIds = new Set(appliedMigrations.map(m => m.id))
    
    // Define migrations in order
    const migrations: Omit<Migration, 'applied_at'>[] = [
      {
        id: '001_initial_schema',
        name: 'Create initial database schema',
        sql: await readSQLFile('schema.sql')
      },
      {
        id: '002_rls_policies',
        name: 'Create Row Level Security policies',
        sql: await readSQLFile('rls-policies.sql')
      },
      {
        id: '003_functions',
        name: 'Create database functions',
        sql: await readSQLFile('functions.sql')
      }
    ]
    
    // Apply pending migrations
    for (const migration of migrations) {
      if (!appliedIds.has(migration.id)) {
        await applyMigration(migration)
      } else {
        console.log(`⏭️  Skipping already applied migration: ${migration.id}`)
      }
    }
    
    console.log('✅ All migrations completed successfully!')
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  }
}

/**
 * Read SQL file from the database directory
 */
async function readSQLFile(filename: string): Promise<string> {
  try {
    const filePath = path.join(process.cwd(), 'src/lib/database', filename)
    return fs.readFileSync(filePath, 'utf-8')
  } catch (error) {
    throw new Error(`Failed to read SQL file ${filename}: ${error}`)
  }
}

/**
 * Reset database (WARNING: This will delete all data!)
 */
export async function resetDatabase() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Cannot reset database in production!')
  }
  
  const supabase = getAdminClient()
  
  console.log('⚠️  Resetting database...')
  
  // Drop all tables
  const dropTablesSQL = `
    DROP TABLE IF EXISTS usage_analytics CASCADE;
    DROP TABLE IF EXISTS api_keys CASCADE;
    DROP TABLE IF EXISTS user_preferences CASCADE;
    DROP TABLE IF EXISTS generation_history CASCADE;
    DROP TABLE IF EXISTS payments CASCADE;
    DROP TABLE IF EXISTS credit_transactions CASCADE;
    DROP TABLE IF EXISTS media_files CASCADE;
    DROP TABLE IF EXISTS generations CASCADE;
    DROP TABLE IF EXISTS user_subscriptions CASCADE;
    DROP TABLE IF EXISTS subscription_plans CASCADE;
    DROP TABLE IF EXISTS users CASCADE;
    DROP TABLE IF EXISTS migrations CASCADE;
    
    -- Drop custom types
    DROP TYPE IF EXISTS generation_type CASCADE;
    DROP TYPE IF EXISTS generation_status CASCADE;
    DROP TYPE IF EXISTS subscription_status CASCADE;
    DROP TYPE IF EXISTS payment_status CASCADE;
    
    -- Drop functions
    DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
    DROP FUNCTION IF EXISTS get_current_user_id() CASCADE;
  `
  
  const { error } = await supabase.rpc('exec_sql', { sql: dropTablesSQL })
  
  if (error) {
    throw new Error(`Failed to reset database: ${error.message}`)
  }
  
  console.log('✅ Database reset completed')
}

/**
 * Seed database with initial data
 */
export async function seedDatabase() {
  const supabase = getAdminClient()
  
  console.log('🌱 Seeding database with initial data...')
  
  // Check if subscription plans already exist
  const { data: existingPlans } = await supabase
    .from('subscription_plans')
    .select('id')
    .limit(1)
  
  if (existingPlans && existingPlans.length > 0) {
    console.log('📋 Subscription plans already exist, skipping seed...')
    return
  }
  
  // Seed subscription plans (already included in schema.sql)
  console.log('✅ Database seeded successfully!')
}

/**
 * Validate database schema
 */
export async function validateSchema(): Promise<{
  isValid: boolean
  errors: string[]
}> {
  const supabase = getAdminClient()
  const errors: string[] = []
  
  // Check if all required tables exist
  const requiredTables = [
    'users',
    'subscription_plans',
    'user_subscriptions',
    'generations',
    'media_files',
    'credit_transactions',
    'payments',
    'generation_history',
    'user_preferences',
    'api_keys',
    'usage_analytics'
  ]
  
  for (const table of requiredTables) {
    const { error } = await supabase
      .from(table)
      .select('count')
      .limit(1)
    
    if (error) {
      errors.push(`Table '${table}' is missing or inaccessible: ${error.message}`)
    }
  }
  
  // Check if RLS is enabled
  const { data: rlsCheck, error: rlsError } = await supabase.rpc('exec_sql', {
    sql: `
      SELECT schemaname, tablename, rowsecurity 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename IN (${requiredTables.map(t => `'${t}'`).join(',')})
    `
  })
  
  if (rlsError) {
    errors.push(`Failed to check RLS status: ${rlsError.message}`)
  } else if (rlsCheck) {
    const tablesWithoutRLS = rlsCheck.filter((row: any) => !row.rowsecurity)
    if (tablesWithoutRLS.length > 0) {
      errors.push(`Tables without RLS: ${tablesWithoutRLS.map((t: any) => t.tablename).join(', ')}`)
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}
