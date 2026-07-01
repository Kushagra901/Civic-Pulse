import { redis } from '../config/redis.js';

/**
 * Creates a rolling Redis-backed rate limiter using sorted sets.
 * Removes expired entries, counts what's left, and saves the current call.
 */
export function createRateLimiter({
  windowSecs,
  max,
  keyPrefix,
  keyFn       = (req) => req.ip,
  message     = 'Too many requests. Please try again later.',
}) {
  return async function rateLimitMiddleware(req, res, next) {
    const key      = `rl:${keyPrefix}:${keyFn(req)}`;
    const now      = Date.now();
    const windowMs = windowSecs * 1000;

    if (redis.status !== "ready") {
      console.warn(`[RateLimiter] Redis is not ready (status: ${redis.status}). Failing open.`);
      return next();
    }

    try {
      const pipeline = redis.pipeline();

      // 1. Remove entries outside the current window
      pipeline.zremrangebyscore(key, 0, now - windowMs);
      // 2. Count remaining entries
      pipeline.zcard(key);
      // 3. Add this request with unique member payload (timestamp + random)
      pipeline.zadd(key, now, `${now}-${Math.random()}`);
      // 4. Set expiry so Redis cleans up old keys automatically
      pipeline.expire(key, windowSecs + 1);

      const results = await pipeline.exec();
      const count   = results[1][1];   // index 1 corresponds to zcard execution

      // Set standard rate limit headers
      res.setHeader('X-RateLimit-Limit',     max);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, max - count - 1));
      res.setHeader('X-RateLimit-Reset',     Math.ceil((now + windowMs) / 1000));

      if (count >= max) {
        console.warn(`[RateLimiter] Limit exceeded for keyPrefix: ${keyPrefix}, user/IP: ${keyFn(req)}, count: ${count}, max: ${max}`);

        return res.status(429).json({
          success: false,
          message,
          retryAfter: windowSecs,
        });
      }

      next();
    } catch (err) {
      // If Redis is down, fail open — don't block legitimate users
      console.error(`[RateLimiter] Redis error in rate limiter: ${err.message}. Failing open.`);
      next();
    }
  };
}

// ── Pre-built limiters for each route type ────────────────────

// Auth: tight — 5 attempts per 15 minutes per IP
export const authLimiter = createRateLimiter({
  windowSecs: 15 * 60,
  max:        5,
  keyPrefix:  'auth',
  message:    'Too many login attempts. Please wait 15 minutes.',
});

// Registration: 3 accounts per hour per IP — prevents bulk fake accounts
export const registerLimiter = createRateLimiter({
  windowSecs: 60 * 60,
  max:        3,
  keyPrefix:  'register',
  message:    'Too many accounts created from this IP.',
});

// Report submission: 5 reports per hour per user
export const reportLimiter = createRateLimiter({
  windowSecs: 60 * 60,
  max:        5,
  keyPrefix:  'report',
  keyFn:      (req) => req.user?.id || req.ip,
  message:    'You have reached the hourly report limit. Please try again later.',
});

// Confirmation votes: 30 votes per hour per user
export const confirmationLimiter = createRateLimiter({
  windowSecs: 60 * 60,
  max:        30,
  keyPrefix:  'confirm',
  keyFn:      (req) => req.user?.id || req.ip,
  message:    'You are voting too frequently.',
});

// General API: 120 requests per minute per IP — catches scrapers
export const generalLimiter = createRateLimiter({
  windowSecs: 60,
  max:        120,
  keyPrefix:  'general',
  message:    'Request rate too high.',
});

// Upload URL signing: 20 per hour per user — prevents hotlinking abuse
export const uploadLimiter = createRateLimiter({
  windowSecs: 60 * 60,
  max:        20,
  keyPrefix:  'upload',
  keyFn:      (req) => req.user?.id || req.ip,
  message:    'Upload limit reached for this hour.',
});
