// Queue Status API Route - Get status of queue items

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { withRateLimit } from '@/lib/middleware/rate-limit';
import { GenerationQueueService } from '@/lib/services/generation-queue';
import { StatusUpdateService } from '@/lib/services/status-updates';

export const GET = withRateLimit('/api/queue/status', async (request: NextRequest) => {
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
    const status = searchParams.get('status');

    if (queueId) {
      // Get specific queue item
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

      // Get recent status updates
      const recentUpdates = await StatusUpdateService.getRecentUpdates(queueId, 5);

      return NextResponse.json({
        queueItem,
        recentUpdates
      });
    } else {
      // Get user's queue items
      const queueItems = await GenerationQueueService.getUserQueueItems(
        userId, 
        status as any
      );

      return NextResponse.json({
        queueItems,
        total: queueItems.length
      });
    }
  } catch (error) {
    console.error('Error in queue status API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
})

export const POST = withRateLimit('/api/queue/status', async (request: NextRequest) => {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { type, model, parameters, priority } = body;

    if (!type || !model || !parameters) {
      return NextResponse.json(
        { error: 'Missing required fields: type, model, parameters' },
        { status: 400 }
      );
    }

    // Add to queue
    const queueResponse = await GenerationQueueService.addToQueue({
      type,
      model,
      parameters,
      userId,
      priority: priority || 'normal'
    });

    return NextResponse.json(queueResponse);
  } catch (error) {
    console.error('Error adding to queue:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
})
