// Status Update Service - Real-time status updates for queue system

import { createServiceRoleClient } from '@/lib/supabase/server';
import { StatusUpdate, QueueEvent, QueueStatus } from '@/lib/types/queue-types';

export class StatusUpdateService {
  private static subscribers = new Map<string, Set<(update: StatusUpdate) => void>>();
  private static userSubscribers = new Map<string, Set<(update: StatusUpdate) => void>>();

  /**
   * Subscribe to status updates for a specific queue item
   */
  static subscribe(queueId: string, callback: (update: StatusUpdate) => void): () => void {
    if (!this.subscribers.has(queueId)) {
      this.subscribers.set(queueId, new Set());
    }
    
    this.subscribers.get(queueId)!.add(callback);
    
    // Return unsubscribe function
    return () => {
      const callbacks = this.subscribers.get(queueId);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.subscribers.delete(queueId);
        }
      }
    };
  }

  /**
   * Subscribe to all status updates for a user
   */
  static subscribeToUser(userId: string, callback: (update: StatusUpdate) => void): () => void {
    if (!this.userSubscribers.has(userId)) {
      this.userSubscribers.set(userId, new Set());
    }
    
    this.userSubscribers.get(userId)!.add(callback);
    
    // Return unsubscribe function
    return () => {
      const callbacks = this.userSubscribers.get(userId);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.userSubscribers.delete(userId);
        }
      }
    };
  }

  /**
   * Broadcast status update to subscribers
   */
  static async broadcastUpdate(update: StatusUpdate): Promise<void> {
    // Broadcast to queue-specific subscribers
    const queueSubscribers = this.subscribers.get(update.queueId);
    if (queueSubscribers) {
      queueSubscribers.forEach(callback => {
        try {
          callback(update);
        } catch (error) {
          console.error('Error in status update callback:', error);
        }
      });
    }

    // Broadcast to user subscribers (need to get userId from queue item)
    const userId = await this.getUserIdFromQueueId(update.queueId);
    if (userId) {
      const userSubscribers = this.userSubscribers.get(userId);
      if (userSubscribers) {
        userSubscribers.forEach(callback => {
          try {
            callback(update);
          } catch (error) {
            console.error('Error in user status update callback:', error);
          }
        });
      }
    }

    // Store update in database for persistence
    await this.storeUpdate(update);

    // Broadcast via Supabase Realtime (if configured)
    await this.broadcastViaSupabase(update);

    console.log(`📡 Broadcasted status update for ${update.queueId}: ${update.status}`);
  }

  /**
   * Create and broadcast status update
   */
  static async createAndBroadcast(
    queueId: string,
    status: QueueStatus,
    options: {
      position?: number;
      estimatedWaitSeconds?: number;
      modelUsed?: string;
      progress?: number;
      result?: any;
      error?: string;
    } = {}
  ): Promise<void> {
    const update: StatusUpdate = {
      queueId,
      status,
      position: options.position,
      estimatedWaitSeconds: options.estimatedWaitSeconds,
      modelUsed: options.modelUsed,
      progress: options.progress,
      result: options.result,
      error: options.error,
      timestamp: new Date().toISOString()
    };

    await this.broadcastUpdate(update);
  }

  /**
   * Get recent status updates for a queue item
   */
  static async getRecentUpdates(queueId: string, limit: number = 10): Promise<StatusUpdate[]> {
    try {
      const supabase = createServiceRoleClient();
      
      const { data, error } = await supabase
        .from('queue_status_updates')
        .select('*')
        .eq('queue_id', queueId)
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Failed to get recent updates:', error);
        return [];
      }

      return data?.map(item => ({
        queueId: item.queue_id,
        status: item.status as QueueStatus,
        position: item.position,
        estimatedWaitSeconds: item.estimated_wait_seconds,
        modelUsed: item.model_used,
        progress: item.progress,
        result: item.result,
        error: item.error,
        timestamp: item.timestamp
      })) || [];
    } catch (error) {
      console.error('Error getting recent updates:', error);
      return [];
    }
  }

  /**
   * Get latest status for a queue item
   */
  static async getLatestStatus(queueId: string): Promise<StatusUpdate | null> {
    const updates = await this.getRecentUpdates(queueId, 1);
    return updates.length > 0 ? updates[0] : null;
  }

  /**
   * Broadcast queue position updates for all queued items
   */
  static async broadcastQueuePositionUpdates(): Promise<void> {
    try {
      const supabase = createServiceRoleClient();
      
      // Get all queued items
      const { data: queuedItems, error } = await supabase
        .from('generation_queue')
        .select('id, user_id, priority, created_at')
        .eq('status', 'queued')
        .order('created_at', { ascending: true });

      if (error || !queuedItems) {
        console.error('Failed to get queued items for position updates:', error);
        return;
      }

      // Calculate positions and broadcast updates
      const priorityOrder = { high: 3, normal: 2, low: 1 };
      
      // Sort by priority then by creation time
      queuedItems.sort((a, b) => {
        const priorityDiff = (priorityOrder[b.priority as keyof typeof priorityOrder] || 1) - 
                           (priorityOrder[a.priority as keyof typeof priorityOrder] || 1);
        if (priorityDiff !== 0) return priorityDiff;
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      });

      // Broadcast position updates
      for (let i = 0; i < queuedItems.length; i++) {
        const item = queuedItems[i];
        const position = i + 1;
        
        await this.createAndBroadcast(item.id, 'queued', {
          position,
          estimatedWaitSeconds: this.estimateWaitTime(position)
        });
      }

      console.log(`📊 Broadcasted position updates for ${queuedItems.length} queued items`);
    } catch (error) {
      console.error('Error broadcasting queue position updates:', error);
    }
  }

  /**
   * Create queue event
   */
  static async createQueueEvent(
    type: QueueEvent['type'],
    queueId: string,
    userId: string,
    data: any
  ): Promise<void> {
    const event: QueueEvent = {
      type,
      queueId,
      userId,
      data,
      timestamp: new Date()
    };

    // Store event in database
    await this.storeEvent(event);

    // Broadcast event to subscribers
    const update: StatusUpdate = {
      queueId,
      status: type === 'queued' ? 'queued' : 
              type === 'processing' ? 'processing' :
              type === 'completed' ? 'completed' :
              type === 'failed' ? 'failed' : 'cancelled',
      timestamp: event.timestamp.toISOString(),
      ...data
    };

    await this.broadcastUpdate(update);
  }

  /**
   * Get subscriber count
   */
  static getSubscriberCount(): { total: number; byQueue: number; byUser: number } {
    let totalQueueSubscribers = 0;
    this.subscribers.forEach(callbacks => {
      totalQueueSubscribers += callbacks.size;
    });

    let totalUserSubscribers = 0;
    this.userSubscribers.forEach(callbacks => {
      totalUserSubscribers += callbacks.size;
    });

    return {
      total: totalQueueSubscribers + totalUserSubscribers,
      byQueue: totalQueueSubscribers,
      byUser: totalUserSubscribers
    };
  }

  /**
   * Clear all subscribers (for cleanup)
   */
  static clearAllSubscribers(): void {
    this.subscribers.clear();
    this.userSubscribers.clear();
    console.log('🧹 Cleared all status update subscribers');
  }

  /**
   * Get user ID from queue ID
   */
  private static async getUserIdFromQueueId(queueId: string): Promise<string | null> {
    try {
      const supabase = createServiceRoleClient();
      
      const { data, error } = await supabase
        .from('generation_queue')
        .select('user_id')
        .eq('id', queueId)
        .single();

      if (error || !data) {
        return null;
      }

      return data.user_id;
    } catch (error) {
      console.error('Error getting user ID from queue ID:', error);
      return null;
    }
  }

  /**
   * Store status update in database
   */
  private static async storeUpdate(update: StatusUpdate): Promise<void> {
    try {
      const supabase = createServiceRoleClient();
      
      const { error } = await supabase
        .from('queue_status_updates')
        .insert({
          queue_id: update.queueId,
          status: update.status,
          position: update.position,
          estimated_wait_seconds: update.estimatedWaitSeconds,
          model_used: update.modelUsed,
          progress: update.progress,
          result: update.result,
          error: update.error,
          timestamp: update.timestamp
        });

      if (error) {
        console.error('Failed to store status update:', error);
      }
    } catch (error) {
      console.error('Error storing status update:', error);
    }
  }

  /**
   * Store queue event in database
   */
  private static async storeEvent(event: QueueEvent): Promise<void> {
    try {
      const supabase = createServiceRoleClient();
      
      const { error } = await supabase
        .from('queue_events')
        .insert({
          type: event.type,
          queue_id: event.queueId,
          user_id: event.userId,
          data: event.data,
          timestamp: event.timestamp.toISOString()
        });

      if (error) {
        console.error('Failed to store queue event:', error);
      }
    } catch (error) {
      console.error('Error storing queue event:', error);
    }
  }

  /**
   * Broadcast via Supabase Realtime
   */
  private static async broadcastViaSupabase(update: StatusUpdate): Promise<void> {
    try {
      const supabase = createServiceRoleClient();
      
      // Broadcast to queue-specific channel
      const queueChannel = supabase.channel(`queue_${update.queueId}`);
      await queueChannel.send({
        type: 'broadcast',
        event: 'status_update',
        payload: update
      });

      // Broadcast to user channel (if we have user ID)
      const userId = await this.getUserIdFromQueueId(update.queueId);
      if (userId) {
        const userChannel = supabase.channel(`user_${userId}`);
        await userChannel.send({
          type: 'broadcast',
          event: 'queue_update',
          payload: update
        });
      }
    } catch (error) {
      console.error('Error broadcasting via Supabase:', error);
    }
  }

  /**
   * Estimate wait time based on position
   */
  private static estimateWaitTime(position: number): number {
    // Simple estimation - would be more sophisticated in production
    const avgProcessingTime = 60; // 60 seconds average
    const concurrentCapacity = 10; // Assume 10 concurrent processing slots
    
    return Math.max(30, Math.ceil((position * avgProcessingTime) / concurrentCapacity));
  }
}
