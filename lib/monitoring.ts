/**
 * Health Checks and System Monitoring
 * Provides comprehensive monitoring for all backend services
 */

import { checkServiceHealth, type HealthStatus } from './errorHandling';
import { getGeminiClient } from './gemini';
import { getAnalysisStats } from './songAnalysis';
import { APIKeyManager } from './security';

export interface SystemHealth {
  overall: 'healthy' | 'degraded' | 'unhealthy';
  services: {
    gemini: HealthStatus;
    cache: HealthStatus;
    security: HealthStatus;
  };
  performance: {
    averageResponseTime: number;
    cacheHitRate: number;
    errorRate: number;
    requestCount: number;
  };
  timestamp: number;
}

export interface MonitoringConfig {
  healthCheckInterval: number;
  performanceThresholds: {
    responseTime: number;
    errorRate: number;
    cacheHitRate: number;
  };
}

/**
 * System health monitor
 */
class HealthMonitor {
  private lastHealthCheck: SystemHealth | null = null;
  private healthHistory: SystemHealth[] = [];
  
  constructor(private config: MonitoringConfig = {
    healthCheckInterval: 60000, // 1 minute
    performanceThresholds: {
      responseTime: 5000, // 5 seconds
      errorRate: 0.1, // 10%
      cacheHitRate: 0.5 // 50%
    }
  }) {}

  /**
   * Perform comprehensive health check
   */
  async performHealthCheck(): Promise<SystemHealth> {
    const timestamp = Date.now();
    
    // Check individual services
    const [geminiHealth, cacheHealth, securityHealth] = await Promise.all([
      this.checkGeminiHealth(),
      this.checkCacheHealth(),
      this.checkSecurityHealth()
    ]);

    // Get performance metrics
    const stats = getAnalysisStats();
    const performance = {
      averageResponseTime: stats.performance.averageResponseTime,
      cacheHitRate: stats.cache.hitRate,
      errorRate: stats.performance.errorRate,
      requestCount: stats.performance.requestCount
    };

    // Determine overall health
    const serviceStatuses = [geminiHealth.status, cacheHealth.status, securityHealth.status];
    const overall = this.determineOverallHealth(serviceStatuses, performance);

    const systemHealth: SystemHealth = {
      overall,
      services: {
        gemini: geminiHealth,
        cache: cacheHealth,
        security: securityHealth
      },
      performance,
      timestamp
    };

    // Store health check result
    this.lastHealthCheck = systemHealth;
    this.healthHistory.push(systemHealth);
    
    // Keep only last 100 health checks
    if (this.healthHistory.length > 100) {
      this.healthHistory = this.healthHistory.slice(-100);
    }

    return systemHealth;
  }

  /**
   * Check Gemini AI service health
   */
  private async checkGeminiHealth(): Promise<HealthStatus> {
    return checkServiceHealth('gemini', async () => {
      // Check API key configuration
      const apiKeyCheck = APIKeyManager.checkConfiguration();
      if (!apiKeyCheck.isValid) {
        throw new Error(apiKeyCheck.error);
      }

      // Try to get client (this validates configuration)
      const client = getGeminiClient();
      
      // Could add a lightweight test request here if needed
      // For now, just check if client can be created
      if (!client) {
        throw new Error('Failed to create Gemini client');
      }
    });
  }

  /**
   * Check cache system health
   */
  private async checkCacheHealth(): Promise<HealthStatus> {
    return checkServiceHealth('cache', async () => {
      const stats = getAnalysisStats();
      
      // Check if cache is functioning
      if (stats.cache.size < 0) {
        throw new Error('Cache size reporting invalid');
      }

      // Check cache hit rate (warn if too low)
      if (stats.cache.totalRequests > 10 && stats.cache.hitRate < 0.1) {
        throw new Error('Cache hit rate too low');
      }
    });
  }

  /**
   * Check security system health
   */
  private async checkSecurityHealth(): Promise<HealthStatus> {
    return checkServiceHealth('security', async () => {
      // Test input validation
      const { performSecurityCheck } = await import('./security');
      const testResult = performSecurityCheck('test input');
      
      if (!testResult.sanitized) {
        throw new Error('Input sanitization not working');
      }
    });
  }

  /**
   * Determine overall system health based on service statuses and performance
   */
  private determineOverallHealth(
    serviceStatuses: Array<'healthy' | 'degraded' | 'unhealthy'>,
    performance: SystemHealth['performance']
  ): 'healthy' | 'degraded' | 'unhealthy' {
    // If any service is unhealthy, system is unhealthy
    if (serviceStatuses.includes('unhealthy')) {
      return 'unhealthy';
    }

    // Check performance thresholds
    const { responseTime, errorRate, cacheHitRate } = this.config.performanceThresholds;
    
    const performanceIssues = [
      performance.averageResponseTime > responseTime,
      performance.errorRate > errorRate,
      performance.requestCount > 10 && performance.cacheHitRate < cacheHitRate
    ].filter(Boolean).length;

    // If any service is degraded or performance issues exist
    if (serviceStatuses.includes('degraded') || performanceIssues > 0) {
      return 'degraded';
    }

    return 'healthy';
  }

  /**
   * Get latest health status
   */
  getLatestHealth(): SystemHealth | null {
    return this.lastHealthCheck;
  }

  /**
   * Get health history
   */
  getHealthHistory(limit = 10): SystemHealth[] {
    return this.healthHistory.slice(-limit);
  }

  /**
   * Get health trends over time
   */
  getHealthTrends(): {
    uptime: number;
    averageResponseTime: number;
    errorTrend: 'improving' | 'stable' | 'degrading';
    healthScore: number;
  } {
    if (this.healthHistory.length < 2) {
      return {
        uptime: 1,
        averageResponseTime: 0,
        errorTrend: 'stable',
        healthScore: 1
      };
    }

    const recent = this.healthHistory.slice(-10);
    const healthyCount = recent.filter(h => h.overall === 'healthy').length;
    const uptime = healthyCount / recent.length;

    const avgResponseTime = recent.reduce((sum, h) => sum + h.performance.averageResponseTime, 0) / recent.length;

    // Determine error trend
    const firstHalf = recent.slice(0, Math.floor(recent.length / 2));
    const secondHalf = recent.slice(Math.floor(recent.length / 2));
    
    const firstHalfErrorRate = firstHalf.reduce((sum, h) => sum + h.performance.errorRate, 0) / firstHalf.length;
    const secondHalfErrorRate = secondHalf.reduce((sum, h) => sum + h.performance.errorRate, 0) / secondHalf.length;
    
    let errorTrend: 'improving' | 'stable' | 'degrading' = 'stable';
    if (secondHalfErrorRate < firstHalfErrorRate * 0.8) {
      errorTrend = 'improving';
    } else if (secondHalfErrorRate > firstHalfErrorRate * 1.2) {
      errorTrend = 'degrading';
    }

    // Calculate health score (0-1)
    const healthScore = recent.reduce((sum, h) => {
      const score = h.overall === 'healthy' ? 1 : h.overall === 'degraded' ? 0.5 : 0;
      return sum + score;
    }, 0) / recent.length;

    return {
      uptime,
      averageResponseTime: avgResponseTime,
      errorTrend,
      healthScore
    };
  }
}

/**
 * Performance benchmarking
 */
export class PerformanceBenchmark {
  private benchmarks: Array<{
    name: string;
    duration: number;
    timestamp: number;
    success: boolean;
  }> = [];

  /**
   * Run a performance benchmark
   */
  async benchmark<T>(name: string, operation: () => Promise<T>): Promise<T> {
    const startTime = Date.now();
    let success = true;
    
    try {
      const result = await operation();
      return result;
    } catch (error) {
      success = false;
      throw error;
    } finally {
      const duration = Date.now() - startTime;
      this.benchmarks.push({
        name,
        duration,
        timestamp: startTime,
        success
      });

      // Keep only last 100 benchmarks
      if (this.benchmarks.length > 100) {
        this.benchmarks = this.benchmarks.slice(-100);
      }
    }
  }

  /**
   * Get benchmark statistics
   */
  getStats(name?: string): {
    count: number;
    averageDuration: number;
    minDuration: number;
    maxDuration: number;
    successRate: number;
  } {
    const filtered = name 
      ? this.benchmarks.filter(b => b.name === name)
      : this.benchmarks;

    if (filtered.length === 0) {
      return {
        count: 0,
        averageDuration: 0,
        minDuration: 0,
        maxDuration: 0,
        successRate: 0
      };
    }

    const durations = filtered.map(b => b.duration);
    const successCount = filtered.filter(b => b.success).length;

    return {
      count: filtered.length,
      averageDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
      minDuration: Math.min(...durations),
      maxDuration: Math.max(...durations),
      successRate: successCount / filtered.length
    };
  }
}

// Global instances
export const healthMonitor = new HealthMonitor();
export const performanceBenchmark = new PerformanceBenchmark();

/**
 * Initialize monitoring system
 */
export function initializeMonitoring(): void {
  // Perform initial health check
  healthMonitor.performHealthCheck().catch(console.error);
  
  // Set up periodic health checks
  setInterval(() => {
    healthMonitor.performHealthCheck().catch(console.error);
  }, 60000); // Every minute
}

/**
 * Get comprehensive system status
 */
export async function getSystemStatus(): Promise<{
  health: SystemHealth;
  trends: ReturnType<HealthMonitor['getHealthTrends']>;
  benchmarks: ReturnType<PerformanceBenchmark['getStats']>;
}> {
  const health = await healthMonitor.performHealthCheck();
  const trends = healthMonitor.getHealthTrends();
  const benchmarks = performanceBenchmark.getStats();

  return {
    health,
    trends,
    benchmarks
  };
}