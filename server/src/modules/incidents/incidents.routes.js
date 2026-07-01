import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { requireRole } from "../../middleware/rbac.js";
import { validate } from "../../middleware/validate.js";
import * as c from "./incidents.controller.js";
import { getHeatmapData } from "./heatmap.controller.js";
import { searchIncidents } from "./search.controller.js";
import { createIncidentSchema, listIncidentsSchema, listIncidentsNearSchema, changeStatusSchema, confirmSchema, getTimelineSchema } from "./incidents.schemas.js";
import { redis } from "../../config/redis.js";
import { prisma } from "../../config/prisma.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { reportLimiter, confirmationLimiter } from "../../middleware/rateLimiter.js";

export const incidentsRouter = Router();

incidentsRouter.get("/", validate(listIncidentsSchema), c.listIncidents);
incidentsRouter.get("/near", validate(listIncidentsNearSchema), c.listIncidentsNear);
incidentsRouter.get("/heatmap", getHeatmapData);
incidentsRouter.get("/search", searchIncidents);

incidentsRouter.get('/stats/public', asyncHandler(async (req, res) => {
  const cacheKey = 'public:stats';
  let cached = null;
  try {
    cached = await redis.get(cacheKey);
  } catch (err) {
    console.error('Redis error during public stats read:', err);
  }
  if (cached) return res.json(JSON.parse(cached));

  const [
    totalIncidents,
    resolvedIncidents,
    totalReports,
    totalUsers,
    recentlyResolved,
    topCategories,
  ] = await Promise.all([
    prisma.incident.count(),
    prisma.incident.count({
      where: { status: { in: ['RESOLVED', 'VERIFIED', 'CLOSED'] } },
    }),
    prisma.report.count(),
    prisma.user.count(),

    // Last 5 resolved incidents for the "proof of fix" feed
    prisma.incident.findMany({
      where:   { status: { in: ['RESOLVED', 'VERIFIED', 'CLOSED'] } },
      take:    5,
      orderBy: { createdAt: 'desc' },
      select:  {
        id: true, title: true, category: true,
        status: true, createdAt: true,
        reports: {
          take: 1,
          select: { photoUrls: true, lat: true, lng: true },
        },
      },
    }),

    prisma.incident.groupBy({
      by:      ['category'],
      _count:  { id: true },
      orderBy: { _count: { id: 'desc' } },
      take:    3,
    }),
  ]);

  const resolutionRate = totalIncidents > 0
    ? Math.round((resolvedIncidents / totalIncidents) * 100)
    : 0;

  const payload = {
    totalIncidents,
    resolvedIncidents,
    totalReports,
    totalUsers,
    resolutionRate,
    recentlyResolved,
    topCategories: topCategories.map(c => ({
      category: c.category,
      count:    c._count.id,
    })),
  };

  try {
    // Cache for 5 minutes — stats don't need to be real-time
    await redis.setex(cacheKey, 300, JSON.stringify(payload));
  } catch (err) {
    console.error('Redis error during public stats write:', err);
  }
  res.json(payload);
}));

incidentsRouter.get("/:id/timeline", validate(getTimelineSchema), c.getTimeline);
incidentsRouter.get("/:id", c.getIncident);

incidentsRouter.post("/", requireAuth, reportLimiter, validate(createIncidentSchema), c.createIncident);

incidentsRouter.post("/:id/confirm", requireAuth, confirmationLimiter, validate(confirmSchema), c.confirm);

// status changes should be restricted
incidentsRouter.patch(
  "/:id/status",
  requireAuth,
  requireRole("MODERATOR", "ADMIN", "WORKER_TEAM"),
  validate(changeStatusSchema),
  c.changeStatus
);

