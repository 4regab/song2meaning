# 🎵 Song2Meaning

**Discover the deeper meaning behind music with AI-powered song analysis.**

A simple web application that uses Gemini AI with grounding search to analyze songs and reveal their themes, cultural context, and hidden meanings. Features Spotify integration for music previews while you explore the deeper meanings behind your favorite tracks.

![Song2Meaning](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8?style=for-the-badge&logo=tailwindcss)
![Gemini AI](https://img.shields.io/badge/Gemini-AI-purple?style=for-the-badge)
![Spotify](https://img.shields.io/badge/Spotify-Integration-1ed760?style=for-the-badge&logo=spotify)

## ✨ Features

- **🤖 AI-Powered Analysis**: Uses Gemini AI with grounding search for accurate, contextual song analysis
- **🎵 Spotify Integration**:
  - Automatic track search and matching
  - 30-second music previews while reading analysis
  - Direct links to full tracks on Spotify
  - Fallback support when previews aren't available
- **🎨 Neobrutalism Design**: Bold, modern interface inspired by contemporary design trends
- **⚙️ Secure API**: Server-side API routes keep your API keys safe from client exposure
- **⚡ Rate Limited**: 5 analyses per IP per hour to prevent abuse
- **📱 Responsive**: Works perfectly on desktop and mobile devices
- **🚀 Fast**: Optimized with caching and performance monitoring
- **🛡️ Secure**: Input validation, sanitization, and security monitoring

## 🚀 Live Demo

Visit the live application: [song2meaning.vercel.app](https://song2meaning.vercel.app)

## 🏗️ Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS 4 with custom neobrutalism design
- **AI**: Google Gemini AI with grounding search
- **Music**: Spotify Web API integration for track search and previews
- **Deployment**: Vercel
- **Security**: Server-side API routes, rate limiting, input validation

## 📌 Prerequisites

- Node.js 18+
- Gemini AI API key ([Get one here](https://makersuite.google.com/app/apikey))
- Spotify Developer Account ([Create one here](https://developer.spotify.com/dashboard))

## 🔧 API Setup

### Gemini AI API Key

1. Visit [Google AI Studio](https://aistudio.google.com/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated API key

### Spotify API Credentials

Song2Meaning uses the **Client Credentials Flow** for Spotify integration, which is perfect for server-side applications that don't require user login.

#### Step 1: Create a Spotify App

1. Go to the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Log in with your Spotify account (create one if needed)
3. Click **"Create app"**
4. Fill in the app details:
   - **App name**: `Song2Meaning` (or your preferred name)
   - **App description**: `AI-powered song analysis with music previews`
   - **Website**: Your domain (e.g., `https://yourdomain.com`) or `http://localhost:3000` for development
   - **Redirect URI**: `http://localhost:3000/callback` (for development)
   - **API/SDKs**: Check **"Web API"**
5. Accept the terms and click **"Save"**

#### Step 2: Get Your Credentials

1. In your newly created app dashboard, you'll see:
   - **Client ID**: A public identifier for your app
   - **Client Secret**: A private key (keep this secure!)
2. Click **"Show client secret"** to reveal it
3. Copy both values - you'll need them for your environment variables

#### Step 3: Configure App Settings (Optional)

For production deployment, update your app settings:

1. Go to **"Settings"** in your Spotify app dashboard
2. Update **"Redirect URIs"** to include your production domain
3. Add your production website URL

> **🔒 Security Note**: The Client Secret should never be exposed in client-side code. Song2Meaning handles this securely by using server-side API routes.

#### Why Client Credentials Flow?

- ✅ **No user login required** - Perfect for public song analysis
- ✅ **Server-side security** - Client secret stays on your server
- ✅ **Simple setup** - No complex OAuth flows
- ✅ **Rate limit friendly** - Suitable for application-level requests

## 🛠️ Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/4regab/song2meaning.git
   cd song2meaning
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.local.example .env.local
   ```

   Edit `.env.local` and add your API keys:

   ```env
   # Gemini AI API Configuration
   GEMINI_API_KEY=your_gemini_api_key_here

   # Spotify API Configuration
   SPOTIFY_CLIENT_ID=your_spotify_client_id_here
   SPOTIFY_CLIENT_SECRET=your_spotify_client_secret_here
   ```

4. **Run the development server**

   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🚀 Deployment

### Deploy to Vercel (Recommended)

1. **Push to GitHub**

   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Deploy to Vercel**

   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Add environment variable: `GEMINI_API_KEY`
   - Deploy!

3. **Environment Variables**
   In your Vercel project settings, add:
   - `GEMINI_API_KEY`: Your Gemini AI API key
   - `SPOTIFY_CLIENT_ID`: Your Spotify Client ID
   - `SPOTIFY_CLIENT_SECRET`: Your Spotify Client Secret

## 🎯 Usage

1. **Enter a song** in the format: `Artist - Song Title`
2. **Click "Analyze Song"** or press Enter
3. **Listen to a preview** (if available) while the analysis runs
4. **View the comprehensive analysis** with four detailed sections:
   - 📖 **Overview**: Summary of the song's meaning and key themes
   - 🔍 **Deep Dive**: Detailed lyrical analysis and interpretation
   - 💭 **Cultural Context**: Historical and cultural background
   - 🎵 **Spotify Integration**: Preview the track while reading the analysis

## 🔧 Troubleshooting

### Spotify Integration Issues

**No music previews showing up?**

- Verify your `SPOTIFY_CLIENT_ID` and `SPOTIFY_CLIENT_SECRET` are correctly set
- Check that your Spotify app is properly configured in the [Developer Dashboard](https://developer.spotify.com/dashboard)
- Note: Not all tracks have preview URLs available from Spotify

**"Spotify API error" messages?**

- Ensure your Spotify app has **"Web API"** enabled
- Check that your Client Secret hasn't been regenerated (this would invalidate the old one)
- Verify your environment variables are properly loaded

**Rate limiting from Spotify?**

- The Client Credentials flow has generous rate limits for most use cases
- If you hit limits, the app will gracefully continue without previews

### General Issues

**"Service configuration error"?**

- Check that all required environment variables are set
- Restart your development server after changing `.env.local`
- Verify your API keys are valid and haven't expired

**Analysis not working?**

- Ensure your `GEMINI_API_KEY` is valid
- Check the [Gemini API status](https://status.cloud.google.com/)
- Verify you haven't exceeded your Gemini API quota

## 🔧 API Endpoints

- `POST /api/analyze` - Analyze a song's meaning and themes
- `GET /api/health` - System health check
- `GET /api/stats` - Performance statistics
- `GET /api/rate-limit` - Rate limit status
- `POST /api/validate` - Input validation
- `GET /api/spotify/search` - Search for Spotify tracks
- `GET /api/spotify/preview` - Get track preview URLs

## 🛡️ Security Features

- **Server-side API**: API key never exposed to client
- **Rate Limiting**: 5 requests per IP per hour
- **Input Validation**: Strict format validation and sanitization
- **Error Handling**: Comprehensive error management with fallbacks
- **Security Monitoring**: Request logging and anomaly detection

## 📊 Performance

- **Caching**: Advanced LRU cache with TTL
- **Request Deduplication**: Prevents duplicate API calls
- **Performance Monitoring**: Real-time metrics and statistics
- **Optimized Prompts**: Efficient AI interactions

## 🎨 Design

The application features a **neobrutalism design** with:

- Bold black borders and shadows
- High contrast colors
- Chunky, interactive buttons
- Clean typography (Inter + JetBrains Mono)
- Responsive layout

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

For issues or questions, visit: [GitHub Issues](https://github.com/4regab/song2meaning/issues)

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Google Gemini AI** for powerful language processing
- **Spotify Web API** for music integration and previews
- **Vercel** for seamless deployment
- **Next.js** for the amazing React framework
- **Tailwind CSS** for utility-first styling

## 📞 Support

If you have any questions or issues:

1. Check the [Issues](https://github.com/4regab/song2meaning/issues) page
2. Create a new issue if needed
3. Review the troubleshooting section above
4. Check the [Spotify Developer Documentation](https://developer.spotify.com/documentation/web-api) for API-related issues

---

**Made with ❤️ and AI** - Discover the stories behind your favorite songs!
