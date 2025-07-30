/**
 * Enhanced Spotify Search API Route
 * Returns multiple search results for user selection
 */

import { NextRequest, NextResponse } from 'next/server';

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

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
  duration_ms: number;
  explicit: boolean;
  popularity: number;
}

interface SpotifySearchResult {
  tracks: {
    items: SpotifyTrack[];
    total: number;
    limit: number;
    offset: number;
  };
}

/**
 * Get Spotify access token using client credentials flow
 */
async function getSpotifyAccessToken(): Promise<string> {
  if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
    throw new Error('Spotify credentials not configured');
  }

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64')}`
    },
    body: 'grant_type=client_credentials'
  });

  if (!response.ok) {
    throw new Error('Failed to get Spotify access token');
  }

  const data = await response.json();
  return data.access_token;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const limit = parseInt(searchParams.get('limit') || '15');

    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Search query is required' },
        { status: 400 }
      );
    }

    // Validate limit parameter (Spotify API allows 1-50)
    const validLimit = Math.min(Math.max(limit, 1), 50);

    // Get Spotify access token
    const accessToken = await getSpotifyAccessToken();
    
    // Clean and encode the search query
    const cleanQuery = query.trim();
    const encodedQuery = encodeURIComponent(cleanQuery);
    
    // Search for tracks with specified limit
    const searchUrl = `https://api.spotify.com/v1/search?q=${encodedQuery}&type=track&limit=${validLimit}&market=US`;
    
    const response = await fetch(searchUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      console.error('Spotify API error:', response.status, response.statusText);
      return NextResponse.json(
        { success: false, error: 'Failed to search Spotify' },
        { status: response.status }
      );
    }

    const data: SpotifySearchResult = await response.json();
    
    // Sort results by popularity and preview availability
    const sortedTracks = data.tracks.items.sort((a, b) => {
      // Prioritize tracks with preview URLs
      if (a.preview_url && !b.preview_url) return -1;
      if (!a.preview_url && b.preview_url) return 1;
      
      // Then sort by popularity
      return b.popularity - a.popularity;
    });

    console.log(`Spotify search for "${cleanQuery}": found ${sortedTracks.length} tracks`);

    return NextResponse.json({ 
      success: true, 
      tracks: sortedTracks,
      total: data.tracks.total,
      query: cleanQuery
    });

  } catch (error) {
    console.error('Spotify search error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to search Spotify' },
      { status: 500 }
    );
  }
}