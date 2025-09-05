// Universal AI Service - Unified interface for all AI generation types with queue integration

import { GenerationQueueService } from './generation-queue';
import { ModelLoadBalancer } from './model-load-balancer';
import { ModelCapacityManager } from './model-capacity';
import { StatusUpdateService } from './status-updates';
import { 
  AIGenerationRequest, 
  QueueResponse, 
  GenerationType, 
  QueuePriority,
  QueueItem 
} from '@/lib/types/queue-types';

export class UniversalAIService {
  private static initialized = false;

  /**
   * Initialize the universal AI service
   */
  static async initialize(): Promise<void> {
    if (this.initialized) return;

    await GenerationQueueService.initialize();
    this.initialized = true;
    console.log('✅ Universal AI Service initialized');
  }

  /**
   * Generate AI content with automatic queue management
   */
  static async generate(
    type: GenerationType,
    model: string,
    parameters: Record<string, any>,
    userId: string,
    options: {
      priority?: QueuePriority;
      skipQueue?: boolean;
      metadata?: Record<string, any>;
    } = {}
  ): Promise<QueueResponse | any> {
    if (!this.initialized) {
      await this.initialize();
    }

    const request: AIGenerationRequest = {
      type,
      model,
      parameters,
      userId,
      priority: options.priority || 'normal',
      metadata: options.metadata
    };

    // Check if we should skip queue (for testing or admin purposes)
    if (options.skipQueue) {
      return await this.directGeneration(request);
    }

    // Add to queue
    const queueResponse = await GenerationQueueService.addToQueue(request);
    
    console.log(`🎯 Added ${type} generation to queue: ${queueResponse.queueId}`);
    return queueResponse;
  }

  /**
   * Generate image with queue management
   */
  static async generateImage(
    model: string,
    prompt: string,
    userId: string,
    options: {
      width?: number;
      height?: number;
      steps?: number;
      guidance?: number;
      seed?: number;
      priority?: QueuePriority;
      skipQueue?: boolean;
    } = {}
  ): Promise<QueueResponse | any> {
    const parameters = {
      prompt,
      width: options.width || 1024,
      height: options.height || 1024,
      steps: options.steps || 20,
      guidance: options.guidance || 7.5,
      seed: options.seed
    };

    return await this.generate('image', model, parameters, userId, {
      priority: options.priority,
      skipQueue: options.skipQueue
    });
  }

  /**
   * Generate video with queue management
   */
  static async generateVideo(
    model: string,
    prompt: string,
    userId: string,
    options: {
      duration?: number;
      fps?: number;
      width?: number;
      height?: number;
      seed?: number;
      priority?: QueuePriority;
      skipQueue?: boolean;
    } = {}
  ): Promise<QueueResponse | any> {
    const parameters = {
      prompt,
      duration: options.duration || 5,
      fps: options.fps || 24,
      width: options.width || 1280,
      height: options.height || 720,
      seed: options.seed
    };

    return await this.generate('video', model, parameters, userId, {
      priority: options.priority,
      skipQueue: options.skipQueue
    });
  }

  /**
   * Upscale image with queue management
   */
  static async upscaleImage(
    model: string,
    imageUrl: string,
    userId: string,
    options: {
      scale?: number;
      priority?: QueuePriority;
      skipQueue?: boolean;
    } = {}
  ): Promise<QueueResponse | any> {
    const parameters = {
      imageUrl,
      scale: options.scale || 4
    };

    return await this.generate('upscaling', model, parameters, userId, {
      priority: options.priority,
      skipQueue: options.skipQueue
    });
  }

  /**
   * Generate text with queue management
   */
  static async generateText(
    model: string,
    prompt: string,
    userId: string,
    options: {
      maxTokens?: number;
      temperature?: number;
      topP?: number;
      priority?: QueuePriority;
      skipQueue?: boolean;
    } = {}
  ): Promise<QueueResponse | any> {
    const parameters = {
      prompt,
      maxTokens: options.maxTokens || 1000,
      temperature: options.temperature || 0.7,
      topP: options.topP || 0.9
    };

    return await this.generate('text', model, parameters, userId, {
      priority: options.priority,
      skipQueue: options.skipQueue
    });
  }

  /**
   * Get queue status for a specific request
   */
  static async getQueueStatus(queueId: string): Promise<QueueItem | null> {
    return await GenerationQueueService.getQueueItem(queueId);
  }

  /**
   * Cancel a queued request
   */
  static async cancelRequest(queueId: string, userId: string): Promise<boolean> {
    return await GenerationQueueService.cancelQueueItem(queueId, userId);
  }

  /**
   * Get user's queue items
   */
  static async getUserQueue(userId: string, status?: string): Promise<QueueItem[]> {
    return await GenerationQueueService.getUserQueueItems(userId, status as any);
  }

  /**
   * Subscribe to real-time updates for a queue item
   */
  static subscribeToUpdates(queueId: string, callback: (update: any) => void): () => void {
    return StatusUpdateService.subscribe(queueId, callback);
  }

  /**
   * Subscribe to all updates for a user
   */
  static subscribeToUserUpdates(userId: string, callback: (update: any) => void): () => void {
    return StatusUpdateService.subscribeToUser(userId, callback);
  }

  /**
   * Get available models for a generation type
   */
  static getAvailableModels(type: GenerationType): string[] {
    return ModelCapacityManager.getAvailableModelsByType(type);
  }

  /**
   * Get recommended model for a request
   */
  static async getRecommendedModel(request: AIGenerationRequest): Promise<string | null> {
    return await ModelLoadBalancer.selectBestModel(request);
  }

  /**
   * Get model capacity information
   */
  static getModelCapacity(modelId: string) {
    return ModelCapacityManager.getModelInfo(modelId);
  }

  /**
   * Get queue statistics
   */
  static getQueueStats() {
    return GenerationQueueService.getQueueStats();
  }

  /**
   * Direct generation without queue (for testing or admin use)
   */
  private static async directGeneration(request: AIGenerationRequest): Promise<any> {
    console.log(`🚀 Direct generation: ${request.type} with ${request.model}`);
    
    // Select best available model
    const selectedModel = await ModelLoadBalancer.selectBestModel(request);
    
    if (!selectedModel) {
      throw new Error(`No available models for ${request.type} generation`);
    }

    // Reserve capacity
    const reservationId = await ModelCapacityManager.reserveSlot(selectedModel);
    
    if (!reservationId) {
      throw new Error(`No capacity available for model ${selectedModel}`);
    }

    try {
      // Simulate generation based on type
      const result = await this.simulateGeneration(request, selectedModel);
      
      // Update performance metrics
      await ModelCapacityManager.updatePerformanceMetrics(selectedModel, 30, true);
      
      return result;
    } catch (error) {
      // Update performance metrics for failure
      await ModelCapacityManager.updatePerformanceMetrics(selectedModel, 30, false);
      throw error;
    } finally {
      // Always release capacity
      await ModelCapacityManager.releaseSlot(selectedModel, reservationId);
    }
  }

  /**
   * Simulate generation for different types (placeholder for actual implementations)
   */
  private static async simulateGeneration(request: AIGenerationRequest, modelId: string): Promise<any> {
    // Simulate processing time
    const processingTime = Math.random() * 5000 + 1000; // 1-6 seconds
    await new Promise(resolve => setTimeout(resolve, processingTime));

    switch (request.type) {
      case 'image':
        return {
          type: 'image',
          modelUsed: modelId,
          imageUrl: `https://example.com/generated-image-${Date.now()}.jpg`,
          parameters: request.parameters,
          processingTime: Math.floor(processingTime / 1000)
        };

      case 'video':
        return {
          type: 'video',
          modelUsed: modelId,
          videoUrl: `https://example.com/generated-video-${Date.now()}.mp4`,
          parameters: request.parameters,
          processingTime: Math.floor(processingTime / 1000)
        };

      case 'upscaling':
        return {
          type: 'upscaling',
          modelUsed: modelId,
          imageUrl: `https://example.com/upscaled-image-${Date.now()}.jpg`,
          parameters: request.parameters,
          processingTime: Math.floor(processingTime / 1000)
        };

      case 'text':
        return {
          type: 'text',
          modelUsed: modelId,
          text: `Generated text using ${modelId}: ${request.parameters.prompt}`,
          parameters: request.parameters,
          processingTime: Math.floor(processingTime / 1000)
        };

      default:
        throw new Error(`Unsupported generation type: ${request.type}`);
    }
  }

  /**
   * Health check for the service
   */
  static async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    services: Record<string, boolean>;
    message: string;
  }> {
    const services = {
      queueService: true,
      modelCapacity: ModelCapacityManager.isInitialized(),
      loadBalancer: true // Would check if initialized
    };

    const allHealthy = Object.values(services).every(status => status);
    const someHealthy = Object.values(services).some(status => status);

    return {
      status: allHealthy ? 'healthy' : someHealthy ? 'degraded' : 'unhealthy',
      services,
      message: allHealthy 
        ? 'All services operational' 
        : someHealthy 
        ? 'Some services degraded' 
        : 'Services unavailable'
    };
  }
}
