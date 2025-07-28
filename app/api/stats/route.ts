/**
 * Performance Statistics API Route
 * Provides performance metrics from the server-side
 */

import { NextResponse } from 'next/server';
import { api } from '../../../lib/api';

export async function GET() {
  try {
    console.log('📊 Retrieving performance statistics...');
    
    // Get performance stats from the backend
    const stats = api.getStats();

    return NextResponse.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('❌ Stats API error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to retrieve performance statistics',
      stats: {
        cache: { size: 0, hitRate: 0, totalRequests: 0 },
        performance: { requestCount: 0, averageResponseTime: 0, errorRate: 0 },
        deduplication: { pendingCount: 0, pendingKeys: [] }
      }
    }, { status: 500 });
  }
}