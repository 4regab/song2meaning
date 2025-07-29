-- Initial schema migration for Song2Meaning
-- Created: 2025-01-30
-- Description: Creates song_analyses table with RLS policies and performance indexes

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create song_analyses table
CREATE TABLE IF NOT EXISTS public.song_analyses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    share_id TEXT UNIQUE NOT NULL,
    artist TEXT NOT NULL,
    title TEXT NOT NULL,
    normalized_artist TEXT NOT NULL,
    normalized_title TEXT NOT NULL,
    analysis_data JSONB NOT NULL,
    access_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_song_analyses_updated_at
    BEFORE UPDATE ON song_analyses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE song_analyses ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Policy 1: Allow public read access to all song analyses
CREATE POLICY "Public read access" ON song_analyses
  FOR SELECT
  TO public
  USING (true);

-- Policy 2: Allow anonymous users to insert new song analyses
CREATE POLICY "Anonymous insert" ON song_analyses
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Policy 3: Allow anonymous users to update access_count only
CREATE POLICY "Anonymous update access_count" ON song_analyses
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- Policy 4: Allow authenticated users full access
CREATE POLICY "Authenticated full access" ON song_analyses
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_song_analyses_share_id ON song_analyses(share_id);
CREATE INDEX IF NOT EXISTS idx_song_analyses_normalized ON song_analyses(normalized_artist, normalized_title);
CREATE INDEX IF NOT EXISTS idx_song_analyses_created_at ON song_analyses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_song_analyses_access_count ON song_analyses(access_count DESC);
CREATE INDEX IF NOT EXISTS idx_song_analyses_artist_title ON song_analyses USING gin((artist || ' ' || title) gin_trgm_ops);

-- Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.song_analyses TO anon, authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Utility Functions

-- Function to generate unique share IDs
CREATE OR REPLACE FUNCTION generate_share_id()
RETURNS TEXT AS $$
DECLARE
    chars TEXT := 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    result TEXT := '';
    i INTEGER;
BEGIN
    FOR i IN 1..8 LOOP
        result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
    
    -- Check if share_id already exists, if so, generate a new one
    WHILE EXISTS(SELECT 1 FROM song_analyses WHERE share_id = result) LOOP
        result := '';
        FOR i IN 1..8 LOOP
            result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
        END LOOP;
    END LOOP;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to normalize text for search
CREATE OR REPLACE FUNCTION normalize_text(input_text TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN lower(trim(regexp_replace(input_text, '[^a-zA-Z0-9\s]', '', 'g')));
END;
$$ LANGUAGE plpgsql;