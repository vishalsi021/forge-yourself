const requestCounts = new Map<string, { count: number; expiresAt: number }>();

export function enforceRateLimit(key: string, limit = 20, windowMs = 60_000) {
  const now = Date.now();
  const current = requestCounts.get(key);

  if (!current || current.expiresAt < now) {
    requestCounts.set(key, { count: 1, expiresAt: now + windowMs });
    return;
  }

  if (current.count >= limit) {
    throw new Error('Rate limit exceeded. Try again in a minute.');
  }

  current.count += 1;
  requestCounts.set(key, current);
}
