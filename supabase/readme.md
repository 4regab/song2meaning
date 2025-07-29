# Supabase Database Schema

This directory contains the database schema and configuration for the Song2Meaning project.

## Quick Setup

### Option 1: Using Supabase Dashboard (Recommended)

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Create a new project or select an existing one
3. Navigate to **SQL Editor**
4. Copy and paste the contents of `schema.sql`
5. Click **Run** to execute the schema

### Option 2: Using Supabase CLI

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Initialize project (if not already done)
supabase init

# Link to your remote project
supabase link --project-ref YOUR_PROJECT_REF

# Apply the schema
supabase db reset
```

## Database Structure

### Tables

#### `song_analyses`
Stores song analysis data with sharing capabilities.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key (auto-generated) |
| `share_id` | TEXT | Unique shareable identifier (8 characters) |
| `artist` | TEXT | Original artist name |
| `title` | TEXT | Original song title |
| `normalized_artist` | TEXT | Normalized artist name for search |
| `normalized_title` | TEXT | Normalized song title for search |
| `analysis_data` | JSONB | AI-generated song analysis |
| `access_count` | INTEGER | Number of times accessed (default: 0) |
| `created_at` | TIMESTAMPTZ | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | Last update timestamp |

### Row Level Security (RLS) Policies

- **Public read access**: Anyone can view song analyses
- **Anonymous insert**: Unauthenticated users can create new analyses
- **Anonymous update**: Unauthenticated users can update `access_count` only
- **Authenticated full access**: Logged-in users have complete access

### Indexes

- `idx_song_analyses_share_id`: Fast lookups by share ID
- `idx_song_analyses_normalized`: Search by normalized artist/title
- `idx_song_analyses_created_at`: Sort by creation date
- `idx_song_analyses_access_count`: Sort by popularity
- `idx_song_analyses_artist_title`: Full-text search on artist and title

### Functions

#### `generate_share_id()`
Generates unique 8-character share IDs for song analyses.

#### `normalize_text(input_text)`
Normalizes text by removing special characters and converting to lowercase.

#### `update_updated_at_column()`
Trigger function to automatically update the `updated_at` timestamp.

## Environment Variables

Make sure to set these in your `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Security Features

- **Row Level Security (RLS)** enabled on all tables
- **Granular permissions** for different user types
- **Data validation** through database constraints
- **Secure sharing** via unique share IDs

## Performance Optimizations

- **Strategic indexing** for common query patterns
- **JSONB storage** for flexible analysis data
- **Trigram indexes** for fuzzy text search
- **Automatic timestamp updates** via triggers

## Development

### Local Development

```bash
# Start local Supabase
supabase start

# Apply migrations
supabase db reset

# View local dashboard
supabase dashboard
```

### Adding Migrations

```bash
# Create new migration
supabase migration new your_migration_name

# Apply migrations
supabase db push
```

## Troubleshooting

### Common Issues

1. **RLS Policies Not Working**
   - Ensure RLS is enabled: `ALTER TABLE song_analyses ENABLE ROW LEVEL SECURITY;`
   - Check policy syntax and roles

2. **Slow Queries**
   - Verify indexes are created
   - Use `EXPLAIN ANALYZE` to debug query performance

3. **Permission Errors**
   - Check user roles and policy conditions
   - Ensure proper grants are in place

### Useful Queries

```sql
-- Check RLS status
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'song_analyses';

-- View all policies
SELECT policyname, cmd, roles FROM pg_policies WHERE tablename = 'song_analyses';

-- Check indexes
SELECT indexname FROM pg_indexes WHERE tablename = 'song_analyses';

-- View table structure
\d song_analyses
```

## Contributing

When making schema changes:

1. Create a new migration file
2. Test locally first
3. Update this README if needed
4. Ensure RLS policies are maintained
5. Add appropriate indexes for performance

## License

This database schema is part of the Song2Meaning open source project.