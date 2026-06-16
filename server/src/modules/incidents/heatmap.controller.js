import { prisma } from '../../config/prisma.js';
import { redis } from '../../config/redis.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

const log = {
  info: (metadata, message) => {
    console.log(`[heatmap] ${message}`, JSON.stringify(metadata));
  }
};

export const getHeatmapData = asyncHandler(async (req, res) => {
  // Build a cache key from the query params
  const cacheKey = `heatmap:${JSON.stringify(req.query)}`;

  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      res.setHeader('Cache-Control', 'public, max-age=60');
      return res.json(JSON.parse(cached));
    }
  } catch (redisErr) {
    // Fall back to DB query if Redis fails or is unavailable
    console.error('Redis error in heatmap:', redisErr);
  }

  const {
    category,
    status,
    // Optional bounding box: "minLng,minLat,maxLng,maxLat"
    // Sent by the client when the user zooms into an area
    bbox,
    // Minimum credibility score to include — filters out noise
    minScore = '0',
  } = req.query;

  // Build the WHERE clauses as arrays so they compose cleanly
  const conditions   = ['1=1'];
  const params       = [];
  let   paramIndex   = 1;

  if (category) {
    conditions.push(`i.category = $${paramIndex++}`);
    params.push(category);
  }

  // Default: only show open incidents on the heatmap
  // Resolved/closed incidents are less useful for "where are the problems"
  if (status) {
    conditions.push(`i.status = $${paramIndex++}`);
    params.push(status);
  } else {
    conditions.push(`i.status NOT IN ('CLOSED', 'VERIFIED')`);
  }

  if (parseFloat(minScore) > 0) {
    conditions.push(`i."credibilityScore" >= $${paramIndex++}`);
    params.push(parseFloat(minScore));
  }

  if (bbox) {
    const [minLng, minLat, maxLng, maxLat] = bbox.split(',').map(Number);
    if (
      [minLng, minLat, maxLng, maxLat].some(isNaN) ||
      minLng < -180 || maxLng > 180 ||
      minLat < -90  || maxLat > 90
    ) {
      return res.status(400).json({ message: 'Invalid bbox parameter' });
    }
    conditions.push(`
      ST_Within(
        i.location::geometry,
        ST_MakeEnvelope($${paramIndex++}, $${paramIndex++},
                        $${paramIndex++}, $${paramIndex++}, 4326)
      )
    `);
    params.push(minLng, minLat, maxLng, maxLat);
  }

  const where = conditions.join(' AND ');

  // Return lat, lng, and a normalised intensity weight (0–1)
  // The weight is derived from credibilityScore, capped at 50
  // so one mega-incident doesn't dwarf everything else on the map
  const rows = await prisma.$queryRawUnsafe(`
    SELECT
      ST_Y(i.location::geometry)      AS lat,
      ST_X(i.location::geometry)      AS lng,
      -- Normalise credibilityScore to 0–1, cap at 50 to prevent outlier dominance
      LEAST(i."credibilityScore", 50) / 50.0  AS intensity,
      i.category
    FROM "Incident" i
    WHERE ${where}
    -- Hard cap: Leaflet.heat degrades above ~5000 points
    LIMIT 3000
  `, ...params);

  // Leaflet.heat expects [lat, lng, intensity] tuples
  // Sending them as flat arrays saves ~40% payload size vs objects
  const points = rows.map(r => [
    parseFloat(r.lat),
    parseFloat(r.lng),
    parseFloat(r.intensity),
  ]);

  const payload = { points, count: points.length };

  try {
    // Cache for 2 minutes — heatmap is analytical, not real-time
    await redis.setex(cacheKey, 120, JSON.stringify(payload));
  } catch (redisErr) {
    console.error('Redis save error in heatmap:', redisErr);
  }

  log.info({ count: points.length, bbox, category }, 'Heatmap data served');

  res.setHeader('X-Cache', 'MISS');
  res.setHeader('Cache-Control', 'public, max-age=60');
  res.json(payload);
});
