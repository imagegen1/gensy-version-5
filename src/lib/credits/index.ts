/**
 * Credit Management System for Gensy AI Creative Suite
 * Handles credit tracking, validation, and transactions
 */

import { createServiceRoleClient } from '@/lib/supabase/server'
import { auth } from '@clerk/nextjs/server'

export interface CreditTransaction {
  id: string
  user_id: string
  type: 'purchase' | 'usage' | 'refund' | 'bonus'
  amount: number
  description: string
  generation_id?: string
  payment_id?: string
  created_at: string
}

export interface CreditBalance {
  current: number
  total_earned: number
  total_spent: number
  last_updated: string
}

export class CreditService {
  /**
   * Get user's current credit balance
   */
  static async getUserCredits(clerkUserId?: string): Promise<number> {
    try {
      const userId = clerkUserId || (await auth()).userId
      if (!userId) throw new Error('User not authenticated')

      const supabase = createServiceRoleClient()
      const { data, error } = await supabase
        .from('profiles')
        .select('credits')
        .eq('clerk_user_id', userId)
        .single()

      if (error) {
        console.log('User not found in credits check, returning 0')
        return 0
      }
      return data?.credits || 0
    } catch (error) {
      console.error('Error getting user credits:', error)
      return 0
    }
  }

  /**
   * Get detailed credit balance information
   */
  static async getCreditBalance(clerkUserId?: string): Promise<CreditBalance> {
    try {
      const userId = clerkUserId || (await auth()).userId
      if (!userId) throw new Error('User not authenticated')

      const supabase = createServiceRoleClient()
      
      // Get current balance
      const { data: user, error: userError } = await supabase
        .from('profiles')
        .select('credits, updated_at')
        .eq('clerk_user_id', userId)
        .single()

      if (userError) {
        console.log('User not found in getCreditBalance, returning default:', userError.message)
        return {
          current: 0,
          total_earned: 0,
          total_spent: 0,
          last_updated: new Date().toISOString()
        }
      }

      // Get transaction totals
      const { data: userRecord } = await supabase
        .from('users')
        .select('id')
        .eq('clerk_user_id', userId)
        .single()

      if (!userRecord) throw new Error('User not found')

      const { data: transactions } = await supabase
        .from('credit_transactions')
        .select('type, amount')
        .eq('user_id', userRecord.id)

      const totalEarned = transactions
        ?.filter(t => ['purchase', 'bonus', 'refund'].includes(t.type))
        .reduce((sum, t) => sum + Math.abs(t.amount), 0) || 0

      const totalSpent = transactions
        ?.filter(t => t.type === 'usage')
        .reduce((sum, t) => sum + Math.abs(t.amount), 0) || 0

      return {
        current: user?.credits || 0,
        total_earned: totalEarned,
        total_spent: totalSpent,
        last_updated: user?.updated_at || new Date().toISOString()
      }
    } catch (error) {
      console.error('Error getting credit balance:', error)
      return {
        current: 0,
        total_earned: 0,
        total_spent: 0,
        last_updated: new Date().toISOString()
      }
    }
  }

  /**
   * Deduct credits from user account
   */
  static async deductCredits(
    amount: number,
    description: string,
    generationId?: string,
    clerkUserId?: string
  ): Promise<{ success: boolean; newBalance: number; error?: string }> {
    try {
      const userId = clerkUserId || (await auth()).userId
      if (!userId) throw new Error('User not authenticated')

      const supabase = createServiceRoleClient()

      // Get user record
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id, credits')
        .eq('clerk_user_id', userId)
        .single()

      if (userError) throw userError
      if (!user) throw new Error('User not found')

      // Check sufficient credits
      if (user.credits < amount) {
        return {
          success: false,
          newBalance: user.credits,
          error: 'Insufficient credits'
        }
      }

      // Start transaction
      const newBalance = user.credits - amount

      // Update user credits
      const { error: updateError } = await supabase
        .from('users')
        .update({
          credits: newBalance,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (updateError) throw updateError

      // Log transaction
      await this.logTransaction({
        user_id: user.id,
        type: 'usage',
        amount: -amount,
        description,
        generation_id: generationId
      })

      return {
        success: true,
        newBalance
      }
    } catch (error) {
      console.error('Error deducting credits:', error)
      return {
        success: false,
        newBalance: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Add credits to user account
   */
  static async addCredits(
    amount: number,
    description: string,
    type: 'purchase' | 'bonus' | 'refund' = 'bonus',
    paymentId?: string,
    clerkUserId?: string
  ): Promise<{ success: boolean; newBalance: number; error?: string }> {
    try {
      const userId = clerkUserId || (await auth()).userId
      if (!userId) throw new Error('User not authenticated')

      const supabase = createServiceRoleClient()

      // Get user record
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id, credits')
        .eq('clerk_user_id', userId)
        .single()

      if (userError) throw userError
      if (!user) throw new Error('User not found')

      const newBalance = user.credits + amount

      // Update user credits
      const { error: updateError } = await supabase
        .from('users')
        .update({
          credits: newBalance,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (updateError) throw updateError

      // Log transaction
      await this.logTransaction({
        user_id: user.id,
        type,
        amount,
        description,
        payment_id: paymentId
      })

      return {
        success: true,
        newBalance
      }
    } catch (error) {
      console.error('Error adding credits:', error)
      return {
        success: false,
        newBalance: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Check if user has sufficient credits
   */
  static async hasCredits(
    requiredAmount: number,
    clerkUserId?: string
  ): Promise<{ hasCredits: boolean; currentCredits: number }> {
    const currentCredits = await this.getUserCredits(clerkUserId)
    return {
      hasCredits: currentCredits >= requiredAmount,
      currentCredits
    }
  }

  /**
   * Get credit transaction history
   */
  static async getTransactionHistory(
    limit: number = 50,
    offset: number = 0,
    clerkUserId?: string
  ): Promise<CreditTransaction[]> {
    try {
      const userId = clerkUserId || (await auth()).userId
      if (!userId) throw new Error('User not authenticated')

      const supabase = createServiceRoleClient()

      // Get user record
      const { data: user } = await supabase
        .from('profiles')
        .select('id')
        .eq('clerk_user_id', userId)
        .single()

      if (!user) return []

      const { data, error } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error getting transaction history:', error)
      return []
    }
  }

  /**
   * Log a credit transaction
   */
  private static async logTransaction(transaction: {
    user_id: string
    type: 'purchase' | 'usage' | 'refund' | 'bonus'
    amount: number
    description: string
    generation_id?: string
    payment_id?: string
  }): Promise<void> {
    try {
      const supabase = createServiceRoleClient()
      const { error } = await supabase
        .from('credit_transactions')
        .insert({
          ...transaction,
          created_at: new Date().toISOString()
        })

      if (error) throw error
    } catch (error) {
      console.error('Error logging transaction:', error)
    }
  }
}

// Credit validation middleware
export async function validateCredits(requiredCredits: number = 1) {
  const { hasCredits, currentCredits } = await CreditService.hasCredits(requiredCredits)
  
  if (!hasCredits) {
    throw new Error(`Insufficient credits. Required: ${requiredCredits}, Available: ${currentCredits}`)
  }
  
  return true
}

// Credit cost constants
export const CREDIT_COSTS = {
  IMAGE_GENERATION: 2,
  IMAGE_UPSCALING: 2,
  IMAGE_UPSCALING_AI_ENHANCED: 3,
  BATCH_PROCESSING_PER_IMAGE: 2,
  FORMAT_CONVERSION: 0, // Free
  VIDEO_GENERATION: 5,
  VIDEO_REGENERATION: 5,
  PREMIUM_MODEL: 3,
} as const

export type CreditCostType = keyof typeof CREDIT_COSTS
