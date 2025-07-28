/**
 * Security and Validation Utilities
 * Handles input sanitization, rate limiting, and API security
 */

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  skipSuccessfulRequests?: boolean;
}

export interface SecurityConfig {
  maxInputLength: number;
  allowedCharacters: RegExp;
  blockedPatterns: RegExp[];
  rateLimiting: RateLimitConfig;
}

/**
 * Rate limiter for client-side API calls
 */
class RateLimiter {
  private requests: number[] = [];

  constructor(private config: RateLimitConfig) {}

  isAllowed(): boolean {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    // Remove old requests outside the window
    this.requests = this.requests.filter(time => time > windowStart);

    // Check if under limit
    if (this.requests.length < this.config.maxRequests) {
      this.requests.push(now);
      return true;
    }

    return false;
  }

  getTimeUntilReset(): number {
    if (this.requests.length === 0) return 0;
    
    const oldestRequest = Math.min(...this.requests);
    const resetTime = oldestRequest + this.config.windowMs;
    return Math.max(0, resetTime - Date.now());
  }

  getRemainingRequests(): number {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;
    const recentRequests = this.requests.filter(time => time > windowStart);
    return Math.max(0, this.config.maxRequests - recentRequests.length);
  }

  reset(): void {
    this.requests = [];
  }
}

/**
 * Input sanitization and validation
 */
export class InputValidator {
  private static readonly DEFAULT_CONFIG: SecurityConfig = {
    maxInputLength: 200,
    allowedCharacters: /^[a-zA-Z0-9\s\-_.,!?'"()&]+$/,
    blockedPatterns: [
      /<script[^>]*>.*?<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /data:text\/html/gi,
      /vbscript:/gi,
      /<iframe[^>]*>.*?<\/iframe>/gi,
      /<object[^>]*>.*?<\/object>/gi,
      /<embed[^>]*>.*?<\/embed>/gi,
      /eval\s*\(/gi,
      /expression\s*\(/gi
    ],
    rateLimiting: {
      windowMs: 60000, // 1 minute
      maxRequests: 10
    }
  };

  constructor(private config: SecurityConfig = InputValidator.DEFAULT_CONFIG) {}

  /**
   * Validate and sanitize user input
   */
  validateInput(input: string): { isValid: boolean; sanitized: string; errors: string[] } {
    const errors: string[] = [];
    let sanitized = input;

    // Check length
    if (input.length > this.config.maxInputLength) {
      errors.push(`Input too long. Maximum ${this.config.maxInputLength} characters allowed.`);
      sanitized = input.substring(0, this.config.maxInputLength);
    }

    // Check for empty input
    if (input.trim().length === 0) {
      errors.push('Input cannot be empty.');
      return { isValid: false, sanitized: '', errors };
    }

    // Basic sanitization
    sanitized = sanitized.trim();
    
    // Remove null bytes and control characters
    sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

    // Check for malicious patterns
    for (const pattern of this.config.blockedPatterns) {
      if (pattern.test(sanitized)) {
        errors.push('Input contains potentially harmful content.');
        // Remove the malicious content
        sanitized = sanitized.replace(pattern, '');
      }
    }

    // Check allowed characters
    if (!this.config.allowedCharacters.test(sanitized)) {
      errors.push('Input contains invalid characters.');
      // Keep only allowed characters
      sanitized = sanitized.replace(/[^a-zA-Z0-9\s\-_.,!?'"()&]/g, '');
    }

    // Final check after sanitization
    if (sanitized.trim().length === 0) {
      errors.push('Input becomes empty after sanitization.');
      return { isValid: false, sanitized: '', errors };
    }

    return {
      isValid: errors.length === 0,
      sanitized,
      errors
    };
  }

  /**
   * Validate song search query specifically
   */
  validateSongQuery(query: string): { isValid: boolean; sanitized: string; errors: string[] } {
    const result = this.validateInput(query);
    
    if (!result.isValid) {
      return result;
    }

    // Additional validation for song queries
    const additionalErrors: string[] = [];
    
    // Check for minimum meaningful content
    if (result.sanitized.length < 2) {
      additionalErrors.push('Search query too short. Please enter at least 2 characters.');
    }

    // Check for reasonable word count (not just spaces)
    const words = result.sanitized.split(/\s+/).filter(word => word.length > 0);
    if (words.length === 0) {
      additionalErrors.push('Search query must contain at least one word.');
    }

    return {
      isValid: additionalErrors.length === 0,
      sanitized: result.sanitized,
      errors: [...result.errors, ...additionalErrors]
    };
  }
}

/**
 * API key security utilities
 */
export class APIKeyManager {
  private static readonly KEY_PATTERN = /^[A-Za-z0-9_-]+$/;

  /**
   * Validate API key format
   */
  static validateAPIKey(key: string): boolean {
    if (!key || key.length < 10) return false;
    return this.KEY_PATTERN.test(key);
  }

  /**
   * Mask API key for logging (show only first and last 4 characters)
   */
  static maskAPIKey(key: string): string {
    if (!key || key.length < 8) return '***';
    return `${key.substring(0, 4)}...${key.substring(key.length - 4)}`;
  }

  /**
   * Check if API key is properly configured
   */
  static checkConfiguration(): { isValid: boolean; error?: string } {
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      return {
        isValid: false,
        error: 'GEMINI_API_KEY environment variable is not set'
      };
    }

    if (!this.validateAPIKey(apiKey)) {
      return {
        isValid: false,
        error: 'API key format is invalid'
      };
    }

    return { isValid: true };
  }
}

/**
 * Request signing for enhanced security (optional)
 */
export class RequestSigner {
  private static readonly SIGNATURE_HEADER = 'X-Request-Signature';
  private static readonly TIMESTAMP_HEADER = 'X-Request-Timestamp';

  /**
   * Generate request signature (simplified version)
   */
  static async generateSignature(
    payload: string,
    timestamp: number,
    secret: string
  ): Promise<string> {
    const message = `${timestamp}:${payload}`;
    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    const key = encoder.encode(secret);
    
    // Simple hash-based signature (in production, use proper HMAC)
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      hash = ((hash << 5) - hash + (data[i] || 0)) & 0xffffffff;
    }
    
    return hash.toString(16);
  }

  /**
   * Add security headers to request
   */
  static async addSecurityHeaders(
    headers: Record<string, string>,
    payload: string,
    secret?: string
  ): Promise<Record<string, string>> {
    const timestamp = Date.now();
    const secureHeaders: Record<string, string> = {
      ...headers,
      [this.TIMESTAMP_HEADER]: timestamp.toString()
    };

    if (secret) {
      const signature = await this.generateSignature(payload, timestamp, secret);
      secureHeaders[this.SIGNATURE_HEADER] = signature;
    }

    return secureHeaders;
  }
}

/**
 * CORS configuration for API requests
 */
export const CORS_CONFIG = {
  allowedOrigins: [
    'http://localhost:3000',
    'https://localhost:3000',
    // Add production domains here
  ],
  allowedMethods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400 // 24 hours
};

/**
 * Security monitoring and anomaly detection
 */
class SecurityMonitor {
  private suspiciousPatterns = [
    /\b(union|select|insert|delete|drop|create|alter)\b/gi,
    /<script/gi,
    /javascript:/gi,
    /data:text\/html/gi
  ];

  private requestLog: Array<{
    timestamp: number;
    input: string;
    suspicious: boolean;
    ip?: string;
  }> = [];

  logRequest(input: string, ip?: string): void {
    const suspicious = this.suspiciousPatterns.some(pattern => pattern.test(input));
    
    const logEntry: any = {
      timestamp: Date.now(),
      input: input.substring(0, 100), // Log only first 100 chars
      suspicious
    };
    
    if (ip) {
      logEntry.ip = ip;
    }
    
    this.requestLog.push(logEntry);

    // Keep only last 1000 requests
    if (this.requestLog.length > 1000) {
      this.requestLog = this.requestLog.slice(-1000);
    }

    if (suspicious) {
      console.warn('Suspicious request detected:', {
        input: input.substring(0, 50),
        ip,
        timestamp: new Date().toISOString()
      });
    }
  }

  getSuspiciousRequests(timeWindowMs = 3600000): Array<any> {
    const cutoff = Date.now() - timeWindowMs;
    return this.requestLog.filter(req => req.timestamp > cutoff && req.suspicious);
  }

  getRequestStats(): { total: number; suspicious: number; suspiciousRate: number } {
    const total = this.requestLog.length;
    const suspicious = this.requestLog.filter(req => req.suspicious).length;
    const suspiciousRate = total > 0 ? suspicious / total : 0;

    return { total, suspicious, suspiciousRate };
  }
}

// Global instances
export const rateLimiter = new RateLimiter({
  windowMs: 60000, // 1 minute
  maxRequests: 10
});

export const inputValidator = new InputValidator();
export const securityMonitor = new SecurityMonitor();

/**
 * Comprehensive security check for requests
 */
export function performSecurityCheck(input: string): {
  allowed: boolean;
  errors: string[];
  sanitized: string;
} {
  const errors: string[] = [];
  
  // Rate limiting check
  if (!rateLimiter.isAllowed()) {
    const resetTime = rateLimiter.getTimeUntilReset();
    errors.push(`Rate limit exceeded. Try again in ${Math.ceil(resetTime / 1000)} seconds.`);
  }

  // Input validation
  const validation = inputValidator.validateSongQuery(input);
  if (!validation.isValid) {
    errors.push(...validation.errors);
  }

  // Log request for monitoring
  securityMonitor.logRequest(input);

  return {
    allowed: errors.length === 0,
    errors,
    sanitized: validation.sanitized
  };
}