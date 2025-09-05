// Queue Cancel API Route - Cancel queue items

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { GenerationQueueService } from '@/lib/services/generation-queue';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { queueId } = body;

    if (!queueId) {
      return NextResponse.json(
        { error: 'Missing queueId' },
        { status: 400 }
      );
    }

    // Cancel the queue item
    const success = await GenerationQueueService.cancelQueueItem(queueId, userId);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to cancel queue item or item not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Queue item cancelled successfully'
    });
  } catch (error) {
    console.error('Error cancelling queue item:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
