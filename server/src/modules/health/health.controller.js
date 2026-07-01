import { prisma } from '../../config/prisma.js';
import { redis } from '../../config/redis.js';
import logger from '../../config/logger.js';

const log = logger.child({ module: 'health' });
const startedAt = Date.now();

export async function getHealth(req, res) {
  const checks = {};
  let overallStatus = 'ok';

  // ── Database check ────────────────────────────────────────
  const dbStart = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = {
      status: 'ok',
      latencyMs: Date.now() - dbStart,
    };
  } catch (err) {
    checks.database = { status: 'error', message: err.message };
    overallStatus = 'degraded';
    log.error({ err }, 'Health check: database unreachable');
  }

  // ── Redis check ────────────────────────────────────────────
  const redisStart = Date.now();
  try {
    if (redis.status !== 'ready') {
      throw new Error(`Redis connection status is ${redis.status}`);
    }
    await redis.ping();
    checks.redis = {
      status: 'ok',
      latencyMs: Date.now() - redisStart,
    };
  } catch (err) {
    checks.redis = { status: 'error', message: err.message };
    overallStatus = 'degraded';
    log.error({ err }, 'Health check: redis unreachable');
  }

  const httpStatus = overallStatus === 'ok' ? 200 : 503;

  res.status(httpStatus).json({
    status: overallStatus,
    timestamp: new Date().toISOString(),
    uptimeSecs: Math.floor((Date.now() - startedAt) / 1000),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version || '1.0.0',
    checks,
  });
}

export function getLiveness(req, res) {
  res.status(200).json({ status: 'alive', uptimeSecs: Math.floor((Date.now() - startedAt) / 1000) });
}
