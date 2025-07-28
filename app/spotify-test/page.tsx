'use client';

import { useState } from 'react';

export default function SpotifyTestPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testSpotifySearch = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      console.log('Testing Spotify API...');
      const response = await fetch('/api/spotify/search?artist=Beatles&track=Yesterday');
      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log('API Response:', data);
      setResult(data);
    } catch (err) {
      console.error('Test error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-6">Spotify API Test</h1>
        
        <button
          onClick={testSpotifySearch}
          disabled={loading}
          className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold px-6 py-3 rounded-lg mb-6"
        >
          {loading ? 'Testing...' : 'Test Spotify Search'}
        </button>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <strong>Error:</strong> {error}
          </div>
        )}

        {result && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            <h3 className="font-bold">Success!</h3>
            <pre className="text-xs mt-2 overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}

        <div className="bg-blue-50 p-4 rounded">
          <h3 className="font-bold text-blue-800">Environment Check:</h3>
          <div className="text-blue-700 text-sm mt-2">
            <div>Spotify Client ID: {process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID ? '✅ Set' : '❌ Missing'}</div>
            <div>Current URL: {typeof window !== 'undefined' ? window.location.href : 'Server'}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
