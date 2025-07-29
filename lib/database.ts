/**
 * Database Service Layer for Song Analysis Sharing
 * Handles all database operations with comprehensive error handling
 */

import { createServerComponentClient, createClientComponentClient, supabase, type SongAnalysisRecord } from './supabase'
import { AnalysisResult } from './gemini'
import { generateShareId, buildShareUrl } from './shareUtils'

// Enhanced AnalysisResult interface with sharing properties
export interface EnhancedAnalysisResult extends AnalysisResult {
  shareId?: string
  shareUrl?: string
  createdAt?: string
  accessCount?: number
  fromCache?: boolean
}



// Database operation result types
export interface DatabaseResult<T> {
  success: boolean
  data?: T | undefined
  error?: string
}

/**
 * Normalize artist and song title for consistent cache key generation
 * Requirements: 2.4, 2.5
 */
export function normalizeKey(text: string): string {
  return text.toLowerCase().trim()
}

// generateShareId and buildShareUrl are now imported from shareUtils.ts

/**
 * Get Supabase client with error handling
 */
async function getSupabaseClient() {
  try {
    // Try server client first (for API routes)
    if (typeof window === 'undefined') {
      return await createServerComponentClient()
    } else {
      // Use client component client for browser
      return createClientComponentClient()
    }
  } catch (error) {
    console.warn('Failed to create context-aware Supabase client, falling back to basic client:', error)
    return supabase
  }
}

/**
 * Retrieve cached analysis by artist and song title
 * Requirements: 2.1, 2.2, 2.4, 2.5
 */
export async function getCachedAnalysis(
  artist: string, 
  songTitle: string
): Promise<DatabaseResult<EnhancedAnalysisResult>> {
  try {
    const client = await getSupabaseClient()
    
    if (!client) {
      return {
        success: false,
        error: 'Database client not available'
      }
    }

    const normalizedArtist = normalizeKey(artist)
    const normalizedTitle = normalizeKey(songTitle)

    const { data, error } = await client
      .from('song_analyses')
      .select('*')
      .eq('normalized_artist', normalizedArtist)
      .eq('normalized_title', normalizedTitle)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows found - not an error, just cache miss
        return {
          success: true,
          data: undefined
        }
      }
      
      console.error('Database error in getCachedAnalysis:', error)
      return {
        success: false,
        error: `Database query failed: ${error.message}`
      }
    }

    if (!data) {
      return {
        success: true,
        data: undefined
      }
    }

    // Update access count and timestamp
    await client
      .from('song_analyses')
      .update({ 
        access_count: data.access_count + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', data.id)

    // Convert database record to EnhancedAnalysisResult
    const result: EnhancedAnalysisResult = {
      ...data.analysis_data,
      shareId: data.share_id,
      shareUrl: buildShareUrl(data.share_id),
      createdAt: data.created_at,
      accessCount: data.access_count + 1,
      fromCache: true
    }

    return {
      success: true,
      data: result
    }

  } catch (error) {
    console.error('Unexpected error in getCachedAnalysis:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown database error'
    }
  }
}/**

 * Store new analysis result in database with share ID generation
 * Requirements: 2.1, 2.3, 1.1, 1.2
 */
export async function storeAnalysis(
  analysisData: AnalysisResult,
  customShareId?: string
): Promise<DatabaseResult<EnhancedAnalysisResult>> {
  try {
    const client = await getSupabaseClient()
    
    if (!client) {
      return {
        success: false,
        error: 'Database client not available'
      }
    }

    const shareId = customShareId || generateShareId(analysisData.artist, analysisData.songTitle)
    const normalizedArtist = normalizeKey(analysisData.artist)
    const normalizedTitle = normalizeKey(analysisData.songTitle)

    const record: Omit<SongAnalysisRecord, 'id' | 'created_at' | 'updated_at'> = {
      share_id: shareId,
      artist: normalizedArtist,
      title: analysisData.songTitle,
      normalized_artist: normalizedArtist,
      normalized_title: normalizedTitle,
      analysis_data: analysisData,
      access_count: 1,
      original_artist: analysisData.artist,
      original_song_title: analysisData.songTitle,
      song_title: normalizedTitle
    }

    const { data, error } = await client
      .from('song_analyses')
      .insert(record)
      .select()
      .single()

    if (error) {
      console.error('Database error in storeAnalysis:', error)
      return {
        success: false,
        error: `Failed to store analysis: ${error.message}`
      }
    }

    if (!data) {
      return {
        success: false,
        error: 'No data returned from insert operation'
      }
    }

    // Convert database record to EnhancedAnalysisResult
    const result: EnhancedAnalysisResult = {
      ...data.analysis_data,
      shareId: data.share_id,
      shareUrl: buildShareUrl(data.share_id),
      createdAt: data.created_at,
      accessCount: data.access_count,
      fromCache: false
    }

    return {
      success: true,
      data: result
    }

  } catch (error) {
    console.error('Unexpected error in storeAnalysis:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown database error'
    }
  }
}

/**
 * Retrieve analysis by share ID for share link resolution
 * Requirements: 1.3, 1.5, 3.1, 3.4
 */
export async function getAnalysisByShareId(
  shareId: string
): Promise<DatabaseResult<EnhancedAnalysisResult>> {
  try {
    const client = await getSupabaseClient()
    
    if (!client) {
      return {
        success: false,
        error: 'Database client not available'
      }
    }

    // Validate share ID format
    if (!shareId || typeof shareId !== 'string' || shareId.trim().length === 0) {
      return {
        success: false,
        error: 'Invalid share ID format'
      }
    }

    const { data, error } = await client
      .from('song_analyses')
      .select('*')
      .eq('share_id', shareId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows found
        return {
          success: false,
          error: 'Share link not found'
        }
      }
      
      console.error('Database error in getAnalysisByShareId:', error)
      return {
        success: false,
        error: `Database query failed: ${error.message}`
      }
    }

    if (!data) {
      return {
        success: false,
        error: 'Share link not found'
      }
    }

    // Increment access count
    await client
      .from('song_analyses')
      .update({ 
        access_count: data.access_count + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', data.id)

    // Convert database record to EnhancedAnalysisResult
    const result: EnhancedAnalysisResult = {
      ...data.analysis_data,
      shareId: data.share_id,
      shareUrl: buildShareUrl(data.share_id),
      createdAt: data.created_at,
      accessCount: data.access_count + 1,
      fromCache: true
    }

    return {
      success: true,
      data: result
    }

  } catch (error) {
    console.error('Unexpected error in getAnalysisByShareId:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown database error'
    }
  }
}

/**
 * Test database connection and basic operations
 * Requirements: 4.1, 4.2
 */
export async function testDatabaseConnection(): Promise<DatabaseResult<boolean>> {
  try {
    const client = await getSupabaseClient()
    
    if (!client) {
      return {
        success: false,
        error: 'Database client not available'
      }
    }

    // Test basic query
    const { data, error } = await client
      .from('song_analyses')
      .select('count')
      .limit(1)

    if (error) {
      console.error('Database connection test failed:', error)
      return {
        success: false,
        error: `Connection test failed: ${error.message}`
      }
    }

    return {
      success: true,
      data: true
    }

  } catch (error) {
    console.error('Database connection test error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Connection test failed'
    }
  }
}

/**
 * Clean up old analyses (utility function for maintenance)
 * Requirements: Performance optimization
 */
export async function cleanupOldAnalyses(
  daysOld: number = 90,
  minAccessCount: number = 1
): Promise<DatabaseResult<number>> {
  try {
    const client = await getSupabaseClient()
    
    if (!client) {
      return {
        success: false,
        error: 'Database client not available'
      }
    }

    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysOld)

    const { data, error } = await client
      .from('song_analyses')
      .delete()
      .lt('created_at', cutoffDate.toISOString())
      .lt('access_count', minAccessCount)
      .select('id')

    if (error) {
      console.error('Database error in cleanupOldAnalyses:', error)
      return {
        success: false,
        error: `Cleanup failed: ${error.message}`
      }
    }

    const deletedCount = data?.length || 0

    return {
      success: true,
      data: deletedCount
    }

  } catch (error) {
    console.error('Unexpected error in cleanupOldAnalyses:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Cleanup failed'
    }
  }
}

/**
 * Get database statistics for monitoring
 * Requirements: Performance monitoring
 */
export async function getDatabaseStats(): Promise<DatabaseResult<{
  totalAnalyses: number
  totalAccesses: number
  averageAccessCount: number
  recentAnalyses: number
}>> {
  try {
    const client = await getSupabaseClient()
    
    if (!client) {
      return {
        success: false,
        error: 'Database client not available'
      }
    }

    // Get total count and sum of access counts
    const { data: statsData, error: statsError } = await client
      .from('song_analyses')
      .select('access_count')

    if (statsError) {
      console.error('Database error in getDatabaseStats:', statsError)
      return {
        success: false,
        error: `Stats query failed: ${statsError.message}`
      }
    }

    const totalAnalyses = statsData?.length || 0
    const totalAccesses = statsData?.reduce((sum, record) => sum + record.access_count, 0) || 0
    const averageAccessCount = totalAnalyses > 0 ? totalAccesses / totalAnalyses : 0

    // Get recent analyses count (last 7 days)
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)

    const { data: recentData, error: recentError } = await client
      .from('song_analyses')
      .select('id')
      .gte('created_at', weekAgo.toISOString())

    if (recentError) {
      console.error('Database error in getDatabaseStats (recent):', recentError)
      return {
        success: false,
        error: `Recent stats query failed: ${recentError.message}`
      }
    }

    const recentAnalyses = recentData?.length || 0

    return {
      success: true,
      data: {
        totalAnalyses,
        totalAccesses,
        averageAccessCount: Math.round(averageAccessCount * 100) / 100,
        recentAnalyses
      }
    }

  } catch (error) {
    console.error('Unexpected error in getDatabaseStats:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Stats query failed'
    }
  }
}