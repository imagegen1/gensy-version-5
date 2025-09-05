# 🔧 **Queue System Implementation Guide**

**Sprint 2 Enhanced - Technical Implementation Details**

---

## 🏗️ **Core Architecture Components**

### **1. Generation Queue Service**

```typescript
// src/lib/services/generation-queue.ts
import { PriorityQueue } from '@/lib/utils/priority-queue'
import { createServiceRoleClient } from '@/lib/supabase/server'

export interface QueueItem {
  id: string
  userId: string
  requestData: GenerationRequest
  priority: 'high' | 'normal' | 'low'
  status: 'queued' | 'processing' | 'completed' | 'failed'
  modelRequested: string
  modelUsed?: string
  queuePosition: number
  estimatedWaitSeconds: number
  createdAt: Date
  startedAt?: Date
  completedAt?: Date
  retryCount: number
  maxRetries: number
}

export class GenerationQueueService {
  private static queues = {
    high: new PriorityQueue<QueueItem>(),
    normal: new PriorityQueue<QueueItem>(),
    low: new PriorityQueue<QueueItem>()
  }

  private static processingInterval: NodeJS.Timeout | null = null
  private static isProcessing = false

  /**
   * Add request to appropriate priority queue
   */
  static async addToQueue(request: GenerationRequest): Promise<QueueResponse> {
    const priority = await this.getUserPriority(request.userId)
    const queueId = `queue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const queueItem: QueueItem = {
      id: queueId,
      userId: request.userId,
      requestData: request,
      priority,
      status: 'queued',
      modelRequested: request.model,
      queuePosition: this.getNextPosition(priority),
      estimatedWaitSeconds: await this.calculateWaitTime(priority),
      createdAt: new Date(),
      retryCount: 0,
      maxRetries: 3
    }

    // Add to in-memory queue
    this.queues[priority].enqueue(queueItem)
    
    // Persist to database
    await this.persistQueueItem(queueItem)
    
    // Start processing if not already running
    this.startProcessing()
    
    // Broadcast queue update
    await this.broadcastQueueUpdate(queueItem)

    return {
      queueId: queueItem.id,
      position: queueItem.queuePosition,
      estimatedWaitSeconds: queueItem.estimatedWaitSeconds,
      priority: queueItem.priority
    }
  }

  /**
   * Start continuous queue processing
   */
  private static startProcessing(): void {
    if (this.isProcessing) return

    this.isProcessing = true
    this.processingInterval = setInterval(async () => {
      await this.processNextBatch()
    }, 2000) // Check every 2 seconds

    console.log('🚀 Queue processing started')
  }

  /**
   * Process next batch of queued items
   */
  private static async processNextBatch(): Promise<void> {
    // Process high priority first, then normal, then low
    for (const priority of ['high', 'normal', 'low'] as const) {
      const queue = this.queues[priority]
      
      while (!queue.isEmpty()) {
        const item = queue.peek()
        if (!item) break

        // Check if we can process this item
        const selectedModel = await ModelLoadBalancer.selectBestModel(item.requestData)
        
        if (selectedModel) {
          // Remove from queue and process
          queue.dequeue()
          await this.processQueueItem(item, selectedModel)
        } else {
          // No capacity available, wait for next cycle
          break
        }
      }
    }
  }

  /**
   * Process individual queue item
   */
  private static async processQueueItem(item: QueueItem, modelId: string): Promise<void> {
    try {
      // Reserve model capacity
      const reserved = await ModelCapacityManager.reserveSlot(modelId)
      if (!reserved) {
        throw new Error('Failed to reserve model capacity')
      }

      // Update status to processing
      item.status = 'processing'
      item.modelUsed = modelId
      item.startedAt = new Date()
      await this.updateQueueItem(item)
      await this.broadcastStatusUpdate(item.id, 'processing', modelId)

      // Process the generation
      const result = await this.executeGeneration(item, modelId)

      // Update status to completed
      item.status = 'completed'
      item.completedAt = new Date()
      await this.updateQueueItem(item)
      await this.broadcastStatusUpdate(item.id, 'completed', modelId, result)

      console.log(`✅ Queue item ${item.id} completed successfully`)

    } catch (error) {
      await this.handleProcessingError(item, error)
    } finally {
      // Always release model capacity
      if (item.modelUsed) {
        await ModelCapacityManager.releaseSlot(item.modelUsed)
      }
    }
  }

  /**
   * Execute the actual generation
   */
  private static async executeGeneration(item: QueueItem, modelId: string): Promise<any> {
    const { requestData } = item

    if (requestData.type === 'image') {
      // Use existing image generation services
      const imageService = this.getImageService(modelId)
      return await imageService.generateImage(requestData)
    } else if (requestData.type === 'video') {
      // Use existing video generation services
      const videoService = this.getVideoService(modelId)
      return await videoService.generateVideo(requestData)
    }

    throw new Error(`Unsupported generation type: ${requestData.type}`)
  }

  /**
   * Handle processing errors with retry logic
   */
  private static async handleProcessingError(item: QueueItem, error: any): Promise<void> {
    console.error(`❌ Queue item ${item.id} failed:`, error)

    item.retryCount++

    if (item.retryCount < item.maxRetries) {
      // Retry with exponential backoff
      const delay = Math.pow(2, item.retryCount) * 1000 // 2s, 4s, 8s
      setTimeout(() => {
        this.queues[item.priority].enqueue(item)
      }, delay)

      console.log(`🔄 Retrying queue item ${item.id} (attempt ${item.retryCount + 1})`)
    } else {
      // Max retries reached, mark as failed
      item.status = 'failed'
      await this.updateQueueItem(item)
      await this.broadcastStatusUpdate(item.id, 'failed', undefined, { error: error.message })
    }
  }

  /**
   * Calculate estimated wait time based on queue position and model capacity
   */
  private static async calculateWaitTime(priority: 'high' | 'normal' | 'low'): Promise<number> {
    const queueLength = this.getQueueLength(priority)
    const avgProcessingTime = await this.getAverageProcessingTime()
    const availableCapacity = await this.getTotalAvailableCapacity()
    
    // Estimate based on queue position and processing capacity
    const estimatedSeconds = Math.ceil((queueLength * avgProcessingTime) / availableCapacity)
    
    return Math.max(estimatedSeconds, 30) // Minimum 30 seconds
  }

  /**
   * Get user priority based on subscription tier
   */
  private static async getUserPriority(userId: string): Promise<'high' | 'normal' | 'low'> {
    const supabase = createServiceRoleClient()
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_tier')
      .eq('clerk_user_id', userId)
      .single()

    if (!profile) return 'low'

    switch (profile.subscription_tier) {
      case 'enterprise':
      case 'pro':
        return 'high'
      case 'starter':
        return 'normal'
      default:
        return 'low'
    }
  }

  /**
   * Broadcast real-time updates to users
   */
  private static async broadcastStatusUpdate(
    queueId: string, 
    status: string, 
    modelId?: string, 
    result?: any
  ): Promise<void> {
    const channel = supabase.channel(`queue_${queueId}`)
    await channel.send({
      type: 'broadcast',
      event: 'status_update',
      payload: {
        queueId,
        status,
        modelId,
        result,
        timestamp: new Date().toISOString()
      }
    })
  }

  /**
   * Get current queue statistics
   */
  static getQueueStats(): QueueStats {
    return {
      high: this.queues.high.size(),
      normal: this.queues.normal.size(),
      low: this.queues.low.size(),
      total: this.queues.high.size() + this.queues.normal.size() + this.queues.low.size(),
      processing: this.isProcessing
    }
  }
}
```

### **2. Model Capacity Manager**

```typescript
// src/lib/services/model-capacity.ts
export interface ModelCapacity {
  modelId: string
  maxConcurrent: number
  currentUsage: number
  avgProcessingTimeSeconds: number
  lastUpdated: Date
  successRate: number
  errorRate: number
}

export class ModelCapacityManager {
  private static capacityMap = new Map<string, ModelCapacity>()
  private static initialized = false

  /**
   * Initialize model capacity tracking
   */
  static async initialize(): Promise<void> {
    if (this.initialized) return

    const models = [
      { modelId: 'imagen-4.0', maxConcurrent: 7, avgProcessingTimeSeconds: 45 },
      { modelId: 'imagen-3.0', maxConcurrent: 10, avgProcessingTimeSeconds: 30 },
      { modelId: 'flux-pro', maxConcurrent: 5, avgProcessingTimeSeconds: 25 },
      { modelId: 'flux-dev', maxConcurrent: 8, avgProcessingTimeSeconds: 20 },
      { modelId: 'bytedance', maxConcurrent: 15, avgProcessingTimeSeconds: 35 }
    ]

    for (const model of models) {
      this.capacityMap.set(model.modelId, {
        ...model,
        currentUsage: 0,
        lastUpdated: new Date(),
        successRate: 0.95,
        errorRate: 0.05
      })
    }

    // Load current usage from database
    await this.loadCurrentUsageFromDB()
    
    this.initialized = true
    console.log('✅ Model capacity manager initialized')
  }

  /**
   * Check if model can accept new request
   */
  static canAcceptRequest(modelId: string): boolean {
    const capacity = this.capacityMap.get(modelId)
    return capacity ? capacity.currentUsage < capacity.maxConcurrent : false
  }

  /**
   * Reserve a processing slot for a model
   */
  static async reserveSlot(modelId: string): Promise<boolean> {
    const capacity = this.capacityMap.get(modelId)
    
    if (capacity && capacity.currentUsage < capacity.maxConcurrent) {
      capacity.currentUsage++
      capacity.lastUpdated = new Date()
      
      // Update database
      await this.updateCapacityInDB(modelId, capacity)
      
      console.log(`🔒 Reserved slot for ${modelId} (${capacity.currentUsage}/${capacity.maxConcurrent})`)
      return true
    }
    
    return false
  }

  /**
   * Release a processing slot for a model
   */
  static async releaseSlot(modelId: string): Promise<void> {
    const capacity = this.capacityMap.get(modelId)
    
    if (capacity && capacity.currentUsage > 0) {
      capacity.currentUsage--
      capacity.lastUpdated = new Date()
      
      // Update database
      await this.updateCapacityInDB(modelId, capacity)
      
      console.log(`🔓 Released slot for ${modelId} (${capacity.currentUsage}/${capacity.maxConcurrent})`)
    }
  }

  /**
   * Get available capacity for all models
   */
  static getAvailableCapacity(): Record<string, number> {
    const available: Record<string, number> = {}
    
    this.capacityMap.forEach((capacity, modelId) => {
      available[modelId] = capacity.maxConcurrent - capacity.currentUsage
    })
    
    return available
  }

  /**
   * Get model with most available capacity
   */
  static getBestAvailableModel(preferredModels: string[]): string | null {
    let bestModel: string | null = null
    let maxAvailable = 0
    
    for (const modelId of preferredModels) {
      const capacity = this.capacityMap.get(modelId)
      if (capacity) {
        const available = capacity.maxConcurrent - capacity.currentUsage
        if (available > maxAvailable) {
          maxAvailable = available
          bestModel = modelId
        }
      }
    }
    
    return bestModel
  }

  /**
   * Update model performance metrics
   */
  static async updatePerformanceMetrics(
    modelId: string, 
    processingTimeSeconds: number, 
    success: boolean
  ): Promise<void> {
    const capacity = this.capacityMap.get(modelId)
    if (!capacity) return

    // Update average processing time (exponential moving average)
    const alpha = 0.1 // Smoothing factor
    capacity.avgProcessingTimeSeconds = 
      (1 - alpha) * capacity.avgProcessingTimeSeconds + alpha * processingTimeSeconds

    // Update success/error rates
    if (success) {
      capacity.successRate = (capacity.successRate * 0.95) + (1 * 0.05)
      capacity.errorRate = (capacity.errorRate * 0.95) + (0 * 0.05)
    } else {
      capacity.successRate = (capacity.successRate * 0.95) + (0 * 0.05)
      capacity.errorRate = (capacity.errorRate * 0.95) + (1 * 0.05)
    }

    capacity.lastUpdated = new Date()
    await this.updateCapacityInDB(modelId, capacity)
  }

  /**
   * Get capacity statistics for monitoring
   */
  static getCapacityStats(): Record<string, ModelCapacity> {
    const stats: Record<string, ModelCapacity> = {}
    this.capacityMap.forEach((capacity, modelId) => {
      stats[modelId] = { ...capacity }
    })
    return stats
  }

  /**
   * Update capacity information in database
   */
  private static async updateCapacityInDB(modelId: string, capacity: ModelCapacity): Promise<void> {
    const supabase = createServiceRoleClient()
    
    await supabase
      .from('model_capacity')
      .upsert({
        model_id: modelId,
        max_concurrent: capacity.maxConcurrent,
        current_usage: capacity.currentUsage,
        avg_processing_time_seconds: capacity.avgProcessingTimeSeconds,
        success_rate: capacity.successRate,
        error_rate: capacity.errorRate,
        last_updated: capacity.lastUpdated.toISOString()
      })
  }

  /**
   * Load current usage from database (for server restart recovery)
   */
  private static async loadCurrentUsageFromDB(): Promise<void> {
    const supabase = createServiceRoleClient()
    
    const { data: capacities } = await supabase
      .from('model_capacity')
      .select('*')

    if (capacities) {
      capacities.forEach(dbCapacity => {
        const capacity = this.capacityMap.get(dbCapacity.model_id)
        if (capacity) {
          capacity.currentUsage = dbCapacity.current_usage || 0
          capacity.avgProcessingTimeSeconds = dbCapacity.avg_processing_time_seconds || capacity.avgProcessingTimeSeconds
          capacity.successRate = dbCapacity.success_rate || 0.95
          capacity.errorRate = dbCapacity.error_rate || 0.05
        }
      })
    }
  }
}
```

---

## 🎯 **Implementation Checklist**

### **Phase 1: Core Infrastructure**
- [ ] Create `GenerationQueueService` class
- [ ] Implement `ModelCapacityManager` 
- [ ] Set up database schema and migrations
- [ ] Create priority queue data structures
- [ ] Add basic queue operations (enqueue, dequeue, peek)

### **Phase 2: Processing Engine**
- [ ] Implement continuous queue processing
- [ ] Add model capacity reservation system
- [ ] Create retry logic with exponential backoff
- [ ] Implement error handling and recovery
- [ ] Add performance metrics tracking

### **Phase 3: Real-time Updates**
- [ ] Set up WebSocket/SSE infrastructure
- [ ] Create status broadcasting system
- [ ] Implement queue position tracking
- [ ] Add estimated wait time calculations
- [ ] Build frontend real-time components

### **Phase 4: Advanced Features**
- [ ] Implement intelligent load balancing
- [ ] Add priority-based processing
- [ ] Create admin monitoring dashboard
- [ ] Implement predictive scaling
- [ ] Add comprehensive testing suite

---

## 🚀 **Expected Results**

After implementing this queue system:

✅ **Handle 1000+ concurrent requests** without failures  
✅ **Intelligent model selection** with automatic fallbacks  
✅ **Real-time status updates** for all users  
✅ **Priority processing** for premium users  
✅ **Optimal resource utilization** across all AI models  
✅ **Comprehensive monitoring** and analytics  

**This implementation will transform Gensy into a scalable, enterprise-ready platform!** 🎉
