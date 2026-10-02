interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Maximum failed attempts allowed within the window
const MAX_ATTEMPTS = 5;
// Window duration: 10 minutes in milliseconds
const WINDOW_MS = 10 * 60 * 1000;

/**
 * Check if the given identifier (e.g. IP or email) has exceeded rate limits.
 */
export function checkRateLimit(key: string): { allowed: boolean; retryAfterSeconds: number; remainingAttempts: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry) {
    return { allowed: true, retryAfterSeconds: 0, remainingAttempts: MAX_ATTEMPTS };
  }

  // If window expired, reset
  if (now > entry.resetTime) {
    rateLimitStore.delete(key);
    return { allowed: true, retryAfterSeconds: 0, remainingAttempts: MAX_ATTEMPTS };
  }

  if (entry.count >= MAX_ATTEMPTS) {
    const retryAfterSeconds = Math.ceil((entry.resetTime - now) / 1000);
    return { allowed: false, retryAfterSeconds, remainingAttempts: 0 };
  }

  return {
    allowed: true,
    retryAfterSeconds: 0,
    remainingAttempts: MAX_ATTEMPTS - entry.count,
  };
}

/**
 * Record a failed attempt for the identifier.
 */
export function recordFailedAttempt(key: string): number {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetTime) {
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + WINDOW_MS,
    });
    return MAX_ATTEMPTS - 1;
  }

  entry.count += 1;
  rateLimitStore.set(key, entry);
  return Math.max(0, MAX_ATTEMPTS - entry.count);
}

/**
 * Reset failed attempts upon successful authentication.
 */
export function resetRateLimit(key: string): void {
  rateLimitStore.delete(key);
}

/**
 * Periodic cleanup of expired rate limit entries
 */
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
      if (now > entry.resetTime) {
        rateLimitStore.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}
