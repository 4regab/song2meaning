import { randomBytes } from 'crypto';

/**
 * Generates a readable share ID from artist and song title
 * @param artist - The artist name
 * @param songTitle - The song title
 * @returns A URL-safe, readable share ID string
 */
export function generateShareId(artist: string, songTitle: string): string {
  // Combine artist and song title
  const combined = `${artist} ${songTitle}`;
  
  // Convert to lowercase and replace spaces/special chars with hyphens
  const shareId = combined
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
  
  // Ensure it's not too long (max 100 characters)
  return shareId.length > 100 ? shareId.substring(0, 100).replace(/-$/, '') : shareId;
}

/**
 * Generates a cryptographically secure, URL-safe share ID (legacy function)
 * @param length - Length of the share ID (default: 16)
 * @returns A URL-safe share ID string
 */
export function generateRandomShareId(length: number = 16): string {
  // Generate random bytes and convert to base64url encoding
  const bytes = randomBytes(Math.ceil(length * 3 / 4));
  return bytes
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
    .substring(0, length);
}

/**
 * Constructs a full share URL from a share ID
 * @param shareId - The unique share identifier
 * @returns Complete share URL
 */
export function buildShareUrl(shareId: string): string {
  if (!shareId || typeof shareId !== 'string') {
    throw new Error('Share ID must be a non-empty string');
  }

  // Validate share ID format (alphanumeric, hyphens, underscores only)
  if (!isValidShareId(shareId)) {
    throw new Error('Invalid share ID format');
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
                  (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
  
  // Remove trailing slash from baseUrl to prevent double slashes
  const cleanBaseUrl = baseUrl.replace(/\/$/, '');
  
  return `${cleanBaseUrl}/share/${shareId}`;
}

/**
 * Copies text to clipboard using the Clipboard API
 * @param text - Text to copy to clipboard
 * @returns Promise that resolves when copy is successful
 */
export async function copyToClipboard(text: string): Promise<void> {
  if (!text || typeof text !== 'string') {
    throw new Error('Text must be a non-empty string');
  }

  // Check if we're in a browser environment
  if (typeof window === 'undefined' || !navigator.clipboard) {
    throw new Error('Clipboard API not available');
  }

  try {
    await navigator.clipboard.writeText(text);
  } catch (error) {
    // Fallback for older browsers or when clipboard API fails
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      const success = document.execCommand('copy');
      document.body.removeChild(textArea);
      if (!success) {
        throw new Error('execCommand failed');
      }
    } catch (fallbackError) {
      document.body.removeChild(textArea);
      throw new Error('Failed to copy to clipboard');
    }
  }
}

/**
 * Validates share ID format
 * @param shareId - Share ID to validate
 * @returns True if valid, false otherwise
 */
export function isValidShareId(shareId: string): boolean {
  if (!shareId || typeof shareId !== 'string') {
    return false;
  }

  // Support both formats:
  // 1. New readable format: lowercase alphanumeric with hyphens (3-100 chars)
  // 2. Legacy random format: base64url encoded (typically 22 chars)
  const readableRegex = /^[a-z0-9-]{3,100}$/;
  const legacyRegex = /^[A-Za-z0-9_-]{10,30}$/;
  
  // Check readable format (preferred)
  if (readableRegex.test(shareId) && !shareId.startsWith('-') && !shareId.endsWith('-')) {
    return true;
  }
  
  // Check legacy format (for backward compatibility)
  return legacyRegex.test(shareId);
}

/**
 * Sanitizes a URL by removing potentially harmful characters
 * @param url - URL to sanitize
 * @returns Sanitized URL string
 */
export function sanitizeUrl(url: string): string {
  if (!url || typeof url !== 'string') {
    return '';
  }

  // Remove any characters that could be used for XSS or other attacks
  return url
    .replace(/[<>'"]/g, '') // Remove HTML/script injection characters
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/data:/gi, '') // Remove data: protocol
    .trim();
}

/**
 * Validates if a URL is a valid share URL format
 * @param url - URL to validate
 * @returns True if valid share URL format, false otherwise
 */
export function isValidShareUrl(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }

  try {
    const urlObj = new URL(url);
    
    // Check if it's a share URL pattern
    const shareUrlPattern = /^\/share\/[a-zA-Z0-9_-]{8,32}$/;
    return shareUrlPattern.test(urlObj.pathname);
  } catch {
    return false;
  }
}

/**
 * Extracts share ID from a share URL
 * @param url - Share URL to extract ID from
 * @returns Share ID or null if invalid
 */
export function extractShareIdFromUrl(url: string): string | null {
  if (!url || typeof url !== 'string') {
    return null;
  }

  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    
    if (pathParts.length === 3 && pathParts[1] === 'share') {
      const shareId = pathParts[2];
      return shareId && isValidShareId(shareId) ? shareId : null;
    }
    
    return null;
  } catch {
    return null;
  }
}