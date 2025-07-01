/**
 * Subscription Management Service for Gensy AI Creative Suite
 * Handles subscription plans, user subscriptions, and billing cycles
 */

import { createServiceRoleClient } from '@/lib/supabase/server'
import { auth } from '@clerk/nextjs/server'

export interface SubscriptionPlan {
  id: string
  name: string
  description: string
  price_monthly: number
  price_yearly: number
  credits_per_month: number
  features: Record<string, boolean>
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface UserSubscription {
  id: string
  user_id: string
  plan_id: string
  status: 'active' | 'cancelled' | 'expired' | 'pending'
  current_period_start: string
  current_period_end: string
  auto_renew: boolean
  created_at: string
  updated_at: string
  plan?: SubscriptionPlan
}

export interface CreditPackage {
  id: string
  name: string
  credits: number
  price: number
  bonus_percentage: number
  description: string
}

export class SubscriptionService {
  /**
   * Get all available subscription plans
   */
  static async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    try {
      const supabase = createServiceRoleClient()
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('price_monthly', { ascending: true })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching subscription plans:', error)
      return []
    }
  }

  /**
   * Get a specific subscription plan
   */
  static async getSubscriptionPlan(planId: string): Promise<SubscriptionPlan | null> {
    try {
      const supabase = createServiceRoleClient()
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('id', planId)
        .eq('is_active', true)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error fetching subscription plan:', error)
      return null
    }
  }

  /**
   * Get user's current subscription
   */
  static async getUserSubscription(clerkUserId?: string): Promise<UserSubscription | null> {
    try {
      const userId = clerkUserId || (await auth()).userId
      if (!userId) throw new Error('User not authenticated')

      const supabase = createServiceRoleClient()
      
      // Get user record first
      const { data: user } = await supabase
        .from('users')
        .select('id')
        .eq('clerk_user_id', userId)
        .single()

      if (!user) return null

      const { data, error } = await supabase
        .from('user_subscriptions')
        .select(`
          *,
          plan:subscription_plans(*)
        `)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      return data
    } catch (error) {
      console.error('Error fetching user subscription:', error)
      return null
    }
  }

  /**
   * Create a new subscription for user
   */
  static async createSubscription(
    planId: string,
    paymentId: string,
    clerkUserId?: string
  ): Promise<{ success: boolean; subscription?: UserSubscription; error?: string }> {
    try {
      const userId = clerkUserId || (await auth()).userId
      if (!userId) throw new Error('User not authenticated')

      const supabase = createServiceRoleClient()

      // Get user record
      const { data: user } = await supabase
        .from('users')
        .select('id')
        .eq('clerk_user_id', userId)
        .single()

      if (!user) throw new Error('User not found')

      // Get plan details
      const plan = await this.getSubscriptionPlan(planId)
      if (!plan) throw new Error('Subscription plan not found')

      // Cancel any existing active subscriptions
      await supabase
        .from('user_subscriptions')
        .update({ status: 'cancelled' })
        .eq('user_id', user.id)
        .eq('status', 'active')

      // Create new subscription
      const startDate = new Date()
      const endDate = new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 days

      const { data: subscription, error } = await supabase
        .from('user_subscriptions')
        .insert({
          user_id: user.id,
          plan_id: planId,
          status: 'active',
          current_period_start: startDate.toISOString(),
          current_period_end: endDate.toISOString(),
          auto_renew: true
        })
        .select(`
          *,
          plan:subscription_plans(*)
        `)
        .single()

      if (error) throw error

      // Add credits to user account
      await supabase
        .from('users')
        .update({
          credits: supabase.raw('credits + ?', [plan.credits_per_month]),
          subscription_status: 'active'
        })
        .eq('id', user.id)

      // Log credit transaction
      await supabase
        .from('credit_transactions')
        .insert({
          user_id: user.id,
          type: 'purchase',
          amount: plan.credits_per_month,
          description: `Subscription: ${plan.name}`,
          payment_id: paymentId
        })

      return { success: true, subscription }
    } catch (error) {
      console.error('Error creating subscription:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create subscription'
      }
    }
  }

  /**
   * Cancel user subscription
   */
  static async cancelSubscription(
    subscriptionId: string,
    clerkUserId?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const userId = clerkUserId || (await auth()).userId
      if (!userId) throw new Error('User not authenticated')

      const supabase = createServiceRoleClient()

      // Get user record
      const { data: user } = await supabase
        .from('users')
        .select('id')
        .eq('clerk_user_id', userId)
        .single()

      if (!user) throw new Error('User not found')

      // Update subscription status
      const { error } = await supabase
        .from('user_subscriptions')
        .update({
          status: 'cancelled',
          auto_renew: false
        })
        .eq('id', subscriptionId)
        .eq('user_id', user.id)

      if (error) throw error

      // Update user subscription status if no active subscriptions remain
      const { data: activeSubscriptions } = await supabase
        .from('user_subscriptions')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'active')

      if (!activeSubscriptions || activeSubscriptions.length === 0) {
        await supabase
          .from('users')
          .update({ subscription_status: 'cancelled' })
          .eq('id', user.id)
      }

      return { success: true }
    } catch (error) {
      console.error('Error cancelling subscription:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to cancel subscription'
      }
    }
  }

  /**
   * Get available credit packages
   */
  static getCreditPackages(): CreditPackage[] {
    return [
      {
        id: 'starter',
        name: 'Starter Pack',
        credits: 25,
        price: 4.99,
        bonus_percentage: 0,
        description: 'Perfect for trying out premium features'
      },
      {
        id: 'value',
        name: 'Value Pack',
        credits: 60,
        price: 9.99,
        bonus_percentage: 20,
        description: 'Great value with 20% bonus credits'
      },
      {
        id: 'power',
        name: 'Power Pack',
        credits: 150,
        price: 19.99,
        bonus_percentage: 50,
        description: 'Best for heavy users with 50% bonus'
      },
      {
        id: 'mega',
        name: 'Mega Pack',
        credits: 350,
        price: 39.99,
        bonus_percentage: 75,
        description: 'Maximum value with 75% bonus credits'
      }
    ]
  }

  /**
   * Purchase credits
   */
  static async purchaseCredits(
    packageId: string,
    paymentId: string,
    clerkUserId?: string
  ): Promise<{ success: boolean; newBalance?: number; error?: string }> {
    try {
      const userId = clerkUserId || (await auth()).userId
      if (!userId) throw new Error('User not authenticated')

      const creditPackage = this.getCreditPackages().find(pkg => pkg.id === packageId)
      if (!creditPackage) throw new Error('Credit package not found')

      const supabase = createServiceRoleClient()

      // Get user record
      const { data: user } = await supabase
        .from('users')
        .select('id, credits')
        .eq('clerk_user_id', userId)
        .single()

      if (!user) throw new Error('User not found')

      // Calculate total credits with bonus
      const bonusCredits = Math.floor(creditPackage.credits * (creditPackage.bonus_percentage / 100))
      const totalCredits = creditPackage.credits + bonusCredits

      // Update user credits
      const { data: updatedUser, error } = await supabase
        .from('users')
        .update({
          credits: user.credits + totalCredits
        })
        .eq('id', user.id)
        .select('credits')
        .single()

      if (error) throw error

      // Log credit transaction
      await supabase
        .from('credit_transactions')
        .insert({
          user_id: user.id,
          type: 'purchase',
          amount: totalCredits,
          description: `Credit Purchase: ${creditPackage.name}`,
          payment_id: paymentId
        })

      return { success: true, newBalance: updatedUser.credits }
    } catch (error) {
      console.error('Error purchasing credits:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to purchase credits'
      }
    }
  }

  /**
   * Check if user has access to feature
   */
  static async hasFeatureAccess(
    feature: string,
    clerkUserId?: string
  ): Promise<boolean> {
    try {
      const subscription = await this.getUserSubscription(clerkUserId)
      
      if (!subscription || !subscription.plan) {
        // Free tier features
        const freeFeatures = ['image_generation', 'basic_upscaling']
        return freeFeatures.includes(feature)
      }

      return subscription.plan.features[feature] === true
    } catch (error) {
      console.error('Error checking feature access:', error)
      return false
    }
  }

  /**
   * Get subscription usage statistics
   */
  static async getSubscriptionStats(clerkUserId?: string): Promise<{
    currentPlan: string
    creditsUsedThisMonth: number
    creditsRemaining: number
    daysUntilRenewal: number
  }> {
    try {
      const userId = clerkUserId || (await auth()).userId
      if (!userId) throw new Error('User not authenticated')

      const supabase = createServiceRoleClient()
      const subscription = await this.getUserSubscription(userId)

      // Get user credits
      const { data: user } = await supabase
        .from('users')
        .select('credits')
        .eq('clerk_user_id', userId)
        .single()

      // Calculate credits used this month
      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      startOfMonth.setHours(0, 0, 0, 0)

      const { data: transactions } = await supabase
        .from('credit_transactions')
        .select('amount')
        .eq('user_id', user?.id || '')
        .eq('type', 'usage')
        .gte('created_at', startOfMonth.toISOString())

      const creditsUsedThisMonth = transactions?.reduce((sum, t) => sum + Math.abs(t.amount), 0) || 0

      // Calculate days until renewal
      let daysUntilRenewal = 0
      if (subscription?.current_period_end) {
        const endDate = new Date(subscription.current_period_end)
        const now = new Date()
        daysUntilRenewal = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
      }

      return {
        currentPlan: subscription?.plan?.name || 'Free',
        creditsUsedThisMonth,
        creditsRemaining: user?.credits || 0,
        daysUntilRenewal
      }
    } catch (error) {
      console.error('Error getting subscription stats:', error)
      return {
        currentPlan: 'Free',
        creditsUsedThisMonth: 0,
        creditsRemaining: 0,
        daysUntilRenewal: 0
      }
    }
  }
}
