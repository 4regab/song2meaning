/**
 * Comprehensive Error Handling and Resilience Features
 * Handles API errors, retries, circuit breaker, and user-friendly messages
 */

export interface ErrorContext {
  operation: string;
  timestamp: number;
  error: Error;
  retryCount?: number;
}

export interface CircuitBreakerState {
  failures: number;
  lastFailureTime: number;
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
}

/**
 * Circuit breaker for API resilience
 */
class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  
  constructor(
    private failureThreshold = 5,
    private recoveryTimeout = 60000 // 1 minute
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.recoveryTimeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Service temporarily unavailable. Please try again later.');
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failures = 0;
    this.state = 'CLOSED';
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();
    
    if (this.failures >= this.failureThreshold) {
      this.state = 'OPEN';
    }
  }

  getState(): CircuitBreakerState {
    return {
      failures: this.failures,
      lastFailureTime: this.lastFailureTime,
      state: this.state
    };
  }

  reset(): void {
    this.failures = 0;
    this.lastFailureTime = 0;
    this.state = 'CLOSED';
  }
}

/**
 * Error classification and user-friendly message mapping
 */
export class APIError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number,
    public retryable = false
  ) {
    super(message);
    this.name = 'APIError';
  }
}

/**
 * Classify errors and provide user-friendly messages
 */
export function classifyError(error: unknown): APIError {
  if (error instanceof APIError) {
    return error;
  }

  if (error instanceof Error) {
    // Network errors
    if (error.message.includes('fetch') || error.message.includes('network')) {
      return new APIError(
        'Network connection failed. Please check your internet connection and try again.',
        'NETWORK_ERROR',
        undefined,
        true
      );
    }

    // Timeout errors
    if (error.message.includes('timeout') || error.message.includes('AbortError')) {
      return new APIError(
        'Request timed out. The service may be busy. Please try again.',
        'TIMEOUT_ERROR',
        undefined,
        true
      );
    }

    // Rate limiting
    if (error.message.includes('429') || error.message.includes('rate limit')) {
      return new APIError(
        'Too many requests. Please wait a moment before trying again.',
        'RATE_LIMIT_ERROR',
        429,
        true
      );
    }

    // API key issues
    if (error.message.includes('API key') || error.message.includes('401')) {
      return new APIError(
        'Service configuration error. Please contact support.',
        'AUTH_ERROR',
        401,
        false
      );
    }

    // Server errors
    if (error.message.includes('500') || error.message.includes('502') || error.message.includes('503')) {
      return new APIError(
        'Service temporarily unavailable. Please try again in a few minutes.',
        'SERVER_ERROR',
        500,
        true
      );
    }

    // Gemini-specific errors
    if (error.message.includes('Gemini')) {
      return new APIError(
        'AI service is currently unavailable. Please try again later.',
        'AI_SERVICE_ERROR',
        undefined,
        true
      );
    }
  }

  // Generic fallback
  return new APIError(
    'An unexpected error occurred. Please try again.',
    'UNKNOWN_ERROR',
    undefined,
    true
  );
}

/**
 * Retry logic with exponential backoff
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      const apiError = classifyError(error);
      
      // Don't retry non-retryable errors
      if (!apiError.retryable || attempt === maxRetries) {
        throw apiError;
      }

      // Exponential backoff with jitter
      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw classifyError(lastError!);
}

/**
 * Health check for API services
 */
export interface HealthStatus {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime?: number;
  error?: string;
  timestamp: number;
}

export async function checkServiceHealth(
  serviceName: string,
  healthCheck: () => Promise<void>
): Promise<HealthStatus> {
  const startTime = Date.now();
  
  try {
    await healthCheck();
    const responseTime = Date.now() - startTime;
    
    return {
      service: serviceName,
      status: responseTime > 5000 ? 'degraded' : 'healthy',
      responseTime,
      timestamp: Date.now()
    };
  } catch (error) {
    return {
      service: serviceName,
      status: 'unhealthy',
      error: error instanceof Error ? error.message : String(error),
      timestamp: Date.now()
    };
  }
}

/**
 * Request timeout wrapper
 */
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutMessage = 'Operation timed out'
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs);
    })
  ]);
}

/**
 * Fallback response generator for when services are unavailable
 */
export function generateFallbackResponse(artist: string, songTitle: string): {
  success: boolean;
  data: any;
  fallback: boolean;
} {
  return {
    success: true,
    fallback: true,
    data: {
      songTitle,
      artist,
      overview: `We're currently unable to analyze "${songTitle}" by ${artist} due to service limitations. This appears to be a song that would benefit from detailed lyrical analysis.`,
      themes: ['Music Analysis', 'Lyrical Content', 'Artistic Expression'],
      deepDive: `Unfortunately, we cannot provide a detailed analysis of "${songTitle}" at this time due to service availability. We recommend trying again later when our AI analysis service is fully operational.`,
      culturalContext: 'Cultural context analysis is temporarily unavailable. Please try again later for comprehensive background information.'
    }
  };
}

// Global circuit breaker instance
const globalCircuitBreaker = new CircuitBreaker();

export { globalCircuitBreaker as circuitBreaker };