'use client';

import React, { useState } from 'react';
import { SpotifyTrack } from '../app/api/spotify/search-multiple/route';

interface SpotifySearchResultsProps {
  tracks: SpotifyTrack[];
  isLoading: boolean;
  onTrackSelect: (track: SpotifyTrack) => void;
  query: string;
}

export default function SpotifySearchResults({
  tracks,
  isLoading,
  onTrackSelect,
  query
}: SpotifySearchResultsProps) {
  const [playingTrack, setPlayingTrack] = useState<string | null>(null);
  const [audioElements, setAudioElements] = useState<{ [key: string]: HTMLAudioElement }>({});

  const handlePreviewPlay = async (track: SpotifyTrack) => {
    if (!track.preview_url) return;

    // Stop any currently playing track
    if (playingTrack && audioElements[playingTrack]) {
      audioElements[playingTrack].pause();
      audioElements[playingTrack].currentTime = 0;
    }

    if (playingTrack === track.id) {
      // If clicking the same track, stop it
      setPlayingTrack(null);
      return;
    }

    try {
      let audio = audioElements[track.id];

      if (!audio) {
        audio = new Audio(track.preview_url);
        audio.volume = 0.5;
        audio.addEventListener('ended', () => {
          setPlayingTrack(null);
        });

        setAudioElements(prev => ({
          ...prev,
          [track.id]: audio
        } as { [key: string]: HTMLAudioElement }));
      }

      await audio.play();
      setPlayingTrack(track.id);
    } catch (error) {
      console.error('Error playing preview:', error);
    }
  };

  const formatDuration = (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getArtistNames = (artists: Array<{ name: string }>): string => {
    return artists.map(artist => artist.name).join(', ');
  };

  const getAlbumImage = (track: SpotifyTrack): string => {
    const images = track.album.images;
    // Get medium size image (usually 300x300)
    return images.find(img => img.height === 300)?.url ||
      images.find(img => img.height && img.height >= 200)?.url ||
      images[0]?.url ||
      '/placeholder-album.svg';
  };

  if (isLoading) {
    return (
      <div className="bg-white border-2 border-gray-300 rounded-xl p-6 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)]">
        <div className="flex items-center justify-center gap-3">
          <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-gray-600 font-medium">Searching Spotify...</span>
        </div>
      </div>
    );
  }

  if (tracks.length === 0) {
    return (
      <div className="bg-white border-2 border-gray-300 rounded-xl p-6 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)]">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-2xl">🔍</span>
          </div>
          <h3 className="text-lg font-bold text-gray-800 mb-2">No results found</h3>
          <p className="text-gray-600">
            Try searching with different keywords or check your spelling.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border-2 border-black rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
      <div className="p-4 border-b-2 border-black">
        <h3 className="text-lg font-bold text-black">
          Found {tracks.length} results for "{query}"
        </h3>
        <p className="text-sm text-gray-600">Click on a song to analyze its meaning</p>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {tracks.map((track, index) => (
          <div
            key={track.id}
            className={`p-4 border-b border-gray-200 hover:bg-purple-50 cursor-pointer transition-colors duration-150 ${index === tracks.length - 1 ? 'border-b-0' : ''
              }`}
            onClick={() => onTrackSelect(track)}
          >
            <div className="flex items-center gap-4">
              {/* Album Art */}
              <div className="relative flex-shrink-0">
                <img
                  src={getAlbumImage(track)}
                  alt={`${track.album.name} cover`}
                  className="w-16 h-16 rounded-lg border-2 border-gray-300 object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/placeholder-album.svg';
                  }}
                />

                {/* Preview Play Button */}
                {track.preview_url && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePreviewPlay(track);
                    }}
                    className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200"
                    title="Play 30-second preview"
                  >
                    {playingTrack === track.id ? (
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                      </svg>
                    ) : (
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    )}
                  </button>
                )}
              </div>

              {/* Track Info */}
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-black text-base truncate">
                  {track.name}
                  {track.explicit && (
                    <span className="ml-2 text-xs bg-gray-600 text-white px-1.5 py-0.5 rounded">
                      E
                    </span>
                  )}
                </h4>
                <p className="text-gray-600 text-sm truncate">
                  by {getArtistNames(track.artists)}
                </p>
                <p className="text-gray-500 text-xs truncate">
                  {track.album.name} • {formatDuration(track.duration_ms)}
                </p>
              </div>

              {/* Popularity & Preview Indicators */}
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                <div className="flex items-center gap-2">
                  {track.preview_url && (
                    <div className="w-2 h-2 bg-green-500 rounded-full" title="Preview available" />
                  )}
                  <div className="text-xs text-gray-500">
                    {track.popularity}% popular
                  </div>
                </div>

                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="p-3 bg-gray-50 border-t border-gray-200 rounded-b-xl">
        <p className="text-xs text-gray-500 text-center">
          🎵 Green dot indicates preview available • Click any song to analyze its meaning
        </p>
      </div>
    </div>
  );
}