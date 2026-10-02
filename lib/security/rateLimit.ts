/**
 * In-Memory Sliding-Window Rate Limiter
 * Compliant with OWASP ASVS Section V13 (API and Web Service Verification)
 */

interface RateLimitRecord {
  timestamps: number[];
}

class SlidingWindowRateLimiter {
  private store = new Map<string, RateLimitRecord>();
  private readonly cleanupIntervalMs = 60 * 1000;
  private lastCleanup = Date.now();

  private cleanup(windowMs: number) {
    const now = Date.now();
    if (now - this.lastCleanup < this.cleanupIntervalMs) return;

    this.lastCleanup = now;
    const threshold = now - windowMs * 2;

    for (const [key, record] of this.store.entries()) {
      record.timestamps = record.timestamps.filter((t) => t > threshold);
      if (record.timestamps.length === 0) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Evaluates if a request identifier exceeds the permitted rate limit.
   */
  public check(
    key: string,
    limit: number,
    windowMs: number
  ): {
    allowed: boolean;
    remaining: number;
    resetSeconds: number;
    total: number;
  } {
    const now = Date.now();
    this.cleanup(windowMs);

    let record = this.store.get(key);
    if (!record) {
      record = { timestamps: [] };
      this.store.set(key, record);
    }

    const windowStart = now - windowMs;
    // Keep only timestamps within current window
    record.timestamps = record.timestamps.filter((t) => t > windowStart);

    if (record.timestamps.length >= limit) {
      const oldestInWindow = record.timestamps[0] || now;
      const resetSeconds = Math.max(1, Math.ceil((oldestInWindow + windowMs - now) / 1000));
      return {
        allowed: false,
        remaining: 0,
        resetSeconds,
        total: record.timestamps.length,
      };
    }

    record.timestamps.push(now);
    const resetSeconds = Math.ceil(windowMs / 1000);

    return {
      allowed: true,
      remaining: Math.max(0, limit - record.timestamps.length),
      resetSeconds,
      total: record.timestamps.length,
    };
  }

  /**
   * Resets rate limit for an identifier (e.g. on successful login).
   */
  public reset(key: string) {
    this.store.delete(key);
  }
}

export const globalRateLimiter = new SlidingWindowRateLimiter();

/**
 * Standard security rate limit profiles
 */
export const RATE_LIMIT_CONFIGS = {
  // Admin authentication: 5 attempts per 60 seconds
  LOGIN: { limit: 5, windowMs: 60 * 1000 },
  // User report submission: 5 reports per 10 minutes
  REPORT_CREATION: { limit: 5, windowMs: 10 * 60 * 1000 },
  // Admin moderation actions: 30 actions per 60 seconds (anti-replay/flood)
  MODERATION_ACTION: { limit: 30, windowMs: 60 * 1000 },
  // PDF Report generation: 10 reports per 60 seconds
  REPORT_GENERATION: { limit: 10, windowMs: 60 * 1000 },
  // Generic admin API requests: 120 per minute
  ADMIN_API: { limit: 120, windowMs: 60 * 1000 },
} as const;
