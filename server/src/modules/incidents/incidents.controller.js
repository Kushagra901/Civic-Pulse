import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { prisma } from "../../config/prisma.js";
import * as service from "./incidents.service.js";
import { env } from "../../config/env.js";
import { emitToArea, emitToIncident, emitToUser } from "../realtime/socket.js";
import { persistNotification } from "../realtime/notifications.service.js";
import { redis } from "../../config/redis.js";
import { sanitiseCoordinates } from "../../utils/sanitise.js";

export const createIncident = asyncHandler(async (req, res) => {
  const { title, category, description, lat, lng, photoUrls } = req.validated.body;

  // Enforce a 5-minute report submission cooldown per user via Redis
  const cooldownKey = `cooldown:report:${req.user.id}`;
  let hasCooldown = false;
  let ttl = 300;
  try {
    const val = await redis.get(cooldownKey);
    if (val) {
      hasCooldown = true;
      ttl = await redis.ttl(cooldownKey);
    }
  } catch (err) {
    console.error(`[Cooldown Check] Redis error: ${err.message}. Failing open.`);
  }

  if (hasCooldown) {
    throw new ApiError(429, `Please wait ${ttl} seconds before submitting another report.`);
  }

  // Validate that URLs actually point to your Cloudinary account
  // (prevents users submitting arbitrary URLs)
  if (photoUrls && photoUrls.length > 0) {
    const allowedHost = `res.cloudinary.com/${env.CLOUDINARY_CLOUD_NAME || ""}`;
    const allTrusted = photoUrls.every(url => url.includes(allowedHost));

    if (!allTrusted) {
      throw new ApiError(400, 'Photo URLs must come from the CivicPulse upload service');
    }
  }

  // Sanitise and round coordinates
  const { lat: cleanLat, lng: cleanLng } = sanitiseCoordinates(lat, lng);

  const incident = await service.createOrAttachIncident({
    userId: req.user.id,
    title,
    category,
    description,
    lat: cleanLat,
    lng: cleanLng,
    photoUrls
  });

  // Set report cooldown in Redis
  try {
    await redis.setex(cooldownKey, 300, '1');
  } catch (err) {
    console.error(`[Cooldown Set] Redis error: ${err.message}`);
  }

  const { isNew, report } = incident;

  if (isNew) {
    emitToArea(incident.areaCode || "delhi", "incident:new", {
      id:               incident.id,
      title:            incident.title,
      category:         incident.category,
      credibilityScore: incident.credibilityScore,
      status:           incident.status,
    });
  } else {
    // Tell everyone on the incident detail page a new report was added
    emitToIncident(incident.id, "incident:report_added", {
      incidentId:   incident.id,
      reportId:     report.id,
      reporterName: req.user.name,
      newScore:     incident.credibilityScore,
    });

    // Notify the original reporter their incident gained a confirmation
    const originalReporter = await prisma.report.findFirst({
      where:   { incidentId: incident.id },
      orderBy: { createdAt: "asc" },
      select:  { reportedById: true },
    });

    if (originalReporter && originalReporter.reportedById !== req.user.id) {
      await persistNotification(originalReporter.reportedById, {
        type:       "REPORT_ADDED",
        title:      "Someone else reported the same issue",
        body:       `Your incident "${incident.title}" now has an additional report.`,
        incidentId: incident.id,
      });
    }
  }

  res.status(201).json({ success: true, incident, report, isNew });
});

export const listIncidents = asyncHandler(async (req, res) => {
  const {
    cursor, cursorDate, status, category,
    bbox, near, limit,
  } = req.validated.query;

  // ── Build WHERE clause ──────────────────────────────────────

  const where = {};

  if (status)   where.status   = status;
  if (category) where.category = category;

  // Cursor: fetch rows older than the last seen item
  // Uses a compound cursor on (createdAt, id) for stable ordering
  // when multiple incidents share the same timestamp
  if (cursor && cursorDate) {
    where.OR = [
      // Strictly older
      { createdAt: { lt: new Date(cursorDate) } },
      // Same timestamp but lower UUID (tie-break)
      { createdAt: new Date(cursorDate), id: { lt: cursor } },
    ];
  }

  // ── Geo filters via raw PostGIS ─────────────────────────────
  // We handle bbox and near separately as raw queries because
  // Prisma doesn't natively support PostGIS functions

  let incidentIds = null;  // null = no geo filter applied

  if (near) {
    const [lat, lng, radius = 5000] = near.split(',').map(Number);
    const rows = await prisma.$queryRaw`
      SELECT id FROM "Incident"
      WHERE ST_DWithin(
        location::geography,
        ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography,
        ${radius}
      )
      AND status NOT IN ('CLOSED')
    `;
    incidentIds = rows.map(r => r.id);
  }

  if (bbox) {
    const [minLng, minLat, maxLng, maxLat] = bbox.split(',').map(Number);
    const rows = await prisma.$queryRaw`
      SELECT id FROM "Incident"
      WHERE ST_Within(
        location::geometry,
        ST_MakeEnvelope(${minLng}, ${minLat}, ${maxLng}, ${maxLat}, 4326)
      )
    `;
    const bboxIds = rows.map(r => r.id);
    // Intersect with proximity result if both filters are active
    incidentIds = incidentIds
      ? incidentIds.filter(id => bboxIds.includes(id))
      : bboxIds;
  }

  if (incidentIds !== null) {
    where.id = { in: incidentIds };
  }

  // ── Fetch one extra row to determine hasNextPage ────────────

  const rows = await prisma.incident.findMany({
    where,
    take:    limit + 1,   // fetch one more than asked
    orderBy: [
      { createdAt: 'desc' },
      { id:        'desc' },   // tie-break
    ],
    select: {
      id:               true,
      title:            true,
      category:         true,
      status:           true,
      credibilityScore: true,
      severityScore:    true,
      createdAt:        true,
      isFlagged:        true,
      _count: {
        select: {
          reports:       true,
          confirmations: true,
        },
      },
      reports: {
        take:    1,
        orderBy: { createdAt: 'asc' },
        select:  {
          lat:        true,
          lng:        true,
          reportedBy: { select: { id: true, name: true } },
          photoUrls:  true,
        },
      },
    },
  });

  // ── Build cursor for next page ──────────────────────────────

  const hasNextPage = rows.length > limit;
  const incidents   = hasNextPage ? rows.slice(0, limit) : rows;

  const lastItem  = incidents[incidents.length - 1];
  const nextCursor = hasNextPage && lastItem
    ? {
        cursor:     lastItem.id,
        cursorDate: lastItem.createdAt.toISOString(),
      }
    : null;

  res.json({
    incidents,
    nextCursor,      // null when on the last page
    hasNextPage,
    count: incidents.length,
  });
});

export const listIncidentsNear = asyncHandler(async (req, res) => {
  const { lat, lng, radiusKm, status, category } = req.validated.query;
  const incidents = await service.listIncidentsNear({ lat, lng, radiusKm, status, category });
  res.json({ success: true, count: incidents.length, incidents });
});

export const getIncident = asyncHandler(async (req, res) => {
  const incident = await service.getIncident(req.params.id);
  res.json({ success: true, incident });
});

export const changeStatus = asyncHandler(async (req, res) => {
  const { toStatus, reason } = req.validated.body;

  const currentIncident = await prisma.incident.findUnique({ where: { id: req.params.id } });
  if (!currentIncident) throw new ApiError(404, "Incident not found");

  const updated = await service.changeStatus({
    id: req.params.id,
    actorId: req.user.id,
    toStatus,
    reason
  });

  emitToIncident(req.params.id, "incident:status_changed", {
    incidentId: req.params.id,
    fromStatus: currentIncident.status,
    toStatus:   toStatus,
    reason,
    updatedAt:  new Date().toISOString(),
  });

  // Persist + push to every reporter of this incident
  const reporters = await prisma.report.findMany({
    where:  { incidentId: req.params.id },
    select: { reportedById: true },
    distinct: ["reportedById"],
  });

  const statusMessages = {
    TRIAGED:     "Your report is being reviewed by moderators.",
    ASSIGNED:    "A team has been assigned to fix this issue.",
    IN_PROGRESS: "Work has started on this issue.",
    RESOLVED:    "This issue has been marked as resolved.",
    VERIFIED:    "The resolution has been independently verified.",
    CLOSED:      "This incident has been closed.",
  };

  await Promise.all(reporters.map(({ reportedById }) =>
    persistNotification(reportedById, {
      type:       "STATUS_CHANGE",
      title:      `Incident status updated → ${toStatus.replace("_", " ")}`,
      body:       statusMessages[toStatus] || `Status changed to ${toStatus}.`,
      incidentId: req.params.id,
    })
  ));

  res.json({ success: true, incident: updated });
});

export const confirm = asyncHandler(async (req, res) => {
  // Silently discard votes (return 200 success) for shadow-banned users
  if (req.user?.isBanned) {
    console.warn(`[Shadow-Ban] User ${req.user.id} attempted to confirm/dispute incident ${req.params.id} but is banned. Discarding vote silently.`);
    return res.json({ success: true });
  }

  const { type, lat, lng } = req.validated.body;
  const id = req.params.id;

  // Proximity check: enforce 500m radius check using ST_DWithin PostGIS query
  const proximityMatch = await prisma.$queryRaw`
    SELECT id FROM "Incident"
    WHERE id = ${id}::uuid
      AND ST_DWithin(
        location,
        ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326),
        500
      )
  `;

  if (!proximityMatch || proximityMatch.length === 0) {
    throw new ApiError(400, "You must be within 500 meters of the incident location to confirm or dispute it.");
  }

  await service.confirmIncident({ id, userId: req.user.id, type });

  // Fetch updated votes and score from database to emit
  const updatedIncident = await prisma.incident.findUnique({
    where: { id },
    select: {
      credibilityScore: true,
      confirmations: {
        select: {
          type: true
        }
      }
    }
  });

  if (updatedIncident) {
    const confirms = updatedIncident.confirmations.filter(c => c.type === "CONFIRM").length;
    const disputes = updatedIncident.confirmations.filter(c => c.type === "DISPUTE").length;

    emitToIncident(id, "incident:score_updated", {
      incidentId:       id,
      credibilityScore: updatedIncident.credibilityScore,
      confirms,
      disputes,
    });
  }

  res.json({ success: true });
});

export const getTimeline = asyncHandler(async (req, res) => {
  const { id } = req.validated.params;
  const { cursor, limit = 15 } = req.validated.query;

  const where = {
    incidentId: id,
    ...(cursor && { id: { lt: cursor } }),   // simple ID cursor for timeline
  };

  const rows = await prisma.timelineEvent.findMany({
    where,
    take:    limit + 1,
    orderBy: { createdAt: 'desc' },
    select: {
      id:        true,
      eventType: true,
      fromStatus: true,
      toStatus:   true,
      meta:       true,
      createdAt:  true,
      actor: { select: { id: true, name: true, role: true } },
    },
  });

  const hasNextPage = rows.length > limit;
  const events      = hasNextPage ? rows.slice(0, limit) : rows;

  res.json({
    events,
    nextCursor:  hasNextPage ? events[events.length - 1].id : null,
    hasNextPage,
  });
});
