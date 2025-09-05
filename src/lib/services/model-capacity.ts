// Model Capacity Manager for tracking and managing AI model concurrent limits

import { createServiceRoleClient } from '@/lib/supabase/server';
import { ModelCapacity, ModelCapacityUpdate, GenerationType, AIProvider } from '@/lib/types/queue-types';

export class ModelCapacityManager {
  private static capacityMap = new Map<string, ModelCapacity>();
  private static initialized = false;
  private static reservations = new Map<string, Set<string>>(); // modelId -> Set of reservationIds

  /**
   * Initialize model capacity tracking from database
   */
  static async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      const supabase = createServiceRoleClient();
      
      const { data: capacities, error } = await supabase
        .from('model_capacity')
        .select('*');

      if (error) {
        console.error('Failed to load model capacities:', error);
        return;
      }

      if (capacities) {
        capacities.forEach(capacity => {
          this.capacityMap.set(capacity.model_id, {
            modelId: capacity.model_id,
            generationType: capacity.generation_type as GenerationType,
            provider: capacity.provider as AIProvider,
            maxConcurrent: capacity.max_concurrent,
            currentUsage: capacity.current_usage || 0,
            avgProcessingTimeSeconds: capacity.avg_processing_time_seconds,
            successRate: parseFloat(capacity.success_rate) || 0.95,
            errorRate: parseFloat(capacity.error_rate) || 0.05,
            totalRequests: capacity.total_requests || 0,
            successfulRequests: capacity.successful_requests || 0,
            failedRequests: capacity.failed_requests || 0,
            lastUpdated: new Date(capacity.last_updated)
          });

          // Initialize reservations set
          this.reservations.set(capacity.model_id, new Set());
        });
      }

      this.initialized = true;
      console.log(`✅ Model capacity manager initialized with ${this.capacityMap.size} models`);
    } catch (error) {
      console.error('Error initializing model capacity manager:', error);
    }
  }

  /**
   * Check if model can accept new request
   */
  static canAcceptRequest(modelId: string): boolean {
    const capacity = this.capacityMap.get(modelId);
    if (!capacity) {
      console.warn(`Model ${modelId} not found in capacity registry`);
      return false;
    }

    return capacity.currentUsage < capacity.maxConcurrent;
  }

  /**
   * Reserve a processing slot for a model
   */
  static async reserveSlot(modelId: string, reservationId?: string): Promise<string | null> {
    const capacity = this.capacityMap.get(modelId);
    
    if (!capacity || capacity.currentUsage >= capacity.maxConcurrent) {
      return null;
    }

    // Generate reservation ID if not provided
    const resId = reservationId || `res_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Add to reservations
    const reservations = this.reservations.get(modelId) || new Set();
    reservations.add(resId);
    this.reservations.set(modelId, reservations);

    // Update capacity
    capacity.currentUsage++;
    capacity.lastUpdated = new Date();

    // Update database
    await this.updateCapacityInDB(modelId, { currentUsage: capacity.currentUsage });

    console.log(`🔒 Reserved slot for ${modelId} (${capacity.currentUsage}/${capacity.maxConcurrent}) - Reservation: ${resId}`);
    return resId;
  }

  /**
   * Release a processing slot for a model
   */
  static async releaseSlot(modelId: string, reservationId?: string): Promise<void> {
    const capacity = this.capacityMap.get(modelId);
    
    if (!capacity) {
      console.warn(`Cannot release slot for unknown model: ${modelId}`);
      return;
    }

    // Remove from reservations if reservation ID provided
    if (reservationId) {
      const reservations = this.reservations.get(modelId);
      if (reservations) {
        reservations.delete(reservationId);
      }
    }

    if (capacity.currentUsage > 0) {
      capacity.currentUsage--;
      capacity.lastUpdated = new Date();

      // Update database
      await this.updateCapacityInDB(modelId, { currentUsage: capacity.currentUsage });

      console.log(`🔓 Released slot for ${modelId} (${capacity.currentUsage}/${capacity.maxConcurrent})`);
    }
  }

  /**
   * Get available capacity for a specific model
   */
  static getAvailableCapacity(modelId: string): number {
    const capacity = this.capacityMap.get(modelId);
    return capacity ? capacity.maxConcurrent - capacity.currentUsage : 0;
  }

  /**
   * Get available capacity for all models
   */
  static getAllAvailableCapacity(): Record<string, number> {
    const available: Record<string, number> = {};
    
    this.capacityMap.forEach((capacity, modelId) => {
      available[modelId] = capacity.maxConcurrent - capacity.currentUsage;
    });
    
    return available;
  }

  /**
   * Get models with available capacity by generation type
   */
  static getAvailableModelsByType(generationType: GenerationType): string[] {
    const availableModels: string[] = [];
    
    this.capacityMap.forEach((capacity, modelId) => {
      if (capacity.generationType === generationType && capacity.currentUsage < capacity.maxConcurrent) {
        availableModels.push(modelId);
      }
    });
    
    return availableModels;
  }

  /**
   * Get model with most available capacity for a generation type
   */
  static getBestAvailableModel(generationType: GenerationType, preferredModels?: string[]): string | null {
    let bestModel: string | null = null;
    let maxAvailable = 0;
    
    const modelsToCheck = preferredModels || Array.from(this.capacityMap.keys());
    
    for (const modelId of modelsToCheck) {
      const capacity = this.capacityMap.get(modelId);
      if (capacity && capacity.generationType === generationType) {
        const available = capacity.maxConcurrent - capacity.currentUsage;
        if (available > maxAvailable) {
          maxAvailable = available;
          bestModel = modelId;
        }
      }
    }
    
    return bestModel;
  }

  /**
   * Update model performance metrics
   */
  static async updatePerformanceMetrics(
    modelId: string, 
    processingTimeSeconds: number, 
    success: boolean
  ): Promise<void> {
    const capacity = this.capacityMap.get(modelId);
    if (!capacity) return;

    // Update counters
    capacity.totalRequests++;
    if (success) {
      capacity.successfulRequests++;
    } else {
      capacity.failedRequests++;
    }

    // Update average processing time (exponential moving average)
    const alpha = 0.1; // Smoothing factor
    capacity.avgProcessingTimeSeconds = 
      (1 - alpha) * capacity.avgProcessingTimeSeconds + alpha * processingTimeSeconds;

    // Update success/error rates
    capacity.successRate = capacity.successfulRequests / capacity.totalRequests;
    capacity.errorRate = capacity.failedRequests / capacity.totalRequests;

    capacity.lastUpdated = new Date();

    // Update database
    await this.updateCapacityInDB(modelId, {
      avgProcessingTimeSeconds: capacity.avgProcessingTimeSeconds,
      successRate: capacity.successRate,
      errorRate: capacity.errorRate
    });
  }

  /**
   * Get capacity statistics for monitoring
   */
  static getCapacityStats(): Record<string, ModelCapacity> {
    const stats: Record<string, ModelCapacity> = {};
    this.capacityMap.forEach((capacity, modelId) => {
      stats[modelId] = { ...capacity };
    });
    return stats;
  }

  /**
   * Get capacity utilization percentage
   */
  static getCapacityUtilization(modelId?: string): number | Record<string, number> {
    if (modelId) {
      const capacity = this.capacityMap.get(modelId);
      return capacity ? (capacity.currentUsage / capacity.maxConcurrent) * 100 : 0;
    }

    const utilization: Record<string, number> = {};
    this.capacityMap.forEach((capacity, id) => {
      utilization[id] = (capacity.currentUsage / capacity.maxConcurrent) * 100;
    });
    return utilization;
  }

  /**
   * Get models by provider
   */
  static getModelsByProvider(provider: AIProvider): string[] {
    const models: string[] = [];
    this.capacityMap.forEach((capacity, modelId) => {
      if (capacity.provider === provider) {
        models.push(modelId);
      }
    });
    return models;
  }

  /**
   * Get total capacity by generation type
   */
  static getTotalCapacityByType(generationType: GenerationType): { total: number; available: number; used: number } {
    let total = 0;
    let used = 0;

    this.capacityMap.forEach(capacity => {
      if (capacity.generationType === generationType) {
        total += capacity.maxConcurrent;
        used += capacity.currentUsage;
      }
    });

    return {
      total,
      used,
      available: total - used
    };
  }

  /**
   * Check if model is overloaded
   */
  static isModelOverloaded(modelId: string, threshold: number = 0.9): boolean {
    const capacity = this.capacityMap.get(modelId);
    if (!capacity) return false;
    
    return (capacity.currentUsage / capacity.maxConcurrent) >= threshold;
  }

  /**
   * Get overloaded models
   */
  static getOverloadedModels(threshold: number = 0.9): string[] {
    const overloaded: string[] = [];
    this.capacityMap.forEach((capacity, modelId) => {
      if ((capacity.currentUsage / capacity.maxConcurrent) >= threshold) {
        overloaded.push(modelId);
      }
    });
    return overloaded;
  }

  /**
   * Force sync capacity from database (for recovery)
   */
  static async syncFromDatabase(): Promise<void> {
    console.log('🔄 Syncing model capacity from database...');
    this.initialized = false;
    this.capacityMap.clear();
    this.reservations.clear();
    await this.initialize();
  }

  /**
   * Update capacity information in database
   */
  private static async updateCapacityInDB(modelId: string, updates: ModelCapacityUpdate): Promise<void> {
    try {
      const supabase = createServiceRoleClient();
      
      const updateData: any = {
        last_updated: new Date().toISOString()
      };

      if (updates.currentUsage !== undefined) {
        updateData.current_usage = updates.currentUsage;
      }
      if (updates.avgProcessingTimeSeconds !== undefined) {
        updateData.avg_processing_time_seconds = updates.avgProcessingTimeSeconds;
      }
      if (updates.successRate !== undefined) {
        updateData.success_rate = updates.successRate;
        updateData.successful_requests = this.capacityMap.get(modelId)?.successfulRequests || 0;
      }
      if (updates.errorRate !== undefined) {
        updateData.error_rate = updates.errorRate;
        updateData.failed_requests = this.capacityMap.get(modelId)?.failedRequests || 0;
      }

      const { error } = await supabase
        .from('model_capacity')
        .update(updateData)
        .eq('model_id', modelId);

      if (error) {
        console.error(`Failed to update capacity for ${modelId}:`, error);
      }
    } catch (error) {
      console.error(`Error updating capacity in DB for ${modelId}:`, error);
    }
  }

  /**
   * Add new model to capacity tracking
   */
  static async addModel(capacity: Omit<ModelCapacity, 'lastUpdated'>): Promise<void> {
    const supabase = createServiceRoleClient();

    const { error } = await supabase
      .from('model_capacity')
      .insert({
        model_id: capacity.modelId,
        generation_type: capacity.generationType,
        provider: capacity.provider,
        max_concurrent: capacity.maxConcurrent,
        current_usage: capacity.currentUsage,
        avg_processing_time_seconds: capacity.avgProcessingTimeSeconds,
        success_rate: capacity.successRate,
        error_rate: capacity.errorRate,
        total_requests: capacity.totalRequests,
        successful_requests: capacity.successfulRequests,
        failed_requests: capacity.failedRequests
      });

    if (error) {
      console.error(`Failed to add model ${capacity.modelId}:`, error);
      return;
    }

    // Add to local cache
    this.capacityMap.set(capacity.modelId, {
      ...capacity,
      lastUpdated: new Date()
    });
    this.reservations.set(capacity.modelId, new Set());

    console.log(`✅ Added model ${capacity.modelId} to capacity tracking`);
  }

  /**
   * Get model information
   */
  static getModelInfo(modelId: string): ModelCapacity | null {
    return this.capacityMap.get(modelId) || null;
  }

  /**
   * Check if manager is initialized
   */
  static isInitialized(): boolean {
    return this.initialized;
  }
}
