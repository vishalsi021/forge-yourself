/**
 * dayCache.js
 * Persists the last successful Supabase day-state response in localStorage
 * so the app survives logout / offline / edge-function failures.
 */

const PREFIX = 'forge-day-cache-v1:';

function key(userId) {
  return `${PREFIX}${userId}`;
}

export function saveDayCache(userId, data) {
  if (!userId || !data) return;
  try {
    localStorage.setItem(key(userId), JSON.stringify({ data, savedAt: Date.now() }));
  } catch {
    // storage quota exceeded — ignore
  }
}

export function loadDayCache(userId) {
  if (!userId) return null;
  try {
    const raw = localStorage.getItem(key(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Expire cache after 48 hours
    if (Date.now() - parsed.savedAt > 48 * 60 * 60 * 1000) {
      localStorage.removeItem(key(userId));
      return null;
    }
    return parsed.data ?? null;
  } catch {
    return null;
  }
}

export function clearDayCache(userId) {
  if (!userId) return;
  try {
    localStorage.removeItem(key(userId));
  } catch {
    // ignore
  }
}
