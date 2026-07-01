import { redis } from '../config/redis.js';
import logger from '../config/logger.js';

const log = logger.child({ module: 'cache' });

/**
 * Wraps an async data-fetching function with Redis caching.
 * On cache miss, calls fetchFn, caches the result, and returns it.
 * On Redis failure, fails open — calls fetchFn directly so a
 * Redis outage never takes down the actual feature.
 */
export async function cached(key, ttlSeconds, fetchFn) {
  try {
    const hit = await redis.get(key);
    if (hit) {
      return JSON.parse(hit);
    }
  } catch (err) {
    log.warn({ err, key }, 'Cache read failed — falling back to source');
  }

  const result = await fetchFn();

  try {
    await redis.setex(key, ttlSeconds, JSON.stringify(result));
  } catch (err) {
    log.warn({ err, key }, 'Cache write failed — continuing without cache');
  }

  return result;
}

/**
 * Invalidates all keys matching a prefix. Use SCAN, not KEYS —
 * KEYS blocks the entire Redis instance on large datasets.
 */
export async function invalidatePrefix(prefix) {
  let cursor = '0';
  let deletedCount = 0;

  try {
    do {
      const [nextCursor, keys] = await redis.scan(
        cursor, 'MATCH', `${prefix}*`, 'COUNT', 100,
      );
      cursor = nextCursor;

      if (keys.length > 0) {
        await redis.del(...keys);
        deletedCount += keys.length;
      }
    } while (cursor !== '0');

    log.info({ prefix, deletedCount }, 'Cache invalidated');
  } catch (err) {
    log.warn({ err, prefix }, 'Cache invalidation failed');
  }

  return deletedCount;
}
