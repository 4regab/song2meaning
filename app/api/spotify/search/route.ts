/**
 * Spotify Search API Route
 * Server-side Spotify integration to avoid CORS issues
 */

import { NextRequest, NextResponse } from 'next/server';

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

interface SpotifyTrack {
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

interface SpotifySearchResult {
  tracks: {
    items: SpotifyTrack[];
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
    const artist = searchParams.get('artist');
    const track = searchParams.get('track');

    if (!artist || !track) {
      return NextResponse.json(
        { success: false, error: 'Artist and track parameters are required' },
        { status: 400 }
      );
    }

    // Get Spotify access token
    const accessToken = await getSpotifyAccessToken();
    
    // Search for the track with multiple strategies to find one with preview
    const searchQueries = [
      `artist:"${artist}" track:"${track}"`,
      `artist:${artist} track:${track}`,
      `${artist} ${track}`,
      `track:"${track}" artist:"${artist}"`
    ];

    let spotifyTrack = null;
    
    for (const query of searchQueries) {
      const encodedQuery = encodeURIComponent(query);
      const response = await fetch(`https://api.spotify.com/v1/search?q=${encodedQuery}&type=track&limit=10`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!response.ok) {
        continue;
      }

      const data: SpotifySearchResult = await response.json();
      
      // Try to find a track with preview_url first
      const trackWithPreview = data.tracks.items.find(item => item.preview_url);
      if (trackWithPreview) {
        spotifyTrack = trackWithPreview;
        break;
      }
      
      // If no preview found, use the first result
      if (!spotifyTrack && data.tracks.items[0]) {
        spotifyTrack = data.tracks.items[0];
      }
    }

    console.log('Spotify search result:', spotifyTrack);
    console.log('Preview URL:', spotifyTrack?.preview_url);
    console.log('Has preview:', !!spotifyTrack?.preview_url);

    return NextResponse.json({ 
      success: true, 
      track: spotifyTrack 
    });

  } catch (error) {
    console.error('Spotify search error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to search Spotify' },
      { status: 500 }
    );
  }
}