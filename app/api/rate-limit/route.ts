/**
 * Rate Limit Status API Route
 * Provides rate limit information for the current IP
 */

import { NextRequest, NextResponse } from 'next/server';
import { songAnalysisRateLimit, getClientIP } from '../../../lib/rateLimiter';

export async function GET(request: NextRequest) {
  try {
    const clientIP = getClientIP(request);
    const status = songAnalysisRateLimit.getStatus(request);
    const stats = songAnalysisRateLimit.getStats();

    return NextResponse.json({
      success: true,
      ip: clientIP,
      rateLimit: {
        limit: 5,
        used: status.count,
        remaining: status.remaining,
        resetTime: status.resetTime,
        resetIn: Math.ceil((status.resetTime - Date.now()) / 1000 / 60 / 60), // hours
        windowMs: 24 * 60 * 60 * 1000 // 1 day
      },
      globalStats: {
        totalActiveIPs: stats.activeIPs,
        totalRequests: stats.totalRequests,
        averageRequestsPerIP: Math.round(stats.averageRequestsPerIP * 100) / 100
      }
    });

  } catch (error) {
    console.error('❌ Rate limit status error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to retrieve rate limit status'
    }, { status: 500 });
  }
}

// Admin endpoint to reset rate limit for an IP (for development/testing)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const targetIP = searchParams.get('ip');
    
    if (!targetIP) {
      return NextResponse.json({
        success: false,
        error: 'IP parameter is required'
      }, { status: 400 });
    }

    // In production, you might want to add authentication here
    // For now, only allow in development
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({
        success: false,
        error: 'Rate limit reset not available in production'
      }, { status: 403 });
    }

    songAnalysisRateLimit.resetIP(targetIP);

    return NextResponse.json({
      success: true,
      message: `Rate limit reset for IP: ${targetIP}`
    });

  } catch (error) {
    console.error('❌ Rate limit reset error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to reset rate limit'
    }, { status: 500 });
  }
}