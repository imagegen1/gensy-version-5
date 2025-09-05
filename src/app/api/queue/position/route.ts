// Queue Position API Route - Get current queue position and wait time

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { GenerationQueueService } from '@/lib/services/generation-queue';
import { ModelCapacityManager } from '@/lib/services/model-capacity';

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
    const queueId = searchParams.get('queueId');

    if (!queueId) {
      return NextResponse.json(
        { error: 'Missing queueId parameter' },
        { status: 400 }
      );
    }

    // Get queue item
    const queueItem = await GenerationQueueService.getQueueItem(queueId);
    
    if (!queueItem) {
      return NextResponse.json(
        { error: 'Queue item not found' },
        { status: 404 }
      );
    }

    // Check if user owns this queue item
    if (queueItem.userId !== userId) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // If item is not queued, return current status
    if (queueItem.status !== 'queued') {
      return NextResponse.json({
        queueId: queueItem.id,
        status: queueItem.status,
        position: null,
        estimatedWaitSeconds: null,
        modelRequested: queueItem.modelRequested,
        modelUsed: queueItem.modelUsed,
        generationType: queueItem.generationType,
        startedAt: queueItem.startedAt,
        completedAt: queueItem.completedAt,
        resultData: queueItem.resultData,
        errorMessage: queueItem.errorMessage
      });
    }

    // Calculate current position and wait time for queued items
    const stats = GenerationQueueService.getQueueStats();
    const modelInfo = ModelCapacityManager.getModelInfo(queueItem.modelRequested);
    
    // Estimate position based on priority and creation time
    // This is a simplified calculation - in production you'd want more sophisticated logic
    let position = 1;
    
    if (queueItem.priority === 'low') {
      position += stats.byPriority.high + stats.byPriority.normal;
    } else if (queueItem.priority === 'normal') {
      position += stats.byPriority.high;
    }

    // Estimate wait time
    let estimatedWaitSeconds = 300; // Default 5 minutes
    
    if (modelInfo) {
      const avgProcessingTime = modelInfo.avgProcessingTimeSeconds;
      const maxConcurrent = modelInfo.maxConcurrent;
      estimatedWaitSeconds = Math.ceil((position * avgProcessingTime) / maxConcurrent);
      estimatedWaitSeconds = Math.max(estimatedWaitSeconds, 30); // Minimum 30 seconds
    }

    return NextResponse.json({
      queueId: queueItem.id,
      status: queueItem.status,
      position,
      estimatedWaitSeconds,
      modelRequested: queueItem.modelRequested,
      generationType: queueItem.generationType,
      priority: queueItem.priority,
      createdAt: queueItem.createdAt,
      queueStats: {
        total: stats.total,
        byPriority: stats.byPriority,
        processing: stats.processing
      },
      modelCapacity: modelInfo ? {
        maxConcurrent: modelInfo.maxConcurrent,
        currentUsage: modelInfo.currentUsage,
        avgProcessingTime: modelInfo.avgProcessingTimeSeconds
      } : null
    });
  } catch (error) {
    console.error('Error getting queue position:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
