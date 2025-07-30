'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SpotifyTrack } from '../app/api/spotify/search-multiple/route';
import SpotifySearchResults from './SpotifySearchResults';

interface SpotifySearchInputProps {
  onTrackSelect: (track: SpotifyTrack) => void;
  placeholder?: string;
  disabled?: boolean;
}

export default function SpotifySearchInput({
  onTrackSelect,
  placeholder = "Search for any song...",
  disabled = false
}: SpotifySearchInputProps) {
  const [query, setQuery] = useState('');
  const [tracks, setTracks] = useState<SpotifyTrack[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState<string>('');

  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounced search function
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setTracks([]);
      setShowResults(false);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/spotify/search-multiple?q=${encodeURIComponent(searchQuery)}&limit=15`);
      const data = await response.json();

      if (data.success) {
        setTracks(data.tracks || []);
        setShowResults(true);
      } else {
        setError(data.error || 'Search failed');
        setTracks([]);
        setShowResults(false);
      }
    } catch (error) {
      console.error('Search error:', error);
      setError('Network error occurred');
      setTracks([]);
      setShowResults(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle input change with debouncing
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);

    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Set new timeout for debounced search
    if (value.trim()) {
      searchTimeoutRef.current = setTimeout(() => {
        performSearch(value);
      }, 300); // 300ms debounce
    } else {
      setTracks([]);
      setShowResults(false);
    }
  };

  // Handle track selection
  const handleTrackSelect = (track: SpotifyTrack) => {
    setQuery(`${track.artists[0]?.name} - ${track.name}`);
    setShowResults(false);
    onTrackSelect(track);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowResults(false);
      inputRef.current?.blur();
    }
  };

  // Handle clicks outside to close results
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const clearSearch = () => {
    setQuery('');
    setTracks([]);
    setShowResults(false);
    setError('');
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-2xl mx-auto">
      {/* Search Input */}
      <div className="relative">
        <div className="bg-white border-2 sm:border-4 border-black rounded-full shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] sm:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] sm:hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all duration-200">
          <div className="flex items-center px-4 sm:px-6 py-3 sm:py-4">
            {/* Search Icon */}
            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400 mr-3 sm:mr-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>

            {/* Input Field */}
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                if (tracks.length > 0) {
                  setShowResults(true);
                }
              }}
              placeholder={placeholder}
              disabled={disabled}
              className="flex-1 text-sm sm:text-lg text-black placeholder-gray-500 bg-transparent outline-none disabled:opacity-50"
            />

            {/* Loading Spinner */}
            {isLoading && (
              <div className="ml-2 w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin flex-shrink-0"></div>
            )}

            {/* Clear Button */}
            {query && !isLoading && (
              <button
                onClick={clearSearch}
                className="ml-2 text-gray-400 hover:text-gray-600 flex-shrink-0"
                title="Clear search"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-4 bg-red-100 border-2 border-red-500 rounded-lg p-3 shadow-[2px_2px_0px_0px_rgba(239,68,68,1)]">
          <p className="text-red-800 font-bold text-center text-sm">
            ⚠️ {error}
          </p>
        </div>
      )}

      {/* Search Results Dropdown */}
      {showResults && (
        <div className="absolute top-full left-0 right-0 mt-2 z-50">
          <SpotifySearchResults
            tracks={tracks}
            isLoading={isLoading}
            onTrackSelect={handleTrackSelect}
            query={query}
          />
        </div>
      )}


    </div>
  );
}