const store = new Map<string, { count: number; reset: number }>();

// Prevent unbounded growth: sweep expired entries when the map gets large.
const MAX_ENTRIES = 10_000;

function sweep(now: number) {
  for (const [key, entry] of store) {
    if (now > entry.reset) store.delete(key);
  }
}

export function checkRateLimit(key: string, maxRequests = 20, windowMs = 60_000): boolean {
  const now = Date.now();
  if (store.size >= MAX_ENTRIES) sweep(now);
  const entry = store.get(key);
  if (!entry || now > entry.reset) {
    store.set(key, { count: 1, reset: now + windowMs });
    return true;
  }
  if (entry.count >= maxRequests) return false;
  entry.count++;
  return true;
}
