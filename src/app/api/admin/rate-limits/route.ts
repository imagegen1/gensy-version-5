/**
 * Admin Rate Limits API Route
 * 
 * Provides administrative functions for managing rate limits, viewing statistics,
 * and handling violations. Part of Sprint 1 security implementation.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import {
  getRateLimitStats,
  getRateLimitRules,
  upsertRateLimitRule,
  removeRateLimitBlock,
  getRateLimitStatus,
  cleanupOldRateLimitData,
  resetRateLimit
} from '@/lib/services/rate-limit-service';

// Check if user is admin (implement based on your auth system)
async function isAdmin(userId: string): Promise<boolean> {
  // This is a placeholder - implement your admin check logic
  // You might check a database, role-based permissions, etc.
  return true; // For now, allow all authenticated users
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!(await isAdmin(userId))) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const timeframe = searchParams.get('timeframe') as 'hour' | 'day' | 'week' || 'day';

    switch (action) {
      case 'stats':
        const stats = await getRateLimitStats(timeframe);
        return NextResponse.json(stats);

      case 'rules':
        const rules = await getRateLimitRules();
        return NextResponse.json({ rules });

      case 'status':
        const identifier = searchParams.get('identifier');
        const identifierType = searchParams.get('identifierType');
        const endpoint = searchParams.get('endpoint');

        if (!identifier || !identifierType || !endpoint) {
          return NextResponse.json(
            { error: 'Missing required parameters: identifier, identifierType, endpoint' },
            { status: 400 }
          );
        }

        const status = await getRateLimitStatus(identifier, identifierType, endpoint);
        return NextResponse.json(status);

      default:
        // Return overview data
        const [overviewStats, overviewRules] = await Promise.all([
          getRateLimitStats(timeframe),
          getRateLimitRules()
        ]);

        return NextResponse.json({
          stats: overviewStats,
          rules: overviewRules,
          timestamp: new Date().toISOString()
        });
    }
  } catch (error) {
    console.error('Error in rate limits admin API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!(await isAdmin(userId))) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'create_rule':
      case 'update_rule':
        const { endpoint, userTier, maxRequests, windowSeconds, burstLimit, isActive } = body;

        if (!endpoint || !userTier || !maxRequests || !windowSeconds) {
          return NextResponse.json(
            { error: 'Missing required fields: endpoint, userTier, maxRequests, windowSeconds' },
            { status: 400 }
          );
        }

        const success = await upsertRateLimitRule({
          endpoint,
          userTier,
          maxRequests,
          windowSeconds,
          burstLimit,
          isActive: isActive !== false // Default to true
        });

        if (success) {
          return NextResponse.json({
            success: true,
            message: `Rate limit rule ${action === 'create_rule' ? 'created' : 'updated'} successfully`
          });
        } else {
          return NextResponse.json(
            { error: 'Failed to save rate limit rule' },
            { status: 500 }
          );
        }

      case 'unblock':
        const { identifier, identifierType, endpoint: unblockEndpoint } = body;

        if (!identifier || !identifierType) {
          return NextResponse.json(
            { error: 'Missing required fields: identifier, identifierType' },
            { status: 400 }
          );
        }

        const unblockSuccess = await removeRateLimitBlock(identifier, identifierType, unblockEndpoint);

        if (unblockSuccess) {
          return NextResponse.json({
            success: true,
            message: 'Rate limit block removed successfully'
          });
        } else {
          return NextResponse.json(
            { error: 'Failed to remove rate limit block' },
            { status: 500 }
          );
        }

      case 'reset':
        const { identifier: resetIdentifier, identifierType: resetType, endpoint: resetEndpoint } = body;

        if (!resetIdentifier || !resetType) {
          return NextResponse.json(
            { error: 'Missing required fields: identifier, identifierType' },
            { status: 400 }
          );
        }

        const resetSuccess = await resetRateLimit(resetIdentifier, resetType, resetEndpoint);

        if (resetSuccess) {
          return NextResponse.json({
            success: true,
            message: 'Rate limit reset successfully'
          });
        } else {
          return NextResponse.json(
            { error: 'Failed to reset rate limit' },
            { status: 500 }
          );
        }

      case 'cleanup':
        const { daysOld = 7 } = body;
        const deletedCount = await cleanupOldRateLimitData(daysOld);

        return NextResponse.json({
          success: true,
          message: `Cleaned up ${deletedCount} old rate limit records`,
          deletedCount
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in rate limits admin POST:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!(await isAdmin(userId))) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { rules } = body;

    if (!Array.isArray(rules)) {
      return NextResponse.json(
        { error: 'Invalid request body: rules must be an array' },
        { status: 400 }
      );
    }

    // Bulk update rules
    const results = await Promise.all(
      rules.map(rule => upsertRateLimitRule(rule))
    );

    const successCount = results.filter(Boolean).length;
    const failureCount = results.length - successCount;

    return NextResponse.json({
      success: failureCount === 0,
      message: `Updated ${successCount} rules successfully${failureCount > 0 ? `, ${failureCount} failed` : ''}`,
      successCount,
      failureCount
    });
  } catch (error) {
    console.error('Error in rate limits bulk update:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
