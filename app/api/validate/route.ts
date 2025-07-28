/**
 * Input Validation API Route
 * Validates user input on the server-side
 */

import { NextRequest, NextResponse } from 'next/server';
import { api } from '../../../lib/api';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { input } = body;

    if (!input || typeof input !== 'string') {
      return NextResponse.json({
        success: false,
        error: 'Input parameter is required and must be a string'
      }, { status: 400 });
    }

    // Validate input using the backend
    const validation = api.validateInput(input);

    return NextResponse.json({
      success: true,
      validation
    });

  } catch (error) {
    console.error('❌ Validation API error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to validate input'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const input = searchParams.get('input');

    if (!input) {
      return NextResponse.json({
        success: false,
        error: 'Input parameter is required'
      }, { status: 400 });
    }

    // Validate input using the backend
    const validation = api.validateInput(input);

    return NextResponse.json({
      success: true,
      validation
    });

  } catch (error) {
    console.error('❌ Validation API error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to validate input'
    }, { status: 500 });
  }
}