/**
 * Share Page Component with Server-Side Rendering
 * Displays shared song analyses with SEO optimization
 * Requirements: 1.3, 1.4, 1.5, 3.1
 */

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getAnalysisByShareId } from '@/lib/database';
import ShareButtons from '@/components/ShareButtons';
import SpotifyPlayerWrapper from '@/components/SpotifyPlayerWrapper';

interface SharePageProps {
  params: Promise<{
    shareId: string;
  }>;
}

// Generate dynamic metadata for SEO optimization
export async function generateMetadata({ params }: SharePageProps): Promise<Metadata> {
  const { shareId } = await params;

  try {
    const result = await getAnalysisByShareId(shareId);

    if (!result.success || !result.data) {
      return {
        title: 'Song Analysis Not Found - Song2Meaning',
        description: 'The requested song analysis could not be found.',
      };
    }

    const { artist, songTitle } = result.data;
    
    return {
      title: `${songTitle} by ${artist} - Song Analysis | Song2Meaning`,
      description: `Discover the meaning behind "${songTitle}" by ${artist}. Deep analysis of themes, cultural context, and lyrical interpretation.`,
      openGraph: {
        title: `${songTitle} by ${artist} - Song Analysis`,
        description: `Discover the meaning behind "${songTitle}" by ${artist}. Deep analysis of themes, cultural context, and lyrical interpretation.`,
        type: 'article',
        url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/share/${shareId}`,
      },
      twitter: {
        card: 'summary_large_image',
        title: `${songTitle} by ${artist} - Song Analysis`,
        description: `Discover the meaning behind "${songTitle}" by ${artist}. Deep analysis of themes, cultural context, and lyrical interpretation.`,
      },
    };
  } catch (error) {
    console.error('Error generating metadata for share page:', error);
    return {
      title: 'Song Analysis - Song2Meaning',
      description: 'Discover the meaning behind your favorite songs.',
    };
  }
}

export default async function SharePage({ params }: SharePageProps) {
  const { shareId } = await params;

  // Fetch analysis data server-side
  const result = await getAnalysisByShareId(shareId);

  // Handle not found or error cases
  if (!result.success || !result.data) {
    notFound();
  }

  const { 
    artist, 
    songTitle, 
    overview, 
    themes, 
    deepDive, 
    culturalContext,
    createdAt,
    accessCount,
    fromCache 
  } = result.data;

  // Format the creation date
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Unknown date';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return 'Unknown date';
    }
  };

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
              <Link href="/" className="hover:opacity-80 transition-opacity">
                <h1 className="text-lg sm:text-2xl font-black text-black truncate">Song2Meaning</h1>
              </Link>
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
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Song Header */}
        <div className="text-center pt-8 sm:pt-12 pb-4 sm:pb-6">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-black mb-2 sm:mb-4 leading-tight">
            {songTitle}
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 mb-4 sm:mb-6">
            by <span className="font-bold text-purple-600">{artist}</span>
          </p>
          
          {/* Metadata */}
          <div className="flex flex-wrap justify-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-500 mb-6">
            <span className="bg-white border-2 border-black px-2 sm:px-3 py-1 rounded-lg shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
              Analyzed on {formatDate(createdAt)}
            </span>
            <span className="bg-white border-2 border-black px-2 sm:px-3 py-1 rounded-lg shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
              {accessCount} {accessCount === 1 ? 'view' : 'views'}
            </span>
          </div>

          {/* Spotify Player */}
          <div className="flex justify-center mb-4">
            <div className="w-full max-w-md">
              <SpotifyPlayerWrapper artist={artist} songTitle={songTitle} />
            </div>
          </div>
        </div>

        {/* Analysis Content */}
        <div className="mt-0">
          <div className="border-2 sm:border-4 rounded-xl sm:rounded-2xl p-4 sm:p-8 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] sm:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] bg-green-50 border-green-500">
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
              <div className="flex items-center gap-2">
                <ShareButtons 
                  shareUrl={`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/share/${shareId}`}
                  songTitle={songTitle}
                  artist={artist}
                />
              </div>
            </div>

            {/* Overview */}
            <section className="mb-8">
              <h2 className="text-2xl font-black text-black mb-4 flex items-center gap-2">
                <span className="text-2xl">📖</span>
                Overview
              </h2>
              <div className="bg-white border-2 border-black rounded-lg p-4 sm:p-6 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <p className="text-gray-800 leading-relaxed">{overview}</p>
              </div>
            </section>

            {/* Themes */}
            <section className="mb-8">
              <h2 className="text-2xl font-black text-black mb-4 flex items-center gap-2">
                <span className="text-2xl">🎯</span>
                Key Themes
              </h2>
              <div className="bg-white border-2 border-black rounded-lg p-4 sm:p-6 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex flex-wrap gap-2">
                  {themes.map((theme, index) => (
                    <span
                      key={index}
                      className="bg-purple-600 text-white px-3 py-1.5 rounded-full text-sm font-bold border-2 border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                    >
                      {theme}
                    </span>
                  ))}
                </div>
              </div>
            </section>

            {/* Deep Dive */}
            <section className="mb-8">
              <h2 className="text-2xl font-black text-black mb-4 flex items-center gap-2">
                <span className="text-2xl">🔍</span>
                Deep Dive
              </h2>
              <div className="bg-white border-2 border-black rounded-lg p-4 sm:p-6 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <div className="text-gray-800 leading-relaxed whitespace-pre-line">
                  {deepDive}
                </div>
              </div>
            </section>

            {/* Cultural Context */}
            <section className="mb-8">
              <h2 className="text-2xl font-black text-black mb-4 flex items-center gap-2">
                <span className="text-2xl">🌍</span>
                Cultural Context
              </h2>
              <div className="bg-white border-2 border-black rounded-lg p-4 sm:p-6 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <div className="text-gray-800 leading-relaxed whitespace-pre-line">
                  {culturalContext}
                </div>
              </div>
            </section>
          </div>

          {/* Call to Action */}
          <div className="text-center mt-8">
            <Link
              href="/"
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-6 sm:px-8 py-2.5 sm:py-3 border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] sm:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] sm:hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] sm:active:translate-x-[2px] active:translate-y-[1px] sm:active:translate-y-[2px] transition-all duration-150"
            >
              Analyze Another Song
            </Link>
          </div>
        </div>
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