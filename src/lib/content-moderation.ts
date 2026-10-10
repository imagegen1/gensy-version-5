/**
 * Content Moderation System for Gensy AI Creative Suite
 * 
 * Handles content review queue, human moderation workflow, and automated actions
 * for content policy violations.
 */

import { createServiceRoleClient } from '@/lib/supabase/server'
import { ViolationType, ContentPolicyResult } from '@/lib/content-policy'

// Moderation status enum
export enum ModerationStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  FLAGGED = 'flagged',
  ESCALATED = 'escalated',
}

// Moderation action enum
export enum ModerationAction {
  ALLOW = 'allow',
  BLOCK = 'block',
  WARN = 'warn',
  SUSPEND = 'suspend',
  BAN = 'ban',
  ESCALATE = 'escalate',
}

// Moderation queue item interface
export interface ModerationQueueItem {
  id: string
  userId: string
  prompt: string
  promptHash: string
  violations: ViolationType[]
  confidence: number
  status: ModerationStatus
  priority: number
  createdAt: string
  reviewedAt?: string
  reviewedBy?: string
  action?: ModerationAction
  notes?: string
}

/**
 * Add content to moderation queue
 */
export async function addToModerationQueue(
  userId: string,
  prompt: string,
  policyResult: ContentPolicyResult
): Promise<string> {
  try {
    const supabase = createServiceRoleClient()
    
    // Calculate priority based on violation severity
    const priority = calculatePriority(policyResult.violations, policyResult.confidence)
    
    const { data, error } = await supabase
      .from('moderation_queue')
      .insert({
        user_id: userId,
        prompt_hash: hashPrompt(prompt),
        violations: policyResult.violations,
        confidence: policyResult.confidence,
        status: ModerationStatus.PENDING,
        priority,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to add to moderation queue: ${error.message}`)
    }

    console.log('Added to moderation queue:', {
      id: data.id,
      userId,
      violations: policyResult.violations,
      priority,
    })

    return data.id
  } catch (error) {
    console.error('Failed to add to moderation queue:', error)
    throw error
  }
}

/**
 * Calculate priority for moderation queue
 */
function calculatePriority(violations: ViolationType[], confidence: number): number {
  let priority = 0

  // Base priority on violation types
  for (const violation of violations) {
    switch (violation) {
      case ViolationType.ILLEGAL_ACTIVITIES:
      case ViolationType.HATE_SPEECH:
      case ViolationType.SELF_HARM:
        priority += 100
        break
      case ViolationType.VIOLENCE:
      case ViolationType.ADULT_CONTENT:
      case ViolationType.HARASSMENT:
        priority += 50
        break
      case ViolationType.MISINFORMATION:
      case ViolationType.PERSONAL_INFO:
        priority += 25
        break
      default:
        priority += 10
    }
  }

  // Adjust by confidence
  priority = Math.floor(priority * confidence)

  return Math.min(priority, 1000) // Cap at 1000
}

/**
 * Get next item from moderation queue
 */
export async function getNextModerationItem(): Promise<ModerationQueueItem | null> {
  try {
    const supabase = createServiceRoleClient()
    
    const { data, error } = await supabase
      .from('moderation_queue')
      .select('*')
      .eq('status', ModerationStatus.PENDING)
      .order('priority', { ascending: false })
      .order('created_at', { ascending: true })
      .limit(1)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw new Error(`Failed to get moderation item: ${error.message}`)
    }

    return data || null
  } catch (error) {
    console.error('Failed to get next moderation item:', error)
    return null
  }
}

/**
 * Review moderation item
 */
export async function reviewModerationItem(
  itemId: string,
  reviewerId: string,
  action: ModerationAction,
  notes?: string
): Promise<void> {
  try {
    const supabase = createServiceRoleClient()
    
    // Update moderation item
    const { error: updateError } = await supabase
      .from('moderation_queue')
      .update({
        status: getStatusFromAction(action),
        reviewed_at: new Date().toISOString(),
        reviewed_by: reviewerId,
        action,
        notes,
      })
      .eq('id', itemId)

    if (updateError) {
      throw new Error(`Failed to update moderation item: ${updateError.message}`)
    }

    // Get the item details for further action
    const { data: item, error: fetchError } = await supabase
      .from('moderation_queue')
      .select('*')
      .eq('id', itemId)
      .single()

    if (fetchError) {
      throw new Error(`Failed to fetch moderation item: ${fetchError.message}`)
    }

    // Apply moderation action
    await applyModerationAction(item.user_id, action, notes)

    console.log('Moderation review completed:', {
      itemId,
      reviewerId,
      action,
      userId: item.user_id,
    })
  } catch (error) {
    console.error('Failed to review moderation item:', error)
    throw error
  }
}

/**
 * Get moderation status from action
 */
function getStatusFromAction(action: ModerationAction): ModerationStatus {
  switch (action) {
    case ModerationAction.ALLOW:
      return ModerationStatus.APPROVED
    case ModerationAction.BLOCK:
    case ModerationAction.WARN:
    case ModerationAction.SUSPEND:
    case ModerationAction.BAN:
      return ModerationStatus.REJECTED
    case ModerationAction.ESCALATE:
      return ModerationStatus.ESCALATED
    default:
      return ModerationStatus.PENDING
  }
}

/**
 * Apply moderation action to user
 */
async function applyModerationAction(
  userId: string,
  action: ModerationAction,
  notes?: string
): Promise<void> {
  try {
    const supabase = createServiceRoleClient()

    switch (action) {
      case ModerationAction.WARN:
        // Add warning to user record
        await supabase.from('user_warnings').insert({
          user_id: userId,
          reason: 'Content policy violation',
          notes,
          created_at: new Date().toISOString(),
        })
        break

      case ModerationAction.SUSPEND:
        // Suspend user account temporarily
        await supabase
          .from('users')
          .update({
            suspended_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
            suspension_reason: notes || 'Content policy violation',
          })
          .eq('clerk_user_id', userId)
        break

      case ModerationAction.BAN:
        // Ban user account permanently
        await supabase
          .from('users')
          .update({
            banned: true,
            ban_reason: notes || 'Severe content policy violation',
            banned_at: new Date().toISOString(),
          })
          .eq('clerk_user_id', userId)
        break

      case ModerationAction.ALLOW:
        // No action needed for allowed content
        break

      case ModerationAction.BLOCK:
        // Content is blocked but no user action
        break

      case ModerationAction.ESCALATE:
        // Escalate to senior moderator
        await escalateToSeniorModerator(userId, notes)
        break
    }

    // Log moderation action
    await supabase.from('moderation_actions').insert({
      user_id: userId,
      action,
      reason: notes || 'Content policy violation',
      created_at: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Failed to apply moderation action:', error)
    throw error
  }
}

/**
 * Escalate to senior moderator
 */
async function escalateToSeniorModerator(userId: string, notes?: string): Promise<void> {
  // In a real implementation, this would notify senior moderators
  // For now, we'll just log the escalation
  console.warn('Content escalated to senior moderator:', {
    userId,
    notes,
    timestamp: new Date().toISOString(),
  })

  // Could integrate with notification systems like:
  // - Slack webhook
  // - Email notification
  // - Internal dashboard alert
}

/**
 * Get moderation queue statistics
 */
export async function getModerationStats(): Promise<{
  pending: number
  approved: number
  rejected: number
  escalated: number
  totalToday: number
}> {
  try {
    const supabase = createServiceRoleClient()
    
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const { data, error } = await supabase
      .from('moderation_queue')
      .select('status, created_at')
      .gte('created_at', today.toISOString())

    if (error) {
      throw new Error(`Failed to get moderation stats: ${error.message}`)
    }

    const stats = {
      pending: 0,
      approved: 0,
      rejected: 0,
      escalated: 0,
      totalToday: data?.length || 0,
    }

    data?.forEach(item => {
      switch (item.status) {
        case ModerationStatus.PENDING:
          stats.pending++
          break
        case ModerationStatus.APPROVED:
          stats.approved++
          break
        case ModerationStatus.REJECTED:
          stats.rejected++
          break
        case ModerationStatus.ESCALATED:
          stats.escalated++
          break
      }
    })

    return stats
  } catch (error) {
    console.error('Failed to get moderation stats:', error)
    return {
      pending: 0,
      approved: 0,
      rejected: 0,
      escalated: 0,
      totalToday: 0,
    }
  }
}

/**
 * Automated moderation for high-confidence violations
 */
export async function autoModerate(
  userId: string,
  policyResult: ContentPolicyResult
): Promise<ModerationAction> {
  // Auto-block high-confidence critical violations
  if (policyResult.confidence >= 0.9 && policyResult.violations.some(v => 
    [ViolationType.ILLEGAL_ACTIVITIES, ViolationType.HATE_SPEECH, ViolationType.SELF_HARM].includes(v)
  )) {
    return ModerationAction.BLOCK
  }

  // Auto-warn for medium-confidence violations
  if (policyResult.confidence >= 0.7) {
    return ModerationAction.WARN
  }

  // Send to human review for lower confidence
  return ModerationAction.ESCALATE
}

/**
 * Hash prompt for privacy
 */
function hashPrompt(prompt: string): string {
  let hash = 0
  for (let i = 0; i < prompt.length; i++) {
    const char = prompt.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return hash.toString(36)
}
