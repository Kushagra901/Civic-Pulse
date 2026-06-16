import { prisma } from '../../config/prisma.js';
import { redis } from '../../config/redis.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { z } from 'zod';

const log = {
  info: (metadata, message) => {
    console.log(`[search] ${message}`, JSON.stringify(metadata));
  }
};

const searchSchema = z.object({
  q:          z.string().max(200).optional(),
  category:   z.string().optional(),
  status:     z.string().optional(),
  minScore:   z.coerce.number().min(0).default(0),
  sortBy:     z.enum(['recent', 'score', 'severity']).default('recent'),
  cursor:     z.string().uuid().optional(),
  cursorDate: z.string().datetime().optional(),
  limit:      z.coerce.number().min(1).max(50).default(20),
  bbox:       z.string().optional(),
});

export const searchIncidents = asyncHandler(async (req, res) => {
  const query = searchSchema.parse(req.query);
  const {
    q, category, status, minScore,
    sortBy, cursor, cursorDate, limit, bbox,
  } = query;

  // ── Cache simple filter-only queries (no keyword) ──────────
  // Keyword searches are too varied to cache effectively
  const isCacheable = !q && !cursor;
  const cacheKey    = isCacheable
    ? `search:${JSON.stringify({ category, status, minScore, sortBy, bbox })}`
    : null;

  if (cacheKey) {
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        res.setHeader('X-Cache', 'HIT');
        return res.json(JSON.parse(cached));
      }
    } catch (redisErr) {
      console.error('Redis read error in search:', redisErr);
    }
  }

  // ── Build query ────────────────────────────────────────────

  // For keyword search, use raw SQL to access tsvector + ts_rank
  // For filter-only, use Prisma ORM
  if (q) {
    return fullTextSearch({ q, category, status, minScore,
                            cursor, cursorDate, limit, bbox, res });
  }

  return filterSearch({ category, status, minScore, sortBy,
                        cursor, cursorDate, limit, bbox,
                        cacheKey, res });
});

// ── Full-text search via raw SQL ──────────────────────────────

async function fullTextSearch({
  q, category, status, minScore,
  cursor, cursorDate, limit, bbox, res,
}) {
  // Sanitise: strip special tsquery characters
  const sanitised = q.replace(/[&|!():*<>]/g, ' ').trim();
  if (!sanitised) {
    return res.json({ incidents: [], nextCursor: null, hasNextPage: false });
  }

  // Convert to prefix-match tsquery: "broken street" → "broken:* & street:*"
  // This means partial words match — "brok" matches "broken"
  const tsQuery = sanitised
    .split(/\s+/)
    .filter(Boolean)
    .map(w => `${w}:*`)
    .join(' & ');

  const conditions  = [`i."searchVector" @@ to_tsquery('english', $1)`];
  const params      = [tsQuery];
  let   idx         = 2;

  if (category) { conditions.push(`i.category = $${idx++}`);          params.push(category); }
  if (status)   { conditions.push(`i.status = $${idx++}::"IncidentStatus"`); params.push(status);   }
  if (minScore) { conditions.push(`i."credibilityScore" >= $${idx++}`); params.push(minScore); }

  if (bbox) {
    const [minLng, minLat, maxLng, maxLat] = bbox.split(',').map(Number);
    conditions.push(`
      ST_Within(i.location::geometry,
        ST_MakeEnvelope($${idx++},$${idx++},$${idx++},$${idx++},4326))
    `);
    params.push(minLng, minLat, maxLng, maxLat);
  }

  if (cursor && cursorDate) {
    conditions.push(`(i."createdAt" < $${idx} OR (i."createdAt" = $${idx + 1} AND i.id < $${idx + 2}))`);
    params.push(new Date(cursorDate), new Date(cursorDate), cursor);
    idx += 3;
  }

  const where = conditions.join(' AND ');

  const rows = await prisma.$queryRawUnsafe(`
    SELECT
      i.id, i.title, i.category, i.status,
      i."credibilityScore", i."severityScore",
      i."isFlagged", i."createdAt",
      -- Rank by text relevance + credibility score
      ts_rank(i."searchVector", to_tsquery('english', $1)) AS rank,
      -- Highlight matching terms in title for the UI
      ts_headline('english', i.title, to_tsquery('english', $1),
        'StartSel=<mark>, StopSel=</mark>, MaxWords=10, MinWords=5'
      ) AS title_highlighted,
      -- Report count and first reporter
      COUNT(DISTINCT r.id)::int AS report_count,
      MIN(r."reportedById")     AS first_reporter_id,
      MIN(r.lat)::float         AS lat,
      MIN(r.lng)::float         AS lng,
      MIN(r."photoUrls"::text)   AS first_photo_urls
    FROM "Incident" i
    LEFT JOIN "Report" r ON r."incidentId" = i.id
    WHERE ${where}
    GROUP BY i.id
    ORDER BY rank DESC, i."credibilityScore" DESC, i."createdAt" DESC
    LIMIT $${idx}
  `, ...params, limit + 1);

  const hasNextPage = rows.length > limit;
  const incidents   = (hasNextPage ? rows.slice(0, limit) : rows)
    .map(normaliseRow);

  const last        = incidents[incidents.length - 1];
  const nextCursor  = hasNextPage && last
    ? { cursor: last.id, cursorDate: last.createdAt.toISOString() }
    : null;

  log.info({ q, count: incidents.length }, 'Full-text search completed');

  res.json({ incidents, nextCursor, hasNextPage, query: q });
}

// ── Filter-only search via Prisma ORM ────────────────────────

async function filterSearch({
  category, status, minScore, sortBy,
  cursor, cursorDate, limit, bbox, cacheKey, res,
}) {
  const where = {
    ...(category && { category }),
    ...(status   && { status   }),
    ...(minScore > 0 && { credibilityScore: { gte: minScore } }),
    ...(cursor && cursorDate && {
      OR: [
        { createdAt: { lt: new Date(cursorDate) } },
        { createdAt: new Date(cursorDate), id: { lt: cursor } },
      ],
    }),
  };

  // Geo filter via raw IDs (same pattern as your feed endpoint)
  if (bbox) {
    const [minLng, minLat, maxLng, maxLat] = bbox.split(',').map(Number);
    const geoRows = await prisma.$queryRaw`
      SELECT id FROM "Incident"
      WHERE ST_Within(location::geometry,
        ST_MakeEnvelope(${minLng},${minLat},${maxLng},${maxLat},4326))
    `;
    where.id = { in: geoRows.map(r => r.id) };
  }

  const orderBy =
    sortBy === 'score'    ? [{ credibilityScore: 'desc' }] :
    sortBy === 'severity' ? [{ severityScore:    'desc' }] :
    /* recent */            [{ createdAt: 'desc' }, { id: 'desc' }];

  const rows = await prisma.incident.findMany({
    where,
    take:    limit + 1,
    orderBy,
    select: {
      id: true, title: true, category: true,
      status: true, credibilityScore: true,
      severityScore: true, createdAt: true,
      isFlagged: true,
      _count: { select: { reports: true, confirmations: true } },
      reports: {
        take:    1,
        orderBy: { createdAt: 'asc' },
        select:  { reportedBy: { select: { id: true, name: true } },
                   photoUrls: true, lat: true, lng: true },
      },
    },
  });

  const hasNextPage = rows.length > limit;
  const incidents   = hasNextPage ? rows.slice(0, limit) : rows;
  const last        = incidents[incidents.length - 1];
  const nextCursor  = hasNextPage && last
    ? { cursor: last.id, cursorDate: last.createdAt.toISOString() }
    : null;

  const payload = { incidents, nextCursor, hasNextPage };

  if (cacheKey) {
    try {
      await redis.setex(cacheKey, 30, JSON.stringify(payload));
    } catch (redisErr) {
      console.error('Redis save error in search:', redisErr);
    }
  }

  res.json(payload);
}

// Normalise raw SQL row to match Prisma shape
function normaliseRow(row) {
  return {
    id:               row.id,
    title:            row.title,
    titleHighlighted: row.title_highlighted || row.title,
    category:         row.category,
    status:           row.status,
    credibilityScore: parseFloat(row.credibilityScore || 0),
    severityScore:    parseFloat(row.severityScore || 1),
    createdAt:        new Date(row.createdAt),
    isFlagged:        row.isFlagged,
    lat:              row.lat,
    lng:              row.lng,
    _count: { reports: row.report_count },
    reports: [{
      lat:        row.lat,
      lng:        row.lng,
      photoUrls:  row.first_photo_urls ? JSON.parse(row.first_photo_urls) : [],
      reportedBy: { id: row.first_reporter_id },
    }],
  };
}
