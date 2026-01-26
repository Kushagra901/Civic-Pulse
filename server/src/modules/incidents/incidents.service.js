import { prisma } from "../../config/prisma.js";
import { ApiError } from "../../utils/ApiError.js";
import { assertTransition } from "./incidents.workflow.js";
import { incidentQueue } from "../jobs/queue.js";

// simple haversine (km) for dedupe without PostGIS
const toRad = (d) => (d * Math.PI) / 180;
const haversineKm = (a, b) => {
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s1 = Math.sin(dLat / 2) ** 2;
  const s2 = Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s1 + s2));
};

export const createOrAttachIncident = async ({ userId, title, category, description, lat, lng, photoUrls }) => {
  // naive candidate search: recent open incidents same category
  const candidates = await prisma.incident.findMany({
    where: {
      category,
      status: { notIn: ["CLOSED"] }
    },
    orderBy: { createdAt: "desc" },
    take: 50
  });

  const here = { lat, lng };
  const match = candidates.find((c) => haversineKm(here, { lat: c.lat, lng: c.lng }) <= 0.25); // 250m

  let incident;
  if (match) {
    incident = match;
  } else {
    incident = await prisma.incident.create({
      data: {
        title,
        category,
        description,
        lat,
        lng,
        createdById: userId
      }
    });

    await prisma.timelineEvent.create({
      data: {
        incidentId: incident.id,
        actorId: userId,
        eventType: "CREATED",
        toStatus: incident.status,
        meta: { title, category }
      }
    });
  }

  // always create a report instance
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

  // enqueue scoring update
  await incidentQueue.add("recalculateScores", { incidentId: incident.id });

  return incident;
};

export const listIncidents = async ({ status, category, take = 20, cursor }) => {
  const takeN = Math.min(Number(take) || 20, 50);

  const where = {};
  if (status) where.status = status;
  if (category) where.category = category;

  const items = await prisma.incident.findMany({
    where,
    orderBy: [{ credibilityScore: "desc" }, { updatedAt: "desc" }],
    take: takeN + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    include: {
      _count: { select: { reports: true, confirmations: true } }
    }
  });

  const nextCursor = items.length > takeN ? items.pop().id : null;
  return { items, nextCursor };
};

export const getIncident = async (id) => {
  const incident = await prisma.incident.findUnique({
    where: { id },
    include: {
      reports: { orderBy: { createdAt: "desc" }, take: 10 },
      confirmations: true,
      timelineEvents: { orderBy: { createdAt: "desc" }, take: 30 },
      assignments: { where: { active: true } }
    }
  });
  if (!incident) throw new ApiError(404, "Incident not found");
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

  await incidentQueue.add("recalculateScores", { incidentId: id });

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

  await incidentQueue.add("recalculateScores", { incidentId: id });

  return true;
};
