/**
 * Atomic Credit Management System for Gensy AI Creative Suite
 * 
 * Implements atomic credit deduction using database stored procedures
 * to prevent race conditions and ensure financial integrity.
 * 
 * Critical security fix for CVSS 8.5 vulnerability.
 */

import { createServiceRoleClient } from '@/lib/supabase/client'

// Credit transaction types
export enum CreditTransactionType {
  DEDUCTION = 'deduction',
  REFUND = 'refund',
  PURCHASE = 'purchase',
  BONUS = 'bonus',
  ADJUSTMENT = 'adjustment',
}

// Credit transaction status
export enum CreditTransactionStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REVERSED = 'reversed',
}

// Credit transaction interface
export interface CreditTransaction {
  id: string
  userId: string
  type: CreditTransactionType
  amount: number
  status: CreditTransactionStatus
  description: string
  metadata?: Record<string, any>
  createdAt: string
  completedAt?: string
}

// Credit operation result
export interface CreditOperationResult {
  success: boolean
  transactionId?: string
  remainingCredits?: number
  error?: string
  code?: string
}

/**
 * Atomic credit deduction with database-level locking
 */
export async function deductCreditsAtomic(
  userId: string,
  amount: number,
  description: string,
  metadata?: Record<string, any>
): Promise<CreditOperationResult> {
  const supabase = createServiceRoleClient()

  try {
    // Call the stored procedure for atomic credit deduction
    const { data, error } = await supabase.rpc('deduct_credits_atomic', {
      p_user_id: userId,
      p_amount: amount,
      p_description: description,
      p_metadata: metadata || {}
    })

    if (error) {
      console.error('Atomic credit deduction failed:', error)
      
      // Handle specific error cases
      if (error.message.includes('Insufficient credits')) {
        return {
          success: false,
          error: 'Insufficient credits',
          code: 'INSUFFICIENT_CREDITS'
        }
      }
      
      if (error.message.includes('User not found')) {
        return {
          success: false,
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        }
      }

      return {
        success: false,
        error: 'Credit deduction failed',
        code: 'DEDUCTION_FAILED'
      }
    }

    return {
      success: true,
      transactionId: data.transaction_id,
      remainingCredits: data.remaining_credits
    }
  } catch (error) {
    console.error('Credit deduction error:', error)
    return {
      success: false,
      error: 'Internal error during credit deduction',
      code: 'INTERNAL_ERROR'
    }
  }
}

/**
 * Atomic credit refund
 */
export async function refundCreditsAtomic(
  userId: string,
  amount: number,
  description: string,
  originalTransactionId?: string,
  metadata?: Record<string, any>
): Promise<CreditOperationResult> {
  const supabase = createServiceRoleClient()

  try {
    const { data, error } = await supabase.rpc('refund_credits_atomic', {
      p_user_id: userId,
      p_amount: amount,
      p_description: description,
      p_original_transaction_id: originalTransactionId,
      p_metadata: metadata || {}
    })

    if (error) {
      console.error('Atomic credit refund failed:', error)
      return {
        success: false,
        error: 'Credit refund failed',
        code: 'REFUND_FAILED'
      }
    }

    return {
      success: true,
      transactionId: data.transaction_id,
      remainingCredits: data.remaining_credits
    }
  } catch (error) {
    console.error('Credit refund error:', error)
    return {
      success: false,
      error: 'Internal error during credit refund',
      code: 'INTERNAL_ERROR'
    }
  }
}

/**
 * Get user's current credit balance with locking
 */
export async function getUserCreditsWithLock(userId: string): Promise<{
  credits: number
  error?: string
}> {
  const supabase = createServiceRoleClient()

  try {
    const { data, error } = await supabase.rpc('get_user_credits_with_lock', {
      p_user_id: userId
    })

    if (error) {
      console.error('Failed to get user credits:', error)
      return { credits: 0, error: error.message }
    }

    return { credits: data.credits }
  } catch (error) {
    console.error('Error getting user credits:', error)
    return { credits: 0, error: 'Internal error' }
  }
}

/**
 * Check if user has sufficient credits without locking
 */
export async function checkSufficientCredits(
  userId: string,
  requiredAmount: number
): Promise<{ sufficient: boolean; currentCredits: number }> {
  const supabase = createServiceRoleClient()

  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('credits')
      .eq('clerk_user_id', userId)
      .single()

    if (error || !user) {
      console.error('Failed to check user credits:', error)
      return { sufficient: false, currentCredits: 0 }
    }

    return {
      sufficient: user.credits >= requiredAmount,
      currentCredits: user.credits
    }
  } catch (error) {
    console.error('Error checking sufficient credits:', error)
    return { sufficient: false, currentCredits: 0 }
  }
}

/**
 * Get credit transaction history
 */
export async function getCreditTransactionHistory(
  userId: string,
  limit: number = 50,
  offset: number = 0
): Promise<CreditTransaction[]> {
  const supabase = createServiceRoleClient()

  try {
    const { data, error } = await supabase
      .from('credit_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Failed to get transaction history:', error)
      return []
    }

    return data.map(transaction => ({
      id: transaction.id,
      userId: transaction.user_id,
      type: transaction.type,
      amount: transaction.amount,
      status: transaction.status,
      description: transaction.description,
      metadata: transaction.metadata,
      createdAt: transaction.created_at,
      completedAt: transaction.completed_at,
    }))
  } catch (error) {
    console.error('Error getting transaction history:', error)
    return []
  }
}

/**
 * Reverse a credit transaction (for failed operations)
 */
export async function reverseCreditTransaction(
  transactionId: string,
  reason: string
): Promise<CreditOperationResult> {
  const supabase = createServiceRoleClient()

  try {
    const { data, error } = await supabase.rpc('reverse_credit_transaction', {
      p_transaction_id: transactionId,
      p_reason: reason
    })

    if (error) {
      console.error('Failed to reverse transaction:', error)
      return {
        success: false,
        error: 'Transaction reversal failed',
        code: 'REVERSAL_FAILED'
      }
    }

    return {
      success: true,
      transactionId: data.reversal_transaction_id,
      remainingCredits: data.remaining_credits
    }
  } catch (error) {
    console.error('Error reversing transaction:', error)
    return {
      success: false,
      error: 'Internal error during transaction reversal',
      code: 'INTERNAL_ERROR'
    }
  }
}

/**
 * Batch credit operations (for multiple users or operations)
 */
export async function batchCreditOperations(
  operations: Array<{
    userId: string
    type: 'deduct' | 'refund'
    amount: number
    description: string
    metadata?: Record<string, any>
  }>
): Promise<Array<CreditOperationResult & { userId: string }>> {
  const results: Array<CreditOperationResult & { userId: string }> = []

  // Process operations sequentially to maintain consistency
  for (const operation of operations) {
    let result: CreditOperationResult

    if (operation.type === 'deduct') {
      result = await deductCreditsAtomic(
        operation.userId,
        operation.amount,
        operation.description,
        operation.metadata
      )
    } else {
      result = await refundCreditsAtomic(
        operation.userId,
        operation.amount,
        operation.description,
        undefined,
        operation.metadata
      )
    }

    results.push({
      ...result,
      userId: operation.userId
    })

    // If any operation fails, we might want to implement rollback logic
    if (!result.success) {
      console.warn('Batch operation failed for user:', operation.userId, result.error)
    }
  }

  return results
}

/**
 * Credit system health check
 */
export async function creditSystemHealthCheck(): Promise<{
  healthy: boolean
  issues: string[]
}> {
  const supabase = createServiceRoleClient()
  const issues: string[] = []

  try {
    // Check if stored procedures exist
    const { error: procError } = await supabase.rpc('deduct_credits_atomic', {
      p_user_id: 'health-check',
      p_amount: 0,
      p_description: 'Health check',
      p_metadata: {}
    })

    if (procError && !procError.message.includes('User not found')) {
      issues.push('Stored procedures not available')
    }

    // Check database connectivity
    const { error: dbError } = await supabase
      .from('users')
      .select('count')
      .limit(1)

    if (dbError) {
      issues.push('Database connectivity issue')
    }

    return {
      healthy: issues.length === 0,
      issues
    }
  } catch (error) {
    return {
      healthy: false,
      issues: ['Credit system health check failed']
    }
  }
}
