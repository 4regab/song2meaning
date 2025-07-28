/**
 * System Health Check API Route
 * Provides system health information from the server-side
 */

import { NextResponse } from 'next/server';
import { api } from '../../../lib/api';

export async function GET() {
  try {
    console.log('🏥 Checking system health...');
    
    // Get system health from the backend
    const health = await api.getHealth();

    return NextResponse.json({
      success: true,
      health
    });

  } catch (error) {
    console.error('❌ Health check API error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to retrieve system health information',
      health: {
        overall: 'unhealthy',
        timestamp: Date.now(),
        services: {
          gemini: { status: 'unhealthy', error: 'Health check failed' },
          cache: { status: 'unknown' },
          security: { status: 'unknown' }
        }
      }
    }, { status: 500 });
  }
}