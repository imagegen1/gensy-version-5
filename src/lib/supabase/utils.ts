/**
 * Supabase Utility Functions for Gensy AI Creative Suite
 * Helper functions for common database operations
 */

import { createClient } from './client'
import { createClient as createServerClient } from './server'
import type { Database } from './types'

// Type aliases for convenience
type Tables = Database['public']['Tables']
type User = Tables['users']['Row']
type Generation = Tables['generations']['Row']
type MediaFile = Tables['media_files']['Row']

/**
 * Test database connection
 */
export async function testConnection() {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1)
      .single()

    if (error) {
      console.error('Supabase connection test failed:', error)
      return false
    }

    console.log('✅ Supabase connection successful')
    return true
  } catch (error) {
    console.error('❌ Supabase connection failed:', error)
    return false
  }
}

/**
 * Get user by Clerk ID
 */
export async function getUserByClerkId(clerkUserId: string): Promise<User | null> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('clerk_user_id', clerkUserId)
      .single()

    if (error) {
      console.error('Error fetching user:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error in getUserByClerkId:', error)
    return null
  }
}

/**
 * Create or update user profile
 */
export async function upsertUser(userData: {
  clerkUserId: string
  email: string
  fullName?: string
  avatarUrl?: string
}): Promise<User | null> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('profiles')
      .upsert({
        clerk_user_id: userData.clerkUserId,
        email: userData.email,
        name: userData.fullName || null,
        avatar_url: userData.avatarUrl || null,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'clerk_user_id'
      })
      .select()
      .single()

    if (error) {
      console.error('Error upserting user:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error in upsertUser:', error)
    return null
  }
}

/**
 * Get user's credit balance
 */
export async function getUserCredits(userId: string): Promise<number> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('users')
      .select('credits')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Error fetching user credits:', error)
      return 0
    }

    return data.credits || 0
  } catch (error) {
    console.error('Error in getUserCredits:', error)
    return 0
  }
}

/**
 * Update user credits
 */
export async function updateUserCredits(
  userId: string,
  credits: number
): Promise<boolean> {
  try {
    const supabase = createClient()
    const { error } = await supabase
      .from('users')
      .update({ 
        credits,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (error) {
      console.error('Error updating user credits:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error in updateUserCredits:', error)
    return false
  }
}

/**
 * Get user's generations
 */
export async function getUserGenerations(
  userId: string,
  limit: number = 20,
  offset: number = 0
): Promise<Generation[]> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('generations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching user generations:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in getUserGenerations:', error)
    return []
  }
}

/**
 * Create a new generation record
 */
export async function createGeneration(generationData: {
  userId: string
  type: 'image' | 'video' | 'upscale'
  prompt: string
  modelUsed: string
  creditsUsed?: number
  metadata?: any
}): Promise<Generation | null> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('generations')
      .insert({
        user_id: generationData.userId,
        type: generationData.type,
        prompt: generationData.prompt,
        model_used: generationData.modelUsed,
        credits_used: generationData.creditsUsed || 1,
        metadata: generationData.metadata || null,
        status: 'pending',
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating generation:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error in createGeneration:', error)
    return null
  }
}

/**
 * Update generation status
 */
export async function updateGenerationStatus(
  generationId: string,
  status: 'pending' | 'processing' | 'completed' | 'failed',
  resultUrl?: string
): Promise<boolean> {
  try {
    const supabase = createClient()
    const updateData: any = { status }
    
    if (resultUrl) {
      updateData.result_url = resultUrl
    }

    const { error } = await supabase
      .from('generations')
      .update(updateData)
      .eq('id', generationId)

    if (error) {
      console.error('Error updating generation status:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error in updateGenerationStatus:', error)
    return false
  }
}

/**
 * Database health check
 */
export async function healthCheck(): Promise<{
  status: 'healthy' | 'unhealthy'
  details: Record<string, any>
}> {
  try {
    const supabase = createClient()
    
    // Test basic connectivity
    const { data: connectionTest, error: connectionError } = await supabase
      .from('users')
      .select('count')
      .limit(1)

    if (connectionError) {
      return {
        status: 'unhealthy',
        details: {
          connection: false,
          error: connectionError.message,
        },
      }
    }

    // Test table access
    const tables = ['users', 'generations', 'media_files']
    const tableTests = await Promise.all(
      tables.map(async (table) => {
        try {
          const { error } = await supabase
            .from(table)
            .select('count')
            .limit(1)
          return { table, accessible: !error, error: error?.message }
        } catch (err) {
          return { table, accessible: false, error: (err as Error).message }
        }
      })
    )

    const allTablesAccessible = tableTests.every((test) => test.accessible)

    return {
      status: allTablesAccessible ? 'healthy' : 'unhealthy',
      details: {
        connection: true,
        tables: tableTests,
        timestamp: new Date().toISOString(),
      },
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      details: {
        connection: false,
        error: (error as Error).message,
        timestamp: new Date().toISOString(),
      },
    }
  }
}
