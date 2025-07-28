/**
 * Gemini AI API Integration
 * Handles authentication, requests, and response processing
 */

export interface GeminiConfig {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
  maxRetries?: number;
}

export interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
}

export interface AnalysisResult {
  songTitle: string;
  artist: string;
  overview: string;
  themes: string[];
  deepDive: string;
  culturalContext: string;
}

class GeminiClient {
  private config: GeminiConfig;

  constructor(config: GeminiConfig) {
    this.config = {
      baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
      timeout: 30000,
      maxRetries: 3,
      ...config
    };
  }

  /**
   * Make authenticated request to Gemini API with retry logic
   */
  private async makeRequest(
    endpoint: string, 
    body: any, 
    retryCount = 0
  ): Promise<GeminiResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(`${this.config.baseUrl}${endpoint}?key=${this.config.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 429 && retryCount < this.config.maxRetries!) {
          // Rate limit hit, exponential backoff
          const delay = Math.pow(2, retryCount) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
          return this.makeRequest(endpoint, body, retryCount + 1);
        }
        
        throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout - please try again');
      }
      
      if (retryCount < this.config.maxRetries! && error instanceof Error) {
        const delay = Math.pow(2, retryCount) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.makeRequest(endpoint, body, retryCount + 1);
      }
      
      throw error;
    }
  }

  /**
   * Generate content using Gemini AI
   */
  async generateContent(prompt: string): Promise<string> {
    const body = {
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
      }
    };

    const response = await this.makeRequest('/models/gemini-2.5-flash:generateContent', body);
    
    if (!response.candidates || response.candidates.length === 0) {
      throw new Error('No response generated from Gemini AI');
    }

    const candidate = response.candidates[0];
    if (!candidate?.content?.parts?.[0]?.text) {
      throw new Error('Invalid response format from Gemini AI');
    }

    return candidate.content.parts[0].text;
  }

  /**
   * Generate content with grounding search for enhanced context
   */
  async generateWithGrounding(prompt: string, _searchQuery?: string): Promise<string> {
    const body = {
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      tools: [{
        google_search: {}
      }],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
      }
    };

    try {
      const response = await this.makeRequest('/models/gemini-2.5-flash:generateContent', body);
      
      if (!response.candidates || response.candidates.length === 0) {
        throw new Error('No response generated from Gemini AI with grounding');
      }

      const candidate = response.candidates[0];
      if (!candidate?.content?.parts?.[0]?.text) {
        throw new Error('Invalid response format from Gemini AI with grounding');
      }

      return candidate.content.parts[0].text;
    } catch (error) {
      // Fallback to standard generation if grounding fails
      console.warn('Grounding search failed, using standard generation:', error);
      return this.generateContent(prompt);
    }
  }
}

// Singleton instance
let geminiClient: GeminiClient | null = null;

/**
 * Get configured Gemini client instance
 */
export function getGeminiClient(): GeminiClient {
  if (!geminiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }
    
    geminiClient = new GeminiClient({ apiKey });
  }
  
  return geminiClient;
}

/**
 * Create structured prompt for song analysis
 */
export function createSongAnalysisPrompt(artist: string, songTitle: string): string {
  return `Analyze the song "${songTitle}" by ${artist}. Provide a comprehensive analysis in the following structured format:

**SONG INFO:**
Title: ${songTitle}
Artist: ${artist}

**ANALYSIS:**

**Overview:** (2-3 sentences summarizing the song's main meaning and message)

**Themes:** (List 3-5 key themes, separated by commas)

**Deep Dive:** (Detailed analysis of lyrics, metaphors, and literary devices - 2-3 paragraphs)

**Cultural Context:** (Historical, social, or cultural background that influenced the song - 1-2 paragraphs)

Please ensure your analysis is insightful, accurate, and accessible to general audiences. Focus on the song's emotional impact, artistic techniques, and broader significance.`;
}

/**
 * Parse Gemini AI response into structured analysis result
 */
export function parseAnalysisResponse(response: string, artist: string, songTitle: string): AnalysisResult {
  try {
    // Extract sections using regex patterns
    const overviewMatch = response.match(/\*\*Overview:\*\*\s*(.*?)(?=\*\*|$)/s);
    const themesMatch = response.match(/\*\*Themes:\*\*\s*(.*?)(?=\*\*|$)/s);
    const deepDiveMatch = response.match(/\*\*Deep Dive:\*\*\s*(.*?)(?=\*\*|$)/s);
    const culturalMatch = response.match(/\*\*Cultural Context:\*\*\s*(.*?)(?=\*\*|$)/s);

    const overview = overviewMatch?.[1]?.trim() || 'Analysis overview not available.';
    const themesText = themesMatch?.[1]?.trim() || '';
    const themes = themesText ? themesText.split(',').map(t => t.trim()).filter(t => t) : [];
    const deepDive = deepDiveMatch?.[1]?.trim() || 'Detailed analysis not available.';
    const culturalContext = culturalMatch?.[1]?.trim() || 'Cultural context not available.';

    return {
      songTitle,
      artist,
      overview,
      themes,
      deepDive,
      culturalContext
    };
  } catch (error) {
    // Fallback parsing if structured format fails
    return {
      songTitle,
      artist,
      overview: response.substring(0, 200) + '...',
      themes: ['Analysis', 'Meaning', 'Interpretation'],
      deepDive: response,
      culturalContext: 'Cultural context analysis not available.'
    };
  }
}