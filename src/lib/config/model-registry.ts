// Model Registry - Central configuration for all AI models

import { ModelRegistry, GenerationType, AIProvider } from '@/lib/types/queue-types';

export const MODEL_REGISTRY: Record<string, ModelRegistry> = {
  // Image Generation Models
  'imagen-4.0-generate-preview-06-06': {
    modelId: 'imagen-4.0-generate-preview-06-06',
    name: 'Imagen 4.0',
    description: 'Google\'s latest high-quality image generation model',
    generationType: 'image',
    provider: 'google-vertex-ai',
    capabilities: ['text-to-image', 'high-resolution', 'photorealistic'],
    pricing: { costPerRequest: 0.04, currency: 'USD' },
    limits: { maxConcurrent: 7, rateLimit: 60, quotaLimit: 1000 },
    alternatives: ['imagen-4.0-fast-generate-preview-06-06', 'imagen-3.0-generate-001'],
    isActive: true,
    version: '4.0',
    lastUpdated: new Date('2024-12-01')
  },

  'imagen-4.0-fast-generate-preview-06-06': {
    modelId: 'imagen-4.0-fast-generate-preview-06-06',
    name: 'Imagen 4.0 Fast',
    description: 'Faster version of Imagen 4.0 with optimized processing',
    generationType: 'image',
    provider: 'google-vertex-ai',
    capabilities: ['text-to-image', 'fast-generation', 'photorealistic'],
    pricing: { costPerRequest: 0.03, currency: 'USD' },
    limits: { maxConcurrent: 10, rateLimit: 80, quotaLimit: 1500 },
    alternatives: ['imagen-4.0-generate-preview-06-06', 'imagen-3.0-fast-generate-001'],
    isActive: true,
    version: '4.0-fast',
    lastUpdated: new Date('2024-12-01')
  },

  'imagen-4.0-ultra-generate-preview': {
    modelId: 'imagen-4.0-ultra-generate-preview',
    name: 'Imagen 4.0 Ultra',
    description: 'Ultra high-quality version of Imagen 4.0',
    generationType: 'image',
    provider: 'google-vertex-ai',
    capabilities: ['text-to-image', 'ultra-high-quality', 'photorealistic'],
    pricing: { costPerRequest: 0.08, currency: 'USD' },
    limits: { maxConcurrent: 5, rateLimit: 30, quotaLimit: 500 },
    alternatives: ['imagen-4.0-generate-preview-06-06', 'imagen-4.0-fast-generate-preview-06-06'],
    isActive: true,
    version: '4.0-ultra',
    lastUpdated: new Date('2024-12-01')
  },

  'imagen-3.0-generate-001': {
    modelId: 'imagen-3.0-generate-001',
    name: 'Imagen 3.0',
    description: 'Google\'s proven image generation model',
    generationType: 'image',
    provider: 'google-vertex-ai',
    capabilities: ['text-to-image', 'reliable', 'photorealistic'],
    pricing: { costPerRequest: 0.025, currency: 'USD' },
    limits: { maxConcurrent: 12, rateLimit: 100, quotaLimit: 2000 },
    alternatives: ['imagen-3.0-fast-generate-001', 'flux-pro'],
    isActive: true,
    version: '3.0',
    lastUpdated: new Date('2024-10-01')
  },

  'imagen-3.0-fast-generate-001': {
    modelId: 'imagen-3.0-fast-generate-001',
    name: 'Imagen 3.0 Fast',
    description: 'Fast version of Imagen 3.0',
    generationType: 'image',
    provider: 'google-vertex-ai',
    capabilities: ['text-to-image', 'fast-generation', 'reliable'],
    pricing: { costPerRequest: 0.02, currency: 'USD' },
    limits: { maxConcurrent: 15, rateLimit: 120, quotaLimit: 2500 },
    alternatives: ['imagen-3.0-generate-001', 'flux-dev'],
    isActive: true,
    version: '3.0-fast',
    lastUpdated: new Date('2024-10-01')
  },

  'flux-pro': {
    modelId: 'flux-pro',
    name: 'Flux Pro',
    description: 'Black Forest Labs professional image generation',
    generationType: 'image',
    provider: 'black-forest-labs',
    capabilities: ['text-to-image', 'artistic', 'high-quality'],
    pricing: { costPerRequest: 0.035, currency: 'USD' },
    limits: { maxConcurrent: 5, rateLimit: 50, quotaLimit: 1000 },
    alternatives: ['flux-pro-1.1', 'flux-dev'],
    isActive: true,
    version: '1.0',
    lastUpdated: new Date('2024-11-01')
  },

  'flux-pro-1.1': {
    modelId: 'flux-pro-1.1',
    name: 'Flux Pro 1.1',
    description: 'Enhanced version of Flux Pro',
    generationType: 'image',
    provider: 'black-forest-labs',
    capabilities: ['text-to-image', 'artistic', 'enhanced-quality'],
    pricing: { costPerRequest: 0.04, currency: 'USD' },
    limits: { maxConcurrent: 4, rateLimit: 40, quotaLimit: 800 },
    alternatives: ['flux-pro-1.1-ultra', 'flux-pro'],
    isActive: true,
    version: '1.1',
    lastUpdated: new Date('2024-12-15')
  },

  'flux-pro-1.1-ultra': {
    modelId: 'flux-pro-1.1-ultra',
    name: 'Flux Pro 1.1 Ultra',
    description: 'Ultra high-quality Flux Pro model',
    generationType: 'image',
    provider: 'black-forest-labs',
    capabilities: ['text-to-image', 'artistic', 'ultra-quality'],
    pricing: { costPerRequest: 0.06, currency: 'USD' },
    limits: { maxConcurrent: 3, rateLimit: 25, quotaLimit: 500 },
    alternatives: ['flux-pro-1.1', 'flux-kontext-pro'],
    isActive: true,
    version: '1.1-ultra',
    lastUpdated: new Date('2024-12-15')
  },

  'flux-dev': {
    modelId: 'flux-dev',
    name: 'Flux Dev',
    description: 'Development version of Flux for experimentation',
    generationType: 'image',
    provider: 'black-forest-labs',
    capabilities: ['text-to-image', 'experimental', 'fast'],
    pricing: { costPerRequest: 0.02, currency: 'USD' },
    limits: { maxConcurrent: 8, rateLimit: 80, quotaLimit: 2000 },
    alternatives: ['flux-pro', 'imagen-3.0-fast-generate-001'],
    isActive: true,
    version: 'dev',
    lastUpdated: new Date('2024-11-01')
  },

  'flux-kontext-max': {
    modelId: 'flux-kontext-max',
    name: 'Flux Kontext Max',
    description: 'Context-aware image generation with maximum capabilities',
    generationType: 'image',
    provider: 'black-forest-labs',
    capabilities: ['text-to-image', 'context-aware', 'high-quality'],
    pricing: { costPerRequest: 0.045, currency: 'USD' },
    limits: { maxConcurrent: 6, rateLimit: 45, quotaLimit: 900 },
    alternatives: ['flux-kontext-pro', 'flux-pro-1.1'],
    isActive: true,
    version: 'kontext-max',
    lastUpdated: new Date('2024-12-20')
  },

  'flux-kontext-pro': {
    modelId: 'flux-kontext-pro',
    name: 'Flux Kontext Pro',
    description: 'Professional context-aware image generation',
    generationType: 'image',
    provider: 'black-forest-labs',
    capabilities: ['text-to-image', 'context-aware', 'professional'],
    pricing: { costPerRequest: 0.038, currency: 'USD' },
    limits: { maxConcurrent: 7, rateLimit: 55, quotaLimit: 1100 },
    alternatives: ['flux-kontext-max', 'flux-pro'],
    isActive: true,
    version: 'kontext-pro',
    lastUpdated: new Date('2024-12-20')
  },

  'bytedance-seedream-3.0-t2i': {
    modelId: 'bytedance-seedream-3.0-t2i',
    name: 'ByteDance Seedream 3.0',
    description: 'ByteDance text-to-image generation model',
    generationType: 'image',
    provider: 'bytedance',
    capabilities: ['text-to-image', 'high-throughput', 'asian-optimized'],
    pricing: { costPerRequest: 0.025, currency: 'USD' },
    limits: { maxConcurrent: 15, rateLimit: 100, quotaLimit: 3000 },
    alternatives: ['imagen-3.0-generate-001', 'flux-dev'],
    isActive: true,
    version: '3.0',
    lastUpdated: new Date('2024-11-15')
  },

  // Video Generation Models
  'veo-2.0-generate-001': {
    modelId: 'veo-2.0-generate-001',
    name: 'Google Veo 2.0',
    description: 'Google\'s advanced video generation model',
    generationType: 'video',
    provider: 'google-vertex-ai',
    capabilities: ['text-to-video', 'high-quality', 'long-duration'],
    pricing: { costPerRequest: 0.50, currency: 'USD' },
    limits: { maxConcurrent: 3, rateLimit: 20, quotaLimit: 200 },
    alternatives: ['veo-3.0-fast-generate-preview', 'seedance-1-0-lite-t2v-250428'],
    isActive: true,
    version: '2.0',
    lastUpdated: new Date('2024-11-01')
  },

  'veo-3.0-generate-preview': {
    modelId: 'veo-3.0-generate-preview',
    name: 'Google Veo 3.0',
    description: 'Latest Google video generation model (preview)',
    generationType: 'video',
    provider: 'google-vertex-ai',
    capabilities: ['text-to-video', 'ultra-quality', 'extended-duration'],
    pricing: { costPerRequest: 0.80, currency: 'USD' },
    limits: { maxConcurrent: 2, rateLimit: 10, quotaLimit: 100 },
    alternatives: ['veo-3.0-fast-generate-preview', 'veo-2.0-generate-001'],
    isActive: true,
    version: '3.0-preview',
    lastUpdated: new Date('2024-12-01')
  },

  'veo-3.0-fast-generate-preview': {
    modelId: 'veo-3.0-fast-generate-preview',
    name: 'Google Veo 3.0 Fast',
    description: 'Fast version of Veo 3.0 for quicker generation',
    generationType: 'video',
    provider: 'google-vertex-ai',
    capabilities: ['text-to-video', 'fast-generation', 'good-quality'],
    pricing: { costPerRequest: 0.40, currency: 'USD' },
    limits: { maxConcurrent: 4, rateLimit: 25, quotaLimit: 300 },
    alternatives: ['veo-3.0-generate-preview', 'veo-2.0-generate-001'],
    isActive: true,
    version: '3.0-fast',
    lastUpdated: new Date('2024-12-01')
  },

  // ByteDance Video Models
  'seedance-1-0-lite-t2v-250428': {
    modelId: 'seedance-1-0-lite-t2v-250428',
    name: 'ByteDance Seedance Lite T2V',
    description: 'ByteDance text-to-video generation (lite version)',
    generationType: 'video',
    provider: 'bytedance',
    capabilities: ['text-to-video', 'efficient', 'good-quality'],
    pricing: { costPerRequest: 0.30, currency: 'USD' },
    limits: { maxConcurrent: 5, rateLimit: 40, quotaLimit: 500 },
    alternatives: ['seedance-1-0-pro-250528', 'MiniMax-T2V-01'],
    isActive: true,
    version: '1.0-lite',
    lastUpdated: new Date('2024-11-20')
  },

  'seedance-1-0-lite-i2v-250428': {
    modelId: 'seedance-1-0-lite-i2v-250428',
    name: 'ByteDance Seedance Lite I2V',
    description: 'ByteDance image-to-video generation (lite version)',
    generationType: 'video',
    provider: 'bytedance',
    capabilities: ['image-to-video', 'efficient', 'good-quality'],
    pricing: { costPerRequest: 0.35, currency: 'USD' },
    limits: { maxConcurrent: 4, rateLimit: 35, quotaLimit: 400 },
    alternatives: ['MiniMax-I2V-01', 'seedance-1-0-pro-250528'],
    isActive: true,
    version: '1.0-lite-i2v',
    lastUpdated: new Date('2024-11-20')
  },

  'seedance-1-0-pro-250528': {
    modelId: 'seedance-1-0-pro-250528',
    name: 'ByteDance Seedance Pro',
    description: 'ByteDance professional video generation model',
    generationType: 'video',
    provider: 'bytedance',
    capabilities: ['text-to-video', 'image-to-video', 'professional-quality'],
    pricing: { costPerRequest: 0.60, currency: 'USD' },
    limits: { maxConcurrent: 3, rateLimit: 20, quotaLimit: 250 },
    alternatives: ['seedance-1-0-lite-t2v-250428', 'veo-2.0-generate-001'],
    isActive: true,
    version: '1.0-pro',
    lastUpdated: new Date('2024-11-25')
  },

  // MiniMax Video Models
  'MiniMax-Hailuo-02': {
    modelId: 'MiniMax-Hailuo-02',
    name: 'MiniMax Hailuo 02',
    description: 'MiniMax advanced video generation model',
    generationType: 'video',
    provider: 'minimax',
    capabilities: ['text-to-video', 'high-quality', 'chinese-optimized'],
    pricing: { costPerRequest: 0.45, currency: 'USD' },
    limits: { maxConcurrent: 5, rateLimit: 30, quotaLimit: 400 },
    alternatives: ['MiniMax-T2V-01', 'seedance-1-0-lite-t2v-250428'],
    isActive: true,
    version: '02',
    lastUpdated: new Date('2024-12-01')
  },

  'MiniMax-T2V-01': {
    modelId: 'MiniMax-T2V-01',
    name: 'MiniMax T2V 01',
    description: 'MiniMax text-to-video generation',
    generationType: 'video',
    provider: 'minimax',
    capabilities: ['text-to-video', 'reliable', 'good-performance'],
    pricing: { costPerRequest: 0.35, currency: 'USD' },
    limits: { maxConcurrent: 6, rateLimit: 40, quotaLimit: 600 },
    alternatives: ['MiniMax-Hailuo-02', 'MiniMax-I2V-01'],
    isActive: true,
    version: '01',
    lastUpdated: new Date('2024-11-15')
  },

  'MiniMax-I2V-01': {
    modelId: 'MiniMax-I2V-01',
    name: 'MiniMax I2V 01',
    description: 'MiniMax image-to-video generation',
    generationType: 'video',
    provider: 'minimax',
    capabilities: ['image-to-video', 'smooth-transitions', 'good-quality'],
    pricing: { costPerRequest: 0.40, currency: 'USD' },
    limits: { maxConcurrent: 4, rateLimit: 30, quotaLimit: 400 },
    alternatives: ['MiniMax-I2V-01-live', 'seedance-1-0-lite-i2v-250428'],
    isActive: true,
    version: '01',
    lastUpdated: new Date('2024-11-15')
  },

  'MiniMax-I2V-01-live': {
    modelId: 'MiniMax-I2V-01-live',
    name: 'MiniMax I2V 01 Live',
    description: 'MiniMax live image-to-video generation',
    generationType: 'video',
    provider: 'minimax',
    capabilities: ['image-to-video', 'real-time', 'fast-generation'],
    pricing: { costPerRequest: 0.25, currency: 'USD' },
    limits: { maxConcurrent: 8, rateLimit: 60, quotaLimit: 800 },
    alternatives: ['MiniMax-I2V-01', 'MiniMax-T2V-01'],
    isActive: true,
    version: '01-live',
    lastUpdated: new Date('2024-11-15')
  },

  'MiniMax-S2V-01': {
    modelId: 'MiniMax-S2V-01',
    name: 'MiniMax S2V 01',
    description: 'MiniMax speech-to-video generation',
    generationType: 'video',
    provider: 'minimax',
    capabilities: ['speech-to-video', 'audio-sync', 'lip-sync'],
    pricing: { costPerRequest: 0.55, currency: 'USD' },
    limits: { maxConcurrent: 3, rateLimit: 20, quotaLimit: 200 },
    alternatives: ['MiniMax-T2V-01', 'MiniMax-I2V-01'],
    isActive: true,
    version: '01',
    lastUpdated: new Date('2024-11-15')
  },

  'replicate-wan-2.1': {
    modelId: 'replicate-wan-2.1',
    name: 'Replicate Wan 2.1',
    description: 'Replicate video generation model',
    generationType: 'video',
    provider: 'replicate',
    capabilities: ['text-to-video', 'open-source', 'customizable'],
    pricing: { costPerRequest: 0.20, currency: 'USD' },
    limits: { maxConcurrent: 4, rateLimit: 35, quotaLimit: 500 },
    alternatives: ['MiniMax-T2V-01', 'seedance-1-0-lite-t2v-250428'],
    isActive: true,
    version: '2.1',
    lastUpdated: new Date('2024-10-15')
  },

  // Upscaling Models
  'vertex-ai-standard': {
    modelId: 'vertex-ai-standard',
    name: 'Vertex AI Standard Upscaling',
    description: 'Google Vertex AI standard image upscaling',
    generationType: 'upscaling',
    provider: 'google-vertex-ai',
    capabilities: ['image-upscaling', '4x-upscale', 'fast'],
    pricing: { costPerRequest: 0.01, currency: 'USD' },
    limits: { maxConcurrent: 15, rateLimit: 120, quotaLimit: 5000 },
    alternatives: ['vertex-ai-enhanced'],
    isActive: true,
    version: 'standard',
    lastUpdated: new Date('2024-10-01')
  },

  'vertex-ai-enhanced': {
    modelId: 'vertex-ai-enhanced',
    name: 'Vertex AI Enhanced Upscaling',
    description: 'Google Vertex AI enhanced image upscaling',
    generationType: 'upscaling',
    provider: 'google-vertex-ai',
    capabilities: ['image-upscaling', '8x-upscale', 'high-quality'],
    pricing: { costPerRequest: 0.025, currency: 'USD' },
    limits: { maxConcurrent: 10, rateLimit: 80, quotaLimit: 2000 },
    alternatives: ['vertex-ai-standard'],
    isActive: true,
    version: 'enhanced',
    lastUpdated: new Date('2024-10-01')
  },

  // Text Generation Models
  'gemini-1.5-flash': {
    modelId: 'gemini-1.5-flash',
    name: 'Gemini 1.5 Flash',
    description: 'Google\'s fast text generation model',
    generationType: 'text',
    provider: 'google-vertex-ai',
    capabilities: ['text-generation', 'fast-response', 'multimodal'],
    pricing: { costPerRequest: 0.001, currency: 'USD' },
    limits: { maxConcurrent: 50, rateLimit: 500, quotaLimit: 50000 },
    alternatives: [],
    isActive: true,
    version: '1.5-flash',
    lastUpdated: new Date('2024-11-01')
  }
};

/**
 * Get model by ID
 */
export function getModel(modelId: string): ModelRegistry | null {
  return MODEL_REGISTRY[modelId] || null;
}

/**
 * Get models by generation type
 */
export function getModelsByType(type: GenerationType): ModelRegistry[] {
  return Object.values(MODEL_REGISTRY).filter(model => model.generationType === type && model.isActive);
}

/**
 * Get models by provider
 */
export function getModelsByProvider(provider: AIProvider): ModelRegistry[] {
  return Object.values(MODEL_REGISTRY).filter(model => model.provider === provider && model.isActive);
}

/**
 * Get all active models
 */
export function getAllActiveModels(): ModelRegistry[] {
  return Object.values(MODEL_REGISTRY).filter(model => model.isActive);
}

/**
 * Search models by capability
 */
export function searchModelsByCapability(capability: string): ModelRegistry[] {
  return Object.values(MODEL_REGISTRY).filter(model => 
    model.isActive && model.capabilities.includes(capability)
  );
}
