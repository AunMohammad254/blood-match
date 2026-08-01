/**
 * Simple in-memory rate limiter for API routes.
 * Tracks request counts per IP over a sliding window.
 * Suitable for serverless environments (resets on cold start).
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Cleanup interval to prevent memory leaks in the map
setInterval(() => {
  const now = Date.now();
  store.forEach((entry, key) => {
    if (now > entry.resetAt) {
      store.delete(key);
    }
  });
}, 60 * 1000); // Clean up every minute

interface RateLimitOptions {
  /** Max requests allowed in the window */
  limit: number;
  /** Window duration in milliseconds */
  windowMs: number;
}

/**
 * Check if the given identifier (IP) has exceeded the rate limit.
 * Returns `true` if allowed, `false` if rate-limited.
 */
export function checkRateLimit(
  identifier: string,
  options: RateLimitOptions
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const entry = store.get(identifier);

  if (!entry || now > entry.resetAt) {
    // New window
    store.set(identifier, { count: 1, resetAt: now + options.windowMs });
    return { allowed: true, remaining: options.limit - 1, resetAt: now + options.windowMs };
  }

  if (entry.count >= options.limit) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count += 1;
  return { allowed: true, remaining: options.limit - entry.count, resetAt: entry.resetAt };
}

/**
 * Extract a usable identifier from the request for rate-limiting purposes.
 *
 * Header priority:
 *  1. `x-real-ip`       — set by Vercel/Railway/Nginx to the real client IP (single value, not spoofable by client).
 *  2. `x-forwarded-for` — first value only (leftmost = client, but only trustworthy if your proxy sets it).
 *  3. Fallback to "unknown" if neither is present.
 *
 * NOTE: If your deployment platform does NOT guarantee these headers, switch to a
 * platform-native solution (e.g., Vercel's `req.ip`) or an external rate-limit store.
 */
export function getIdentifier(req: Request): string {
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();

  return "unknown";
}
