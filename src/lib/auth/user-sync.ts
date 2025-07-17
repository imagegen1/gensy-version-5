/**
 * User Profile Synchronization for Gensy AI Creative Suite
 * Handles syncing user data between Clerk and Supabase
 */

import { auth, currentUser } from '@clerk/nextjs/server'
import { createServiceRoleClient } from '../supabase/server'
import type { User } from '@clerk/nextjs/server'

/**
 * Sync user profile from Clerk to Supabase
 */
export async function syncUserProfile(clerkUser?: User | null): Promise<{
  success: boolean
  user?: any
  error?: string
}> {
  try {
    // Get current user if not provided
    const user = clerkUser || await currentUser()
    
    if (!user) {
      return { success: false, error: 'No authenticated user found' }
    }

    const supabase = createServiceRoleClient()

    // Prepare user data (matching the 'users' table schema)
    const userData = {
      clerk_user_id: user.id,
      email: user.emailAddresses[0]?.emailAddress || '',
      full_name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || null,
      avatar_url: user.imageUrl || null,
      updated_at: new Date().toISOString(),
    }

    // Use upsert to safely create or update user profile
    const { data: supabaseUser, error } = await supabase
      .from('users')
      .upsert(userData, {
        onConflict: 'clerk_user_id',
        ignoreDuplicates: false
      })
      .select()
      .single()

    if (error) {
      console.error('Error syncing user profile:', error)
      return { success: false, error: error.message }
    }

    // Initialize user preferences if this is a new user
    if (supabaseUser) {
      await initializeUserPreferences(supabaseUser.id)
    }

    return { success: true, user: supabaseUser }
  } catch (error) {
    console.error('Error in syncUserProfile:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Initialize default user preferences
 */
async function initializeUserPreferences(userId: string) {
  try {
    const supabase = createServiceRoleClient()

    const defaultPreferences = {
      theme: 'light',
      notifications: {
        email: true,
        push: false,
        generation_complete: true,
        credit_low: true,
        marketing: false,
      },
      generation_defaults: {
        image_style: 'realistic',
        aspect_ratio: '1:1',
        quality: 'standard',
      },
      privacy: {
        profile_public: false,
        gallery_public: false,
        analytics_opt_out: false,
      },
    }

    const { error } = await supabase
      .from('user_preferences')
      .upsert({
        user_id: userId,
        preferences: defaultPreferences,
      }, {
        onConflict: 'user_id',
        ignoreDuplicates: true,
      })

    if (error) {
      console.error('Error initializing user preferences:', error)
    }
  } catch (error) {
    console.error('Error in initializeUserPreferences:', error)
  }
}

/**
 * Get current authenticated user from Supabase
 */
export async function getCurrentUser(): Promise<{
  success: boolean
  user?: any
  error?: string
}> {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return { success: false, error: 'Not authenticated' }
    }

    const supabase = createServiceRoleClient()
    
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('clerk_user_id', userId)
      .single()

    if (error) {
      // If user doesn't exist in Supabase, try to sync from Clerk
      if (error.code === 'PGRST116') {
        const syncResult = await syncUserProfile()
        if (syncResult.success) {
          return { success: true, user: syncResult.user }
        }
      }
      
      return { success: false, error: error.message }
    }

    return { success: true, user }
  } catch (error) {
    console.error('Error in getCurrentUser:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Update user profile in Supabase
 */
export async function updateUserProfile(updates: {
  full_name?: string
  avatar_url?: string
  preferences?: any
}): Promise<{
  success: boolean
  user?: any
  error?: string
}> {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return { success: false, error: 'Not authenticated' }
    }

    const supabase = createServiceRoleClient()

    // Update user profile
    const { data: user, error } = await supabase
      .from('users')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('clerk_user_id', userId)
      .select()
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, user }
  } catch (error) {
    console.error('Error in updateUserProfile:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Delete user account and all associated data
 */
export async function deleteUserAccount(): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return { success: false, error: 'Not authenticated' }
    }

    const supabase = createServiceRoleClient()

    // Delete user (cascade will handle related data)
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('clerk_user_id', userId)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Error in deleteUserAccount:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Check if user has sufficient credits
 */
export async function checkUserCredits(requiredCredits: number = 1): Promise<{
  hasCredits: boolean
  currentCredits: number
  error?: string
}> {
  try {
    const userResult = await getCurrentUser()
    
    if (!userResult.success || !userResult.user) {
      return { 
        hasCredits: false, 
        currentCredits: 0, 
        error: userResult.error || 'User not found' 
      }
    }

    const currentCredits = userResult.user.credits || 0
    
    return {
      hasCredits: currentCredits >= requiredCredits,
      currentCredits,
    }
  } catch (error) {
    console.error('Error in checkUserCredits:', error)
    return { 
      hasCredits: false, 
      currentCredits: 0, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Get user's subscription status
 */
export async function getUserSubscriptionStatus(): Promise<{
  success: boolean
  subscription?: any
  error?: string
}> {
  try {
    const userResult = await getCurrentUser()
    
    if (!userResult.success || !userResult.user) {
      return { 
        success: false, 
        error: userResult.error || 'User not found' 
      }
    }

    const supabase = createServiceRoleClient()
    
    const { data: subscription, error } = await supabase
      .from('user_subscriptions')
      .select(`
        *,
        subscription_plans (*)
      `)
      .eq('user_id', userResult.user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error && error.code !== 'PGRST116') {
      return { success: false, error: error.message }
    }

    return { success: true, subscription: subscription || null }
  } catch (error) {
    console.error('Error in getUserSubscriptionStatus:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}
