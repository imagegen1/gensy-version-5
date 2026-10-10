/**
 * Rate Limiting Middleware for Next.js API Routes
 * 
 * Provides middleware functions to apply rate limiting to API endpoints.
 * Integrates with Clerk authentication to get user information.
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { 
  rateLimitMiddleware, 
  getUserTier, 
  RateLimitType,
  UserTier,
  checkRateLimit,
  addRateLimitHeaders
} from '@/lib/rate-limit'
import { createServiceRoleClient } from '@/lib/supabase/server'

/**
 * Get user information from Clerk and Supabase
 */
async function getUserInfo(request: NextRequest): Promise<{
  userId: string
  userTier: UserTier
  isAuthenticated: boolean
}> {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return {
        userId: 'anonymous',
        userTier: 'free',
        isAuthenticated: false,
      }
    }
    
    // Get user subscription tier from Supabase
    const supabase = createServiceRoleClient()
    const { data: user } = await supabase
      .from('users')
      .select('subscription_status')
      .eq('clerk_user_id', userId)
      .single()
    
    return {
      userId,
      userTier: getUserTier(user?.subscription_status),
      isAuthenticated: true,
    }
  } catch (error) {
    console.error('Failed to get user info for rate limiting:', error)
    
    // Fallback to anonymous user
    return {
      userId: 'anonymous',
      userTier: 'free',
      isAuthenticated: false,
    }
  }
}

/**
 * Apply rate limiting to an API route handler
 */
export function withRateLimiting(
  rateLimitType: RateLimitType,
  handler: (request: NextRequest, context: any) => Promise<NextResponse>
) {
  return async (request: NextRequest, context: any): Promise<NextResponse> => {
    try {
      // Get user information
      const { userId, userTier, isAuthenticated } = await getUserInfo(request)
      
      // Apply stricter limits for unauthenticated users
      const effectiveTier = isAuthenticated ? userTier : 'free'
      
      // Check rate limit
      const rateLimitResponse = await rateLimitMiddleware(
        request,
        userId,
        effectiveTier,
        rateLimitType
      )
      
      if (rateLimitResponse) {
        // Log rate limit violation for monitoring
        console.warn('Rate limit exceeded:', {
          userId,
          userTier: effectiveTier,
          rateLimitType,
          ip: request.ip || request.headers.get('x-forwarded-for'),
          userAgent: request.headers.get('user-agent'),
          timestamp: new Date().toISOString(),
        })
        
        return rateLimitResponse
      }
      
      // Execute the handler
      const response = await handler(request, context)
      
      // Add rate limit headers to successful responses
      const result = await checkRateLimit(userId, rateLimitType, effectiveTier)
      return addRateLimitHeaders(response, result)
      
    } catch (error) {
      console.error('Rate limiting middleware error:', error)
      
      // Continue with handler execution if rate limiting fails
      // This ensures rate limiting issues don't break the service
      return handler(request, context)
    }
  }
}

/**
 * Rate limiting middleware for specific endpoint types
 */
export const withImageGenerationRateLimit = (
  handler: (request: NextRequest, context: any) => Promise<NextResponse>
) => withRateLimiting('imageGeneration', handler)

export const withVideoGenerationRateLimit = (
  handler: (request: NextRequest, context: any) => Promise<NextResponse>
) => withRateLimiting('videoGeneration', handler)

export const withCreditPurchaseRateLimit = (
  handler: (request: NextRequest, context: any) => Promise<NextResponse>
) => withRateLimiting('creditPurchase', handler)

export const withGeneralRateLimit = (
  handler: (request: NextRequest, context: any) => Promise<NextResponse>
) => withRateLimiting('general', handler)

/**
 * Check if request should be rate limited based on IP
 * Additional protection against distributed attacks
 */
export async function checkIPRateLimit(request: NextRequest): Promise<NextResponse | null> {
  const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown'
  
  // Skip rate limiting for localhost in development
  if (process.env.NODE_ENV === 'development' && (ip === '127.0.0.1' || ip === 'localhost')) {
    return null
  }
  
  try {
    const result = await checkRateLimit(
      `ip:${ip}`,
      'general',
      'free' // Use most restrictive tier for IP-based limiting
    )
    
    if (!result.success) {
      return NextResponse.json(
        {
          error: 'Too many requests from this IP address',
          code: 'IP_RATE_LIMIT_EXCEEDED',
          retryAfter: result.retryAfter,
        },
        { 
          status: 429,
          headers: {
            'Retry-After': result.retryAfter?.toString() || '60',
          }
        }
      )
    }
    
    return null
  } catch (error) {
    console.error('IP rate limit check failed:', error)
    return null // Fail open
  }
}

/**
 * Comprehensive rate limiting middleware that combines user and IP limits
 */
export function withComprehensiveRateLimit(
  rateLimitType: RateLimitType,
  handler: (request: NextRequest, context: any) => Promise<NextResponse>
) {
  return async (request: NextRequest, context: any): Promise<NextResponse> => {
    // First check IP-based rate limiting
    const ipLimitResponse = await checkIPRateLimit(request)
    if (ipLimitResponse) {
      return ipLimitResponse
    }
    
    // Then apply user-based rate limiting
    return withRateLimiting(rateLimitType, handler)(request, context)
  }
}

/**
 * Rate limiting for authentication-required endpoints
 */
export function withAuthenticatedRateLimit(
  rateLimitType: RateLimitType,
  handler: (request: NextRequest, context: any) => Promise<NextResponse>
) {
  return async (request: NextRequest, context: any): Promise<NextResponse> => {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    return withRateLimiting(rateLimitType, handler)(request, context)
  }
}

/**
 * Emergency rate limiting for high-cost operations
 */
export async function applyEmergencyRateLimit(
  request: NextRequest,
  type: 'videoGeneration' | 'imageGeneration'
): Promise<NextResponse | null> {
  const { userId } = await auth()
  
  if (!userId) {
    return NextResponse.json(
      { error: 'Authentication required for this operation' },
      { status: 401 }
    )
  }
  
  const { emergencyRateLimit } = await import('@/lib/rate-limit')
  const result = await emergencyRateLimit(userId, type)
  
  if (!result.success) {
    return NextResponse.json(
      {
        error: 'Emergency rate limit exceeded',
        code: 'EMERGENCY_RATE_LIMIT_EXCEEDED',
        message: `This operation is temporarily rate limited. Please wait ${result.retryAfter} seconds before trying again.`,
        retryAfter: result.retryAfter,
      },
      { 
        status: 429,
        headers: {
          'Retry-After': result.retryAfter?.toString() || '300',
        }
      }
    )
  }
  
  return null
}
