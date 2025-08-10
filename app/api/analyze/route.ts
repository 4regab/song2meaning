/**
 * Secure Song Analysis API Route with Rate Limiting and Caching
 * Handles song analysis requests on the server-side to keep API key secure
 * Limits each IP to 5 analyses per day
 * Integrates Supabase caching to reduce API calls and enable sharing
 */

import { NextRequest, NextResponse } from 'next/server';
import { api } from '../../../lib/api';
import { songAnalysisRateLimit, getClientIP } from '../../../lib/rateLimiter';
import { getCachedAnalysis, storeAnalysis, type EnhancedAnalysisResult } from '../../../lib/database';
import { parseSearchQuery } from '../../../lib/songAnalysis';

/**
 * Shared handler for song analysis logic.
 * @param request - The NextRequest object.
 * @param query - The song query string.
 * @returns A NextResponse object.
 */
async function handleAnalysisRequest(request: NextRequest, query: string | null) {
  const clientIP = getClientIP(request);

  // Validate input
  if (!query || typeof query !== 'string') {
    const rateLimitStatus = songAnalysisRateLimit.getStatus(request);
    return NextResponse.json({
      success: false,
      error: 'Query parameter is required and must be a string',
      rateLimitInfo: {
        remaining: rateLimitStatus.remaining,
        resetTime: rateLimitStatus.resetTime,
      }
    }, { status: 400 });
  }

  if (query.trim().length === 0) {
    const rateLimitStatus = songAnalysisRateLimit.getStatus(request);
    return NextResponse.json({
      success: false,
      error: 'Query cannot be empty',
      rateLimitInfo: {
        remaining: rateLimitStatus.remaining,
        resetTime: rateLimitStatus.resetTime,
      }
    }, { status: 400 });
  }

  if (query.length > 200) {
    const rateLimitStatus = songAnalysisRateLimit.getStatus(request);
    return NextResponse.json({
      success: false,
      error: 'Query is too long (maximum 200 characters)',
      rateLimitInfo: {
        remaining: rateLimitStatus.remaining,
        resetTime: rateLimitStatus.resetTime,
      }
    }, { status: 400 });
  }

  // Parse the query to extract artist and song title
  console.log(`🎵 Analyzing song: "${query}" for IP: ${clientIP}`);
  const parsedQuery = parseSearchQuery(query);

  let analysisResult: EnhancedAnalysisResult;
  let fromCache = false;

  try {
    // First, check if we have a cached result
    console.log(`🔍 Checking cache for: ${parsedQuery.artist} - ${parsedQuery.songTitle}`);
    const cacheResult = await getCachedAnalysis(parsedQuery.artist, parsedQuery.songTitle);
    
    if (cacheResult.success && cacheResult.data) {
      // Cache hit - return cached result
      console.log(`✅ Cache hit for: ${parsedQuery.artist} - ${parsedQuery.songTitle}`);
      analysisResult = cacheResult.data;
      fromCache = true;
    } else {
      // Cache miss - perform fresh analysis
      console.log(`❌ Cache miss, performing fresh analysis for: ${parsedQuery.artist} - ${parsedQuery.songTitle}`);
      
      if (!cacheResult.success) {
        console.warn(`⚠️ Database cache check failed: ${cacheResult.error} - proceeding with fresh analysis`);
      }
      
      const freshResult = await api.analyzeSong(query);
      
      if (!freshResult.success) {
        // Increment rate limit counter even for failed analysis
        songAnalysisRateLimit.increment(request);
        const updatedStatus = songAnalysisRateLimit.getStatus(request);
        
        return NextResponse.json({
          success: false,
          error: freshResult.error,
          rateLimitInfo: {
            remaining: updatedStatus.remaining,
            resetTime: updatedStatus.resetTime,
            used: updatedStatus.count
          }
        }, { status: 500 });
      }
      
      // Store the fresh result in the database
      try {
        console.log('💾 Storing analysis result in database');
        const storeResult = await storeAnalysis(freshResult.data!);

        if (storeResult.success && storeResult.data) {
          analysisResult = storeResult.data;
          console.log(`✅ Analysis stored with share ID: ${analysisResult.shareId}`);
        } else {
          console.warn(`⚠️ Failed to store analysis in database: ${storeResult.error}`);
          analysisResult = { ...freshResult.data!, fromCache: false };
        }
      } catch (storeError) {
        console.error('❌ Error storing analysis:', storeError);
        analysisResult = { ...freshResult.data!, fromCache: false };
      }

      fromCache = false;
    }
  } catch (error) {
    console.error('❌ Database operation failed:', error);

    // Fallback to fresh analysis if the database is completely unavailable
    console.log('🔄 Falling back to fresh analysis due to database error');
    const freshResult = await api.analyzeSong(query);

    if (!freshResult.success) {
      // Increment rate limit counter even for failed analysis
      songAnalysisRateLimit.increment(request);
      const updatedStatus = songAnalysisRateLimit.getStatus(request);

      return NextResponse.json({
        success: false,
        error: freshResult.error,
        rateLimitInfo: {
          remaining: updatedStatus.remaining,
          resetTime: updatedStatus.resetTime,
          used: updatedStatus.count
        }
      }, { status: 500 });
    }

    analysisResult = { ...freshResult.data!, fromCache: false };
    fromCache = false;

    // Try to store the result even in fallback mode
    try {
      console.log('💾 Storing analysis result in database (fallback)');
      await storeAnalysis(freshResult.data!);
    } catch (storeError) {
      console.error('❌ Error storing analysis in fallback mode:', storeError);
    }
  }

  // If the request was not a cache hit, increment the counter
  if (!fromCache) {
    songAnalysisRateLimit.increment(request);
  }

  const updatedStatus = songAnalysisRateLimit.getStatus(request);

  return NextResponse.json({
    success: true,
    result: analysisResult,
    cache: {
      hit: fromCache,
      source: fromCache ? 'database' : 'fresh'
    },
    rateLimitInfo: {
      remaining: updatedStatus.remaining,
      resetTime: updatedStatus.resetTime,
      used: updatedStatus.count
    }
  }, {
    headers: {
      'X-RateLimit-Limit': '5',
      'X-RateLimit-Remaining': updatedStatus.remaining.toString(),
      'X-RateLimit-Reset': updatedStatus.resetTime.toString(),
      'X-Cache-Status': fromCache ? 'HIT' : 'MISS'
    }
  });
}

export async function POST(request: NextRequest) {
  try {
    const clientIP = getClientIP(request);
    console.log(`📡 POST request from IP: ${clientIP}`);

    // Check rate limit before parsing body
    const rateLimitResult = songAnalysisRateLimit.check(request);
    if (!rateLimitResult.allowed) {
      console.log(`🚫 Rate limit exceeded for IP: ${clientIP}`);
      return NextResponse.json({
        success: false,
        error: rateLimitResult.error,
        rateLimitInfo: {
          remaining: rateLimitResult.remaining,
          resetTime: rateLimitResult.resetTime,
          resetIn: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000 / 60 / 60) // hours
        }
      }, {
        status: 429,
        headers: {
          'X-RateLimit-Limit': '5',
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
          'Retry-After': Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString()
        }
      });
    }

    const body = await request.json();
    const { query } = body;

    return await handleAnalysisRequest(request, query);

  } catch (error) {
    console.error('❌ Song analysis POST API error:', error);
    const status = songAnalysisRateLimit.getStatus(request);
    return NextResponse.json({
      success: false,
      error: 'Internal server error occurred while analyzing the song',
      rateLimitInfo: {
        remaining: status.remaining,
        resetTime: status.resetTime
      }
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const clientIP = getClientIP(request);
    console.log(`📡 GET request from IP: ${clientIP}`);

    // Check rate limit
    const rateLimitResult = songAnalysisRateLimit.check(request);
    if (!rateLimitResult.allowed) {
      console.log(`🚫 Rate limit exceeded for IP (GET): ${clientIP}`);
      return NextResponse.json({
        success: false,
        error: rateLimitResult.error,
        rateLimitInfo: {
          remaining: rateLimitResult.remaining,
          resetTime: rateLimitResult.resetTime,
          resetIn: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000 / 60 / 60) // hours
        }
      }, {
        status: 429,
        headers: {
          'X-RateLimit-Limit': '5',
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
          'Retry-After': Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString()
        }
      });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    return await handleAnalysisRequest(request, query);

  } catch (error) {
    console.error('❌ Song analysis GET API error:', error);
    const status = songAnalysisRateLimit.getStatus(request);
    return NextResponse.json({
      success: false,
      error: 'Internal server error occurred while analyzing the song',
      rateLimitInfo: {
        remaining: status.remaining,
        resetTime: status.resetTime
      }
    }, { status: 500 });
  }
}