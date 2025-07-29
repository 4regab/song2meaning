import { createClient } from '@supabase/supabase-js'
import { createBrowserClient, createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Database types for type safety
export interface SongAnalysisRecord {
  id: string
  share_id: string
  artist: string
  title: string
  normalized_artist: string
  normalized_title: string
  analysis_data: any
  access_count: number
  created_at: string
  updated_at: string
  original_artist: string
  original_song_title: string
  song_title: string
}

export interface Database {
  public: {
    Tables: {
      song_analyses: {
        Row: SongAnalysisRecord
        Insert: Omit<SongAnalysisRecord, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<SongAnalysisRecord, 'id' | 'created_at'>>
      }
    }
  }
}

// Environment variables validation
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase environment variables. Please configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

// Client-side Supabase client
export const createClientComponentClient = () => {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables')
  }
  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey)
}

// Server-side Supabase client for API routes
export const createServerComponentClient = async () => {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables')
  }
  
  const cookieStore = await cookies()
  
  return createServerClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

// Simple client for basic operations (fallback)
export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient<Database>(supabaseUrl, supabaseAnonKey)
  : null

// Connection test function
export async function testConnection(): Promise<boolean> {
  if (!supabase) {
    console.error('Supabase client not initialized - missing environment variables')
    return false
  }
  
  try {
    const { data, error } = await supabase
      .from('song_analyses')
      .select('count')
      .limit(1)
    
    if (error) {
      console.error('Supabase connection test failed:', error.message)
      return false
    }
    
    console.log('Supabase connection test successful')
    return true
  } catch (error) {
    console.error('Supabase connection test error:', error)
    return false
  }
}