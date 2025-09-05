// Model Load Balancer for intelligent AI model selection with smart fallbacks

import { createServiceRoleClient } from '@/lib/supabase/server';
import { ModelCapacityManager } from './model-capacity';
import { 
  AIGenerationRequest, 
  ModelSelectionCriteria, 
  ModelAlternative, 
  GenerationType,
  LoadBalancingStrategy 
} from '@/lib/types/queue-types';

export class ModelLoadBalancer {
  private static alternativesMap = new Map<string, ModelAlternative[]>();
  private static initialized = false;

  /**
   * Initialize load balancer with model alternatives from database
   */
  static async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      const supabase = createServiceRoleClient();
      
      const { data: alternatives, error } = await supabase
        .from('model_alternatives')
        .select('*')
        .order('priority_order', { ascending: true });

      if (error) {
        console.error('Failed to load model alternatives:', error);
        return;
      }

      if (alternatives) {
        // Group alternatives by primary model
        alternatives.forEach(alt => {
          const existing = this.alternativesMap.get(alt.primary_model) || [];
          existing.push({
            id: alt.id,
            primaryModel: alt.primary_model,
            alternativeModel: alt.alternative_model,
            generationType: alt.generation_type as GenerationType,
            priorityOrder: alt.priority_order,
            qualityScore: parseFloat(alt.quality_score),
            speedScore: parseFloat(alt.speed_score)
          });
          this.alternativesMap.set(alt.primary_model, existing);
        });
      }

      this.initialized = true;
      console.log(`✅ Model load balancer initialized with alternatives for ${this.alternativesMap.size} models`);
    } catch (error) {
      console.error('Error initializing model load balancer:', error);
    }
  }

  /**
   * Select best available model for a request
   */
  static async selectBestModel(request: AIGenerationRequest): Promise<string | null> {
    if (!ModelCapacityManager.isInitialized()) {
      await ModelCapacityManager.initialize();
    }
    if (!this.initialized) {
      await this.initialize();
    }

    const criteria: ModelSelectionCriteria = {
      preferredModel: request.model,
      generationType: request.type,
      priority: request.priority || 'normal',
      qualityPreference: 'high',
      speedPreference: 'medium',
      allowFallbacks: true
    };

    return this.selectModelWithCriteria(criteria);
  }

  /**
   * Select model based on specific criteria
   */
  static async selectModelWithCriteria(criteria: ModelSelectionCriteria): Promise<string | null> {
    // First, try the preferred model
    if (ModelCapacityManager.canAcceptRequest(criteria.preferredModel)) {
      return criteria.preferredModel;
    }

    // If preferred model is not available and fallbacks are allowed, try alternatives
    if (criteria.allowFallbacks) {
      const alternatives = this.getAlternatives(criteria.preferredModel);
      
      for (const alternative of alternatives) {
        if (ModelCapacityManager.canAcceptRequest(alternative.alternativeModel)) {
          console.log(`🔄 Using fallback model ${alternative.alternativeModel} for ${criteria.preferredModel}`);
          return alternative.alternativeModel;
        }
      }

      // If no direct alternatives available, try intelligent selection
      return this.intelligentModelSelection(criteria);
    }

    return null;
  }

  /**
   * Intelligent model selection based on availability and performance
   */
  private static intelligentModelSelection(criteria: ModelSelectionCriteria): string | null {
    const availableModels = ModelCapacityManager.getAvailableModelsByType(criteria.generationType);
    
    if (availableModels.length === 0) {
      return null;
    }

    // Score models based on criteria
    const scoredModels = availableModels.map(modelId => {
      const capacity = ModelCapacityManager.getModelInfo(modelId);
      if (!capacity) return { modelId, score: 0 };

      let score = 0;

      // Availability score (higher available capacity = higher score)
      const availableCapacity = capacity.maxConcurrent - capacity.currentUsage;
      const availabilityScore = (availableCapacity / capacity.maxConcurrent) * 100;
      score += availabilityScore * 0.4;

      // Performance score (success rate)
      score += capacity.successRate * 100 * 0.3;

      // Speed score (lower processing time = higher score)
      const speedScore = Math.max(0, 100 - capacity.avgProcessingTimeSeconds);
      score += speedScore * 0.2;

      // Priority bonus for high-priority requests
      if (criteria.priority === 'high' && capacity.maxConcurrent >= 5) {
        score += 10;
      }

      return { modelId, score };
    });

    // Sort by score and return best model
    scoredModels.sort((a, b) => b.score - a.score);
    
    const bestModel = scoredModels[0];
    if (bestModel && bestModel.score > 0) {
      console.log(`🎯 Intelligent selection: ${bestModel.modelId} (score: ${bestModel.score.toFixed(2)})`);
      return bestModel.modelId;
    }

    return null;
  }

  /**
   * Get alternatives for a model
   */
  static getAlternatives(modelId: string): ModelAlternative[] {
    return this.alternativesMap.get(modelId) || [];
  }

  /**
   * Add new model alternative
   */
  static async addAlternative(alternative: Omit<ModelAlternative, 'id'>): Promise<void> {
    const supabase = createServiceRoleClient();
    
    const { data, error } = await supabase
      .from('model_alternatives')
      .insert({
        primary_model: alternative.primaryModel,
        alternative_model: alternative.alternativeModel,
        generation_type: alternative.generationType,
        priority_order: alternative.priorityOrder,
        quality_score: alternative.qualityScore,
        speed_score: alternative.speedScore
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to add model alternative:', error);
      return;
    }

    // Add to local cache
    const existing = this.alternativesMap.get(alternative.primaryModel) || [];
    existing.push({
      ...alternative,
      id: data.id
    });
    existing.sort((a, b) => a.priorityOrder - b.priorityOrder);
    this.alternativesMap.set(alternative.primaryModel, existing);

    console.log(`✅ Added alternative ${alternative.alternativeModel} for ${alternative.primaryModel}`);
  }

  /**
   * Get load balancing recommendations
   */
  static getLoadBalancingRecommendations(generationType: GenerationType): {
    overloaded: string[];
    underutilized: string[];
    recommendations: string[];
  } {
    const overloaded: string[] = [];
    const underutilized: string[] = [];
    const recommendations: string[] = [];

    const capacityStats = ModelCapacityManager.getCapacityStats();
    
    Object.entries(capacityStats).forEach(([modelId, capacity]) => {
      if (capacity.generationType !== generationType) return;

      const utilization = (capacity.currentUsage / capacity.maxConcurrent) * 100;
      
      if (utilization >= 90) {
        overloaded.push(modelId);
      } else if (utilization <= 30) {
        underutilized.push(modelId);
      }
    });

    // Generate recommendations
    if (overloaded.length > 0 && underutilized.length > 0) {
      recommendations.push(`Consider redirecting traffic from ${overloaded.join(', ')} to ${underutilized.join(', ')}`);
    }

    if (overloaded.length > 0) {
      overloaded.forEach(modelId => {
        const alternatives = this.getAlternatives(modelId);
        if (alternatives.length > 0) {
          recommendations.push(`Use alternatives for ${modelId}: ${alternatives.map(a => a.alternativeModel).join(', ')}`);
        }
      });
    }

    return { overloaded, underutilized, recommendations };
  }

  /**
   * Get model selection statistics
   */
  static getSelectionStats(): {
    totalSelections: number;
    fallbackUsage: number;
    modelUsage: Record<string, number>;
    fallbackSuccess: number;
  } {
    // This would be implemented with actual tracking in production
    // For now, return mock data structure
    return {
      totalSelections: 0,
      fallbackUsage: 0,
      modelUsage: {},
      fallbackSuccess: 0
    };
  }

  /**
   * Test model selection for a given request
   */
  static async testModelSelection(request: AIGenerationRequest): Promise<{
    selectedModel: string | null;
    fallbackUsed: boolean;
    alternatives: string[];
    reasoning: string;
  }> {
    const originalModel = request.model;
    const selectedModel = await this.selectBestModel(request);
    const alternatives = this.getAlternatives(originalModel).map(a => a.alternativeModel);
    
    let reasoning = '';
    let fallbackUsed = false;

    if (selectedModel === originalModel) {
      reasoning = `Primary model ${originalModel} is available`;
    } else if (selectedModel && alternatives.includes(selectedModel)) {
      reasoning = `Primary model ${originalModel} is at capacity, using fallback ${selectedModel}`;
      fallbackUsed = true;
    } else if (selectedModel) {
      reasoning = `Primary model ${originalModel} and alternatives unavailable, using intelligent selection: ${selectedModel}`;
      fallbackUsed = true;
    } else {
      reasoning = `No models available for ${request.type} generation`;
    }

    return {
      selectedModel,
      fallbackUsed,
      alternatives,
      reasoning
    };
  }

  /**
   * Get all model alternatives mapping
   */
  static getAllAlternatives(): Record<string, ModelAlternative[]> {
    const result: Record<string, ModelAlternative[]> = {};
    this.alternativesMap.forEach((alternatives, modelId) => {
      result[modelId] = [...alternatives];
    });
    return result;
  }

  /**
   * Update alternative priority
   */
  static async updateAlternativePriority(
    primaryModel: string, 
    alternativeModel: string, 
    newPriority: number
  ): Promise<void> {
    const supabase = createServiceRoleClient();
    
    const { error } = await supabase
      .from('model_alternatives')
      .update({ priority_order: newPriority })
      .eq('primary_model', primaryModel)
      .eq('alternative_model', alternativeModel);

    if (error) {
      console.error('Failed to update alternative priority:', error);
      return;
    }

    // Update local cache
    const alternatives = this.alternativesMap.get(primaryModel);
    if (alternatives) {
      const alt = alternatives.find(a => a.alternativeModel === alternativeModel);
      if (alt) {
        alt.priorityOrder = newPriority;
        alternatives.sort((a, b) => a.priorityOrder - b.priorityOrder);
      }
    }

    console.log(`✅ Updated priority for ${alternativeModel} (alternative to ${primaryModel}) to ${newPriority}`);
  }

  /**
   * Force refresh alternatives from database
   */
  static async refreshAlternatives(): Promise<void> {
    this.initialized = false;
    this.alternativesMap.clear();
    await this.initialize();
  }
}
