/**
 * Main API Client for Song2Meaning
 * Comprehensive interface that integrates all backend functionality
 */

import { 
  analyzeSong, 
  parseSearchQuery, 
  clearAnalysisCache,
  getAnalysisStats,
  type SongAnalysisRequest,
  type SongAnalysisResponse 
} from './songAnalysis';
import { getSystemStatus, performanceBenchmark } from './monitoring';
import { performSecurityCheck } from './security';

export interface Song2MeaningAPI {
  // Core functionality
  analyzeSong(query: string): Promise<SongAnalysisResponse>;
  
  // System management
  getSystemHealth(): Promise<any>;
  clearCache(): void;
  getStats(): any;
  
  // Utilities
  validateInput(input: string): { isValid: boolean; errors: string[] };
}

/**
 * Main API client class
 */
class Song2MeaningClient implements Song2MeaningAPI {
  /**
   * Analyze a song's meaning from a search query
   */
  async analyzeSong(query: string): Promise<SongAnalysisResponse> {
    return performanceBenchmark.benchmark('song-analysis', async () => {
      // Parse the search query
      const parsedQuery = parseSearchQuery(query);
      
      // Perform the analysis
      return await analyzeSong(parsedQuery);
    });
  }

  /**
   * Get comprehensive system health information
   */
  async getSystemHealth() {
    return await getSystemStatus();
  }

  /**
   * Clear all caches
   */
  clearCache(): void {
    clearAnalysisCache();
  }

  /**
   * Get system statistics
   */
  getStats() {
    return getAnalysisStats();
  }

  /**
   * Validate user input
   */
  validateInput(input: string): { isValid: boolean; errors: string[] } {
    const securityCheck = performSecurityCheck(input);
    return {
      isValid: securityCheck.allowed,
      errors: securityCheck.errors
    };
  }

  /**
   * Batch analyze multiple songs (future enhancement)
   */
  async analyzeSongs(queries: string[]): Promise<SongAnalysisResponse[]> {
    const results: SongAnalysisResponse[] = [];
    
    // Process with controlled concurrency to avoid rate limits
    const concurrencyLimit = 2;
    
    for (let i = 0; i < queries.length; i += concurrencyLimit) {
      const batch = queries.slice(i, i + concurrencyLimit);
      
      const batchPromises = batch.map(query => this.analyzeSong(query));
      const batchResults = await Promise.all(batchPromises);
      
      results.push(...batchResults);
      
      // Add delay between batches to respect rate limits
      if (i + concurrencyLimit < queries.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    return results;
  }

  /**
   * Get popular/trending songs analysis (mock implementation)
   */
  async getTrendingSongs(): Promise<Array<{ query: string; analysis: SongAnalysisResponse }>> {
    // This would typically come from a database or external API
    const trendingQueries = [
      'The Beatles - Yesterday',
      'Queen - Bohemian Rhapsody',
      'Bob Dylan - Like a Rolling Stone',
      'Nirvana - Smells Like Teen Spirit',
      'Johnny Cash - Hurt'
    ];

    const results = await Promise.all(
      trendingQueries.map(async query => ({
        query,
        analysis: await this.analyzeSong(query)
      }))
    );

    return results.filter(result => result.analysis.success);
  }

  /**
   * Search for songs by partial match (mock implementation)
   */
  async searchSongs(partialQuery: string): Promise<string[]> {
    // This would typically use a search service or database
    // For now, return some mock suggestions based on input
    const suggestions: Record<string, string[]> = {
      'beatles': [
        'The Beatles - Yesterday',
        'The Beatles - Hey Jude',
        'The Beatles - Let It Be',
        'The Beatles - Come Together'
      ],
      'queen': [
        'Queen - Bohemian Rhapsody',
        'Queen - We Will Rock You',
        'Queen - Another One Bites the Dust',
        'Queen - Somebody to Love'
      ],
      'dylan': [
        'Bob Dylan - Like a Rolling Stone',
        'Bob Dylan - Blowin\' in the Wind',
        'Bob Dylan - The Times They Are a-Changin\'',
        'Bob Dylan - Mr. Tambourine Man'
      ]
    };

    const lowerQuery = partialQuery.toLowerCase();
    
    for (const [key, songs] of Object.entries(suggestions)) {
      if (lowerQuery.includes(key)) {
        return songs;
      }
    }

    return [];
  }
}

// Global client instance
let apiClient: Song2MeaningClient | null = null;

/**
 * Get the global API client instance
 */
export function getAPIClient(): Song2MeaningClient {
  if (!apiClient) {
    apiClient = new Song2MeaningClient();
  }
  return apiClient;
}

/**
 * Convenience functions for direct API access
 */
export const api = {
  /**
   * Analyze a song's meaning
   */
  analyzeSong: (query: string) => getAPIClient().analyzeSong(query),
  
  /**
   * Get system health
   */
  getHealth: () => getAPIClient().getSystemHealth(),
  
  /**
   * Clear caches
   */
  clearCache: () => getAPIClient().clearCache(),
  
  /**
   * Get statistics
   */
  getStats: () => getAPIClient().getStats(),
  
  /**
   * Validate input
   */
  validateInput: (input: string) => getAPIClient().validateInput(input),
  
  /**
   * Batch analyze songs
   */
  analyzeSongs: (queries: string[]) => getAPIClient().analyzeSongs(queries),
  
  /**
   * Get trending songs
   */
  getTrending: () => getAPIClient().getTrendingSongs(),
  
  /**
   * Search for songs
   */
  searchSongs: (query: string) => getAPIClient().searchSongs(query)
};

// Export types for frontend use
export type {
  SongAnalysisRequest,
  SongAnalysisResponse
} from './songAnalysis';

export type { SystemHealth } from './monitoring';

/**
 * Initialize the API system
 */
export function initializeAPI(): void {
  // Initialize monitoring
  const { initializeMonitoring } = require('./monitoring');
  initializeMonitoring();
  
  console.log('Song2Meaning API initialized');
}

// Auto-initialize in browser environment
if (typeof window !== 'undefined') {
  initializeAPI();
}