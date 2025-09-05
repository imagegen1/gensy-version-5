// Advanced AI Generation Queue Service - Main queue management system

import { createServiceRoleClient } from '@/lib/supabase/server';
import { MultiLevelPriorityQueue } from '@/lib/utils/priority-queue';
import { ModelCapacityManager } from './model-capacity';
import { ModelLoadBalancer } from './model-load-balancer';
import { 
  QueueItem, 
  QueueResponse, 
  AIGenerationRequest, 
  QueueStatus, 
  QueuePriority,
  QueueStats,
  GenerationType,
  QUEUE_PRIORITIES,
  USER_TIER_PRIORITIES
} from '@/lib/types/queue-types';

export class GenerationQueueService {
  private static queues = new MultiLevelPriorityQueue<QueueItem>([3, 2, 1]); // high, normal, low
  private static processingInterval: NodeJS.Timeout | null = null;
  private static isProcessing = false;
  private static processingItems = new Map<string, QueueItem>();

  /**
   * Initialize the queue service
   */
  static async initialize(): Promise<void> {
    // Initialize dependencies
    await ModelCapacityManager.initialize();
    await ModelLoadBalancer.initialize();

    // Start processing if not already running
    this.startProcessing();

    console.log('✅ Generation Queue Service initialized');
  }

  /**
   * Add request to appropriate priority queue
   */
  static async addToQueue(request: AIGenerationRequest): Promise<QueueResponse> {
    const priority = await this.getUserPriority(request.userId);
    const queueId = `queue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const queueItem: QueueItem = {
      id: queueId,
      userId: request.userId,
      requestData: request,
      status: 'queued',
      priority,
      modelRequested: request.model,
      generationType: request.type,
      retryCount: 0,
      maxRetries: 3,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Add to in-memory queue
    const priorityValue = QUEUE_PRIORITIES[priority];
    this.queues.enqueue(queueItem, priorityValue);
    
    // Calculate queue position and estimated wait time
    const position = this.calculateQueuePosition(queueItem);
    const estimatedWaitSeconds = await this.calculateWaitTime(queueItem);
    
    queueItem.queuePosition = position;
    queueItem.estimatedWaitSeconds = estimatedWaitSeconds;

    // Persist to database
    await this.persistQueueItem(queueItem);
    
    // Start processing if not already running
    this.startProcessing();
    
    // Broadcast queue update
    await this.broadcastQueueUpdate(queueItem);

    console.log(`📥 Added ${request.type} request to ${priority} priority queue: ${queueId}`);

    return {
      queueId: queueItem.id,
      position,
      estimatedWaitSeconds,
      priority: queueItem.priority,
      status: queueItem.status,
      modelRequested: queueItem.modelRequested,
      generationType: queueItem.generationType
    };
  }

  /**
   * Start continuous queue processing
   */
  private static startProcessing(): void {
    if (this.isProcessing) return;

    this.isProcessing = true;
    this.processingInterval = setInterval(async () => {
      await this.processNextBatch();
    }, 2000); // Check every 2 seconds

    console.log('🚀 Queue processing started');
  }

  /**
   * Stop queue processing
   */
  static stopProcessing(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
    this.isProcessing = false;
    console.log('⏹️ Queue processing stopped');
  }

  /**
   * Process next batch of queued items
   */
  private static async processNextBatch(): Promise<void> {
    const batchSize = 10; // Process up to 10 items per batch
    let processed = 0;

    while (processed < batchSize && !this.queues.isEmpty()) {
      const item = this.queues.dequeue();
      if (!item) break;

      // Check if we can process this item
      const selectedModel = await ModelLoadBalancer.selectBestModel(item.requestData);
      
      if (selectedModel) {
        // Process the item
        this.processQueueItem(item, selectedModel);
        processed++;
      } else {
        // No capacity available, put back in queue
        const priorityValue = QUEUE_PRIORITIES[item.priority];
        this.queues.enqueue(item, priorityValue);
        break; // Stop processing this batch
      }
    }
  }

  /**
   * Process individual queue item
   */
  private static async processQueueItem(item: QueueItem, modelId: string): Promise<void> {
    try {
      // Reserve model capacity
      const reservationId = await ModelCapacityManager.reserveSlot(modelId);
      if (!reservationId) {
        throw new Error('Failed to reserve model capacity');
      }

      // Update status to processing
      item.status = 'processing';
      item.modelUsed = modelId;
      item.startedAt = new Date();
      item.updatedAt = new Date();
      
      // Add to processing items
      this.processingItems.set(item.id, item);

      await this.updateQueueItem(item);
      await this.broadcastStatusUpdate(item.id, 'processing', modelId);

      console.log(`🔄 Processing ${item.generationType} request ${item.id} with ${modelId}`);

      // Process the generation (async)
      this.executeGeneration(item, modelId, reservationId);

    } catch (error) {
      await this.handleProcessingError(item, error);
    }
  }

  /**
   * Execute the actual generation (async)
   */
  private static async executeGeneration(item: QueueItem, modelId: string, reservationId: string): Promise<void> {
    const startTime = Date.now();

    try {
      // Execute the actual AI generation
      const result = await this.callGenerationAPI(item, modelId);

      // Calculate processing time
      const processingTime = Math.floor((Date.now() - startTime) / 1000);

      // Update status to completed
      item.status = 'completed';
      item.resultData = result;
      item.completedAt = new Date();
      item.updatedAt = new Date();

      // Remove from processing items
      this.processingItems.delete(item.id);

      // Update database
      await this.updateQueueItem(item);
      await this.broadcastStatusUpdate(item.id, 'completed', modelId, result);

      // Update model performance metrics
      await ModelCapacityManager.updatePerformanceMetrics(modelId, processingTime, true);

      console.log(`✅ Completed ${item.generationType} request ${item.id} in ${processingTime}s`);

    } catch (error) {
      // Calculate processing time even for failures
      const processingTime = Math.floor((Date.now() - startTime) / 1000);
      
      // Update model performance metrics
      await ModelCapacityManager.updatePerformanceMetrics(modelId, processingTime, false);
      
      await this.handleProcessingError(item, error);
    } finally {
      // Always release model capacity
      await ModelCapacityManager.releaseSlot(modelId, reservationId);
    }
  }

  /**
   * Call the appropriate generation API
   */
  private static async callGenerationAPI(item: QueueItem, modelId: string): Promise<any> {
    const { requestData } = item;

    // Route to appropriate generation service based on type
    switch (requestData.type) {
      case 'image':
        return await this.callImageGenerationAPI(requestData, modelId);
      case 'video':
        return await this.callVideoGenerationAPI(requestData, modelId);
      case 'upscaling':
        return await this.callUpscalingAPI(requestData, modelId);
      case 'text':
        return await this.callTextGenerationAPI(requestData, modelId);
      default:
        throw new Error(`Unsupported generation type: ${requestData.type}`);
    }
  }

  /**
   * Call image generation API
   */
  private static async callImageGenerationAPI(request: AIGenerationRequest, modelId: string): Promise<any> {
    // This would integrate with your existing image generation services
    // For now, simulate the API call
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate processing time
    
    return {
      type: 'image',
      modelUsed: modelId,
      imageUrl: `https://example.com/generated-image-${Date.now()}.jpg`,
      parameters: request.parameters
    };
  }

  /**
   * Call video generation API
   */
  private static async callVideoGenerationAPI(request: AIGenerationRequest, modelId: string): Promise<any> {
    // This would integrate with your existing video generation services
    await new Promise(resolve => setTimeout(resolve, 5000)); // Simulate processing time
    
    return {
      type: 'video',
      modelUsed: modelId,
      videoUrl: `https://example.com/generated-video-${Date.now()}.mp4`,
      parameters: request.parameters
    };
  }

  /**
   * Call upscaling API
   */
  private static async callUpscalingAPI(request: AIGenerationRequest, modelId: string): Promise<any> {
    // This would integrate with your existing upscaling services
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate processing time
    
    return {
      type: 'upscaling',
      modelUsed: modelId,
      imageUrl: `https://example.com/upscaled-image-${Date.now()}.jpg`,
      parameters: request.parameters
    };
  }

  /**
   * Call text generation API
   */
  private static async callTextGenerationAPI(request: AIGenerationRequest, modelId: string): Promise<any> {
    // This would integrate with your existing text generation services
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate processing time
    
    return {
      type: 'text',
      modelUsed: modelId,
      text: `Generated text using ${modelId}`,
      parameters: request.parameters
    };
  }

  /**
   * Handle processing errors with retry logic
   */
  private static async handleProcessingError(item: QueueItem, error: any): Promise<void> {
    console.error(`❌ Queue item ${item.id} failed:`, error);

    // Remove from processing items
    this.processingItems.delete(item.id);

    item.retryCount++;
    item.errorMessage = error.message;
    item.updatedAt = new Date();

    if (item.retryCount < item.maxRetries) {
      // Retry with exponential backoff
      const delay = Math.pow(2, item.retryCount) * 1000; // 2s, 4s, 8s
      
      setTimeout(() => {
        item.status = 'queued';
        const priorityValue = QUEUE_PRIORITIES[item.priority];
        this.queues.enqueue(item, priorityValue);
      }, delay);

      console.log(`🔄 Retrying queue item ${item.id} (attempt ${item.retryCount + 1})`);
    } else {
      // Max retries reached, mark as failed
      item.status = 'failed';
      await this.updateQueueItem(item);
      await this.broadcastStatusUpdate(item.id, 'failed', undefined, { error: error.message });
    }
  }

  /**
   * Calculate queue position for an item
   */
  private static calculateQueuePosition(item: QueueItem): number {
    const stats = this.queues.getStats();
    const higherPriorityCount = Object.entries(stats.byPriority)
      .filter(([priority]) => parseInt(priority) > QUEUE_PRIORITIES[item.priority])
      .reduce((sum, [, count]) => sum + count, 0);
    
    return higherPriorityCount + 1;
  }

  /**
   * Calculate estimated wait time based on queue position and model capacity
   */
  private static async calculateWaitTime(item: QueueItem): Promise<number> {
    const position = item.queuePosition || 1;
    const modelInfo = ModelCapacityManager.getModelInfo(item.modelRequested);
    
    if (!modelInfo) {
      return 300; // Default 5 minutes if model info not available
    }

    const avgProcessingTime = modelInfo.avgProcessingTimeSeconds;
    const maxConcurrent = modelInfo.maxConcurrent;
    
    // Estimate based on position and processing capacity
    const estimatedSeconds = Math.ceil((position * avgProcessingTime) / maxConcurrent);
    
    return Math.max(estimatedSeconds, 30); // Minimum 30 seconds
  }

  /**
   * Get user priority based on subscription tier
   */
  private static async getUserPriority(userId: string): Promise<QueuePriority> {
    try {
      const supabase = createServiceRoleClient();
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_tier')
        .eq('clerk_user_id', userId)
        .single();

      if (!profile) return 'low';

      const tier = profile.subscription_tier || 'free';
      return USER_TIER_PRIORITIES[tier] || 'low';
    } catch (error) {
      console.error('Error getting user priority:', error);
      return 'low';
    }
  }

  /**
   * Persist queue item to database
   */
  private static async persistQueueItem(item: QueueItem): Promise<void> {
    try {
      const supabase = createServiceRoleClient();
      
      const { error } = await supabase
        .from('generation_queue')
        .insert({
          id: item.id,
          user_id: item.userId,
          request_data: item.requestData,
          status: item.status,
          priority: item.priority,
          model_requested: item.modelRequested,
          model_used: item.modelUsed,
          generation_type: item.generationType,
          queue_position: item.queuePosition,
          estimated_wait_seconds: item.estimatedWaitSeconds,
          result_data: item.resultData,
          error_message: item.errorMessage,
          retry_count: item.retryCount,
          max_retries: item.maxRetries,
          created_at: item.createdAt.toISOString(),
          started_at: item.startedAt?.toISOString(),
          completed_at: item.completedAt?.toISOString()
        });

      if (error) {
        console.error('Failed to persist queue item:', error);
      }
    } catch (error) {
      console.error('Error persisting queue item:', error);
    }
  }

  /**
   * Update queue item in database
   */
  private static async updateQueueItem(item: QueueItem): Promise<void> {
    try {
      const supabase = createServiceRoleClient();

      const { error } = await supabase
        .from('generation_queue')
        .update({
          status: item.status,
          model_used: item.modelUsed,
          result_data: item.resultData,
          error_message: item.errorMessage,
          retry_count: item.retryCount,
          started_at: item.startedAt?.toISOString(),
          completed_at: item.completedAt?.toISOString(),
          updated_at: item.updatedAt.toISOString()
        })
        .eq('id', item.id);

      if (error) {
        console.error('Failed to update queue item:', error);
      }
    } catch (error) {
      console.error('Error updating queue item:', error);
    }
  }

  /**
   * Broadcast real-time updates to users
   */
  private static async broadcastStatusUpdate(
    queueId: string,
    status: QueueStatus,
    modelId?: string,
    result?: any
  ): Promise<void> {
    // This would integrate with your real-time system (WebSocket/SSE)
    // For now, just log the update
    console.log(`📡 Broadcasting update for ${queueId}: ${status}${modelId ? ` (${modelId})` : ''}`);
  }

  /**
   * Broadcast queue update
   */
  private static async broadcastQueueUpdate(item: QueueItem): Promise<void> {
    // This would integrate with your real-time system
    console.log(`📡 Broadcasting queue update for ${item.id}: position ${item.queuePosition}, wait ${item.estimatedWaitSeconds}s`);
  }

  /**
   * Get current queue statistics
   */
  static getQueueStats(): QueueStats {
    const stats = this.queues.getStats();
    const processingCount = this.processingItems.size;

    return {
      total: stats.total + processingCount,
      queued: stats.total,
      processing: processingCount,
      completed: 0, // Would be tracked separately
      failed: 0, // Would be tracked separately
      byPriority: {
        high: stats.byPriority[3] || 0,
        normal: stats.byPriority[2] || 0,
        low: stats.byPriority[1] || 0
      },
      byType: {
        image: 0, // Would need to calculate from queue items
        video: 0,
        upscaling: 0,
        text: 0,
        audio: 0
      },
      avgWaitTime: 0, // Would be calculated from historical data
      processingCapacity: 0 // Would be calculated from model capacities
    };
  }

  /**
   * Get queue item by ID
   */
  static async getQueueItem(queueId: string): Promise<QueueItem | null> {
    try {
      const supabase = createServiceRoleClient();

      const { data, error } = await supabase
        .from('generation_queue')
        .select('*')
        .eq('id', queueId)
        .single();

      if (error || !data) {
        return null;
      }

      return {
        id: data.id,
        userId: data.user_id,
        requestData: data.request_data,
        status: data.status as QueueStatus,
        priority: data.priority as QueuePriority,
        modelRequested: data.model_requested,
        modelUsed: data.model_used,
        generationType: data.generation_type as GenerationType,
        queuePosition: data.queue_position,
        estimatedWaitSeconds: data.estimated_wait_seconds,
        resultData: data.result_data,
        errorMessage: data.error_message,
        retryCount: data.retry_count,
        maxRetries: data.max_retries,
        createdAt: new Date(data.created_at),
        startedAt: data.started_at ? new Date(data.started_at) : undefined,
        completedAt: data.completed_at ? new Date(data.completed_at) : undefined,
        updatedAt: new Date(data.updated_at)
      };
    } catch (error) {
      console.error('Error getting queue item:', error);
      return null;
    }
  }

  /**
   * Cancel queue item
   */
  static async cancelQueueItem(queueId: string, userId: string): Promise<boolean> {
    try {
      // Remove from in-memory queue if still queued
      const removed = this.queues.remove(item => item.id === queueId && item.userId === userId);

      if (removed) {
        // Update database
        const supabase = createServiceRoleClient();

        const { error } = await supabase
          .from('generation_queue')
          .update({
            status: 'cancelled',
            updated_at: new Date().toISOString()
          })
          .eq('id', queueId)
          .eq('user_id', userId);

        if (error) {
          console.error('Failed to cancel queue item:', error);
          return false;
        }

        await this.broadcastStatusUpdate(queueId, 'cancelled');
        console.log(`❌ Cancelled queue item ${queueId}`);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error cancelling queue item:', error);
      return false;
    }
  }

  /**
   * Get user's queue items
   */
  static async getUserQueueItems(userId: string, status?: QueueStatus): Promise<QueueItem[]> {
    try {
      const supabase = createServiceRoleClient();

      let query = supabase
        .from('generation_queue')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Failed to get user queue items:', error);
        return [];
      }

      return data?.map(item => ({
        id: item.id,
        userId: item.user_id,
        requestData: item.request_data,
        status: item.status as QueueStatus,
        priority: item.priority as QueuePriority,
        modelRequested: item.model_requested,
        modelUsed: item.model_used,
        generationType: item.generation_type as GenerationType,
        queuePosition: item.queue_position,
        estimatedWaitSeconds: item.estimated_wait_seconds,
        resultData: item.result_data,
        errorMessage: item.error_message,
        retryCount: item.retry_count,
        maxRetries: item.max_retries,
        createdAt: new Date(item.created_at),
        startedAt: item.started_at ? new Date(item.started_at) : undefined,
        completedAt: item.completed_at ? new Date(item.completed_at) : undefined,
        updatedAt: new Date(item.updated_at)
      })) || [];
    } catch (error) {
      console.error('Error getting user queue items:', error);
      return [];
    }
  }

  /**
   * Clear completed items older than specified days
   */
  static async clearOldItems(daysOld: number = 7): Promise<number> {
    try {
      const supabase = createServiceRoleClient();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const { data, error } = await supabase
        .from('generation_queue')
        .delete()
        .in('status', ['completed', 'failed', 'cancelled'])
        .lt('completed_at', cutoffDate.toISOString())
        .select('id');

      if (error) {
        console.error('Failed to clear old items:', error);
        return 0;
      }

      const deletedCount = data?.length || 0;
      console.log(`🧹 Cleared ${deletedCount} old queue items`);
      return deletedCount;
    } catch (error) {
      console.error('Error clearing old items:', error);
      return 0;
    }
  }
}
