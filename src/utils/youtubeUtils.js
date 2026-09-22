const YOUTUBE_ID_PATTERN = /^[a-zA-Z0-9_-]{11}$/;

const isYouTubeVideoId = (value) => YOUTUBE_ID_PATTERN.test(value || '');

const YOUTUBE_HOSTS = new Set([
  'youtube.com',
  'm.youtube.com',
  'music.youtube.com',
  'youtube-nocookie.com',
]);

export function extractYouTubeVideoId(input) {
  if (!input || typeof input !== 'string') {
    return null;
  }

  const value = input.trim();
  if (!value) {
    return null;
  }

  if (isYouTubeVideoId(value)) {
    return value;
  }

  try {
    const url = new URL(value.includes('://') ? value : `https://${value}`);
    const host = url.hostname.replace(/^www\./, '');

    if (host === 'youtu.be') {
      const id = url.pathname.split('/').filter(Boolean)[0];
      return isYouTubeVideoId(id) ? id : null;
    }

    if (YOUTUBE_HOSTS.has(host)) {
      const queryId = url.searchParams.get('v');
      if (isYouTubeVideoId(queryId)) {
        return queryId;
      }

      const parts = url.pathname.split('/').filter(Boolean);
      if (parts.length >= 2 && ['embed', 'v', 'e', 'shorts', 'live'].includes(parts[0]) && isYouTubeVideoId(parts[1])) {
        return parts[1];
      }
    }
  } catch {
    // Fall through to regex for pasted fragments that are not valid URLs.
  }

  const match = value.match(
    /(?:youtube(?:-nocookie)?\.com\/(?:[^/\n]+\/.+\/|(?:v|e(?:mbed)?|shorts|live)\/|.*[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i
  );

  return match?.[1] || null;
}
