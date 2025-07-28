/**
 * Spotify Preview Scraper API Route
 * Scrapes preview URLs directly from Spotify track pages
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const trackId = searchParams.get('trackId');
        const artist = searchParams.get('artist');
        const track = searchParams.get('track');

        if (!trackId && (!artist || !track)) {
            return NextResponse.json(
                { error: 'Either trackId or artist+track parameters are required' },
                { status: 400 }
            );
        }

        let spotifyUrl: string;

        if (trackId) {
            // Direct track ID provided
            spotifyUrl = `https://open.spotify.com/track/${trackId}`;
            console.log(`Scraping preview from track ID: ${trackId}`);
        } else {
            // Need to search for the track first to get the ID
            console.log(`Searching for track: ${artist} - ${track}`);

            // Use the existing search API to get track ID
            const searchResponse = await fetch(`${request.nextUrl.origin}/api/spotify/search?artist=${encodeURIComponent(artist!)}&track=${encodeURIComponent(track!)}`);
            const searchData = await searchResponse.json();

            if (!searchData.track || !searchData.track.id) {
                return NextResponse.json({
                    success: false,
                    error: 'Track not found on Spotify'
                });
            }

            spotifyUrl = `https://open.spotify.com/track/${searchData.track.id}`;
            console.log(`Found track ID: ${searchData.track.id}`);
        }

        console.log(`Scraping Spotify URL: ${spotifyUrl}`);

        // Fetch the Spotify track page with proper headers
        const response = await fetch(spotifyUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Accept-Encoding': 'gzip, deflate, br',
                'DNT': '1',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1'
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch Spotify page: ${response.status}`);
        }

        const html = await response.text();

        // Extract preview URL from the HTML
        // Look for preview URLs in various formats
        const previewPatterns = [
            /"preview_url":"([^"]+)"/,
            /"audioPreview":{"url":"([^"]+)"/,
            /preview_url['"]\s*:\s*['"]([^'"]+)['"]/,
            /audioPreview['"]\s*:\s*\{[^}]*url['"]\s*:\s*['"]([^'"]+)['"]/,
            /https:\/\/p\.scdn\.co\/mp3-preview\/[a-zA-Z0-9]+/g
        ];

        let previewUrl: string | null = null;

        for (const pattern of previewPatterns) {
            const match = html.match(pattern);
            if (match && match[1]) {
                previewUrl = match[1];
                console.log(`Found preview URL with pattern: ${previewUrl}`);
                break;
            }
        }

        // If no preview found in JSON, try to find direct MP3 links
        if (!previewUrl) {
            const mp3Matches = html.match(/https:\/\/p\.scdn\.co\/mp3-preview\/[a-zA-Z0-9]+/g);
            if (mp3Matches && mp3Matches.length > 0) {
                previewUrl = mp3Matches[0];
                console.log(`Found direct MP3 preview URL: ${previewUrl}`);
            }
        }

        if (previewUrl) {
            // Clean up the URL (remove escape characters)
            previewUrl = previewUrl.replace(/\\u002F/g, '/').replace(/\\/g, '');

            return NextResponse.json({
                success: true,
                preview_url: previewUrl,
                spotify_url: spotifyUrl
            });
        } else {
            console.log('No preview URL found in HTML');
            return NextResponse.json({
                success: false,
                error: 'No preview URL found on Spotify page'
            });
        }

    } catch (error) {
        console.error('Preview scraper error:', error);
        return NextResponse.json(
            { error: 'Failed to scrape preview URL' },
            { status: 500 }
        );
    }
}