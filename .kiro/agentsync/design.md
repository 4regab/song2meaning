# Design Document - Song2Meaning

## APPROVED LAYOUT

**Selected**: Option 3 - Approved on January 29, 2025
**Modifications**: None requested

Based on your requirements, your application is a single-page responsive web app with these key sections:

- Hero Header with Branding
- Large Search Interface
- Detailed Results Display (Song Info + AI Analysis)

### APPROVED LAYOUT: Hero-Focused Glassmorphism Layout


#### Main Page (Desktop)

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                     Song2Meaning                            │
│              Discover the deeper meaning behind music       │
│                                                             │
│              ┌─────────────────────────────┐                │
│              │     🎵 Search Any Song      │                │
│              │                             │                │
│              │  [Large Search Input]       │                │
│              │  "Enter artist and song"    │                │
│              │                             │                │
│              │      [Analyze Meaning]      │                │
│              └─────────────────────────────┘                │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                  [Analysis Results Card]                    │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  🎤 "Song Title" by Artist Name                      │  │
│  │  ═══════════════════════════════════════════════════  │  │
│  │                                                       │  │
│  │  🤖 AI-Powered Meaning Analysis:                      │  │
│  │                                                       │  │
│  │  📖 Overview: [Brief summary of song's meaning]      │  │
│  │                                                       │  │
│  │  🎭 Themes: [Key themes and messages]                │  │
│  │                                                       │  │
│  │  🔍 Deep Dive: [Detailed lyrical analysis]           │  │
│  │                                                       │  │
│  │  💭 Cultural Context: [Historical/cultural background]│  │
│  │                                                       │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### Main Page (Mobile)

```
┌─────────────────────┐
│                     │
│   Song2Meaning      │
│ Discover meaning    │
│   behind music      │
│                     │
│ ┌─────────────────┐ │
│ │ 🎵 Search Song  │ │
│ │                 │ │
│ │ [Input Field]   │ │
│ │ "Artist-Song"   │ │
│ │                 │ │
│ │ [Analyze Btn]   │ │
│ └─────────────────┘ │
│                     │
├─────────────────────┤
│                     │
│ [Results Card]      │
│ ┌─────────────────┐ │
│ │ 🎤 Song Info    │ │
│ │ ═══════════     │ │
│ │                 │ │
│ │ 🤖 AI Analysis  │ │
│ │                 │ │
│ │ 📖 Overview     │ │
│ │ [Summary]       │ │
│ │                 │ │
│ │ 🎭 Themes       │ │
│ │ [Key themes]    │ │
│ │                 │ │
│ │ 🔍 Deep Dive    │ │
│ │ [Detailed]      │ │
│ │                 │ │
│ │ 💭 Context      │ │
│ │ [Background]    │ │
│ └─────────────────┘ │
│                     │
└─────────────────────┘
```

## Overview

Song2Meaning is a single-page web application that helps music lovers understand the deeper meaning behind their favorite songs. The app features a hero-focused design with glassmorphism aesthetics, providing an intuitive search interface and comprehensive AI-powered analysis results.

## Approved Page Layouts

### Hero Section

- **Large branding area** with "Song2Meaning" title and tagline
- **Prominent search card** with glassmorphism styling
- **Clean, spacious layout** that draws attention to the search functionality
- **Responsive design** that adapts beautifully to mobile devices

### Search Interface

- **Large search input field** for artist and song title
- **Clear call-to-action button** ("Analyze Meaning")
- **Glassmorphism card design** with subtle transparency and blur effects
- **Intuitive placeholder text** to guide user input

### Results Display

- **Structured analysis sections** with clear visual hierarchy
- **Four main analysis categories**: Overview, Themes, Deep Dive, Cultural Context
- **Emoji icons** for visual appeal and quick section identification
- **Scrollable content area** for detailed analysis
- **Responsive card layout** that works on all screen sizes

## Component Mapping

### Core Components

1. **HeroSection**: Main branding and tagline area
2. **SearchCard**: Glassmorphism search interface with input and button
3. **ResultsCard**: Analysis display with structured sections
4. **AnalysisSection**: Reusable component for each analysis category
5. **LoadingState**: Animated loading indicator during AI processing
6. **ErrorState**: User-friendly error handling display

### Layout Components

1. **GlassCard**: Reusable glassmorphism container
2. **ResponsiveContainer**: Main layout wrapper
3. **SectionDivider**: Visual separators between content areas

## System Architecture

### Frontend Architecture

- **Next.js 14** (App Router, no Turbopack)
- **Custom Tailwind CSS** with glassmorphism utilities
- **TypeScript** for type safety
- **Responsive design** with mobile-first approach

### API Integration

- **Gemini AI API** for song meaning analysis
- **Gemini Grounding Search** for enhanced context
- **Context7** for up-to-date documentation
- **Client-side API calls** (no backend server needed)

### State Management

- **React useState** for search input and results
- **Loading states** for better UX during API calls
- **Error handling** for failed requests
- **No persistent storage** (stateless application)

## Components and Interfaces

### SearchCard Interface

```typescript
interface SearchCardProps {
  onSearch: (query: string) => void;
  isLoading: boolean;
  placeholder?: string;
}
```

### ResultsCard Interface

```typescript
interface AnalysisResult {
  songTitle: string;
  artist: string;
  overview: string;
  themes: string[];
  deepDive: string;
  culturalContext: string;
}

interface ResultsCardProps {
  result: AnalysisResult | null;
  isLoading: boolean;
  error?: string;
}
```

### GlassCard Interface

```typescript
interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  blur?: "sm" | "md" | "lg";
  opacity?: number;
}
```

## Data Models

### Search Query

```typescript
interface SearchQuery {
  artist: string;
  songTitle: string;
  fullQuery: string;
}
```

### AI Analysis Response

```typescript
interface AIAnalysisResponse {
  success: boolean;
  data?: {
    songInfo: {
      title: string;
      artist: string;
    };
    analysis: {
      overview: string;
      themes: string[];
      deepDive: string;
      culturalContext: string;
    };
  };
  error?: string;
}
```

## Error Handling

### User-Friendly Error Messages

- **Network errors**: "Unable to connect. Please check your internet connection."
- **API errors**: "Sorry, we couldn't analyze this song right now. Please try again."
- **Invalid input**: "Please enter both artist and song title."
- **No results**: "We couldn't find information about this song. Try a different search."

### Error Recovery

- **Retry functionality** for failed requests
- **Clear error states** with actionable messages
- **Graceful degradation** when services are unavailable

## Testing Strategy

### Component Testing

- **Unit tests** for all React components
- **Props validation** and rendering tests
- **User interaction** testing (search, button clicks)
- **Responsive design** testing across breakpoints

### Integration Testing

- **API integration** tests with mock responses
- **Error handling** scenarios
- **Loading states** and transitions
- **End-to-end user flows**

### Performance Testing

- **Lighthouse audits** for performance metrics
- **Accessibility testing** (WCAG compliance)
- **Mobile performance** optimization
- **Bundle size** monitoring

## File References

- Requirements: See `prd.md`
- Frontend Implementation: See `front.md`
- Backend Implementation: See `back.md` (API integration tasks)
