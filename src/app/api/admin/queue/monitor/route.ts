// Admin Queue Monitor API Route - Comprehensive queue monitoring for administrators

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { GenerationQueueService } from '@/lib/services/generation-queue';
import { ModelCapacityManager } from '@/lib/services/model-capacity';
import { ModelLoadBalancer } from '@/lib/services/model-load-balancer';
import { queueProcessor } from '@/lib/services/queue-processor';
import { StatusUpdateService } from '@/lib/services/status-updates';

// Check if user is admin (you'll need to implement this based on your auth system)
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

    // Check admin permissions
    if (!(await isAdmin(userId))) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const section = searchParams.get('section') || 'overview';

    switch (section) {
      case 'overview':
        return NextResponse.json(await getOverviewData());
      
      case 'queue':
        return NextResponse.json(await getQueueData());
      
      case 'models':
        return NextResponse.json(await getModelData());
      
      case 'processor':
        return NextResponse.json(await getProcessorData());
      
      case 'health':
        return NextResponse.json(await getHealthData());
      
      default:
        return NextResponse.json(
          { error: 'Invalid section parameter' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in admin queue monitor API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function getOverviewData() {
  const queueStats = GenerationQueueService.getQueueStats();
  const capacityStats = ModelCapacityManager.getCapacityStats();
  const processorMetrics = queueProcessor.getMetrics();
  const subscriberCount = StatusUpdateService.getSubscriberCount();

  // Calculate total capacity utilization
  let totalCapacity = 0;
  let totalUsed = 0;
  
  Object.values(capacityStats).forEach(capacity => {
    totalCapacity += capacity.maxConcurrent;
    totalUsed += capacity.currentUsage;
  });

  const overallUtilization = totalCapacity > 0 ? (totalUsed / totalCapacity) * 100 : 0;

  return {
    timestamp: new Date().toISOString(),
    queue: {
      total: queueStats.total,
      queued: queueStats.queued,
      processing: queueStats.processing,
      byPriority: queueStats.byPriority,
      byType: queueStats.byType
    },
    capacity: {
      totalModels: Object.keys(capacityStats).length,
      totalCapacity,
      totalUsed,
      utilizationPercentage: overallUtilization,
      availableSlots: totalCapacity - totalUsed
    },
    processor: {
      isRunning: processorMetrics.isRunning,
      totalProcessed: processorMetrics.totalProcessed,
      successRate: processorMetrics.successRate,
      uptime: processorMetrics.uptime
    },
    realtime: {
      totalSubscribers: subscriberCount.total,
      queueSubscribers: subscriberCount.byQueue,
      userSubscribers: subscriberCount.byUser
    }
  };
}

async function getQueueData() {
  const queueStats = GenerationQueueService.getQueueStats();
  
  // Get recent queue items (last 50)
  // This would need to be implemented in GenerationQueueService
  const recentItems = []; // Placeholder
  
  return {
    stats: queueStats,
    recentItems,
    trends: {
      // This would include historical data for trends
      hourlyVolume: [],
      successRates: [],
      avgWaitTimes: []
    }
  };
}

async function getModelData() {
  const capacityStats = ModelCapacityManager.getCapacityStats();
  const loadBalancingRecommendations = ModelLoadBalancer.getLoadBalancingRecommendations('image');
  
  // Transform capacity stats for better presentation
  const modelMetrics = Object.entries(capacityStats).map(([modelId, capacity]) => ({
    modelId,
    name: modelId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    type: capacity.generationType,
    provider: capacity.provider,
    capacity: {
      max: capacity.maxConcurrent,
      current: capacity.currentUsage,
      available: capacity.maxConcurrent - capacity.currentUsage,
      utilizationPercentage: (capacity.currentUsage / capacity.maxConcurrent) * 100
    },
    performance: {
      avgProcessingTime: capacity.avgProcessingTimeSeconds,
      successRate: capacity.successRate * 100,
      errorRate: capacity.errorRate * 100,
      totalRequests: capacity.totalRequests
    },
    lastUpdated: capacity.lastUpdated
  }));

  return {
    models: modelMetrics,
    loadBalancing: loadBalancingRecommendations,
    alternatives: ModelLoadBalancer.getAllAlternatives()
  };
}

async function getProcessorData() {
  const metrics = queueProcessor.getMetrics();
  const config = queueProcessor.getConfig();
  const healthStatus = queueProcessor.getHealthStatus();

  return {
    metrics,
    config,
    health: healthStatus,
    systemInfo: {
      memoryUsage: process.memoryUsage(),
      uptime: process.uptime(),
      nodeVersion: process.version,
      platform: process.platform
    }
  };
}

async function getHealthData() {
  const queueHealth = queueProcessor.getHealthStatus();
  const capacityStats = ModelCapacityManager.getCapacityStats();
  
  // Check for overloaded models
  const overloadedModels = Object.entries(capacityStats)
    .filter(([, capacity]) => (capacity.currentUsage / capacity.maxConcurrent) >= 0.9)
    .map(([modelId]) => modelId);

  // Check for models with high error rates
  const problematicModels = Object.entries(capacityStats)
    .filter(([, capacity]) => capacity.errorRate > 0.1) // More than 10% error rate
    .map(([modelId, capacity]) => ({ modelId, errorRate: capacity.errorRate }));

  // Overall system health
  let overallHealth: 'healthy' | 'warning' | 'critical' = 'healthy';
  const issues: string[] = [];
  const recommendations: string[] = [];

  if (queueHealth.status === 'critical') {
    overallHealth = 'critical';
  } else if (queueHealth.status === 'warning' && overallHealth !== 'critical') {
    overallHealth = 'warning';
  }

  issues.push(...queueHealth.issues);
  recommendations.push(...queueHealth.recommendations);

  if (overloadedModels.length > 0) {
    issues.push(`${overloadedModels.length} models are overloaded`);
    recommendations.push('Consider scaling up capacity or implementing better load balancing');
    if (overallHealth === 'healthy') overallHealth = 'warning';
  }

  if (problematicModels.length > 0) {
    issues.push(`${problematicModels.length} models have high error rates`);
    recommendations.push('Check model health and error logs');
    if (overallHealth === 'healthy') overallHealth = 'warning';
  }

  return {
    overall: {
      status: overallHealth,
      issues,
      recommendations
    },
    queue: queueHealth,
    models: {
      overloaded: overloadedModels,
      problematic: problematicModels,
      total: Object.keys(capacityStats).length
    },
    alerts: [
      // This would include active alerts/notifications
    ]
  };
}

// POST endpoint for admin actions
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
    const { action, parameters } = body;

    switch (action) {
      case 'force_process':
        await queueProcessor.forceProcess();
        return NextResponse.json({ success: true, message: 'Forced queue processing' });
      
      case 'clear_old_items':
        const daysOld = parameters?.daysOld || 7;
        const cleared = await GenerationQueueService.clearOldItems(daysOld);
        return NextResponse.json({ success: true, message: `Cleared ${cleared} old items` });
      
      case 'sync_capacity':
        await ModelCapacityManager.syncFromDatabase();
        return NextResponse.json({ success: true, message: 'Synced model capacity from database' });
      
      case 'reset_metrics':
        queueProcessor.resetMetrics();
        return NextResponse.json({ success: true, message: 'Reset processor metrics' });
      
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in admin action:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
