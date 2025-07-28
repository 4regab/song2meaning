/**
 * Performance Optimization and Caching Strategies
 * Implements advanced caching, request optimization, and performance monitoring
 */

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
}

export interface CacheStats {
  size: number;
  hitRate: number;
  totalRequests: number;
  totalHits: number;
  totalMisses: number;
  averageResponseTime: number;
}

export interface PerformanceMetrics {
  requestCount: number;
  averageResponseTime: number;
  errorRate: number;
  cacheHitRate: number;
  lastUpdated: number;
}

/**
 * Advanced LRU Cache with TTL and statistics
 */
class AdvancedCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private stats = {
    totalRequests: 0,
    totalHits: 0,
    totalMisses: 0,
    responseTimes: [] as number[]
  };

  constructor(
    private maxSize = 100,
    private defaultTTL = 1800000 // 30 minutes
  ) {}

  set(key: string, value: T, ttl = this.defaultTTL): void {
    // Remove expired entries if cache is full
    if (this.cache.size >= this.maxSize) {
      this.evictExpired();
      
      // If still full, remove least recently used
      if (this.cache.size >= this.maxSize) {
        this.evictLRU();
      }
    }

    this.cache.set(key, {
      data: value,
      timestamp: Date.now(),
      ttl,
      accessCount: 0,
      lastAccessed: Date.now()
    });
  }

  get(key: string): T | null {
    this.stats.totalRequests++;
    const startTime = Date.now();

    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.totalMisses++;
      return null;
    }

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.stats.totalMisses++;
      return null;
    }

    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = Date.now();
    this.stats.totalHits++;
    
    const responseTime = Date.now() - startTime;
    this.stats.responseTimes.push(responseTime);
    
    // Keep only last 1000 response times for average calculation
    if (this.stats.responseTimes.length > 1000) {
      this.stats.responseTimes = this.stats.responseTimes.slice(-1000);
    }

    return entry.data;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
    this.resetStats();
  }

  private evictExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  private evictLRU(): void {
    let oldestKey = '';
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  getStats(): CacheStats {
    const hitRate = this.stats.totalRequests > 0 
      ? this.stats.totalHits / this.stats.totalRequests 
      : 0;
    
    const averageResponseTime = this.stats.responseTimes.length > 0
      ? this.stats.responseTimes.reduce((a, b) => a + b, 0) / this.stats.responseTimes.length
      : 0;

    return {
      size: this.cache.size,
      hitRate,
      totalRequests: this.stats.totalRequests,
      totalHits: this.stats.totalHits,
      totalMisses: this.stats.totalMisses,
      averageResponseTime
    };
  }

  private resetStats(): void {
    this.stats = {
      totalRequests: 0,
      totalHits: 0,
      totalMisses: 0,
      responseTimes: []
    };
  }

  // Get cache entries for debugging
  getEntries(): Array<{ key: string; entry: CacheEntry<T> }> {
    return Array.from(this.cache.entries()).map(([key, entry]) => ({ key, entry }));
  }
}

/**
 * Request deduplication to prevent duplicate API calls
 */
class RequestDeduplicator {
  private pendingRequests = new Map<string, Promise<any>>();

  async deduplicate<T>(key: string, requestFn: () => Promise<T>): Promise<T> {
    // If request is already pending, return the existing promise
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key)!;
    }

    // Create new request
    const requestPromise = requestFn().finally(() => {
      // Clean up after request completes
      this.pendingRequests.delete(key);
    });

    this.pendingRequests.set(key, requestPromise);
    return requestPromise;
  }

  getPendingCount(): number {
    return this.pendingRequests.size;
  }

  getPendingKeys(): string[] {
    return Array.from(this.pendingRequests.keys());
  }
}

/**
 * Performance monitoring
 */
class PerformanceMonitor {
  private metrics = {
    requestCount: 0,
    totalResponseTime: 0,
    errorCount: 0,
    startTime: Date.now()
  };

  recordRequest(responseTime: number, isError = false): void {
    this.metrics.requestCount++;
    this.metrics.totalResponseTime += responseTime;
    
    if (isError) {
      this.metrics.errorCount++;
    }
  }

  getMetrics(): PerformanceMetrics {
    const averageResponseTime = this.metrics.requestCount > 0 
      ? this.metrics.totalResponseTime / this.metrics.requestCount 
      : 0;
    
    const errorRate = this.metrics.requestCount > 0 
      ? this.metrics.errorCount / this.metrics.requestCount 
      : 0;

    return {
      requestCount: this.metrics.requestCount,
      averageResponseTime,
      errorRate,
      cacheHitRate: 0, // Will be updated by cache
      lastUpdated: Date.now()
    };
  }

  reset(): void {
    this.metrics = {
      requestCount: 0,
      totalResponseTime: 0,
      errorCount: 0,
      startTime: Date.now()
    };
  }
}

/**
 * Prompt optimization for better AI responses
 */
export function optimizePrompt(basePrompt: string): string {
  // Add optimization instructions for better, faster responses
  const optimizations = [
    'Please provide a concise but comprehensive analysis.',
    'Focus on the most significant themes and meanings.',
    'Use clear, accessible language for general audiences.',
    'Structure your response according to the requested format.'
  ];

  return `${basePrompt}\n\nOPTIMIZATION GUIDELINES:\n${optimizations.join('\n')}`;
}

/**
 * Batch processing for multiple requests (future enhancement)
 */
export interface BatchRequest {
  id: string;
  artist: string;
  songTitle: string;
}

export interface BatchResponse {
  id: string;
  success: boolean;
  data?: any;
  error?: string;
}

export async function processBatch(
  requests: BatchRequest[],
  processor: (request: BatchRequest) => Promise<any>
): Promise<BatchResponse[]> {
  // Process requests with controlled concurrency
  const concurrencyLimit = 3;
  const results: BatchResponse[] = [];
  
  for (let i = 0; i < requests.length; i += concurrencyLimit) {
    const batch = requests.slice(i, i + concurrencyLimit);
    
    const batchPromises = batch.map(async (request) => {
      try {
        const data = await processor(request);
        return { id: request.id, success: true, data };
      } catch (error) {
        return { 
          id: request.id, 
          success: false, 
          error: error instanceof Error ? error.message : String(error)
        };
      }
    });
    
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
  }
  
  return results;
}

// Global instances
export const analysisCache = new AdvancedCache(200, 1800000); // 200 entries, 30 min TTL
export const requestDeduplicator = new RequestDeduplicator();
export const performanceMonitor = new PerformanceMonitor();

/**
 * Get comprehensive performance report
 */
export function getPerformanceReport(): {
  cache: CacheStats;
  performance: PerformanceMetrics;
  deduplication: { pendingCount: number; pendingKeys: string[] };
} {
  const cacheStats = analysisCache.getStats();
  const performanceMetrics = performanceMonitor.getMetrics();
  
  // Update cache hit rate in performance metrics
  performanceMetrics.cacheHitRate = cacheStats.hitRate;

  return {
    cache: cacheStats,
    performance: performanceMetrics,
    deduplication: {
      pendingCount: requestDeduplicator.getPendingCount(),
      pendingKeys: requestDeduplicator.getPendingKeys()
    }
  };
}