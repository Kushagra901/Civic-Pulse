import { redis } from '../config/redis.js';
import { env } from '../config/env.js';

const LOCKOUT_CONFIG = {
  maxFailures:   env.AUTH_MAX_FAILURES,
  windowSecs:    15 * 60,   // 15 min window
  lockoutSecs:   env.ACCOUNT_LOCKOUT_SECS,   // lockout after max failures
  longLockoutAt: 10,        // failures before 24h lockout
  longLockoutSecs: 24 * 60 * 60,
};

export async function recordLoginFailure(email) {
  const key      = `lockout:${email.toLowerCase()}`;
  const failures = await redis.incr(key);

  if (failures === 1) {
    // First failure — set window expiry
    await redis.expire(key, LOCKOUT_CONFIG.windowSecs);
  }

  const lockoutSecs = failures >= LOCKOUT_CONFIG.longLockoutAt
    ? LOCKOUT_CONFIG.longLockoutSecs
    : LOCKOUT_CONFIG.lockoutSecs;

  if (failures >= LOCKOUT_CONFIG.maxFailures) {
    await redis.setex(`lockout:locked:${email.toLowerCase()}`, lockoutSecs, '1');
    console.warn(`[Lockout] Account locked out for email: ${email.toLowerCase()}, failures count: ${failures}, duration: ${lockoutSecs}s`);
  }

  return failures;
}

export async function clearLoginFailures(email) {
  await redis.del(`lockout:${email.toLowerCase()}`);
  await redis.del(`lockout:locked:${email.toLowerCase()}`);
}

export async function isAccountLocked(email) {
  const lockedKey = `lockout:locked:${email.toLowerCase()}`;
  const locked = await redis.get(lockedKey);
  if (!locked) return { locked: false };

  const ttl = await redis.ttl(lockedKey);
  return { locked: true, retryAfterSecs: ttl };
}
