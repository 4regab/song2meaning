# Song2Meaning Deployment Guide

This guide helps you deploy the Song2Meaning application with Supabase database.

## Prerequisites

- Node.js 18+ installed
- A Supabase account (free tier available)
- Git for cloning the repository

## Quick Start

### 1. Clone and Setup

```bash
git clone https://github.com/your-username/song2meaning.git
cd song2meaning
npm install
```

### 2. Create Supabase Project

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Choose your organization
4. Enter project name: `song2meaning`
5. Enter a secure database password
6. Select your region
7. Click "Create new project"

### 3. Setup Database Schema

**Option A: Using Supabase Dashboard (Recommended)**

1. In your Supabase project, go to **SQL Editor**
2. Click **New Query**
3. Copy the entire contents of `supabase/schema.sql`
4. Paste into the SQL Editor
5. Click **Run** to execute

**Option B: Using Supabase CLI**

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Apply migrations
supabase db push
```

### 4. Configure Environment Variables

1. Copy `.env.local.example` to `.env.local`:
   ```bash
   cp .env.local.example .env.local
   ```

2. Fill in your Supabase credentials in `.env.local`:
   ```env
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   
   # AI Configuration
   GEMINI_API_KEY=your-gemini-api-key
   
   # Spotify Configuration (Optional)
   SPOTIFY_CLIENT_ID=your-spotify-client-id
   SPOTIFY_CLIENT_SECRET=your-spotify-client-secret
   ```

3. Get your Supabase credentials:
   - **URL**: Found in Project Settings > API
   - **Anon Key**: Found in Project Settings > API

4. Get your Gemini API key:
   - Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Create a new API key

### 5. Run the Application

```bash
# Development mode
npm run dev

# Production build
npm run build
npm start
```

Visit `http://localhost:3000` to see your application!

## Database Schema Overview

The database includes:

- **song_analyses table**: Stores song analysis data
- **RLS policies**: Secure access control
- **Performance indexes**: Optimized queries
- **Utility functions**: Helper functions for data processing

### Key Features

✅ **Public sharing** - Anyone can view shared analyses
✅ **Anonymous creation** - No login required to analyze songs
✅ **Access tracking** - View count for popular analyses
✅ **Full-text search** - Find analyses by artist or song title
✅ **Performance optimized** - Strategic indexing for fast queries

## Deployment Options

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your GitHub repo to [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy automatically on every push

### Netlify

1. Build the application: `npm run build`
2. Deploy the `out` folder to Netlify
3. Configure environment variables

### Docker

```bash
# Build Docker image
docker build -t song2meaning .

# Run container
docker run -p 3000:3000 --env-file .env.local song2meaning
```

## Environment Configuration

### Required Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | ✅ |
| `GEMINI_API_KEY` | Google Gemini AI API key | ✅ |

### Optional Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `SPOTIFY_CLIENT_ID` | Spotify app client ID | ❌ |
| `SPOTIFY_CLIENT_SECRET` | Spotify app client secret | ❌ |

## Security Considerations

- **Never commit** `.env.local` to version control
- **Use environment variables** for all sensitive data
- **Enable RLS** on all Supabase tables (already configured)
- **Validate input** on both client and server side
- **Rate limit** API endpoints to prevent abuse

## Monitoring and Analytics

### Supabase Dashboard

- Monitor database performance
- View real-time analytics
- Check API usage
- Manage user authentication

### Application Metrics

- Track song analysis requests
- Monitor popular songs/artists
- Analyze user engagement
- Performance monitoring

## Troubleshooting

### Common Issues

**Database Connection Errors**
```
Error: Invalid API key
```
- Check your `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Ensure they match your Supabase project

**AI Analysis Failures**
```
Error: Gemini API request failed
```
- Verify your `GEMINI_API_KEY` is correct
- Check API quota and billing

**Build Errors**
```
Module not found
```
- Run `npm install` to install dependencies
- Check Node.js version (18+ required)

### Getting Help

- Check the [Issues](https://github.com/your-username/song2meaning/issues) page
- Join our [Discord community](https://discord.gg/your-invite)
- Read the [Documentation](https://docs.song2meaning.com)

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Development Setup

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the [MIT License](LICENSE).