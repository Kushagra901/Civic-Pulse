import { prisma } from "../../config/prisma.js";
import { ApiError } from "../../utils/ApiError.js";
import { assertTransition } from "./incidents.workflow.js";
import { incidentQueue } from "../jobs/queue.js";

// PostGIS Implementation
// We use raw queries because Prisma doesn't fully support PostGIS geography types yet for writes/complex reads without extensions.

export const createOrAttachIncident = async ({ userId, title, category, description, lat, lng, photoUrls }) => {
  // 1. Auto-Clustering: Find existing incidents within 200m (0.2km)
  // We use ST_DWithin on the geography column.
  // Note: ST_MakePoint takes (lng, lat) order!

  const candidates = await prisma.$queryRaw`
    SELECT id, title, status, "createdById", "clusterConfidence"
    FROM "Incident"
    WHERE category = ${category}
      AND status NOT IN ('CLOSED', 'RESOLVED')
      AND ST_DWithin(
        location,
        ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326),
        200 -- meters
      )
    ORDER BY "createdAt" DESC
    LIMIT 1;
  `;

  let incident;
  let isNew = false;

  if (candidates.length > 0) {
    // Attach to existing incident
    incident = candidates[0];

    // Optional: Boost severity or confidence if multiple people report it?
    // We could update the incident here if needed.
  } else {
    // Create new incident using raw SQL to insert geography
    // We need to generate UUID manually or let DB do it if default(uuid()) is set (it is).
    // But we need the ID back.

    // Returning clause helps us get the created row
    const result = await prisma.$queryRaw`
      INSERT INTO "Incident" (
        id, title, description, category, status, location, "severityScore", "credibilityScore", "clusterConfidence", "createdById", "createdAt"
      ) VALUES (
        gen_random_uuid(), -- ensuring we generate an ID
        ${title},
        ${description},
        ${category},
        'REPORTED',
        ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326),
        1, 0, 1.0, 
        ${userId},
        NOW()
      )
      RETURNING id, title, status, "createdById";
    `;

    incident = result[0];
    isNew = true;
  }

  // 2. Create the Report (Report model doesn't have PostGIS column in schema yet, it uses lat/lng floats, which is fine)
  // But wait, the schema says Report has lat/lng Float.
  await prisma.report.create({
    data: {
      incidentId: incident.id,
      reportedById: userId,
      description: description || title,
      photoUrls: photoUrls ? photoUrls : undefined,
      lat,
      lng
    }
  });

  if (isNew) {
    await prisma.timelineEvent.create({
      data: {
        incidentId: incident.id,
        actorId: userId,
        eventType: "CREATED",
        toStatus: incident.status,
        meta: { title, category }
      }
    });
  } else {
    // Log attachment?
    await prisma.timelineEvent.create({
      data: {
        incidentId: incident.id,
        actorId: userId,
        eventType: "REPORT_ADDED", // Custom event type ? 
        meta: { description: "User added a report to this existing incident" }
      }
    });
  }

  // enqueue scoring update
  await incidentQueue.add("recalculateScores", { incidentId: incident.id, userId });

  incident.isNew = isNew;
  incident.report = report;
  return incident;
};

export const listIncidents = async ({ status, category, take = 20, cursor }) => {
  const takeN = Math.min(Number(take) || 20, 50);

  const where = {};
  if (status) where.status = status;
  if (category) where.category = category;

  const items = await prisma.incident.findMany({
    where,
    orderBy: [{ credibilityScore: "desc" }, { createdAt: "desc" }],
    take: takeN + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    include: {
      _count: { select: { reports: true, confirmations: true } }
    }
  });

  const nextCursor = items.length > takeN ? items.pop().id : null;
  return { items, nextCursor };
};

// New: Geo-Spatial Query
export const listIncidentsNear = async ({ lat, lng, radiusKm = 2, status, category }) => {
  // Convert radius to meters
  const radiusMeters = radiusKm * 1000;

  // Base query
  // We want to return distance too?

  // Parameterized query is tricky with dynamic WHERE clauses in raw SQL in Prisma.
  // Simplest is to filter by status/category effectively.

  // Note: Prisma raw query parameters must be scalar values.

  const statusFilter = status ? `AND status = '${status}'` : ""; // Be careful with injection here if not careful, validation schema shields us usually.
  // Better use Prisma.sql helper if available or manual templating carefully.
  // Since we use Zod validation enum, status is safe.

  const categoryFilter = category ? `AND category = '${category}'` : ""; // Category might need sanitization if not strictly enum.

  // Using template literals for values we trust from validation (e.g. lat/lng are numbers)
  // For strings like status/category, it's safer to use ${val} if it works, but conditional logic is hard.
  // Let's rely on basic validation for now or use multiple queries.
  // Safest: use Prisma.join? No, just fetch all near and filter? PostGIS is fast.
  // Let's write a single query with standard SQL parameters if possible.

  const result = await prisma.$queryRawUnsafe(`
    SELECT 
      id, title, description, category, status, "severityScore", "credibilityScore",
      ST_Y(location::geometry) as lat,
      ST_X(location::geometry) as lng,
      ST_Distance(location, ST_SetSRID(ST_MakePoint($1, $2), 4326)) as distance_meters
    FROM "Incident"
    WHERE ST_DWithin(location, ST_SetSRID(ST_MakePoint($1, $2), 4326), $3)
    ${status ? `AND status = $4` : ""}
    ${category ? `AND category = $5` : ""}
    ORDER BY distance_meters ASC
    LIMIT 50;
  `, lng, lat, radiusMeters, ...(status ? [status] : []), ...(category ? [category] : []));

  // Wait, argument mapping for optional params is messy with $3, $4, etc indices changing.
  // Let's do a cleaner approach: fetch mostly by location, then filter in JS if needed?
  // Or handle arguments array dynamically.

  const args = [lng, lat, radiusMeters];
  let query = `
    SELECT 
      id, title, description, category, status, "severityScore", "credibilityScore",
      ST_Y(location::geometry) as lat,
      ST_X(location::geometry) as lng,
      ST_Distance(location, ST_SetSRID(ST_MakePoint($1, $2), 4326)) as distance_meters,
      (SELECT COUNT(*) FROM "Report" WHERE "incidentId" = "Incident".id) as report_count,
      (SELECT COUNT(*) FROM "Confirmation" WHERE "incidentId" = "Incident".id) as confirmation_count
    FROM "Incident"
    WHERE ST_DWithin(location, ST_SetSRID(ST_MakePoint($1, $2), 4326), $3)
  `;

  if (status) {
    args.push(status);
    query += ` AND status = $${args.length}`;
  }

  if (category) {
    args.push(category);
    query += ` AND category = $${args.length}`;
  }

  query += ` ORDER BY distance_meters ASC LIMIT 50`;

  const items = await prisma.$queryRawUnsafe(query, ...args);

  return items;
};

export const getIncident = async (id) => {
  const incident = await prisma.incident.findUnique({
    where: { id },
    include: {
      createdBy: { select: { id: true, name: true } },
      reports: {
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { reportedBy: { select: { id: true, name: true } } }
      },
      confirmations: true,
      timelineEvents: {
        orderBy: { createdAt: "desc" },
        take: 30,
        include: { actor: { select: { id: true, name: true } } }
      },
      assignments: { where: { active: true } }
    }
  });
  if (!incident) throw new ApiError(404, "Incident not found");

  // Note: incident.location is not returned by Prisma normally because it's Unsupported.
  // If we need lat/lng for the frontend, we might need a raw query or store it duplicately.
  // For now, let's rely on the reports lat/lng or fetch it raw if needed.
  // Given the 'Report' model has lat/lng, we can use that for display?
  // Or simpler: do a raw fetch for this single incident location if critical.

  return incident;
};

export const changeStatus = async ({ id, actorId, toStatus, reason }) => {
  const incident = await prisma.incident.findUnique({ where: { id } });
  if (!incident) throw new ApiError(404, "Incident not found");

  assertTransition(incident.status, toStatus);

  const updated = await prisma.incident.update({
    where: { id },
    data: { status: toStatus }
  });

  await prisma.timelineEvent.create({
    data: {
      incidentId: id,
      actorId,
      eventType: "STATUS_CHANGE",
      fromStatus: incident.status,
      toStatus,
      meta: { reason: reason || null }
    }
  });

  await incidentQueue.add("recalculateScores", { incidentId: id, userId: actorId });

  return updated;
};

export const confirmIncident = async ({ id, userId, type }) => {
  // prevent owner self-confirm (optional)
  const incident = await prisma.incident.findUnique({ where: { id } });
  if (!incident) throw new ApiError(404, "Incident not found");
  if (incident.createdById === userId) throw new ApiError(400, "You cannot confirm your own incident");

  await prisma.confirmation.upsert({
    where: { incidentId_userId: { incidentId: id, userId } },
    update: { type },
    create: { incidentId: id, userId, type }
  });

  await prisma.timelineEvent.create({
    data: {
      incidentId: id,
      actorId: userId,
      eventType: "CONFIRMATION",
      meta: { type }
    }
  });

  await incidentQueue.add("recalculateScores", { incidentId: id, userId });

  return true;
};
