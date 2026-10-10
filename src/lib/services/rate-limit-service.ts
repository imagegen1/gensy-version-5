/**
 * Rate Limit Service
 * 
 * Service layer for managing rate limits, violations, and administrative functions.
 * Provides utilities for monitoring and managing the rate limiting system.
 */

import { createServiceRoleClient } from '@/lib/supabase/server';

export interface RateLimitStats {
  totalRequests: number;
  totalViolations: number;
  activeBlocks: number;
  topEndpoints: Array<{
    endpoint: string;
    requestCount: number;
    violationCount: number;
  }>;
  topViolators: Array<{
    identifier: string;
    identifierType: string;
    violationCount: number;
    lastViolation: string;
  }>;
}

export interface RateLimitRule {
  id: string;
  endpoint: string;
  userTier: string;
  maxRequests: number;
  windowSeconds: number;
  burstLimit?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Get rate limit statistics for monitoring
 */
export async function getRateLimitStats(timeframe: 'hour' | 'day' | 'week' = 'day'): Promise<RateLimitStats> {
  const supabase = createServiceRoleClient();
  
  const timeframeDuration = {
    hour: 1,
    day: 24,
    week: 168
  };
  
  const since = new Date(Date.now() - (timeframeDuration[timeframe] * 60 * 60 * 1000));
  
  try {
    // Get total requests
    const { count: totalRequests } = await supabase
      .from('rate_limit_tracking')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', since.toISOString());
    
    // Get total violations
    const { count: totalViolations } = await supabase
      .from('rate_limit_violations')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', since.toISOString());
    
    // Get active blocks
    const { count: activeBlocks } = await supabase
      .from('rate_limit_violations')
      .select('*', { count: 'exact', head: true })
      .gte('blocked_until', new Date().toISOString());
    
    // Get top endpoints by request count
    const { data: endpointStats } = await supabase
      .from('rate_limit_tracking')
      .select('endpoint, request_count')
      .gte('created_at', since.toISOString())
      .order('request_count', { ascending: false })
      .limit(10);
    
    // Get top violators
    const { data: violatorStats } = await supabase
      .from('rate_limit_violations')
      .select('identifier, identifier_type, violation_count, updated_at')
      .gte('created_at', since.toISOString())
      .order('violation_count', { ascending: false })
      .limit(10);
    
    // Aggregate endpoint stats
    const endpointMap = new Map();
    endpointStats?.forEach(stat => {
      const existing = endpointMap.get(stat.endpoint) || { requestCount: 0, violationCount: 0 };
      existing.requestCount += stat.request_count;
      endpointMap.set(stat.endpoint, existing);
    });
    
    // Get violation counts per endpoint
    const { data: violationsByEndpoint } = await supabase
      .from('rate_limit_violations')
      .select('endpoint, violation_count')
      .gte('created_at', since.toISOString());
    
    violationsByEndpoint?.forEach(violation => {
      const existing = endpointMap.get(violation.endpoint) || { requestCount: 0, violationCount: 0 };
      existing.violationCount += violation.violation_count;
      endpointMap.set(violation.endpoint, existing);
    });
    
    const topEndpoints = Array.from(endpointMap.entries()).map(([endpoint, stats]) => ({
      endpoint,
      requestCount: stats.requestCount,
      violationCount: stats.violationCount
    })).sort((a, b) => b.requestCount - a.requestCount).slice(0, 5);
    
    const topViolators = violatorStats?.map(violator => ({
      identifier: violator.identifier,
      identifierType: violator.identifier_type,
      violationCount: violator.violation_count,
      lastViolation: violator.updated_at
    })) || [];
    
    return {
      totalRequests: totalRequests || 0,
      totalViolations: totalViolations || 0,
      activeBlocks: activeBlocks || 0,
      topEndpoints,
      topViolators
    };
  } catch (error) {
    console.error('Error getting rate limit stats:', error);
    return {
      totalRequests: 0,
      totalViolations: 0,
      activeBlocks: 0,
      topEndpoints: [],
      topViolators: []
    };
  }
}

/**
 * Get all rate limit rules
 */
export async function getRateLimitRules(): Promise<RateLimitRule[]> {
  const supabase = createServiceRoleClient();
  
  try {
    const { data: rules } = await supabase
      .from('rate_limit_rules')
      .select('*')
      .order('endpoint', { ascending: true })
      .order('user_tier', { ascending: true });
    
    return rules?.map(rule => ({
      id: rule.id,
      endpoint: rule.endpoint,
      userTier: rule.user_tier,
      maxRequests: rule.max_requests,
      windowSeconds: rule.window_seconds,
      burstLimit: rule.burst_limit,
      isActive: rule.is_active,
      createdAt: rule.created_at,
      updatedAt: rule.updated_at
    })) || [];
  } catch (error) {
    console.error('Error getting rate limit rules:', error);
    return [];
  }
}

/**
 * Create or update a rate limit rule
 */
export async function upsertRateLimitRule(rule: Omit<RateLimitRule, 'id' | 'createdAt' | 'updatedAt'>): Promise<boolean> {
  const supabase = createServiceRoleClient();
  
  try {
    const { error } = await supabase
      .from('rate_limit_rules')
      .upsert({
        endpoint: rule.endpoint,
        user_tier: rule.userTier,
        max_requests: rule.maxRequests,
        window_seconds: rule.windowSeconds,
        burst_limit: rule.burstLimit,
        is_active: rule.isActive,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'endpoint,user_tier'
      });
    
    return !error;
  } catch (error) {
    console.error('Error upserting rate limit rule:', error);
    return false;
  }
}

/**
 * Remove a rate limit block for an identifier
 */
export async function removeRateLimitBlock(
  identifier: string, 
  identifierType: string, 
  endpoint?: string
): Promise<boolean> {
  const supabase = createServiceRoleClient();
  
  try {
    let query = supabase
      .from('rate_limit_violations')
      .update({ 
        blocked_until: new Date().toISOString(), // Set to now to unblock
        updated_at: new Date().toISOString()
      })
      .eq('identifier', identifier)
      .eq('identifier_type', identifierType);
    
    if (endpoint) {
      query = query.eq('endpoint', endpoint);
    }
    
    const { error } = await query;
    
    // Log the unblock action
    await supabase
      .from('security_audit_log')
      .insert({
        event_type: 'rate_limit_unblock',
        event_category: 'rate_limit',
        severity: 'info',
        endpoint: endpoint || 'all',
        request_data: {
          identifier,
          identifierType,
          unblockedBy: 'admin'
        }
      });
    
    return !error;
  } catch (error) {
    console.error('Error removing rate limit block:', error);
    return false;
  }
}

/**
 * Get current rate limit status for an identifier
 */
export async function getRateLimitStatus(
  identifier: string,
  identifierType: string,
  endpoint: string
): Promise<{
  isBlocked: boolean;
  blockedUntil?: Date;
  violationCount: number;
  recentRequests: number;
  windowStart?: Date;
  windowEnd?: Date;
}> {
  const supabase = createServiceRoleClient();
  
  try {
    // Check for active blocks
    const { data: violation } = await supabase
      .from('rate_limit_violations')
      .select('blocked_until, violation_count')
      .eq('identifier', identifier)
      .eq('identifier_type', identifierType)
      .eq('endpoint', endpoint)
      .single();
    
    const isBlocked = violation?.blocked_until ? new Date(violation.blocked_until) > new Date() : false;
    
    // Get recent request count
    const oneHourAgo = new Date(Date.now() - (60 * 60 * 1000));
    const { data: tracking } = await supabase
      .from('rate_limit_tracking')
      .select('request_count, window_start, window_end')
      .eq('identifier', identifier)
      .eq('identifier_type', identifierType)
      .eq('endpoint', endpoint)
      .gte('window_start', oneHourAgo.toISOString())
      .order('window_start', { ascending: false })
      .limit(1)
      .single();
    
    return {
      isBlocked,
      blockedUntil: violation?.blocked_until ? new Date(violation.blocked_until) : undefined,
      violationCount: violation?.violation_count || 0,
      recentRequests: tracking?.request_count || 0,
      windowStart: tracking?.window_start ? new Date(tracking.window_start) : undefined,
      windowEnd: tracking?.window_end ? new Date(tracking.window_end) : undefined
    };
  } catch (error) {
    console.error('Error getting rate limit status:', error);
    return {
      isBlocked: false,
      violationCount: 0,
      recentRequests: 0
    };
  }
}

/**
 * Clean up old rate limit tracking data
 */
export async function cleanupOldRateLimitData(daysOld: number = 7): Promise<number> {
  const supabase = createServiceRoleClient();
  const cutoffDate = new Date(Date.now() - (daysOld * 24 * 60 * 60 * 1000));
  
  try {
    // Clean up old tracking records
    const { count: trackingDeleted } = await supabase
      .from('rate_limit_tracking')
      .delete({ count: 'exact' })
      .lt('created_at', cutoffDate.toISOString());
    
    // Clean up old violations (but keep recent ones for analysis)
    const { count: violationsDeleted } = await supabase
      .from('rate_limit_violations')
      .delete({ count: 'exact' })
      .lt('created_at', cutoffDate.toISOString())
      .lt('blocked_until', new Date().toISOString()); // Only delete expired blocks
    
    console.log(`Cleaned up ${trackingDeleted || 0} tracking records and ${violationsDeleted || 0} violation records`);
    
    return (trackingDeleted || 0) + (violationsDeleted || 0);
  } catch (error) {
    console.error('Error cleaning up rate limit data:', error);
    return 0;
  }
}

/**
 * Reset rate limit for an identifier (emergency function)
 */
export async function resetRateLimit(
  identifier: string,
  identifierType: string,
  endpoint?: string
): Promise<boolean> {
  const supabase = createServiceRoleClient();
  
  try {
    // Remove tracking records
    let trackingQuery = supabase
      .from('rate_limit_tracking')
      .delete()
      .eq('identifier', identifier)
      .eq('identifier_type', identifierType);
    
    if (endpoint) {
      trackingQuery = trackingQuery.eq('endpoint', endpoint);
    }
    
    await trackingQuery;
    
    // Remove violations
    let violationQuery = supabase
      .from('rate_limit_violations')
      .delete()
      .eq('identifier', identifier)
      .eq('identifier_type', identifierType);
    
    if (endpoint) {
      violationQuery = violationQuery.eq('endpoint', endpoint);
    }
    
    await violationQuery;
    
    // Log the reset action
    await supabase
      .from('security_audit_log')
      .insert({
        event_type: 'rate_limit_reset',
        event_category: 'rate_limit',
        severity: 'warning',
        endpoint: endpoint || 'all',
        request_data: {
          identifier,
          identifierType,
          resetBy: 'admin'
        }
      });
    
    return true;
  } catch (error) {
    console.error('Error resetting rate limit:', error);
    return false;
  }
}
