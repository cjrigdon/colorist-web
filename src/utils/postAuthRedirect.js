// Remembers where to send someone after they sign in or finish registering (e.g. back to a share link).
// Kept in localStorage so it survives the email verification step, which may open in a new tab.

const STORAGE_KEY = 'post_auth_redirect';
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

// Only same-site paths, never "//host" or full URLs
const isSafePath = (path) => typeof path === 'string' && path.startsWith('/') && !path.startsWith('//');

export const setPostAuthRedirect = (path) => {
  if (!isSafePath(path)) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ path, savedAt: Date.now() }));
};

export const consumePostAuthRedirect = (fallback = '/studio/overview') => {
  const raw = localStorage.getItem(STORAGE_KEY);
  localStorage.removeItem(STORAGE_KEY);
  if (!raw) return fallback;

  try {
    const { path, savedAt } = JSON.parse(raw);
    if (isSafePath(path) && Date.now() - savedAt < MAX_AGE_MS) {
      return path;
    }
  } catch (_) { /* ignore malformed values */ }

  return fallback;
};
