/**
 * Service Pricing Configuration for Gensy AI Creative Suite
 * Manages credit costs for different AI models and services
 * Based on 55% gross margin pricing structure
 */

import { createServiceRoleClient } from '@/lib/supabase/server'

export interface ServicePricing {
  id: string
  provider: string
  model_name: string
  service_type: 'image' | 'video' | 'upscale'
  api_cost_usd: number
  api_cost_inr: number
  storage_cost_inr: number
  total_cost_inr: number
  selling_price_inr: number
  credits_required: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CreditCostCalculation {
  credits_required: number
  cost_inr: number
  selling_price_inr: number
  margin_percentage: number
}

export class ServicePricingManager {
  private static readonly CREDIT_VALUE_INR = 0.02 // ₹0.02 per credit
  private static readonly COST_PER_CREDIT_INR = 0.009 // ₹0.009 cost to Gensy per credit
  private static readonly TARGET_MARGIN = 0.55 // 55% gross margin

  /**
   * Get all active service pricing
   */
  static async getAllServicePricing(): Promise<ServicePricing[]> {
    try {
      const supabase = createServiceRoleClient()
      const { data, error } = await supabase
        .from('service_pricing')
        .select('*')
        .eq('is_active', true)
        .order('provider', { ascending: true })
        .order('credits_required', { ascending: true })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching service pricing:', error)
      return []
    }
  }

  /**
   * Get pricing for a specific model
   */
  static async getModelPricing(provider: string, modelName: string): Promise<ServicePricing | null> {
    try {
      const supabase = createServiceRoleClient()
      const { data, error } = await supabase
        .from('service_pricing')
        .select('*')
        .eq('provider', provider)
        .eq('model_name', modelName)
        .eq('is_active', true)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error fetching model pricing:', error)
      return null
    }
  }

  /**
   * Get pricing by service type
   */
  static async getPricingByServiceType(serviceType: 'image' | 'video' | 'upscale'): Promise<ServicePricing[]> {
    try {
      const supabase = createServiceRoleClient()
      const { data, error } = await supabase
        .from('service_pricing')
        .select('*')
        .eq('service_type', serviceType)
        .eq('is_active', true)
        .order('credits_required', { ascending: true })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching pricing by service type:', error)
      return []
    }
  }

  /**
   * Calculate credit cost for a service
   */
  static calculateCreditCost(totalCostInr: number): CreditCostCalculation {
    // Calculate credits required based on cost per credit
    const creditsRequired = Math.ceil(totalCostInr / this.COST_PER_CREDIT_INR)
    
    // Calculate selling price (credits * credit value)
    const sellingPriceInr = creditsRequired * this.CREDIT_VALUE_INR
    
    // Calculate actual margin percentage
    const marginPercentage = ((sellingPriceInr - totalCostInr) / sellingPriceInr) * 100

    return {
      credits_required: creditsRequired,
      cost_inr: totalCostInr,
      selling_price_inr: sellingPriceInr,
      margin_percentage: Math.round(marginPercentage * 100) / 100
    }
  }

  /**
   * Get credit cost for a specific model (cached lookup)
   */
  static async getCreditsForModel(provider: string, modelName: string): Promise<number> {
    const pricing = await this.getModelPricing(provider, modelName)
    return pricing?.credits_required || 0
  }

  /**
   * Validate if user has enough credits for a service
   */
  static async validateCreditsForService(
    userCredits: number, 
    provider: string, 
    modelName: string
  ): Promise<{ hasEnoughCredits: boolean; creditsRequired: number; creditsShort: number }> {
    const creditsRequired = await this.getCreditsForModel(provider, modelName)
    const hasEnoughCredits = userCredits >= creditsRequired
    const creditsShort = hasEnoughCredits ? 0 : creditsRequired - userCredits

    return {
      hasEnoughCredits,
      creditsRequired,
      creditsShort
    }
  }

  /**
   * Get popular models by service type (most cost-effective)
   */
  static async getPopularModels(serviceType: 'image' | 'video' | 'upscale', limit: number = 5): Promise<ServicePricing[]> {
    try {
      const supabase = createServiceRoleClient()
      const { data, error } = await supabase
        .from('service_pricing')
        .select('*')
        .eq('service_type', serviceType)
        .eq('is_active', true)
        .order('credits_required', { ascending: true })
        .limit(limit)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching popular models:', error)
      return []
    }
  }

  /**
   * Get premium models by service type (highest quality/cost)
   */
  static async getPremiumModels(serviceType: 'image' | 'video' | 'upscale', limit: number = 5): Promise<ServicePricing[]> {
    try {
      const supabase = createServiceRoleClient()
      const { data, error } = await supabase
        .from('service_pricing')
        .select('*')
        .eq('service_type', serviceType)
        .eq('is_active', true)
        .order('credits_required', { ascending: false })
        .limit(limit)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching premium models:', error)
      return []
    }
  }

  /**
   * Update service pricing (admin function)
   */
  static async updateServicePricing(
    id: string,
    updates: Partial<Omit<ServicePricing, 'id' | 'created_at' | 'updated_at'>>
  ): Promise<boolean> {
    try {
      const supabase = createServiceRoleClient()
      const { error } = await supabase
        .from('service_pricing')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)

      if (error) throw error
      return true
    } catch (error) {
      console.error('Error updating service pricing:', error)
      return false
    }
  }

  /**
   * Add new service pricing (admin function)
   */
  static async addServicePricing(pricing: Omit<ServicePricing, 'id' | 'created_at' | 'updated_at'>): Promise<string | null> {
    try {
      const supabase = createServiceRoleClient()
      const { data, error } = await supabase
        .from('service_pricing')
        .insert(pricing)
        .select('id')
        .single()

      if (error) throw error
      return data?.id || null
    } catch (error) {
      console.error('Error adding service pricing:', error)
      return null
    }
  }

  /**
   * Get pricing statistics for admin dashboard
   */
  static async getPricingStatistics(): Promise<{
    totalModels: number
    imageModels: number
    videoModels: number
    averageImageCredits: number
    averageVideoCredits: number
    mostExpensiveModel: ServicePricing | null
    cheapestModel: ServicePricing | null
  }> {
    try {
      const allPricing = await this.getAllServicePricing()
      
      const imageModels = allPricing.filter(p => p.service_type === 'image')
      const videoModels = allPricing.filter(p => p.service_type === 'video')
      
      const averageImageCredits = imageModels.length > 0 
        ? Math.round(imageModels.reduce((sum, p) => sum + p.credits_required, 0) / imageModels.length)
        : 0
      
      const averageVideoCredits = videoModels.length > 0
        ? Math.round(videoModels.reduce((sum, p) => sum + p.credits_required, 0) / videoModels.length)
        : 0

      const sortedByCredits = [...allPricing].sort((a, b) => a.credits_required - b.credits_required)
      
      return {
        totalModels: allPricing.length,
        imageModels: imageModels.length,
        videoModels: videoModels.length,
        averageImageCredits,
        averageVideoCredits,
        mostExpensiveModel: sortedByCredits[sortedByCredits.length - 1] || null,
        cheapestModel: sortedByCredits[0] || null
      }
    } catch (error) {
      console.error('Error getting pricing statistics:', error)
      return {
        totalModels: 0,
        imageModels: 0,
        videoModels: 0,
        averageImageCredits: 0,
        averageVideoCredits: 0,
        mostExpensiveModel: null,
        cheapestModel: null
      }
    }
  }
}
