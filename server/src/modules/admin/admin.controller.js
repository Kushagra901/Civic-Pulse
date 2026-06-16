import { prisma } from '../../config/prisma.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiError } from '../../utils/ApiError.js';

const log = {
  info: (obj, msg) => console.log(`[INFO] ${msg}`, obj),
  warn: (obj, msg) => console.warn(`[WARN] ${msg}`, obj),
  error: (obj, msg) => console.error(`[ERROR] ${msg}`, obj)
};

// ── Triage queue ─────────────────────────────────────────────
// Returns incidents needing attention: newly reported, flagged,
// or stale (no status change in 48h)
export const getTriageQueue = asyncHandler(async (req, res) => {
  const { status, category, page = '1', limit = '20' } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = {
    ...(status   && { status }),
    ...(category && { category }),
  };

  const [incidents, total] = await Promise.all([
    prisma.incident.findMany({
      where,
      skip,
      take: parseInt(limit),
      orderBy: [
        { credibilityScore: 'desc' },
        { createdAt: 'desc' },
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
          take: 1,
          orderBy: { createdAt: 'asc' },
          select: {
            reportedBy: {
              select: { id: true, name: true, trustScore: true },
            },
          },
        },
        assignments: {
          where:  { active: true },
          select: { teamName: true },
          take:   1,
        },
      },
    }),
    prisma.incident.count({ where }),
  ]);

  res.json({
    incidents,
    pagination: {
      total,
      page:       parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
    },
  });
});

// ── Flag / unflag an incident ────────────────────────────────
export const flagIncident = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason, flag = true } = req.body;

  const incident = await prisma.incident.update({
    where: { id },
    data:  { isFlagged: flag },
  });

  await prisma.timelineEvent.create({
    data: {
      incidentId: id,
      actorId:    req.user.id,
      eventType:  'NOTE',
      meta:       { action: flag ? 'FLAGGED' : 'UNFLAGGED', reason },
    },
  });

  log.warn({ incidentId: id, actorId: req.user.id, flag, reason },
    'Incident flag toggled');

  res.json({ success: true, isFlagged: incident.isFlagged });
});

// ── Assign a team to an incident ─────────────────────────────
export const assignTeam = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { teamName } = req.body;

  if (!teamName?.trim()) throw new ApiError(400, 'teamName is required');

  // Deactivate any existing assignment first
  await prisma.assignment.updateMany({
    where: { incidentId: id, active: true },
    data:  { active: false },
  });

  const [assignment] = await Promise.all([
    prisma.assignment.create({
      data: {
        incidentId:  id,
        teamName:    teamName.trim(),
        assignedBy:  req.user.id,
        active:      true,
      },
    }),
    prisma.incident.update({
      where: { id },
      data:  { status: 'ASSIGNED' },
    }),
    prisma.timelineEvent.create({
      data: {
        incidentId: id,
        actorId:    req.user.id,
        eventType:  'ASSIGNMENT',
        fromStatus: 'TRIAGED',
        toStatus:   'ASSIGNED',
        meta:       { teamName },
      },
    }),
  ]);

  log.info({ incidentId: id, teamName, actorId: req.user.id }, 'Team assigned');

  res.json(assignment);
});

// ── Update user role ──────────────────────────────────────────
export const updateUserRole = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { role } = req.body;

  const VALID_ROLES = ['CITIZEN', 'MODERATOR', 'ADMIN', 'WORKER_TEAM'];
  if (!VALID_ROLES.includes(role)) {
    throw new ApiError(400, `Role must be one of: ${VALID_ROLES.join(', ')}`);
  }

  // Prevent self-demotion
  if (userId === req.user.id) {
    throw new ApiError(403, 'You cannot change your own role');
  }

  const user = await prisma.user.update({
    where:  { id: userId },
    data:   { role },
    select: { id: true, name: true, email: true, role: true },
  });

  log.warn({
    targetUserId: userId,
    newRole:      role,
    actorId:      req.user.id,
  }, 'User role changed');

  res.json(user);
});

// ── Shadow ban a user ─────────────────────────────────────────
export const banUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { ban = true, reason } = req.body;

  if (userId === req.user.id) {
    throw new ApiError(403, 'You cannot ban yourself');
  }

  const user = await prisma.user.update({
    where:  { id: userId },
    data:   { isBanned: ban, trustScore: ban ? 0 : undefined },
    select: { id: true, name: true, isBanned: true },
  });

  log.warn({
    targetUserId: userId,
    ban,
    reason,
    actorId: req.user.id,
  }, 'User ban status changed');

  res.json(user);
});

// ── Platform metrics ──────────────────────────────────────────
export const getMetrics = asyncHandler(async (req, res) => {
  const now      = new Date();
  const last24h  = new Date(now - 24 * 60 * 60 * 1000);
  const last7d   = new Date(now - 7  * 24 * 60 * 60 * 1000);

  const [
    totalIncidents,
    openIncidents,
    resolvedLast7d,
    newLast24h,
    totalUsers,
    newUsersLast7d,
    byCategory,
    byStatus,
    avgResolutionMs,
  ] = await Promise.all([
    prisma.incident.count(),
    prisma.incident.count({
      where: { status: { notIn: ['RESOLVED', 'VERIFIED', 'CLOSED'] } },
    }),
    prisma.incident.count({
      where: {
        status:    { in: ['RESOLVED', 'VERIFIED', 'CLOSED'] },
        updatedAt: { gte: last7d },
      },
    }),
    prisma.incident.count({ where: { createdAt: { gte: last24h } } }),
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: last7d } } }),
    prisma.incident.groupBy({
      by:         ['category'],
      _count:     { id: true },
      orderBy:    { _count: { id: 'desc' } },
    }),
    prisma.incident.groupBy({
      by:         ['status'],
      _count:     { id: true },
    }),
    // Average time from REPORTED to RESOLVED via timeline events (updated schema matching)
    prisma.$queryRaw`
      SELECT AVG(
        EXTRACT(EPOCH FROM (resolved."createdAt" - created_ev."createdAt")) * 1000
      ) as avg_ms
      FROM "TimelineEvent" created_ev
      JOIN "TimelineEvent" resolved
        ON created_ev."incidentId" = resolved."incidentId"
       AND resolved."toStatus" = 'RESOLVED'
      WHERE created_ev."eventType" = 'CREATED'
    `,
  ]);

  const avgResolutionHours = avgResolutionMs[0]?.avg_ms
    ? Math.round(Number(avgResolutionMs[0].avg_ms) / 3_600_000)
    : null;

  res.json({
    overview: {
      totalIncidents,
      openIncidents,
      resolvedLast7d,
      newLast24h,
      totalUsers,
      newUsersLast7d,
      avgResolutionHours,
    },
    byCategory: byCategory.map(r => ({
      category: r.category,
      count:    r._count.id,
    })),
    byStatus: byStatus.map(r => ({
      status: r.status,
      count:  r._count.id,
    })),
  });
});
