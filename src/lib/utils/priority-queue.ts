// Priority Queue implementation for AI generation queue system

export interface PriorityQueueItem<T> {
  item: T;
  priority: number;
  timestamp: number;
}

export class PriorityQueue<T> {
  private heap: PriorityQueueItem<T>[] = [];

  constructor() {
    this.heap = [];
  }

  /**
   * Add item to queue with priority
   */
  enqueue(item: T, priority: number): void {
    const queueItem: PriorityQueueItem<T> = {
      item,
      priority,
      timestamp: Date.now()
    };

    this.heap.push(queueItem);
    this.heapifyUp(this.heap.length - 1);
  }

  /**
   * Remove and return highest priority item
   */
  dequeue(): T | null {
    if (this.isEmpty()) {
      return null;
    }

    if (this.heap.length === 1) {
      const item = this.heap.pop();
      return item ? item.item : null;
    }

    const root = this.heap[0];
    const lastItem = this.heap.pop()!;
    this.heap[0] = lastItem;
    this.heapifyDown(0);

    return root.item;
  }

  /**
   * Peek at highest priority item without removing
   */
  peek(): T | null {
    if (this.isEmpty()) {
      return null;
    }
    return this.heap[0].item;
  }

  /**
   * Check if queue is empty
   */
  isEmpty(): boolean {
    return this.heap.length === 0;
  }

  /**
   * Get queue size
   */
  size(): number {
    return this.heap.length;
  }

  /**
   * Clear all items from queue
   */
  clear(): void {
    this.heap = [];
  }

  /**
   * Get all items as array (for debugging)
   */
  toArray(): T[] {
    return this.heap
      .sort((a, b) => {
        // Sort by priority first, then by timestamp (FIFO for same priority)
        if (a.priority !== b.priority) {
          return b.priority - a.priority; // Higher priority first
        }
        return a.timestamp - b.timestamp; // Earlier timestamp first
      })
      .map(item => item.item);
  }

  /**
   * Find and remove specific item
   */
  remove(predicate: (item: T) => boolean): T | null {
    const index = this.heap.findIndex(queueItem => predicate(queueItem.item));
    
    if (index === -1) {
      return null;
    }

    const removedItem = this.heap[index];
    
    // Replace with last item and re-heapify
    const lastItem = this.heap.pop()!;
    
    if (index < this.heap.length) {
      this.heap[index] = lastItem;
      
      // Re-heapify both up and down to maintain heap property
      this.heapifyUp(index);
      this.heapifyDown(index);
    }

    return removedItem.item;
  }

  /**
   * Update priority of existing item
   */
  updatePriority(predicate: (item: T) => boolean, newPriority: number): boolean {
    const index = this.heap.findIndex(queueItem => predicate(queueItem.item));
    
    if (index === -1) {
      return false;
    }

    const oldPriority = this.heap[index].priority;
    this.heap[index].priority = newPriority;

    // Re-heapify based on priority change
    if (newPriority > oldPriority) {
      this.heapifyUp(index);
    } else if (newPriority < oldPriority) {
      this.heapifyDown(index);
    }

    return true;
  }

  /**
   * Get items by priority level
   */
  getItemsByPriority(priority: number): T[] {
    return this.heap
      .filter(queueItem => queueItem.priority === priority)
      .sort((a, b) => a.timestamp - b.timestamp) // FIFO for same priority
      .map(queueItem => queueItem.item);
  }

  /**
   * Get queue statistics
   */
  getStats(): {
    total: number;
    byPriority: Record<number, number>;
    oldestTimestamp: number;
    newestTimestamp: number;
  } {
    const stats = {
      total: this.heap.length,
      byPriority: {} as Record<number, number>,
      oldestTimestamp: this.heap.length > 0 ? Math.min(...this.heap.map(item => item.timestamp)) : 0,
      newestTimestamp: this.heap.length > 0 ? Math.max(...this.heap.map(item => item.timestamp)) : 0
    };

    // Count items by priority
    this.heap.forEach(item => {
      stats.byPriority[item.priority] = (stats.byPriority[item.priority] || 0) + 1;
    });

    return stats;
  }

  /**
   * Heapify up (bubble up)
   */
  private heapifyUp(index: number): void {
    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2);
      
      if (!this.shouldSwap(index, parentIndex)) {
        break;
      }

      this.swap(index, parentIndex);
      index = parentIndex;
    }
  }

  /**
   * Heapify down (bubble down)
   */
  private heapifyDown(index: number): void {
    while (true) {
      let maxIndex = index;
      const leftChild = 2 * index + 1;
      const rightChild = 2 * index + 2;

      if (leftChild < this.heap.length && this.shouldSwap(leftChild, maxIndex)) {
        maxIndex = leftChild;
      }

      if (rightChild < this.heap.length && this.shouldSwap(rightChild, maxIndex)) {
        maxIndex = rightChild;
      }

      if (maxIndex === index) {
        break;
      }

      this.swap(index, maxIndex);
      index = maxIndex;
    }
  }

  /**
   * Determine if two items should be swapped
   */
  private shouldSwap(childIndex: number, parentIndex: number): boolean {
    const child = this.heap[childIndex];
    const parent = this.heap[parentIndex];

    // Higher priority wins
    if (child.priority !== parent.priority) {
      return child.priority > parent.priority;
    }

    // For same priority, earlier timestamp wins (FIFO)
    return child.timestamp < parent.timestamp;
  }

  /**
   * Swap two items in heap
   */
  private swap(i: number, j: number): void {
    [this.heap[i], this.heap[j]] = [this.heap[j], this.heap[i]];
  }
}

/**
 * Multi-level priority queue for different priority levels
 */
export class MultiLevelPriorityQueue<T> {
  private queues: Map<number, PriorityQueue<T>> = new Map();
  private priorities: number[] = [];

  constructor(priorities: number[] = [3, 2, 1]) {
    this.priorities = priorities.sort((a, b) => b - a); // Highest first
    this.priorities.forEach(priority => {
      this.queues.set(priority, new PriorityQueue<T>());
    });
  }

  /**
   * Add item to appropriate priority queue
   */
  enqueue(item: T, priority: number): void {
    // Find the closest priority level
    const actualPriority = this.priorities.find(p => p <= priority) || this.priorities[this.priorities.length - 1];
    const queue = this.queues.get(actualPriority);
    
    if (queue) {
      queue.enqueue(item, priority);
    }
  }

  /**
   * Dequeue from highest priority non-empty queue
   */
  dequeue(): T | null {
    for (const priority of this.priorities) {
      const queue = this.queues.get(priority);
      if (queue && !queue.isEmpty()) {
        return queue.dequeue();
      }
    }
    return null;
  }

  /**
   * Peek at next item to be dequeued
   */
  peek(): T | null {
    for (const priority of this.priorities) {
      const queue = this.queues.get(priority);
      if (queue && !queue.isEmpty()) {
        return queue.peek();
      }
    }
    return null;
  }

  /**
   * Check if all queues are empty
   */
  isEmpty(): boolean {
    return Array.from(this.queues.values()).every(queue => queue.isEmpty());
  }

  /**
   * Get total size across all queues
   */
  size(): number {
    return Array.from(this.queues.values()).reduce((total, queue) => total + queue.size(), 0);
  }

  /**
   * Get size by priority level
   */
  sizeByPriority(): Record<number, number> {
    const sizes: Record<number, number> = {};
    this.queues.forEach((queue, priority) => {
      sizes[priority] = queue.size();
    });
    return sizes;
  }

  /**
   * Clear all queues
   */
  clear(): void {
    this.queues.forEach(queue => queue.clear());
  }

  /**
   * Remove item from any queue
   */
  remove(predicate: (item: T) => boolean): T | null {
    for (const priority of this.priorities) {
      const queue = this.queues.get(priority);
      if (queue) {
        const removed = queue.remove(predicate);
        if (removed) {
          return removed;
        }
      }
    }
    return null;
  }

  /**
   * Get comprehensive statistics
   */
  getStats(): {
    total: number;
    byPriority: Record<number, number>;
    oldestItem: number;
    newestItem: number;
  } {
    let total = 0;
    const byPriority: Record<number, number> = {};
    let oldestItem = Infinity;
    let newestItem = 0;

    this.queues.forEach((queue, priority) => {
      const queueStats = queue.getStats();
      total += queueStats.total;
      byPriority[priority] = queueStats.total;
      
      if (queueStats.total > 0) {
        oldestItem = Math.min(oldestItem, queueStats.oldestTimestamp);
        newestItem = Math.max(newestItem, queueStats.newestTimestamp);
      }
    });

    return {
      total,
      byPriority,
      oldestItem: oldestItem === Infinity ? 0 : oldestItem,
      newestItem
    };
  }
}
