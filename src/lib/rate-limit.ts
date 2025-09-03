/**
 * Rate Limiting System for Gensy AI Creative Suite
 * 
 * Implements Redis-based rate limiting to prevent API abuse and unlimited costs.
 * Critical security fix for CVSS 9.1 vulnerability.
 * 
 * Features:
 * - Tier-based rate limiting (free, starter, pro, enterprise)
 * - Sliding window algorithm for accurate rate limiting
 * - Different limits for different endpoint types
 * - Proper error responses with retry-after headers
 */

import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { NextRequest, NextResponse } from 'next/server'

// Initialize Redis connection
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

// Rate limit configurations by user tier and endpoint type
export const RATE_LIMITS = {
  // Image generation limits (per hour)
  imageGeneration: {
    free: { requests: 10, window: '1 h' },
    starter: { requests: 50, window: '1 h' },
    pro: { requests: 200, window: '1 h' },
    enterprise: { requests: 1000, window: '1 h' },
  },
  
  // Video generation limits (per hour) - more restrictive
  videoGeneration: {
    free: { requests: 2, window: '1 h' },
    starter: { requests: 10, window: '1 h' },
    pro: { requests: 50, window: '1 h' },
    enterprise: { requests: 200, window: '1 h' },
  },
  
  // Credit purchase limits (per day)
  creditPurchase: {
    free: { requests: 5, window: '1 d' },
    starter: { requests: 20, window: '1 d' },
    pro: { requests: 50, window: '1 d' },
    enterprise: { requests: 100, window: '1 d' },
  },
  
  // General API limits (per minute) - global protection
  general: {
    free: { requests: 30, window: '1 m' },
    starter: { requests: 60, window: '1 m' },
    pro: { requests: 120, window: '1 m' },
    enterprise: { requests: 300, window: '1 m' },
  },
} as const

// User tier type
export type UserTier = 'free' | 'starter' | 'pro' | 'enterprise'
export type RateLimitType = keyof typeof RATE_LIMITS

// Rate limit result interface
export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: Date
  retryAfter?: number
}

// Create rate limiter instances
const rateLimiters = new Map<string, Ratelimit>()

/**
 * Get or create a rate limiter for specific configuration
 */
function getRateLimiter(type: RateLimitType, tier: UserTier): Ratelimit {
  const key = `${type}-${tier}`
  
  if (!rateLimiters.has(key)) {
    const config = RATE_LIMITS[type][tier]
    
    const limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(config.requests, config.window),
      analytics: true,
      prefix: `gensy:ratelimit:${type}:${tier}`,
    })
    
    rateLimiters.set(key, limiter)
  }
  
  return rateLimiters.get(key)!
}

/**
 * Check rate limit for a user
 */
export async function checkRateLimit(
  userId: string,
  type: RateLimitType,
  tier: UserTier
): Promise<RateLimitResult> {
  try {
    const limiter = getRateLimiter(type, tier)
    const identifier = `${userId}:${type}`
    
    const result = await limiter.limit(identifier)
    
    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
      retryAfter: result.success ? undefined : Math.ceil((result.reset.getTime() - Date.now()) / 1000),
    }
  } catch (error) {
    console.error('Rate limit check failed:', error)
    
    // Fail open - allow request if rate limiting fails
    // This prevents rate limiting issues from breaking the service
    return {
      success: true,
      limit: 0,
      remaining: 0,
      reset: new Date(),
    }
  }
}

/**
 * Rate limiting middleware for API routes
 */
export async function rateLimitMiddleware(
  request: NextRequest,
  userId: string,
  userTier: UserTier,
  rateLimitType: RateLimitType
): Promise<NextResponse | null> {
  const result = await checkRateLimit(userId, rateLimitType, userTier)
  
  if (!result.success) {
    const response = NextResponse.json(
      {
        error: 'Rate limit exceeded',
        code: 'RATE_LIMIT_EXCEEDED',
        details: {
          limit: result.limit,
          remaining: result.remaining,
          reset: result.reset.toISOString(),
          retryAfter: result.retryAfter,
          type: rateLimitType,
          tier: userTier,
        },
        message: `Too many requests. You can make ${result.limit} requests per ${RATE_LIMITS[rateLimitType][userTier].window}. Try again in ${result.retryAfter} seconds.`,
      },
      { status: 429 }
    )
    
    // Add rate limit headers
    response.headers.set('X-RateLimit-Limit', result.limit.toString())
    response.headers.set('X-RateLimit-Remaining', result.remaining.toString())
    response.headers.set('X-RateLimit-Reset', result.reset.getTime().toString())
    
    if (result.retryAfter) {
      response.headers.set('Retry-After', result.retryAfter.toString())
    }
    
    return response
  }
  
  return null // No rate limit exceeded, continue processing
}

/**
 * Get user tier from subscription status
 */
export function getUserTier(subscriptionStatus?: string): UserTier {
  switch (subscriptionStatus?.toLowerCase()) {
    case 'starter':
      return 'starter'
    case 'pro':
      return 'pro'
    case 'business':
    case 'enterprise':
      return 'enterprise'
    default:
      return 'free'
  }
}

/**
 * Add rate limit headers to successful responses
 */
export function addRateLimitHeaders(
  response: NextResponse,
  result: RateLimitResult
): NextResponse {
  response.headers.set('X-RateLimit-Limit', result.limit.toString())
  response.headers.set('X-RateLimit-Remaining', result.remaining.toString())
  response.headers.set('X-RateLimit-Reset', result.reset.getTime().toString())
  
  return response
}

/**
 * Rate limit decorator for API route handlers
 */
export function withRateLimit(
  rateLimitType: RateLimitType,
  handler: (request: NextRequest, context: any) => Promise<NextResponse>
) {
  return async (request: NextRequest, context: any): Promise<NextResponse> => {
    try {
      // Extract user information (this will be implemented with Clerk integration)
      const userId = request.headers.get('x-user-id') || 'anonymous'
      const userTier = getUserTier(request.headers.get('x-user-tier') || undefined)
      
      // Check rate limit
      const rateLimitResponse = await rateLimitMiddleware(
        request,
        userId,
        userTier,
        rateLimitType
      )
      
      if (rateLimitResponse) {
        return rateLimitResponse
      }
      
      // Execute the handler
      const response = await handler(request, context)
      
      // Add rate limit headers to successful responses
      const result = await checkRateLimit(userId, rateLimitType, userTier)
      return addRateLimitHeaders(response, result)
      
    } catch (error) {
      console.error('Rate limit middleware error:', error)
      
      // Continue with handler execution if rate limiting fails
      return handler(request, context)
    }
  }
}

/**
 * Emergency rate limiting for critical endpoints
 * More restrictive limits for high-cost operations
 */
export const EMERGENCY_LIMITS = {
  videoGeneration: {
    requests: 1,
    window: '5 m', // 1 request per 5 minutes
  },
  imageGeneration: {
    requests: 5,
    window: '1 m', // 5 requests per minute
  },
} as const

/**
 * Apply emergency rate limiting
 */
export async function emergencyRateLimit(
  userId: string,
  type: 'videoGeneration' | 'imageGeneration'
): Promise<RateLimitResult> {
  const config = EMERGENCY_LIMITS[type]
  
  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(config.requests, config.window),
    analytics: true,
    prefix: `gensy:emergency:${type}`,
  })
  
  const result = await limiter.limit(`emergency:${userId}:${type}`)
  
  return {
    success: result.success,
    limit: result.limit,
    remaining: result.remaining,
    reset: result.reset,
    retryAfter: result.success ? undefined : Math.ceil((result.reset.getTime() - Date.now()) / 1000),
  }
}
