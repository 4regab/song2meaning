import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Song2Meaning - Discover the deeper meaning behind music",
  description: "AI-powered song analysis that reveals themes, cultural context, and hidden meanings in your favorite tracks. Powered by Gemini AI with grounding search.",
  keywords: ["song analysis", "music meaning", "AI", "lyrics analysis", "song interpretation", "music culture"],
  authors: [{ name: "Song2Meaning" }],
  creator: "Song2Meaning",
  publisher: "Song2Meaning",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://song2meaning.vercel.app"),
  openGraph: {
    title: "Song2Meaning - Discover the deeper meaning behind music",
    description: "AI-powered song analysis that reveals themes, cultural context, and hidden meanings in your favorite tracks.",
    url: "https://song2meaning.vercel.app",
    siteName: "Song2Meaning",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Song2Meaning - Discover the deeper meaning behind music",
    description: "AI-powered song analysis that reveals themes, cultural context, and hidden meanings in your favorite tracks.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
