/**
 * Database-Driven Rate Limiting Middleware
 * 
 * Enforces rate limits using Supabase database rules with real-time tracking.
 * Critical security component from Sprint 1 to prevent API abuse and cost overruns.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/client';
import { auth } from '@clerk/nextjs/server';

// Rate limit result interface
export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetTime: Date;
  retryAfter?: number;
  userTier: string;
  endpoint: string;
}

// Rate limit violation interface
export interface RateLimitViolation {
  identifier: string;
  identifierType: 'user' | 'ip' | 'api_key';
  endpoint: string;
  violationCount: number;
  blockedUntil?: Date;
}

/**
 * Get user tier from database - supports subscription and pay-as-you-go users
 */
async function getUserTier(userId?: string): Promise<string> {
  if (!userId) return 'unregistered';

  const supabase = createServiceRoleClient();

  try {
    // Get user's subscription status and credits
    const { data: user } = await supabase
      .from('users')
      .select('subscription_status, credits, clerk_user_id')
      .eq('clerk_user_id', userId)
      .single();

    if (!user) return 'unregistered';

    // If user has active subscription, get their plan tier
    if (user.subscription_status === 'active') {
      const { data: subscription } = await supabase
        .from('user_subscriptions')
        .select(`
          plan:subscription_plans(name)
        `)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      if (subscription?.plan?.name) {
        return subscription.plan.name.toLowerCase(); // starter, pro, business, enterprise
      }
    }

    // For pay-as-you-go users, determine tier based on credit balance
    const credits = user.credits || 0;

    if (credits >= 100000) return 'enterprise-payg'; // High credit balance
    if (credits >= 50000) return 'business-payg';    // Medium-high credit balance
    if (credits >= 10000) return 'pro-payg';         // Medium credit balance
    if (credits >= 1000) return 'starter-payg';      // Low credit balance
    if (credits > 0) return 'basic-payg';            // Has some credits

    return 'no-credits'; // No credits available
  } catch (error) {
    console.error('Error getting user tier:', error);
    return 'unregistered'; // Default for errors
  }
}

/**
 * Get rate limit rule for endpoint and user tier
 */
async function getRateLimitRule(endpoint: string, userTier: string) {
  const supabase = createServiceRoleClient();
  
  try {
    const { data: rule } = await supabase
      .from('rate_limit_rules')
      .select('*')
      .eq('endpoint', endpoint)
      .eq('user_tier', userTier)
      .eq('is_active', true)
      .single();
    
    return rule;
  } catch (error) {
    console.error('Error getting rate limit rule:', error);
    return null;
  }
}

/**
 * Check if identifier is currently blocked
 */
async function checkIfBlocked(identifier: string, identifierType: string, endpoint: string): Promise<boolean> {
  const supabase = createServiceRoleClient();
  
  try {
    const { data: violation } = await supabase
      .from('rate_limit_violations')
      .select('blocked_until')
      .eq('identifier', identifier)
      .eq('identifier_type', identifierType)
      .eq('endpoint', endpoint)
      .gte('blocked_until', new Date().toISOString())
      .single();
    
    return !!violation;
  } catch (error) {
    // No active block found
    return false;
  }
}

/**
 * Get current request count for the time window
 */
async function getCurrentRequestCount(
  identifier: string, 
  identifierType: string, 
  endpoint: string, 
  windowSeconds: number
): Promise<{ count: number; windowStart: Date; windowEnd: Date }> {
  const supabase = createServiceRoleClient();
  const now = new Date();
  const windowStart = new Date(now.getTime() - (windowSeconds * 1000));
  const windowEnd = now;
  
  try {
    // Get or create tracking record for current window
    const { data: tracking } = await supabase
      .from('rate_limit_tracking')
      .select('request_count, window_start, window_end')
      .eq('identifier', identifier)
      .eq('identifier_type', identifierType)
      .eq('endpoint', endpoint)
      .gte('window_end', windowStart.toISOString())
      .single();
    
    if (tracking) {
      return {
        count: tracking.request_count,
        windowStart: new Date(tracking.window_start),
        windowEnd: new Date(tracking.window_end)
      };
    }
    
    // No existing window, start fresh
    return {
      count: 0,
      windowStart,
      windowEnd
    };
  } catch (error) {
    console.error('Error getting request count:', error);
    return { count: 0, windowStart, windowEnd };
  }
}

/**
 * Update request count in database
 */
async function updateRequestCount(
  identifier: string,
  identifierType: string,
  endpoint: string,
  windowStart: Date,
  windowEnd: Date,
  currentCount: number
): Promise<void> {
  const supabase = createServiceRoleClient();
  
  try {
    await supabase
      .from('rate_limit_tracking')
      .upsert({
        identifier,
        identifier_type: identifierType,
        endpoint,
        request_count: currentCount + 1,
        window_start: windowStart.toISOString(),
        window_end: windowEnd.toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'identifier,identifier_type,endpoint,window_start'
      });
  } catch (error) {
    console.error('Error updating request count:', error);
  }
}

/**
 * Record rate limit violation
 */
async function recordViolation(
  identifier: string,
  identifierType: string,
  endpoint: string,
  blockDurationMinutes: number = 15
): Promise<void> {
  const supabase = createServiceRoleClient();
  const blockedUntil = new Date(Date.now() + (blockDurationMinutes * 60 * 1000));
  
  try {
    // Get existing violation count
    const { data: existing } = await supabase
      .from('rate_limit_violations')
      .select('violation_count')
      .eq('identifier', identifier)
      .eq('identifier_type', identifierType)
      .eq('endpoint', endpoint)
      .single();
    
    const violationCount = (existing?.violation_count || 0) + 1;
    
    // Increase block duration for repeat offenders
    const escalatedBlockMinutes = Math.min(blockDurationMinutes * Math.pow(2, violationCount - 1), 1440); // Max 24 hours
    const escalatedBlockedUntil = new Date(Date.now() + (escalatedBlockMinutes * 60 * 1000));
    
    await supabase
      .from('rate_limit_violations')
      .upsert({
        identifier,
        identifier_type: identifierType,
        endpoint,
        violation_count: violationCount,
        blocked_until: escalatedBlockedUntil.toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'identifier,identifier_type,endpoint'
      });
    
    // Log security event
    await supabase
      .from('security_audit_log')
      .insert({
        event_type: 'rate_limit_violation',
        event_category: 'rate_limit',
        severity: violationCount > 3 ? 'critical' : 'warning',
        endpoint,
        request_data: {
          identifier,
          identifierType,
          violationCount,
          blockedUntil: escalatedBlockedUntil.toISOString()
        }
      });
  } catch (error) {
    console.error('Error recording violation:', error);
  }
}

/**
 * Check rate limit for a request
 */
export async function checkRateLimit(
  request: NextRequest,
  endpoint: string
): Promise<RateLimitResult> {
  try {
    // Get user information
    const { userId } = await auth();
    const userTier = await getUserTier(userId || undefined);
    
    // Get client IP
    const clientIP = request.ip || 
                    request.headers.get('x-forwarded-for')?.split(',')[0] || 
                    request.headers.get('x-real-ip') || 
                    'unknown';
    
    // Primary identifier is user ID, fallback to IP
    const identifier = userId || clientIP;
    const identifierType = userId ? 'user' : 'ip';
    
    // Check if currently blocked
    const isBlocked = await checkIfBlocked(identifier, identifierType, endpoint);
    if (isBlocked) {
      return {
        allowed: false,
        limit: 0,
        remaining: 0,
        resetTime: new Date(Date.now() + (15 * 60 * 1000)), // Default 15 min block
        retryAfter: 15 * 60,
        userTier,
        endpoint
      };
    }
    
    // Get rate limit rule
    const rule = await getRateLimitRule(endpoint, userTier);
    if (!rule) {
      // No rule found, allow request (fail open)
      console.warn(`No rate limit rule found for ${endpoint} and tier ${userTier}`);
      return {
        allowed: true,
        limit: 1000, // Default high limit
        remaining: 999,
        resetTime: new Date(Date.now() + (3600 * 1000)),
        userTier,
        endpoint
      };
    }
    
    // Get current request count
    const { count, windowStart, windowEnd } = await getCurrentRequestCount(
      identifier,
      identifierType,
      endpoint,
      rule.window_seconds
    );
    
    // Check if limit exceeded
    if (count >= rule.max_requests) {
      // Record violation
      await recordViolation(identifier, identifierType, endpoint);
      
      const resetTime = new Date(windowStart.getTime() + (rule.window_seconds * 1000));
      const retryAfter = Math.ceil((resetTime.getTime() - Date.now()) / 1000);
      
      return {
        allowed: false,
        limit: rule.max_requests,
        remaining: 0,
        resetTime,
        retryAfter,
        userTier,
        endpoint
      };
    }
    
    // Update request count
    await updateRequestCount(identifier, identifierType, endpoint, windowStart, windowEnd, count);
    
    const resetTime = new Date(windowStart.getTime() + (rule.window_seconds * 1000));
    
    return {
      allowed: true,
      limit: rule.max_requests,
      remaining: rule.max_requests - count - 1,
      resetTime,
      userTier,
      endpoint
    };
    
  } catch (error) {
    console.error('Rate limit check failed:', error);
    
    // Fail open - allow request if rate limiting fails
    return {
      allowed: true,
      limit: 100,
      remaining: 99,
      resetTime: new Date(Date.now() + (3600 * 1000)),
      userTier: 'free',
      endpoint
    };
  }
}

/**
 * Rate limiting middleware function
 */
export async function rateLimitMiddleware(
  request: NextRequest,
  endpoint: string
): Promise<NextResponse | null> {
  const result = await checkRateLimit(request, endpoint);
  
  if (!result.allowed) {
    const response = NextResponse.json(
      {
        error: 'Rate limit exceeded',
        code: 'RATE_LIMIT_EXCEEDED',
        message: `Too many requests. Limit: ${result.limit} requests per window. Try again in ${result.retryAfter} seconds.`,
        details: {
          limit: result.limit,
          remaining: result.remaining,
          resetTime: result.resetTime.toISOString(),
          retryAfter: result.retryAfter,
          userTier: result.userTier,
          endpoint: result.endpoint
        }
      },
      { status: 429 }
    );
    
    // Add rate limit headers
    response.headers.set('X-RateLimit-Limit', result.limit.toString());
    response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
    response.headers.set('X-RateLimit-Reset', result.resetTime.toISOString());
    if (result.retryAfter) {
      response.headers.set('Retry-After', result.retryAfter.toString());
    }
    
    return response;
  }
  
  // Add rate limit headers to successful requests
  const headers = new Headers();
  headers.set('X-RateLimit-Limit', result.limit.toString());
  headers.set('X-RateLimit-Remaining', result.remaining.toString());
  headers.set('X-RateLimit-Reset', result.resetTime.toISOString());
  
  return null; // Allow request to continue
}

/**
 * Higher-order function to wrap API routes with rate limiting
 */
export function withRateLimit(
  endpoint: string,
  handler: (request: NextRequest, context: any) => Promise<NextResponse>
) {
  return async (request: NextRequest, context: any): Promise<NextResponse> => {
    // Apply rate limiting
    const rateLimitResponse = await rateLimitMiddleware(request, endpoint);
    
    if (rateLimitResponse) {
      return rateLimitResponse;
    }
    
    // Continue with original handler
    const response = await handler(request, context);
    
    // Add rate limit headers to response
    const result = await checkRateLimit(request, endpoint);
    response.headers.set('X-RateLimit-Limit', result.limit.toString());
    response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
    response.headers.set('X-RateLimit-Reset', result.resetTime.toISOString());
    
    return response;
  };
}
