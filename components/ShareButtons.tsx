'use client';

import { useState } from 'react';

interface ShareButtonsProps {
  shareUrl: string;
  songTitle: string;
  artist: string;
}

export default function ShareButtons({ shareUrl, songTitle, artist }: ShareButtonsProps) {
  const [copySuccess, setCopySuccess] = useState(false);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
      // Fallback for older browsers
      try {
        const textArea = document.createElement('textarea');
        textArea.value = shareUrl;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      } catch (fallbackError) {
        console.error('Fallback copy also failed:', fallbackError);
      }
    }
  };

  return (
    <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
      <button
        onClick={handleCopyLink}
        className={`font-bold px-3 sm:px-4 py-2 border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] transition-all duration-150 text-xs sm:text-sm ${
          copySuccess
            ? 'bg-green-500 hover:bg-green-600 text-white'
            : 'bg-purple-600 hover:bg-purple-700 text-white'
        }`}
      >
        {copySuccess ? '✓ Copied!' : '🔗 Copy Link'}
      </button>
    </div>
  );
}