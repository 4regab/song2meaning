/**
 * Spotify Integration for Song2Meaning
 * Handles Spotify Web Playback SDK and search functionality
 */

// Spotify configuration is now handled server-side for security

export interface SpotifyTrack {
  id: string;
  name: string;
  artists: Array<{ name: string }>;
  album: {
    name: string;
    images: Array<{ url: string; height: number; width: number }>;
  };
  preview_url: string | null;
  external_urls: {
    spotify: string;
  };
}

export interface SpotifySearchResult {
  tracks: {
    items: SpotifyTrack[];
  };
}

/**
 * Search for a track on Spotify using server-side API
 */
export async function searchSpotifyTrack(artist: string, songTitle: string): Promise<SpotifyTrack | null> {
  try {
    console.log('🎵 Searching Spotify for:', { artist, songTitle });
    
    const params = new URLSearchParams({
      artist: artist.trim(),
      track: songTitle.trim()
    });
    
    const url = `/api/spotify/search?${params}`;
    console.log('🌐 Fetching from:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // Add timeout
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });

    console.log('📡 Response status:', response.status);
    console.log('📡 Response ok:', response.ok);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Spotify API error:', response.status, errorText);
      throw new Error(`Spotify API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ Spotify search successful:', data.track ? 'Track found' : 'No track found');
    
    return data.track || null;
  } catch (error) {
    console.error('❌ Spotify search error:', error);
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        console.error('🕐 Spotify search timeout');
      } else if (error.message.includes('NetworkError')) {
        console.error('🌐 Network error during Spotify search');
      }
    }
    
    // Return null instead of throwing to allow the app to continue
    return null;
  }
}

/**
 * Spotify Web Playback SDK integration
 */
export class SpotifyPlayer {
  private player: any = null;
  private deviceId: string = '';
  private isReady: boolean = false;

  constructor(private accessToken: string) {}

  /**
   * Initialize the Spotify Web Playback SDK
   */
  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Load Spotify Web Playback SDK
      if (!document.querySelector('script[src*="spotify-player.js"]')) {
        const script = document.createElement('script');
        script.src = 'https://sdk.scdn.co/spotify-player.js';
        script.async = true;
        document.body.appendChild(script);
      }

      // Wait for SDK to load
      (window as any).onSpotifyWebPlaybackSDKReady = () => {
        const player = new (window as any).Spotify.Player({
          name: 'Song2Meaning Player',
          getOAuthToken: (cb: (token: string) => void) => {
            cb(this.accessToken);
          },
          volume: 0.5
        });

        // Error handling
        player.addListener('initialization_error', ({ message }: { message: string }) => {
          console.error('Spotify initialization error:', message);
          reject(new Error(message));
        });

        player.addListener('authentication_error', ({ message }: { message: string }) => {
          console.error('Spotify authentication error:', message);
          reject(new Error(message));
        });

        player.addListener('account_error', ({ message }: { message: string }) => {
          console.error('Spotify account error:', message);
          reject(new Error(message));
        });

        // Ready state
        player.addListener('ready', ({ device_id }: { device_id: string }) => {
          console.log('Spotify player ready with Device ID:', device_id);
          this.deviceId = device_id;
          this.isReady = true;
          resolve();
        });

        player.addListener('not_ready', ({ device_id }: { device_id: string }) => {
          console.log('Spotify player not ready, Device ID:', device_id);
          this.isReady = false;
        });

        this.player = player;
        player.connect();
      };
    });
  }

  /**
   * Play a track by Spotify URI
   */
  async playTrack(spotifyUri: string): Promise<void> {
    if (!this.isReady || !this.deviceId) {
      throw new Error('Spotify player not ready');
    }

    try {
      const response = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${this.deviceId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          uris: [spotifyUri]
        })
      });

      if (!response.ok) {
        throw new Error('Failed to play track');
      }
    } catch (error) {
      console.error('Error playing track:', error);
      throw error;
    }
  }

  /**
   * Pause playback
   */
  async pause(): Promise<void> {
    if (this.player) {
      await this.player.pause();
    }
  }

  /**
   * Resume playback
   */
  async resume(): Promise<void> {
    if (this.player) {
      await this.player.resume();
    }
  }

  /**
   * Toggle play/pause
   */
  async togglePlay(): Promise<void> {
    if (this.player) {
      await this.player.togglePlay();
    }
  }

  /**
   * Set volume (0.0 to 1.0)
   */
  async setVolume(volume: number): Promise<void> {
    if (this.player) {
      await this.player.setVolume(volume);
    }
  }

  /**
   * Get current playback state
   */
  async getCurrentState(): Promise<any> {
    if (this.player) {
      return await this.player.getCurrentState();
    }
    return null;
  }

  /**
   * Disconnect the player
   */
  disconnect(): void {
    if (this.player) {
      this.player.disconnect();
    }
  }
}

/**
 * Create a simple audio player for preview URLs
 */
export class PreviewPlayer {
  private audio: HTMLAudioElement | null = null;
  private isPlaying: boolean = false;

  /**
   * Play a preview URL
   */
  async playPreview(previewUrl: string): Promise<void> {
    try {
      console.log('Attempting to play preview:', previewUrl);
      
      if (!previewUrl) {
        throw new Error('No preview URL provided');
      }

      // Stop current audio if playing
      if (this.audio) {
        this.audio.pause();
        this.audio.currentTime = 0;
        this.audio.src = '';
      }

      // Create new audio element
      this.audio = new Audio();
      this.audio.volume = 0.5;
      this.audio.preload = 'metadata';
      this.audio.crossOrigin = 'anonymous';

      // Set up event listeners before setting src
      this.audio.addEventListener('loadstart', () => {
        console.log('Audio loading started');
      });

      this.audio.addEventListener('canplay', () => {
        console.log('Audio can play');
      });

      this.audio.addEventListener('play', () => {
        console.log('Audio started playing');
        this.isPlaying = true;
      });

      this.audio.addEventListener('pause', () => {
        console.log('Audio paused');
        this.isPlaying = false;
      });

      this.audio.addEventListener('ended', () => {
        console.log('Audio ended');
        this.isPlaying = false;
      });

      this.audio.addEventListener('error', (e) => {
        console.error('Audio error:', e);
        this.isPlaying = false;
      });

      // Set source and load
      this.audio.src = previewUrl;
      this.audio.load();

      // Try to play
      const playPromise = this.audio.play();
      if (playPromise !== undefined) {
        await playPromise;
        console.log('Audio playing successfully');
      }
    } catch (error) {
      console.error('Error playing preview:', error);
      this.isPlaying = false;
      
      // Handle autoplay policy errors
      if (error instanceof Error && error.name === 'NotAllowedError') {
        throw new Error('Browser blocked autoplay - click play button');
      }
      
      throw error;
    }
  }

  /**
   * Pause preview
   */
  pause(): void {
    if (this.audio && this.isPlaying) {
      this.audio.pause();
      this.isPlaying = false;
    }
  }

  /**
   * Resume preview
   */
  async resume(): Promise<void> {
    if (this.audio && !this.isPlaying) {
      try {
        await this.audio.play();
        this.isPlaying = true;
      } catch (error) {
        console.error('Error resuming preview:', error);
        throw error;
      }
    }
  }

  /**
   * Stop and cleanup
   */
  stop(): void {
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
      this.audio.src = '';
      this.audio = null;
      this.isPlaying = false;
    }
  }

  /**
   * Set volume (0.0 to 1.0)
   */
  setVolume(volume: number): void {
    if (this.audio) {
      this.audio.volume = Math.max(0, Math.min(1, volume));
    }
  }

  /**
   * Get current playing state
   */
  getIsPlaying(): boolean {
    return this.isPlaying;
  }

  /**
   * Get current time
   */
  getCurrentTime(): number {
    return this.audio?.currentTime || 0;
  }

  /**
   * Get duration
   */
  getDuration(): number {
    return this.audio?.duration || 0;
  }
}

/**
 * Parse artist and song from query for Spotify search
 */
export function parseSpotifyQuery(query: string): { artist: string; songTitle: string } {
  const parts = query.split(' - ');
  if (parts.length >= 2 && parts[0] && parts[1]) {
    return {
      artist: parts[0].trim(),
      songTitle: parts[1].trim()
    };
  }
  
  // Fallback parsing
  const words = query.split(' ');
  if (words.length >= 2 && words[0]) {
    return {
      artist: words[0],
      songTitle: words.slice(1).join(' ')
    };
  }
  
  return {
    artist: 'Unknown',
    songTitle: query
  };
}