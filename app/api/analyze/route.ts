/**
 * Secure Song Analysis API Route with Rate Limiting
 * Handles song analysis requests on the server-side to keep API key secure
 * Limits each IP to 5 analyses per hour
 */

import { NextRequest, NextResponse } from 'next/server';
import { api } from '../../../lib/api';
import { songAnalysisRateLimit, getClientIP } from '../../../lib/rateLimiter';

export async function POST(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const clientIP = getClientIP(request);
    console.log('📡 Request from IP:', clientIP);

    // Check rate limit
    const rateLimitResult = songAnalysisRateLimit.check(request);

    if (!rateLimitResult.allowed) {
      console.log('🚫 Rate limit exceeded for IP:', clientIP);

      return NextResponse.json({
        success: false,
        error: rateLimitResult.error,
        rateLimitInfo: {
          remaining: rateLimitResult.remaining,
          resetTime: rateLimitResult.resetTime,
          resetIn: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000 / 60) // minutes
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

    // Parse request body
    const body = await request.json();
    const { query } = body;

    // Validate input
    if (!query || typeof query !== 'string') {
      return NextResponse.json({
        success: false,
        error: 'Query parameter is required and must be a string',
        rateLimitInfo: {
          remaining: rateLimitResult.remaining,
          resetTime: rateLimitResult.resetTime
        }
      }, { status: 400 });
    }

    if (query.trim().length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Query cannot be empty',
        rateLimitInfo: {
          remaining: rateLimitResult.remaining,
          resetTime: rateLimitResult.resetTime
        }
      }, { status: 400 });
    }

    if (query.length > 200) {
      return NextResponse.json({
        success: false,
        error: 'Query is too long (maximum 200 characters)',
        rateLimitInfo: {
          remaining: rateLimitResult.remaining,
          resetTime: rateLimitResult.resetTime
        }
      }, { status: 400 });
    }

    // Perform song analysis using the secure backend
    console.log('🎵 Analyzing song:', query, 'for IP:', clientIP);
    const result = await api.analyzeSong(query);

    // Record the request (rate limit counter was already incremented)
    songAnalysisRateLimit.record(request, result.success);

    // Get updated rate limit status
    const updatedStatus = songAnalysisRateLimit.getStatus(request);

    // Return the result with rate limit info
    return NextResponse.json({
      success: true,
      result,
      rateLimitInfo: {
        remaining: updatedStatus.remaining,
        resetTime: updatedStatus.resetTime,
        used: updatedStatus.count
      }
    }, {
      headers: {
        'X-RateLimit-Limit': '5',
        'X-RateLimit-Remaining': updatedStatus.remaining.toString(),
        'X-RateLimit-Reset': updatedStatus.resetTime.toString()
      }
    });

  } catch (error) {
    console.error('❌ Song analysis API error:', error);

    // Get rate limit status for error response
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

// Handle GET requests with query parameter (also rate limited)
export async function GET(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const clientIP = getClientIP(request);
    console.log('📡 GET request from IP:', clientIP);

    // Check rate limit
    const rateLimitResult = songAnalysisRateLimit.check(request);

    if (!rateLimitResult.allowed) {
      console.log('🚫 Rate limit exceeded for IP (GET):', clientIP);

      return NextResponse.json({
        success: false,
        error: rateLimitResult.error,
        rateLimitInfo: {
          remaining: rateLimitResult.remaining,
          resetTime: rateLimitResult.resetTime,
          resetIn: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000 / 60)
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

    if (!query) {
      return NextResponse.json({
        success: false,
        error: 'Query parameter "q" is required',
        rateLimitInfo: {
          remaining: rateLimitResult.remaining,
          resetTime: rateLimitResult.resetTime
        }
      }, { status: 400 });
    }

    // Perform song analysis
    console.log('🎵 Analyzing song (GET):', query, 'for IP:', clientIP);
    const result = await api.analyzeSong(query);

    // Record the request
    songAnalysisRateLimit.record(request, result.success);

    // Get updated rate limit status
    const updatedStatus = songAnalysisRateLimit.getStatus(request);

    return NextResponse.json({
      success: true,
      result,
      rateLimitInfo: {
        remaining: updatedStatus.remaining,
        resetTime: updatedStatus.resetTime,
        used: updatedStatus.count
      }
    }, {
      headers: {
        'X-RateLimit-Limit': '5',
        'X-RateLimit-Remaining': updatedStatus.remaining.toString(),
        'X-RateLimit-Reset': updatedStatus.resetTime.toString()
      }
    });

  } catch (error) {
    console.error('❌ Song analysis API error (GET):', error);

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