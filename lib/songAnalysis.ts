/**
 * Song Analysis API Functions
 * Main interface for analyzing songs using Gemini AI
 */

import { 
  getGeminiClient, 
  createSongAnalysisPrompt, 
  parseAnalysisResponse, 
  type AnalysisResult 
} from './gemini';
import { 
  withRetry, 
  circuitBreaker, 
  classifyError, 
  generateFallbackResponse,
  withTimeout 
} from './errorHandling';
import { 
  analysisCache, 
  requestDeduplicator, 
  performanceMonitor,
  optimizePrompt 
} from './performance';

export interface SongAnalysisRequest {
  artist: string;
  songTitle: string;
  fullQuery?: string | undefined;
}

export interface SongAnalysisResponse {
  success: boolean;
  data?: AnalysisResult | undefined;
  error?: string | undefined;
  fallback?: boolean | undefined;
}

// Cache is now handled by the performance module

/**
 * Generate cache key for a song analysis request
 */
function getCacheKey(artist: string, songTitle: string): string {
  return `${artist.toLowerCase().trim()}-${songTitle.toLowerCase().trim()}`;
}

// Cache validation is now handled by the performance module

import { performSecurityCheck, APIKeyManager } from './security';

/**
 * Validate and sanitize song analysis request with comprehensive security
 */
function validateRequest(request: SongAnalysisRequest): { 
  isValid: boolean; 
  error?: string | undefined; 
  sanitizedRequest?: SongAnalysisRequest | undefined;
} {
  const { artist, songTitle } = request;
  if (!artist || !songTitle) {
    return { isValid: false, error: 'Both artist and song title are required' };
  }
  // Check API key configuration
  const apiKeyCheck = APIKeyManager.checkConfiguration();
  if (!apiKeyCheck.isValid) {
    return { isValid: false, error: 'Service configuration error' };
  }
  // Accept any input for artist and song title (no security check)
  return { 
    isValid: true, 
    sanitizedRequest: {
      artist,
      songTitle,
      fullQuery: request.fullQuery
    }
  };
}

/**
 * Analyze a song's meaning using Gemini AI
 */
export async function analyzeSong(request: SongAnalysisRequest): Promise<SongAnalysisResponse> {
  // Validate and sanitize request
  const validation = validateRequest(request);
  if (!validation.isValid) {
    return {
      success: false,
      error: validation.error
    };
  }
  
  const { artist, songTitle } = validation.sanitizedRequest!;
  
  try {
    const cacheKey = getCacheKey(artist, songTitle);
    const startTime = Date.now();
    
    // Check cache first
    const cachedResult = analysisCache.get(cacheKey);
    if (cachedResult) {
      performanceMonitor.recordRequest(Date.now() - startTime, false);
      return {
        success: true,
        data: cachedResult as AnalysisResult
      };
    }
    
    // Use request deduplication to prevent duplicate API calls
    const analysisResult = await requestDeduplicator.deduplicate(cacheKey, async () => {
      return await circuitBreaker.execute(async () => {
        return await withRetry(async () => {
          // Get Gemini client
          const client = getGeminiClient();
          
          // Create and optimize analysis prompt
          const basePrompt = createSongAnalysisPrompt(artist, songTitle);
          const prompt = optimizePrompt(basePrompt);
          
          // Generate analysis with grounding search and timeout
          const searchQuery = `${artist} ${songTitle} song meaning lyrics analysis`;
          const response = await withTimeout(
            client.generateWithGrounding(prompt, searchQuery),
            30000, // 30 second timeout
            'AI analysis request timed out'
          );
          
          // Parse response
          return parseAnalysisResponse(response, artist, songTitle);
        }, 3, 1000); // 3 retries with 1 second base delay
      });
    });
    
    // Cache successful result
    analysisCache.set(cacheKey, analysisResult);
    
    // Record performance metrics
    performanceMonitor.recordRequest(Date.now() - startTime, false);
    
    return {
      success: true,
      data: analysisResult
    };
    
  } catch (error) {
    console.error('Song analysis error:', error);
    
    const apiError = classifyError(error);
    
    // For certain errors, provide fallback response
    if (apiError.code === 'TIMEOUT_ERROR' || apiError.code === 'SERVER_ERROR') {
      const fallbackResponse = generateFallbackResponse(artist, songTitle);
      return {
        success: true,
        data: fallbackResponse.data,
        fallback: true
      };
    }
    
    return {
      success: false,
      error: apiError.message
    };
  }
}

/**
 * Parse search query to extract artist and song title
 */
export function parseSearchQuery(query: string): SongAnalysisRequest {
  const trimmedQuery = query.trim();
  
  // Try to split by common separators
  const separators = [' - ', ' by ', ' | ', ' / '];
  
  for (const separator of separators) {
    if (trimmedQuery.includes(separator)) {
      const parts = trimmedQuery.split(separator);
      if (parts.length >= 2 && parts[0] && parts[1]) {
        return {
          artist: parts[0].trim(),
          songTitle: parts[1].trim(),
          fullQuery: trimmedQuery
        };
      }
    }
  }
  
  // If no separator found, try to guess based on common patterns
  const words = trimmedQuery.split(' ');
  if (words.length >= 3) {
    // Assume first word is artist, rest is song title
    return {
      artist: words[0] || 'Unknown Artist',
      songTitle: words.slice(1).join(' ') || 'Unknown Song',
      fullQuery: trimmedQuery
    };
  }
  
  // Fallback: treat entire query as song title with unknown artist
  return {
    artist: 'Unknown Artist',
    songTitle: trimmedQuery,
    fullQuery: trimmedQuery
  };
}

/**
 * Clear analysis cache (useful for testing or memory management)
 */
export function clearAnalysisCache(): void {
  analysisCache.clear();
}

/**
 * Get comprehensive performance and cache statistics
 */
export function getAnalysisStats() {
  return {
    cache: analysisCache.getStats(),
    performance: performanceMonitor.getMetrics(),
    deduplication: {
      pendingCount: requestDeduplicator.getPendingCount(),
      pendingKeys: requestDeduplicator.getPendingKeys()
    }
  };
}