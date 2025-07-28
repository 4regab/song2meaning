/**
 * IP-based Rate Limiter for Song Analysis
 * Limits each IP address to 5 analyses per time window
 */

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  error?: string;
}

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  skipSuccessfulRequests?: boolean;
}

/**
 * In-memory rate limiter for serverless environments
 * Note: In production, consider using Redis or a database for persistence
 */
class IPRateLimiter {
  private requests: Map<string, { count: number; resetTime: number }> = new Map();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig = {
    maxRequests: 5,
    windowMs: 24 * 60 * 60 * 1000, // 1 day
    skipSuccessfulRequests: false
  }) {
    this.config = config;
    
    // Clean up expired entries every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  /**
   * Check if IP address is allowed to make a request
   */
  checkLimit(ip: string): RateLimitResult {
    const now = Date.now();
    const key = this.normalizeIP(ip);
    
    // Get current request data for this IP
    let requestData = this.requests.get(key);
    
    // If no data exists or window has expired, create new entry
    if (!requestData || now >= requestData.resetTime) {
      requestData = {
        count: 0,
        resetTime: now + this.config.windowMs
      };
      this.requests.set(key, requestData);
    }
    
    // Check if limit exceeded
    if (requestData.count >= this.config.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: requestData.resetTime,
        error: `Rate limit exceeded. You can make ${this.config.maxRequests} requests per hour. Try again in ${Math.ceil((requestData.resetTime - now) / 1000 / 60)} minutes.`
      };
    }
    
    // Increment counter
    requestData.count++;
    
    return {
      allowed: true,
      remaining: this.config.maxRequests - requestData.count,
      resetTime: requestData.resetTime
    };
  }

  /**
   * Record a successful request (if configured to skip successful requests)
   */
  recordRequest(ip: string, success: boolean = true): void {
    if (this.config.skipSuccessfulRequests && success) {
      const key = this.normalizeIP(ip);
      const requestData = this.requests.get(key);
      if (requestData && requestData.count > 0) {
        requestData.count--;
      }
    }
  }

  /**
   * Get current status for an IP
   */
  getStatus(ip: string): { count: number; remaining: number; resetTime: number } {
    const key = this.normalizeIP(ip);
    const requestData = this.requests.get(key);
    const now = Date.now();
    
    if (!requestData || now >= requestData.resetTime) {
      return {
        count: 0,
        remaining: this.config.maxRequests,
        resetTime: now + this.config.windowMs
      };
    }
    
    return {
      count: requestData.count,
      remaining: Math.max(0, this.config.maxRequests - requestData.count),
      resetTime: requestData.resetTime
    };
  }

  /**
   * Reset rate limit for a specific IP (admin function)
   */
  resetIP(ip: string): void {
    const key = this.normalizeIP(ip);
    this.requests.delete(key);
  }

  /**
   * Get all rate limit data (for monitoring)
   */
  getAllData(): Array<{ ip: string; count: number; resetTime: number }> {
    const now = Date.now();
    const result: Array<{ ip: string; count: number; resetTime: number }> = [];
    
    for (const [ip, data] of this.requests.entries()) {
      if (now < data.resetTime) {
        result.push({
          ip,
          count: data.count,
          resetTime: data.resetTime
        });
      }
    }
    
    return result;
  }

  /**
   * Normalize IP address for consistent storage
   */
  private normalizeIP(ip: string): string {
    // Handle IPv6 mapped IPv4 addresses
    if (ip.startsWith('::ffff:')) {
      return ip.substring(7);
    }
    
    // Handle localhost variations
    if (ip === '::1' || ip === '127.0.0.1' || ip === 'localhost') {
      return '127.0.0.1';
    }
    
    return ip;
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, data] of this.requests.entries()) {
      if (now >= data.resetTime) {
        this.requests.delete(key);
      }
    }
  }

  /**
   * Get statistics about the rate limiter
   */
  getStats(): {
    totalIPs: number;
    activeIPs: number;
    totalRequests: number;
    averageRequestsPerIP: number;
  } {
    const now = Date.now();
    let totalRequests = 0;
    let activeIPs = 0;
    
    for (const [, data] of this.requests.entries()) {
      if (now < data.resetTime) {
        activeIPs++;
        totalRequests += data.count;
      }
    }
    
    return {
      totalIPs: this.requests.size,
      activeIPs,
      totalRequests,
      averageRequestsPerIP: activeIPs > 0 ? totalRequests / activeIPs : 0
    };
  }
}

/**
 * Utility function to extract IP address from Next.js request
 */
export function getClientIP(request: Request): string {
  // Try to get IP from various headers (Vercel, Cloudflare, etc.)
  const headers = request.headers;
  
  // Vercel
  const forwardedFor = headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0]?.trim() || '127.0.0.1';
  }
  
  // Cloudflare
  const cfConnectingIP = headers.get('cf-connecting-ip');
  if (cfConnectingIP) {
    return cfConnectingIP;
  }
  
  // Other common headers
  const xRealIP = headers.get('x-real-ip');
  if (xRealIP) {
    return xRealIP;
  }
  
  const xClientIP = headers.get('x-client-ip');
  if (xClientIP) {
    return xClientIP;
  }
  
  // Fallback to localhost for development
  return '127.0.0.1';
}

/**
 * Middleware function for rate limiting
 */
export function createRateLimitMiddleware(config?: Partial<RateLimitConfig>) {
  const rateLimiter = new IPRateLimiter(config as RateLimitConfig);
  
  return {
    check: (request: Request) => {
      const ip = getClientIP(request);
      return rateLimiter.checkLimit(ip);
    },
    record: (request: Request, success: boolean = true) => {
      const ip = getClientIP(request);
      rateLimiter.recordRequest(ip, success);
    },
    getStatus: (request: Request) => {
      const ip = getClientIP(request);
      return rateLimiter.getStatus(ip);
    },
    getStats: () => rateLimiter.getStats(),
    resetIP: (ip: string) => rateLimiter.resetIP(ip),
    getAllData: () => rateLimiter.getAllData()
  };
}

// Global rate limiter instance for song analysis
export const songAnalysisRateLimit = createRateLimitMiddleware({
  maxRequests: 5,
  windowMs: 60 * 60 * 1000, // 1 hour
  skipSuccessfulRequests: false
});

// Types are already exported above