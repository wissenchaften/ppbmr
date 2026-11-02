/**
 * Extracts an 11-character YouTube video ID from various YouTube URL formats
 * (standard watch links, shortlinks, shorts, embed links) or returns the string
 * if it is already a bare 11-character video ID.
 */
export function extractYouTubeId(input: string): string | null {
  if (!input) return null;
  const trimmed = input.trim();

  // If already a valid 11-character alphanumeric ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  // Patterns for youtu.be, shorts, embed, watch?v=, m.youtube.com
  const patterns = [
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|shorts\/|watch\?v=|watch\?.+&v=))([a-zA-Z0-9_-]{11})/,
    /^https?:\/\/(?:www\.|m\.)?youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (match?.[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * Returns a privacy-friendly YouTube embed URL using the official youtube-nocookie.com domain.
 */
export function getYouTubeEmbedUrl(videoId: string): string {
  return `https://www.youtube-nocookie.com/embed/${videoId}?rel=0`;
}

/**
 * Validates whether a string is or contains a valid YouTube video reference.
 */
export function isValidYouTubeUrl(input: string): boolean {
  return extractYouTubeId(input) !== null;
}
