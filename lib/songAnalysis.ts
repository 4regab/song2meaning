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

export interface SongAnalysisRequest {
  artist: string;
  songTitle: string;
  fullQuery?: string;
}

export interface SongAnalysisResponse {
  success: boolean;
  data?: AnalysisResult;
  error?: string;
}

/**
 * Cache for storing analysis results to avoid duplicate API calls
 */
const analysisCache = new Map<string, AnalysisResult>();
const CACHE_TTL = 1000 * 60 * 30; // 30 minutes
const cacheTimestamps = new Map<string, number>();

/**
 * Generate cache key for a song analysis request
 */
function getCacheKey(artist: string, songTitle: string): string {
  return `${artist.toLowerCase().trim()}-${songTitle.toLowerCase().trim()}`;
}

/**
 * Check if cached result is still valid
 */
function isCacheValid(key: string): boolean {
  const timestamp = cacheTimestamps.get(key);
  if (!timestamp) return false;
  
  return Date.now() - timestamp < CACHE_TTL;
}

/**
 * Validate and sanitize song analysis request
 */
function validateRequest(request: SongAnalysisRequest): { isValid: boolean; error?: string } {
  const { artist, songTitle } = request;
  
  if (!artist || !songTitle) {
    return { isValid: false, error: 'Both artist and song title are required' };
  }
  
  if (artist.trim().length === 0 || songTitle.trim().length === 0) {
    return { isValid: false, error: 'Artist and song title cannot be empty' };
  }
  
  if (artist.length > 100 || songTitle.length > 100) {
    return { isValid: false, error: 'Artist and song title must be less than 100 characters' };
  }
  
  // Basic sanitization check for malicious content
  const maliciousPatterns = [/<script/i, /javascript:/i, /on\w+=/i];
  const combinedText = `${artist} ${songTitle}`;
  
  for (const pattern of maliciousPatterns) {
    if (pattern.test(combinedText)) {
      return { isValid: false, error: 'Invalid characters in search query' };
    }
  }
  
  return { isValid: true };
}

/**
 * Analyze a song's meaning using Gemini AI
 */
export async function analyzeSong(request: SongAnalysisRequest): Promise<SongAnalysisResponse> {
  try {
    // Validate request
    const validation = validateRequest(request);
    if (!validation.isValid) {
      return {
        success: false,
        error: validation.error
      };
    }
    
    const { artist, songTitle } = request;
    const cacheKey = getCacheKey(artist, songTitle);
    
    // Check cache first
    if (analysisCache.has(cacheKey) && isCacheValid(cacheKey)) {
      return {
        success: true,
        data: analysisCache.get(cacheKey)!
      };
    }
    
    // Get Gemini client
    const client = getGeminiClient();
    
    // Create analysis prompt
    const prompt = createSongAnalysisPrompt(artist, songTitle);
    
    // Generate analysis
    const response = await client.generateContent(prompt);
    
    // Parse response
    const analysisResult = parseAnalysisResponse(response, artist, songTitle);
    
    // Cache result
    analysisCache.set(cacheKey, analysisResult);
    cacheTimestamps.set(cacheKey, Date.now());
    
    return {
      success: true,
      data: analysisResult
    };
    
  } catch (error) {
    console.error('Song analysis error:', error);
    
    // Return user-friendly error messages
    let errorMessage = 'Unable to analyze song at this time. Please try again.';
    
    if (error instanceof Error) {
      if (error.message.includes('timeout')) {
        errorMessage = 'Request timed out. Please try again.';
      } else if (error.message.includes('rate limit') || error.message.includes('429')) {
        errorMessage = 'Too many requests. Please wait a moment and try again.';
      } else if (error.message.includes('API key')) {
        errorMessage = 'Service configuration error. Please contact support.';
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      }
    }
    
    return {
      success: false,
      error: errorMessage
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
      if (parts.length >= 2) {
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
      artist: words[0],
      songTitle: words.slice(1).join(' '),
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
  cacheTimestamps.clear();
}

/**
 * Get cache statistics for monitoring
 */
export function getCacheStats(): { size: number; keys: string[] } {
  return {
    size: analysisCache.size,
    keys: Array.from(analysisCache.keys())
  };
}