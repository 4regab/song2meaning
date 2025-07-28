/**
 * Spotify Player Component
 * Displays Spotify track info and provides playback controls
 */

'use client';

import React, { useState, useEffect } from 'react';
import { SpotifyTrack } from '../lib/spotify';

interface SpotifyPlayerProps {
  track: SpotifyTrack | null;
  isLoading: boolean;
  autoPlay?: boolean;
}

export default function SpotifyPlayer({ track, isLoading, autoPlay = false }: SpotifyPlayerProps) {
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [alternativePreviewUrl, setAlternativePreviewUrl] = useState<string | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  // ALL HOOKS MUST BE AT THE TOP - BEFORE ANY EARLY RETURNS
  useEffect(() => {
    return () => {
      if (audio) {
        audio.pause();
        audio.src = '';
      }
    };
  }, [audio]);

  // Reset alternative preview when track changes
  useEffect(() => {
    setAlternativePreviewUrl(null);
    setIsLoadingPreview(false);
  }, [track?.id]);

  // Try to find alternative preview URL when official one is not available - ONLY ONCE
  useEffect(() => {
    if (track?.id && !track.preview_url && !alternativePreviewUrl && !isLoadingPreview) {
      const findAlternativePreview = async () => {
        setIsLoadingPreview(true);
        try {
          const params = new URLSearchParams();
          params.append('trackId', track.id);

          const response = await fetch(`/api/spotify/preview?${params}`);
          const data = await response.json();

          if (data.success && data.preview_url) {
            setAlternativePreviewUrl(data.preview_url);
          }
        } catch (error) {
          console.error('Failed to find alternative preview:', error);
        } finally {
          setIsLoadingPreview(false);
        }
      };

      findAlternativePreview();
    }
  }, [track?.id, track?.preview_url, alternativePreviewUrl, isLoadingPreview]);

  // Only log once when track changes
  useEffect(() => {
    if (track) {
      console.log('SpotifyPlayer track loaded:', track.name, 'Preview URL:', track.preview_url);
    }
  }, [track?.id, track?.name, track?.preview_url]);

  const handlePlay = async () => {
    const previewUrl = track?.preview_url || alternativePreviewUrl;
    if (!previewUrl) return;

    try {
      if (isPlaying && audio) {
        audio.pause();
        setIsPlaying(false);
      } else {
        // Stop any existing audio
        if (audio) {
          audio.pause();
          audio.currentTime = 0;
        }

        // Create new audio element
        const newAudio = new Audio(previewUrl);
        newAudio.volume = volume;

        // Set up event listeners
        newAudio.addEventListener('play', () => setIsPlaying(true));
        newAudio.addEventListener('pause', () => setIsPlaying(false));
        newAudio.addEventListener('ended', () => setIsPlaying(false));
        newAudio.addEventListener('error', () => setIsPlaying(false));

        setAudio(newAudio);
        await newAudio.play();
      }
    } catch (error) {
      console.error('Playback error:', error);
      setIsPlaying(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white/95 backdrop-blur-sm border-2 border-black rounded-xl p-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gray-200 rounded-lg animate-pulse"></div>
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
            <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!track) {
    return (
      <div className="bg-white/95 backdrop-blur-sm border-2 border-black rounded-xl p-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
        <div className="text-center text-gray-500">
          <span className="text-2xl">🎵</span>
          <p className="text-sm mt-2">No Spotify track found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/95 backdrop-blur-sm border-2 border-black rounded-xl p-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
      <div className="flex items-center gap-3">
        {/* Album Art */}
        <div className="flex-shrink-0">
          <img
            src={track.album.images[0]?.url || '/placeholder-album.png'}
            alt={`${track.album.name} cover`}
            className="w-16 h-16 rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
          />
        </div>

        {/* Play/Pause Button - Beside the image */}
        <button
          onClick={handlePlay}
          disabled={!track.preview_url && !alternativePreviewUrl && !isLoadingPreview}
          className={`flex-shrink-0 w-12 h-12 ${track.preview_url || alternativePreviewUrl
            ? 'bg-green-500 hover:bg-green-600'
            : isLoadingPreview
              ? 'bg-yellow-500 animate-pulse'
              : 'bg-gray-400 cursor-not-allowed opacity-50'
            } border-2 border-black rounded-full flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] transition-all duration-150`}
          title={
            track.preview_url || alternativePreviewUrl
              ? (isPlaying ? 'Pause preview' : 'Play preview')
              : isLoadingPreview
                ? 'Finding preview...'
                : 'No preview available'
          }
        >
          <span className="text-white text-lg">
            {isLoadingPreview ? '🔍' :
              (!track.preview_url && !alternativePreviewUrl) ? '❌' :
                (isPlaying ? '⏸️' : '▶️')}
          </span>
        </button>

        {/* Track Info */}
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-black truncate">{track.name}</h4>
          <p className="text-gray-600 text-sm truncate">
            {track.artists.map(artist => artist.name).join(', ')}
          </p>
          <p className="text-gray-500 text-xs truncate">{track.album.name}</p>
        </div>

        {/* Spotify Link */}
        <a
          href={track.external_urls.spotify}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-shrink-0 w-8 h-8 bg-green-500 hover:bg-green-600 border-2 border-black rounded-lg flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] transition-all duration-150"
          title="Open in Spotify"
        >
          <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z" />
          </svg>
        </a>
      </div>
    </div>
  );
}