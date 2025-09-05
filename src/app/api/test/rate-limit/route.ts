/**
 * Rate Limit Testing API Route
 * 
 * Provides endpoints for testing the rate limiting system functionality.
 * Used for validating rate limits, violations, and administrative functions.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { withRateLimit, checkRateLimit } from '@/lib/middleware/rate-limit';
import { 
  getRateLimitStats, 
  getRateLimitStatus,
  removeRateLimitBlock,
  resetRateLimit 
} from '@/lib/services/rate-limit-service';

// Test endpoint with rate limiting applied
export const POST = withRateLimit('/api/test/rate-limit', async (request: NextRequest) => {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action, testData } = body;

    switch (action) {
      case 'test_limit':
        // Simple test to trigger rate limiting
        return NextResponse.json({
          success: true,
          message: 'Rate limit test successful',
          timestamp: new Date().toISOString(),
          userId,
          testData
        });

      case 'check_status':
        const { identifier, identifierType, endpoint } = testData || {};
        
        if (!identifier || !identifierType || !endpoint) {
          return NextResponse.json(
            { error: 'Missing required test data: identifier, identifierType, endpoint' },
            { status: 400 }
          );
        }

        const status = await getRateLimitStatus(identifier, identifierType, endpoint);
        return NextResponse.json({
          success: true,
          status,
          timestamp: new Date().toISOString()
        });

      case 'get_stats':
        const timeframe = testData?.timeframe || 'hour';
        const stats = await getRateLimitStats(timeframe);
        return NextResponse.json({
          success: true,
          stats,
          timeframe,
          timestamp: new Date().toISOString()
        });

      case 'simulate_burst':
        // Simulate burst requests for testing
        const burstCount = testData?.count || 5;
        const results = [];
        
        for (let i = 0; i < burstCount; i++) {
          const result = await checkRateLimit(request, '/api/test/rate-limit');
          results.push({
            attempt: i + 1,
            allowed: result.allowed,
            remaining: result.remaining,
            limit: result.limit
          });
          
          // Small delay between requests
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        return NextResponse.json({
          success: true,
          message: `Simulated ${burstCount} burst requests`,
          results,
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json(
          { error: 'Invalid test action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in rate limit test:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

// GET endpoint for basic rate limit information (no rate limiting applied)
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'check_current':
        // Check current rate limit status without consuming a request
        const result = await checkRateLimit(request, '/api/test/rate-limit');
        return NextResponse.json({
          success: true,
          rateLimitInfo: {
            allowed: result.allowed,
            limit: result.limit,
            remaining: result.remaining,
            resetTime: result.resetTime,
            userTier: result.userTier,
            endpoint: result.endpoint
          },
          timestamp: new Date().toISOString()
        });

      case 'stats':
        const timeframe = searchParams.get('timeframe') as 'hour' | 'day' | 'week' || 'hour';
        const stats = await getRateLimitStats(timeframe);
        return NextResponse.json({
          success: true,
          stats,
          timeframe,
          timestamp: new Date().toISOString()
        });

      case 'help':
        return NextResponse.json({
          success: true,
          message: 'Rate Limit Testing API',
          endpoints: {
            'POST /api/test/rate-limit': {
              description: 'Test rate limiting functionality',
              actions: [
                'test_limit - Simple rate limit test',
                'check_status - Check rate limit status for identifier',
                'get_stats - Get rate limiting statistics',
                'simulate_burst - Simulate burst requests'
              ]
            },
            'GET /api/test/rate-limit': {
              description: 'Get rate limit information',
              actions: [
                'check_current - Check current rate limit status',
                'stats - Get rate limiting statistics',
                'help - Show this help message'
              ]
            }
          },
          examples: {
            testLimit: {
              method: 'POST',
              body: { action: 'test_limit', testData: { message: 'test' } }
            },
            checkStatus: {
              method: 'POST',
              body: {
                action: 'check_status',
                testData: {
                  identifier: 'user_123',
                  identifierType: 'user',
                  endpoint: '/api/test/rate-limit'
                }
              }
            },
            simulateBurst: {
              method: 'POST',
              body: { action: 'simulate_burst', testData: { count: 10 } }
            }
          },
          timestamp: new Date().toISOString()
        });

      default:
        // Default: show current rate limit status
        const defaultResult = await checkRateLimit(request, '/api/test/rate-limit');
        return NextResponse.json({
          success: true,
          message: 'Rate Limit Test API - Use ?action=help for more information',
          currentStatus: {
            allowed: defaultResult.allowed,
            limit: defaultResult.limit,
            remaining: defaultResult.remaining,
            resetTime: defaultResult.resetTime,
            userTier: defaultResult.userTier
          },
          timestamp: new Date().toISOString()
        });
    }
  } catch (error) {
    console.error('Error in rate limit test GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT endpoint for admin testing functions
export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action, testData } = body;

    switch (action) {
      case 'unblock':
        const { identifier, identifierType, endpoint } = testData || {};
        
        if (!identifier || !identifierType) {
          return NextResponse.json(
            { error: 'Missing required test data: identifier, identifierType' },
            { status: 400 }
          );
        }

        const unblockSuccess = await removeRateLimitBlock(identifier, identifierType, endpoint);
        return NextResponse.json({
          success: unblockSuccess,
          message: unblockSuccess ? 'Rate limit block removed' : 'Failed to remove block',
          timestamp: new Date().toISOString()
        });

      case 'reset':
        const { identifier: resetId, identifierType: resetType, endpoint: resetEndpoint } = testData || {};
        
        if (!resetId || !resetType) {
          return NextResponse.json(
            { error: 'Missing required test data: identifier, identifierType' },
            { status: 400 }
          );
        }

        const resetSuccess = await resetRateLimit(resetId, resetType, resetEndpoint);
        return NextResponse.json({
          success: resetSuccess,
          message: resetSuccess ? 'Rate limit reset successfully' : 'Failed to reset rate limit',
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json(
          { error: 'Invalid admin action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in rate limit admin test:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
