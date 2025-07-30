'use client';

import React, { useState } from 'react';
import SpotifyPlayer from '../components/SpotifyPlayer';
import SpotifySearchInput from '../components/SpotifySearchInput';

import { searchSpotifyTrack, parseSpotifyQuery, type SpotifyTrack } from '../lib/spotify';
import { analyzeSong, getRateLimitStatus } from '../lib/client-api';
import { copyToClipboard } from '../lib/shareUtils';
import { SpotifyTrack as SearchSpotifyTrack } from './api/spotify/search-multiple/route';

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [songQuery, setSongQuery] = useState('');
  const [result, setResult] = useState<any>(null);
  const [rateLimitInfo, setRateLimitInfo] = useState<any>(null);
  const [validationError, setValidationError] = useState<string>('');
  const [currentExampleIndex, setCurrentExampleIndex] = useState(0);
  const [spotifyTrack, setSpotifyTrack] = useState<SpotifyTrack | null>(null);
  const [spotifyLoading, setSpotifyLoading] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<SearchSpotifyTrack | null>(null);

  // Example songs array
  const exampleSongs = [
    'The Beatles - Yesterday',
    'Queen - Bohemian Rhapsody',
    'Bob Dylan - Like a Rolling Stone',
    'Nirvana - Smells Like Teen Spirit',
    'Johnny Cash - Hurt'
  ];

  // Validate input format (Artist - Title)
  const validateInput = (input: string): string => {
    const trimmed = input.trim();

    if (!trimmed) {
      return 'Please enter a song to analyze';
    }

    if (!trimmed.includes(' - ')) {
      return 'Please use the format: Artist - Song Title';
    }

    const parts = trimmed.split(' - ');
    if (parts.length !== 2) {
      return 'Please use the format: Artist - Song Title';
    }

    const [artist, title] = parts;
    if (!artist?.trim() || !title?.trim()) {
      return 'Both artist and song title are required';
    }

    if (artist.trim().split(' ').length < 1 || title.trim().split(' ').length < 1) {
      return 'Please provide both artist name and song title';
    }

    return '';
  };

  // Handle track selection from enhanced search
  const handleTrackSelect = async (track: SearchSpotifyTrack) => {
    setSelectedTrack(track);
    const formattedQuery = `${track.artists[0]?.name} - ${track.name}`;
    setSongQuery(formattedQuery);
    
    // Convert SearchSpotifyTrack to SpotifyTrack format for compatibility
    const compatibleTrack: SpotifyTrack = {
      id: track.id,
      name: track.name,
      artists: track.artists,
      album: track.album,
      preview_url: track.preview_url,
      external_urls: track.external_urls
    };
    
    setSpotifyTrack(compatibleTrack);
    
    // Automatically start analysis
    await analyzeSongFromTrack(formattedQuery, compatibleTrack);
  };

  // Analyze song from selected track
  const analyzeSongFromTrack = async (query: string, track: SpotifyTrack) => {
    setValidationError('');
    setIsLoading(true);
    setResult(null);

    try {
      console.log('🎵 Analyzing selected song:', query);

      // Use the secure client API helper
      const analysisResult = await analyzeSong(query);

      setResult(analysisResult);

      // Update rate limit info if available
      if (analysisResult.rateLimitInfo) {
        setRateLimitInfo(analysisResult.rateLimitInfo);
      }
    } catch (error) {
      console.error('❌ Analysis failed:', error);
      setResult({
        success: false,
        error: 'Network error occurred while analyzing the song'
      });
    }

    setIsLoading(false);
  };

  const testSongAnalysis = async () => {
    const error = validateInput(songQuery);
    if (error) {
      setValidationError(error);
      return;
    }

    setValidationError('');
    setIsLoading(true);
    setResult(null);
    setSpotifyTrack(null);

    try {
      console.log('🎵 Analyzing song:', songQuery);

      // Search for Spotify track
      setSpotifyLoading(true);
      const { artist, songTitle } = parseSpotifyQuery(songQuery);
      console.log('Searching Spotify for:', { artist, songTitle });

      try {
        const track = await searchSpotifyTrack(artist, songTitle);
        console.log('Spotify track found:', track);
        setSpotifyTrack(track);
      } catch (spotifyError) {
        console.warn('Spotify search failed, continuing without preview:', spotifyError);
        setSpotifyTrack(null);
      }
      setSpotifyLoading(false);

      // Use the secure client API helper
      const analysisResult = await analyzeSong(songQuery);

      setResult(analysisResult);

      // Update rate limit info if available
      if (analysisResult.rateLimitInfo) {
        setRateLimitInfo(analysisResult.rateLimitInfo);
      }
    } catch (error) {
      console.error('❌ Analysis failed:', error);
      setResult({
        success: false,
        error: 'Network error occurred while analyzing the song'
      });
      setSpotifyLoading(false);
    }

    setIsLoading(false);
  };

  const loadRateLimitStatus = async () => {
    try {
      const status = await getRateLimitStatus();

      if (status.success) {
        setRateLimitInfo(status.data.rateLimit);
      }
    } catch (error) {
      console.error('Failed to load rate limit status:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      testSongAnalysis();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSongQuery(e.target.value);
    if (validationError) {
      setValidationError('');
    }
  };

  const tryNextExample = () => {
    const nextIndex = (currentExampleIndex + 1) % exampleSongs.length;
    setCurrentExampleIndex(nextIndex);
    setSongQuery(exampleSongs[nextIndex] || '');
    if (validationError) {
      setValidationError('');
    }
  };



  const handleShareClick = async () => {
    if (!result?.success || !result.data?.shareUrl) {
      return;
    }

    setShareLoading(true);
    setShareSuccess(false);

    try {
      await copyToClipboard(result.data.shareUrl);
      setShareSuccess(true);
      
      // Reset success state after 3 seconds
      setTimeout(() => {
        setShareSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Failed to copy share link:', error);
      // Fallback: try to select the URL for manual copying
      try {
        const textArea = document.createElement('textarea');
        textArea.value = result.data.shareUrl;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        setShareSuccess(true);
        setTimeout(() => setShareSuccess(false), 3000);
      } catch (fallbackError) {
        console.error('Fallback copy also failed:', fallbackError);
      }
    } finally {
      setShareLoading(false);
    }
  };

  // Format reset time for display
  const formatResetTime = (hours: number): string => {
    if (hours >= 24) {
      const days = Math.floor(hours / 24);
      const remainingHours = hours % 24;
      if (remainingHours === 0) {
        return days === 1 ? '1 day' : `${days} days`;
      } else {
        return days === 1 
          ? `1 day ${remainingHours}h` 
          : `${days} days ${remainingHours}h`;
      }
    } else if (hours >= 1) {
      return hours === 1 ? '1 hour' : `${hours} hours`;
    } else {
      // For less than 1 hour, show "less than 1 hour"
      return 'less than 1 hour';
    }
  };

  // Load rate limit status on component mount
  React.useEffect(() => {
    loadRateLimitStatus();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100">
      {/* Header */}
      <header className="border-b-4 border-black bg-white/90 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-black rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-white text-lg sm:text-xl font-bold">🎵</span>
              </div>
              <h1 className="text-lg sm:text-2xl font-black text-black truncate">Song2Meaning</h1>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              {/* GitHub Link */}
              <a
                href="https://github.com/4regab/song2meaning"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-gray-900 hover:bg-gray-800 border-2 border-black px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] transition-all duration-150 flex items-center gap-1 sm:gap-2"
                title="View source code on GitHub"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
                <span className="text-xs sm:text-sm font-bold text-white hidden min-[480px]:inline">GitHub</span>
              </a>

              {/* Rate Limit Badge */}
              {rateLimitInfo && (
                <div className="bg-yellow-300 border-2 border-black px-2 sm:px-3 py-1 rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  <span className="text-xs sm:text-sm font-bold text-black whitespace-nowrap">
                    {rateLimitInfo.remaining}/5
                    <span className="hidden sm:inline"> left</span>
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Hero Section */}
        <div className="text-center py-8 sm:py-12 lg:py-20">
          <h2 className="text-3xl sm:text-4xl lg:text-6xl font-black text-black mb-4 sm:mb-6 leading-tight">
            Discover the deeper<br />
            <span className="text-purple-600">meaning</span> behind music
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-gray-600 mb-6 sm:mb-8 lg:mb-12 max-w-2xl mx-auto px-4">
            AI-powered song analysis that reveals themes, cultural context, and hidden meanings in your favorite tracks.
          </p>

          {/* Smart Search Interface */}
          <div className="max-w-2xl mx-auto mb-6 sm:mb-8">
            <SpotifySearchInput
              onTrackSelect={handleTrackSelect}
              placeholder="Search for any song... (e.g., Bohemian Rhapsody, Taylor Swift, Beatles)"
              disabled={isLoading || (rateLimitInfo && rateLimitInfo.remaining === 0)}
            />

            {/* Validation Error */}
            {validationError && (
              <div className="mt-4 bg-red-100 border-2 border-red-500 rounded-lg p-3 shadow-[2px_2px_0px_0px_rgba(239,68,68,1)]">
                <p className="text-red-800 font-bold text-center text-sm">
                  ⚠️ {validationError}
                </p>
              </div>
            )}





            {/* Spotify Player with Loading State */}
            {(spotifyTrack || spotifyLoading) && (
              <div className="mt-4 sm:mt-6">
                {isLoading && spotifyTrack ? (
                  <div className="bg-purple-50 border-2 border-purple-500 rounded-xl p-4 sm:p-6 shadow-[2px_2px_0px_0px_rgba(147,51,234,1)] sm:shadow-[3px_3px_0px_0px_rgba(147,51,234,1)] mb-4">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                      <h4 className="font-bold text-purple-800 text-base sm:text-lg mb-1">Analyzing song meaning</h4>
                      <p className="text-purple-600 text-xs sm:text-sm">Play the preview below while I analyze the deeper meaning!</p>
                    </div>
                  </div>
                ) : null}

                <SpotifyPlayer
                  track={spotifyTrack}
                  isLoading={spotifyLoading}
                  autoPlay={false}
                />
              </div>
            )}

            {/* Rate Limit Warning */}
            {rateLimitInfo && rateLimitInfo.remaining === 0 && (
              <div className="mt-4 sm:mt-6 bg-red-100 border-2 border-red-500 rounded-lg p-3 sm:p-4 shadow-[2px_2px_0px_0px_rgba(239,68,68,1)]">
                <p className="text-red-800 font-bold text-center text-sm sm:text-base">
                  ⚠️ Rate limit reached! Try again in {formatResetTime(rateLimitInfo.resetIn)}.
                </p>
              </div>
            )}
          </div>
        </div>



        {/* Results Section */}
        {result && (
          <div className="mt-2">
            <div className={`border-2 sm:border-4 rounded-xl sm:rounded-2xl p-4 sm:p-8 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] sm:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] ${result.success
              ? 'bg-green-50 border-green-500'
              : 'bg-red-50 border-red-500'
              }`}>
              {result.success ? (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xl">✓</span>
                      </div>
                      <div>
                        <h3 className="text-2xl font-black text-black">Analysis Complete</h3>
                        <p className="text-gray-600">Here's what we discovered about your song</p>
                      </div>
                    </div>

                    {/* Share Button */}
                    {result.data?.shareUrl && (
                      <button
                        onClick={handleShareClick}
                        disabled={shareLoading}
                        className={`flex items-center gap-2 font-bold px-4 py-2 border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] transition-all duration-150 ${
                          shareSuccess
                            ? 'bg-green-500 text-white'
                            : 'bg-blue-500 hover:bg-blue-600 text-white'
                        }`}
                        title={shareSuccess ? 'Link copied to clipboard!' : 'Copy share link to clipboard'}
                      >
                        {shareLoading ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>Copying...</span>
                          </>
                        ) : shareSuccess ? (
                          <>
                            <span>✓</span>
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                            </svg>
                            <span>Share</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {result.data && (
                    <div className="grid gap-6">
                      {/* Overview with Key Themes */}
                      <div className="bg-white border-2 border-black rounded-xl p-6 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                        <h4 className="text-xl font-black text-black mb-3 flex items-center gap-2">
                          📖 Overview
                        </h4>
                        <p className="text-gray-800 leading-relaxed mb-4">{result.data.overview}</p>

                        {/* Key Themes as subcategory */}
                        {result.data.themes && result.data.themes.length > 0 && (
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <h5 className="text-lg font-bold text-black mb-2 flex items-center gap-2">
                              🎭 Key Themes
                            </h5>
                            <div className="flex flex-wrap gap-2">
                              {result.data.themes.map((theme: string, index: number) => (
                                <span
                                  key={index}
                                  className="bg-purple-200 border-2 border-purple-500 text-purple-800 font-bold px-3 py-1 rounded-lg shadow-[2px_2px_0px_0px_rgba(147,51,234,1)]"
                                >
                                  {theme}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Deep Dive */}
                      <div className="bg-white border-2 border-black rounded-xl p-6 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                        <h4 className="text-xl font-black text-black mb-3 flex items-center gap-2">
                          🔍 Deep Dive
                        </h4>
                        <p className="text-gray-800 leading-relaxed">{result.data.deepDive}</p>
                      </div>

                      {/* Cultural Context */}
                      <div className="bg-white border-2 border-black rounded-xl p-6 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                        <h4 className="text-xl font-black text-black mb-3 flex items-center gap-2">
                          💭 Cultural Context
                        </h4>
                        <p className="text-gray-800 leading-relaxed">{result.data.culturalContext}</p>
                      </div>

                      {/* Fallback Notice */}
                      {result.fallback && (
                        <div className="bg-orange-100 border-2 border-orange-500 rounded-xl p-4 shadow-[2px_2px_0px_0px_rgba(249,115,22,1)]">
                          <p className="text-orange-800 font-bold text-center">
                            ⚠️ This analysis was generated using fallback mode due to service limitations.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center">
                  <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-white text-2xl">✗</span>
                  </div>
                  <h3 className="text-2xl font-black text-black mb-2">Analysis Failed</h3>
                  <p className="text-red-800 font-medium">{result.error}</p>
                </div>
              )}

              {/* Rate Limit Info */}
              {result.rateLimitInfo && (
                <div className="mt-6 bg-purple-100 border-2 border-purple-500 rounded-lg p-4 shadow-[2px_2px_0px_0px_rgba(147,51,234,1)]">
                  <p className="text-purple-800 font-bold text-center">
                    📊 {result.rateLimitInfo.remaining}/5 requests remaining
                    {result.rateLimitInfo.resetIn && ` • Resets in ${formatResetTime(result.rateLimitInfo.resetIn)}`}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Bottom padding for scroll */}
        <div className="pb-20"></div>
      </main>

      {/* Footer */}
      <footer className="border-t-4 border-black bg-gray-50 py-8 mt-20">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <p className="text-gray-600 font-medium">
            Powered by <span className="font-bold text-black">Gemini AI</span> with Grounding Search •
            Built with <span className="font-bold text-black">Kiro</span>
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Discover the stories behind your favorite songs
          </p>
        </div>
      </footer>
    </div>
  );
}