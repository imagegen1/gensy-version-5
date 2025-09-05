// Queue system types for advanced AI generation queue management

export type GenerationType = 'image' | 'video' | 'upscaling' | 'text' | 'audio';
export type QueueStatus = 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';
export type QueuePriority = 'high' | 'normal' | 'low';
export type AIProvider = 'google-vertex-ai' | 'black-forest-labs' | 'bytedance' | 'minimax' | 'replicate' | 'openai' | 'anthropic';

// Base AI generation request interface
export interface AIGenerationRequest {
  type: GenerationType;
  model: string;
  parameters: Record<string, any>;
  userId: string;
  priority?: QueuePriority;
  metadata?: Record<string, any>;
}

// Queue item interface
export interface QueueItem {
  id: string;
  userId: string;
  requestData: AIGenerationRequest;
  status: QueueStatus;
  priority: QueuePriority;
  modelRequested: string;
  modelUsed?: string;
  generationType: GenerationType;
  queuePosition?: number;
  estimatedWaitSeconds?: number;
  resultData?: any;
  errorMessage?: string;
  retryCount: number;
  maxRetries: number;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  updatedAt: Date;
}

// Queue response interface
export interface QueueResponse {
  queueId: string;
  position: number;
  estimatedWaitSeconds: number;
  priority: QueuePriority;
  status: QueueStatus;
  modelRequested: string;
  generationType: GenerationType;
}

// Model capacity interface
export interface ModelCapacity {
  modelId: string;
  generationType: GenerationType;
  provider: AIProvider;
  maxConcurrent: number;
  currentUsage: number;
  avgProcessingTimeSeconds: number;
  successRate: number;
  errorRate: number;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  lastUpdated: Date;
}

// Model alternative interface for fallbacks
export interface ModelAlternative {
  id: string;
  primaryModel: string;
  alternativeModel: string;
  generationType: GenerationType;
  priorityOrder: number;
  qualityScore: number;
  speedScore: number;
}

// Queue statistics interface
export interface QueueStats {
  total: number;
  queued: number;
  processing: number;
  completed: number;
  failed: number;
  byPriority: {
    high: number;
    normal: number;
    low: number;
  };
  byType: {
    image: number;
    video: number;
    upscaling: number;
    text: number;
    audio: number;
  };
  avgWaitTime: number;
  processingCapacity: number;
}

// Real-time status update interface
export interface StatusUpdate {
  queueId: string;
  status: QueueStatus;
  position?: number;
  estimatedWaitSeconds?: number;
  modelUsed?: string;
  progress?: number;
  result?: any;
  error?: string;
  timestamp: string;
}

// Queue analytics interface
export interface QueueAnalytics {
  id: string;
  date: string;
  generationType: GenerationType;
  modelId: string;
  totalRequests: number;
  completedRequests: number;
  failedRequests: number;
  cancelledRequests: number;
  avgWaitTimeSeconds: number;
  avgProcessingTimeSeconds: number;
  peakQueueSize: number;
}

// Model selection criteria interface
export interface ModelSelectionCriteria {
  preferredModel: string;
  generationType: GenerationType;
  priority: QueuePriority;
  qualityPreference: 'high' | 'medium' | 'low';
  speedPreference: 'fast' | 'medium' | 'slow';
  allowFallbacks: boolean;
}

// Queue configuration interface
export interface QueueConfig {
  maxQueueSize: number;
  maxRetries: number;
  processingInterval: number;
  priorityWeights: {
    high: number;
    normal: number;
    low: number;
  };
  capacityThresholds: {
    warning: number;
    critical: number;
  };
}

// Batch processing interface
export interface BatchProcessingConfig {
  batchSize: number;
  maxBatchWaitTime: number;
  enableBatching: boolean;
  batchableTypes: GenerationType[];
}

// Load balancing interface
export interface LoadBalancingStrategy {
  strategy: 'round-robin' | 'least-loaded' | 'weighted' | 'intelligent';
  weights?: Record<string, number>;
  fallbackEnabled: boolean;
  maxFallbackDepth: number;
}

// Performance metrics interface
export interface PerformanceMetrics {
  modelId: string;
  avgResponseTime: number;
  successRate: number;
  errorRate: number;
  throughput: number;
  queueLength: number;
  capacityUtilization: number;
  lastUpdated: Date;
}

// User tier interface for priority determination
export interface UserTier {
  tier: 'free' | 'starter' | 'pro' | 'enterprise';
  priority: QueuePriority;
  maxConcurrentRequests: number;
  queueJumps: number;
  fastTrack: boolean;
}

// Queue event interface for real-time updates
export interface QueueEvent {
  type: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'position_updated';
  queueId: string;
  userId: string;
  data: any;
  timestamp: Date;
}

// Model registry interface
export interface ModelRegistry {
  modelId: string;
  name: string;
  description: string;
  generationType: GenerationType;
  provider: AIProvider;
  capabilities: string[];
  pricing: {
    costPerRequest: number;
    currency: string;
  };
  limits: {
    maxConcurrent: number;
    rateLimit: number;
    quotaLimit?: number;
  };
  alternatives: string[];
  isActive: boolean;
  version: string;
  lastUpdated: Date;
}

// Error types for queue system
export class QueueError extends Error {
  constructor(
    message: string,
    public code: string,
    public queueId?: string,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'QueueError';
  }
}

export class ModelCapacityError extends QueueError {
  constructor(modelId: string, currentUsage: number, maxCapacity: number) {
    super(
      `Model ${modelId} at capacity: ${currentUsage}/${maxCapacity}`,
      'MODEL_CAPACITY_EXCEEDED',
      undefined,
      true
    );
  }
}

export class ModelNotFoundError extends QueueError {
  constructor(modelId: string) {
    super(
      `Model ${modelId} not found in registry`,
      'MODEL_NOT_FOUND',
      undefined,
      false
    );
  }
}

// Utility types
export type QueueItemUpdate = Partial<Pick<QueueItem, 'status' | 'modelUsed' | 'resultData' | 'errorMessage' | 'retryCount'>>;
export type ModelCapacityUpdate = Partial<Pick<ModelCapacity, 'currentUsage' | 'avgProcessingTimeSeconds' | 'successRate' | 'errorRate'>>;

// Constants
export const QUEUE_PRIORITIES: Record<QueuePriority, number> = {
  high: 3,
  normal: 2,
  low: 1
};

export const USER_TIER_PRIORITIES: Record<string, QueuePriority> = {
  enterprise: 'high',
  pro: 'high',
  starter: 'normal',
  free: 'low'
};

export const DEFAULT_QUEUE_CONFIG: QueueConfig = {
  maxQueueSize: 10000,
  maxRetries: 3,
  processingInterval: 2000,
  priorityWeights: {
    high: 10,
    normal: 5,
    low: 1
  },
  capacityThresholds: {
    warning: 0.8,
    critical: 0.95
  }
};

export const DEFAULT_BATCH_CONFIG: BatchProcessingConfig = {
  batchSize: 5,
  maxBatchWaitTime: 30000,
  enableBatching: false,
  batchableTypes: ['text']
};

export const DEFAULT_LOAD_BALANCING: LoadBalancingStrategy = {
  strategy: 'intelligent',
  fallbackEnabled: true,
  maxFallbackDepth: 3
};
