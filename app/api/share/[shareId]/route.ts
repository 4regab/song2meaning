/**
 * Share Link API Route
 * Handles share link resolution and access count tracking
 * Requirements: 1.3, 1.5, 3.1, 3.4
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAnalysisByShareId } from '@/lib/database'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ shareId: string }> }
) {
  try {
    const { shareId } = await params

    // Validate share ID parameter exists
    if (!shareId || shareId.trim() === '') {
      return NextResponse.json(
        { 
          error: 'Share ID is required',
          code: 'MISSING_SHARE_ID'
        },
        { status: 400 }
      )
    }

    // Basic share ID format validation
    if (typeof shareId !== 'string' || shareId.length < 16 || /\s/.test(shareId) || /[^a-zA-Z0-9_-]/.test(shareId)) {
      return NextResponse.json(
        { 
          error: 'Invalid share ID format',
          code: 'INVALID_SHARE_ID'
        },
        { status: 400 }
      )
    }

    // Retrieve analysis from database
    const result = await getAnalysisByShareId(shareId)

    if (!result.success) {
      // Handle different error types
      if (result.error === 'Share link not found') {
        return NextResponse.json(
          { 
            error: 'Share link not found',
            code: 'SHARE_NOT_FOUND'
          },
          { status: 404 }
        )
      }

      if (result.error === 'Database client not available') {
        return NextResponse.json(
          { 
            error: 'Service temporarily unavailable',
            code: 'SERVICE_UNAVAILABLE'
          },
          { status: 503 }
        )
      }

      // Generic database error
      console.error('Database error in share API:', result.error)
      return NextResponse.json(
        { 
          error: 'Internal server error',
          code: 'DATABASE_ERROR'
        },
        { status: 500 }
      )
    }

    if (!result.data) {
      return NextResponse.json(
        { 
          error: 'Share link not found',
          code: 'SHARE_NOT_FOUND'
        },
        { status: 404 }
      )
    }

    // Return structured analysis data with metadata
    return NextResponse.json({
      success: true,
      data: {
        analysis: {
          songTitle: result.data.songTitle,
          artist: result.data.artist,
          overview: result.data.overview,
          themes: result.data.themes,
          deepDive: result.data.deepDive,
          culturalContext: result.data.culturalContext
        },
        metadata: {
          shareId: result.data.shareId,
          shareUrl: result.data.shareUrl,
          createdAt: result.data.createdAt,
          accessCount: result.data.accessCount,
          fromCache: result.data.fromCache
        }
      }
    })

  } catch (error) {
    console.error('Unexpected error in share API route:', error)
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        code: 'UNEXPECTED_ERROR'
      },
      { status: 500 }
    )
  }
}

// Handle unsupported methods
export async function POST() {
  return NextResponse.json(
    { 
      error: 'Method not allowed',
      code: 'METHOD_NOT_ALLOWED'
    },
    { status: 405 }
  )
}

export async function PUT() {
  return NextResponse.json(
    { 
      error: 'Method not allowed',
      code: 'METHOD_NOT_ALLOWED'
    },
    { status: 405 }
  )
}

export async function DELETE() {
  return NextResponse.json(
    { 
      error: 'Method not allowed',
      code: 'METHOD_NOT_ALLOWED'
    },
    { status: 405 }
  )
}