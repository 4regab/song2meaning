/**
 * Spotify Player Wrapper Component
 * Client-side wrapper that fetches Spotify track data and renders the player
 */

'use client';

import React, { useState, useEffect } from 'react';
import SpotifyPlayer from './SpotifyPlayer';
import { SpotifyTrack } from '../lib/spotify';

interface SpotifyPlayerWrapperProps {
  artist: string;
  songTitle: string;
}

export default function SpotifyPlayerWrapper({ artist, songTitle }: SpotifyPlayerWrapperProps) {
  const [track, setTrack] = useState<SpotifyTrack | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSpotifyTrack = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const params = new URLSearchParams();
        params.append('artist', artist);
        params.append('track', songTitle);

        const response = await fetch(`/api/spotify/search?${params}`);
        const data = await response.json();

        if (data.success && data.track) {
          setTrack(data.track);
        } else {
          setError(data.error || 'Track not found');
        }
      } catch (err) {
        console.error('Error fetching Spotify track:', err);
        setError('Failed to load Spotify track');
      } finally {
        setIsLoading(false);
      }
    };

    if (artist && songTitle) {
      fetchSpotifyTrack();
    }
  }, [artist, songTitle]);

  // Don't render anything if there's an error or no track found
  if (error || (!isLoading && !track)) {
    return null;
  }

  return (
    <div className="mb-6">
      <SpotifyPlayer 
        track={track} 
        isLoading={isLoading} 
        autoPlay={false} 
      />
    </div>
  );
}