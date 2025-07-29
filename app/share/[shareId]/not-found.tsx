/**
 * Not Found Page for Invalid Share IDs
 * Handles cases where share links don't exist
 * Requirements: 1.5
 */

import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
      <div className="text-center px-4">
        <div className="mb-8">
          <h1 className="text-6xl font-bold text-white mb-4">404</h1>
          <h2 className="text-2xl font-semibold text-white mb-4">
            Analysis Not Found
          </h2>
          <p className="text-white/80 mb-8 max-w-md mx-auto">
            The song analysis you're looking for doesn't exist or may have been removed.
          </p>
        </div>
        
        <div className="space-y-4">
          <Link
            href="/"
            className="inline-block bg-white text-purple-900 font-semibold px-8 py-3 rounded-lg hover:bg-white/90 transition-colors"
          >
            Analyze a Song
          </Link>
          
          <div>
            <Link
              href="/"
              className="text-white/60 hover:text-white transition-colors"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}