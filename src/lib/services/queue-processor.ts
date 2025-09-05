// Queue Processor - Continuous background processing engine for AI generation queue

import { GenerationQueueService } from './generation-queue';
import { ModelCapacityManager } from './model-capacity';
import { ModelLoadBalancer } from './model-load-balancer';
import { QueueConfig, DEFAULT_QUEUE_CONFIG } from '@/lib/types/queue-types';

export class QueueProcessor {
  private static instance: QueueProcessor | null = null;
  private processingInterval: NodeJS.Timeout | null = null;
  private isRunning = false;
  private config: QueueConfig;
  private metrics = {
    totalProcessed: 0,
    successfulProcessed: 0,
    failedProcessed: 0,
    avgProcessingTime: 0,
    lastProcessedAt: new Date(),
    startedAt: new Date()
  };

  private constructor(config: QueueConfig = DEFAULT_QUEUE_CONFIG) {
    this.config = config;
  }

  /**
   * Get singleton instance
   */
  static getInstance(config?: QueueConfig): QueueProcessor {
    if (!this.instance) {
      this.instance = new QueueProcessor(config);
    }
    return this.instance;
  }

  /**
   * Start the queue processor
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('⚠️ Queue processor is already running');
      return;
    }

    // Initialize dependencies
    await ModelCapacityManager.initialize();
    await ModelLoadBalancer.initialize();
    await GenerationQueueService.initialize();

    this.isRunning = true;
    this.metrics.startedAt = new Date();

    // Start processing loop
    this.processingInterval = setInterval(async () => {
      await this.processQueue();
    }, this.config.processingInterval);

    console.log(`🚀 Queue processor started with ${this.config.processingInterval}ms interval`);
  }

  /**
   * Stop the queue processor
   */
  stop(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
    this.isRunning = false;
    console.log('⏹️ Queue processor stopped');
  }

  /**
   * Process the queue
   */
  private async processQueue(): Promise<void> {
    try {
      const stats = GenerationQueueService.getQueueStats();
      
      if (stats.queued === 0) {
        return; // Nothing to process
      }

      // Check system health before processing
      if (!this.isSystemHealthy()) {
        console.log('⚠️ System health check failed, skipping processing cycle');
        return;
      }

      // Process items based on available capacity
      await this.processAvailableCapacity();

      // Update metrics
      this.metrics.lastProcessedAt = new Date();

    } catch (error) {
      console.error('Error in queue processing cycle:', error);
    }
  }

  /**
   * Process items based on available capacity
   */
  private async processAvailableCapacity(): Promise<void> {
    const capacityStats = ModelCapacityManager.getCapacityStats();
    
    // Find models with available capacity
    const availableModels = Object.entries(capacityStats)
      .filter(([, capacity]) => capacity.currentUsage < capacity.maxConcurrent)
      .map(([modelId]) => modelId);

    if (availableModels.length === 0) {
      return; // No capacity available
    }

    console.log(`🔄 Processing queue with ${availableModels.length} available models`);

    // Process up to the available capacity
    let processed = 0;
    const maxBatchSize = Math.min(10, availableModels.length * 2); // Conservative batch size

    while (processed < maxBatchSize) {
      const stats = GenerationQueueService.getQueueStats();
      if (stats.queued === 0) break;

      // Try to process one more item
      const success = await this.processNextItem();
      if (!success) break; // No more items can be processed

      processed++;
    }

    if (processed > 0) {
      console.log(`✅ Processed ${processed} items in this cycle`);
    }
  }

  /**
   * Process the next available item
   */
  private async processNextItem(): Promise<boolean> {
    try {
      // This would integrate with GenerationQueueService to get and process the next item
      // For now, we'll simulate the processing
      
      const stats = GenerationQueueService.getQueueStats();
      if (stats.queued === 0) {
        return false;
      }

      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 100));

      // Update metrics
      this.metrics.totalProcessed++;
      this.metrics.successfulProcessed++;

      return true;
    } catch (error) {
      console.error('Error processing next item:', error);
      this.metrics.failedProcessed++;
      return false;
    }
  }

  /**
   * Check system health
   */
  private isSystemHealthy(): boolean {
    // Check memory usage
    const memUsage = process.memoryUsage();
    const memUsageMB = memUsage.heapUsed / 1024 / 1024;
    
    if (memUsageMB > 1000) { // 1GB threshold
      console.warn(`⚠️ High memory usage: ${memUsageMB.toFixed(2)}MB`);
      return false;
    }

    // Check if models are responsive
    const capacityStats = ModelCapacityManager.getCapacityStats();
    const totalModels = Object.keys(capacityStats).length;
    
    if (totalModels === 0) {
      console.warn('⚠️ No models available');
      return false;
    }

    return true;
  }

  /**
   * Get processor metrics
   */
  getMetrics(): {
    isRunning: boolean;
    totalProcessed: number;
    successfulProcessed: number;
    failedProcessed: number;
    successRate: number;
    avgProcessingTime: number;
    uptime: number;
    lastProcessedAt: Date;
    queueStats: any;
    capacityStats: any;
  } {
    const uptime = Date.now() - this.metrics.startedAt.getTime();
    const successRate = this.metrics.totalProcessed > 0 
      ? (this.metrics.successfulProcessed / this.metrics.totalProcessed) * 100 
      : 0;

    return {
      isRunning: this.isRunning,
      totalProcessed: this.metrics.totalProcessed,
      successfulProcessed: this.metrics.successfulProcessed,
      failedProcessed: this.metrics.failedProcessed,
      successRate,
      avgProcessingTime: this.metrics.avgProcessingTime,
      uptime,
      lastProcessedAt: this.metrics.lastProcessedAt,
      queueStats: GenerationQueueService.getQueueStats(),
      capacityStats: ModelCapacityManager.getCapacityStats()
    };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<QueueConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Restart with new interval if changed
    if (newConfig.processingInterval && this.isRunning) {
      this.stop();
      setTimeout(() => this.start(), 1000);
    }

    console.log('✅ Queue processor configuration updated');
  }

  /**
   * Force process queue immediately
   */
  async forceProcess(): Promise<void> {
    if (!this.isRunning) {
      console.log('⚠️ Queue processor is not running');
      return;
    }

    console.log('🔄 Force processing queue...');
    await this.processQueue();
  }

  /**
   * Get queue health status
   */
  getHealthStatus(): {
    status: 'healthy' | 'warning' | 'critical';
    issues: string[];
    recommendations: string[];
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let status: 'healthy' | 'warning' | 'critical' = 'healthy';

    // Check if processor is running
    if (!this.isRunning) {
      issues.push('Queue processor is not running');
      recommendations.push('Start the queue processor');
      status = 'critical';
    }

    // Check queue size
    const queueStats = GenerationQueueService.getQueueStats();
    if (queueStats.total > this.config.maxQueueSize * 0.8) {
      issues.push(`Queue size is high: ${queueStats.total}/${this.config.maxQueueSize}`);
      recommendations.push('Consider scaling up processing capacity');
      status = status === 'critical' ? 'critical' : 'warning';
    }

    // Check processing success rate
    const successRate = this.metrics.totalProcessed > 0 
      ? (this.metrics.successfulProcessed / this.metrics.totalProcessed) * 100 
      : 100;

    if (successRate < 90) {
      issues.push(`Low success rate: ${successRate.toFixed(1)}%`);
      recommendations.push('Check model availability and error logs');
      status = status === 'critical' ? 'critical' : 'warning';
    }

    // Check model capacity utilization
    const capacityStats = ModelCapacityManager.getCapacityStats();
    const overloadedModels = Object.entries(capacityStats)
      .filter(([, capacity]) => (capacity.currentUsage / capacity.maxConcurrent) > 0.9)
      .map(([modelId]) => modelId);

    if (overloadedModels.length > 0) {
      issues.push(`Overloaded models: ${overloadedModels.join(', ')}`);
      recommendations.push('Consider load balancing or adding model capacity');
      status = status === 'critical' ? 'critical' : 'warning';
    }

    return { status, issues, recommendations };
  }

  /**
   * Reset metrics
   */
  resetMetrics(): void {
    this.metrics = {
      totalProcessed: 0,
      successfulProcessed: 0,
      failedProcessed: 0,
      avgProcessingTime: 0,
      lastProcessedAt: new Date(),
      startedAt: new Date()
    };
    console.log('📊 Queue processor metrics reset');
  }

  /**
   * Get configuration
   */
  getConfig(): QueueConfig {
    return { ...this.config };
  }

  /**
   * Check if processor is running
   */
  isProcessorRunning(): boolean {
    return this.isRunning;
  }
}

// Export singleton instance
export const queueProcessor = QueueProcessor.getInstance();
