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
- **🎵 Spotify Integration**: Search and preview tracks directly in the app while analyzing their meaning
- **🎨 Neobrutalism Design**: Bold, modern interface inspired by contemporary design trends
- **🔒 Secure API**: Server-side API routes keep your API key safe from client exposure
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

## 🛠️ Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/song2meaning.git
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

   Edit `.env.local` and add your Gemini API key:

   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
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

## 🎯 Usage

1. **Enter a song** in the format: `Artist - Song Title`
2. **Click "Analyze Song"** or press Enter
3. **Listen to a preview** (if available) while the analysis runs
4. **View the comprehensive analysis** with four detailed sections:
   - 📖 **Overview**: Summary of the song's meaning and key themes
   - 🔍 **Deep Dive**: Detailed lyrical analysis and interpretation
   - 💭 **Cultural Context**: Historical and cultural background
   - 🎵 **Spotify Integration**: Preview the track while reading the analysis

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

1. Check the [Issues](https://github.com/yourusername/song2meaning/issues) page
2. Create a new issue if needed
3. For urgent matters, contact [your-email@example.com]

---

**Made with ❤️ and AI** - Discover the stories behind your favorite songs!
