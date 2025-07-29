/**
 * Client-Side API Helper
 * Provides a clean interface for calling secure server-side API routes
 */

export interface ClientAPIResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
}

export interface SongAnalysisResult {
    songTitle: string;
    artist: string;
    overview: string;
    themes: string[];
    deepDive: string;
    culturalContext: string;
}

export interface RateLimitInfo {
    remaining: number;
    resetTime: number;
    resetIn?: number; // hours until reset
    used?: number;
}

export interface SongAnalysisResponse {
    success: boolean;
    data?: SongAnalysisResult;
    error?: string;
    fallback?: boolean;
    rateLimitInfo?: RateLimitInfo;
}

/**
 * Client-side API for calling secure server routes
 */
export class ClientAPI {
    private baseUrl: string;

    constructor(baseUrl = '') {
        this.baseUrl = baseUrl;
    }

    /**
     * Analyze a song using the secure server-side API with rate limiting
     */
    async analyzeSong(query: string): Promise<SongAnalysisResponse> {
        try {
            const response = await fetch(`${this.baseUrl}/api/analyze`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ query })
            });

            const data = await response.json();

            // Handle rate limit exceeded (429 status)
            if (response.status === 429) {
                return {
                    success: false,
                    error: data.error || 'Rate limit exceeded',
                    rateLimitInfo: data.rateLimitInfo
                };
            }

            if (data.success) {
                return {
                    ...data.result,
                    rateLimitInfo: data.rateLimitInfo
                };
            } else {
                return {
                    success: false,
                    error: data.error || 'Analysis failed',
                    rateLimitInfo: data.rateLimitInfo
                };
            }
        } catch (error) {
            console.error('Client API error:', error);
            return {
                success: false,
                error: 'Network error occurred while analyzing the song'
            };
        }
    }

    /**
     * Get system health information
     */
    async getHealth(): Promise<ClientAPIResponse> {
        try {
            const response = await fetch(`${this.baseUrl}/api/health`);
            const data = await response.json();

            return {
                success: data.success,
                data: data.health,
                error: data.error
            };
        } catch (error) {
            console.error('Health check error:', error);
            return {
                success: false,
                error: 'Failed to retrieve system health'
            };
        }
    }

    /**
     * Get performance statistics
     */
    async getStats(): Promise<ClientAPIResponse> {
        try {
            const response = await fetch(`${this.baseUrl}/api/stats`);
            const data = await response.json();

            return {
                success: data.success,
                data: data.stats,
                error: data.error
            };
        } catch (error) {
            console.error('Stats retrieval error:', error);
            return {
                success: false,
                error: 'Failed to retrieve performance statistics'
            };
        }
    }

    /**
     * Validate user input
     */
    async validateInput(input: string): Promise<ClientAPIResponse> {
        try {
            const response = await fetch(`${this.baseUrl}/api/validate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ input })
            });

            const data = await response.json();

            return {
                success: data.success,
                data: data.validation,
                error: data.error
            };
        } catch (error) {
            console.error('Validation error:', error);
            return {
                success: false,
                error: 'Failed to validate input'
            };
        }
    }

    /**
     * Get rate limit status for current IP
     */
    async getRateLimitStatus(): Promise<ClientAPIResponse> {
        try {
            const response = await fetch(`${this.baseUrl}/api/rate-limit`);
            const data = await response.json();

            return {
                success: data.success,
                data: data,
                error: data.error
            };
        } catch (error) {
            console.error('Rate limit status error:', error);
            return {
                success: false,
                error: 'Failed to retrieve rate limit status'
            };
        }
    }

    /**
     * Clear server-side cache (if implemented)
     */
    async clearCache(): Promise<ClientAPIResponse> {
        try {
            const response = await fetch(`${this.baseUrl}/api/cache`, {
                method: 'DELETE'
            });

            const data = await response.json();

            return {
                success: data.success,
                error: data.error
            };
        } catch (error) {
            console.error('Cache clear error:', error);
            return {
                success: false,
                error: 'Failed to clear cache'
            };
        }
    }
}

// Global client instance
export const clientAPI = new ClientAPI();

// Convenience functions
export const analyzeSong = (query: string) => clientAPI.analyzeSong(query);
export const getHealth = () => clientAPI.getHealth();
export const getStats = () => clientAPI.getStats();
export const validateInput = (input: string) => clientAPI.validateInput(input);
export const getRateLimitStatus = () => clientAPI.getRateLimitStatus();
export const clearCache = () => clientAPI.clearCache();