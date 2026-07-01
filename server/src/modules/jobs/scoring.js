import { prisma } from "../../config/prisma.js";
import { invalidatePrefix } from "../../utils/cache.js";


export async function updateUserTrustScore(userId) {
  const [reports, confirmations, disputes, resolvedCount] = await Promise.all([
    prisma.report.count({ where: { reportedById: userId } }),
    prisma.confirmation.count({ where: { userId, type: 'CONFIRM' } }),
    prisma.confirmation.count({ where: { userId, type: 'DISPUTE' } }),
    prisma.incident.count({
      where: {
        reports: { some: { reportedById: userId } },
        status: { in: ['RESOLVED', 'VERIFIED', 'CLOSED'] },
      },
    }),
  ]);

  // Check dispute rate on incidents reported by this user to auto-ban
  const userReports = await prisma.report.findMany({
    where: { reportedById: userId },
    select: { incidentId: true }
  });
  const incidentIds = [...new Set(userReports.map(r => r.incidentId))];

  let shouldBan = false;
  if (incidentIds.length > 0) {
    const votes = await prisma.confirmation.groupBy({
      by: ['type'],
      where: {
        incidentId: { in: incidentIds }
      },
      _count: { id: true }
    });

    const confirmVotes = votes.find(v => v.type === 'CONFIRM')?._count.id || 0;
    const disputeVotes = votes.find(v => v.type === 'DISPUTE')?._count.id || 0;
    const totalVotes = confirmVotes + disputeVotes;

    if (totalVotes >= 10) {
      const disputeRate = disputeVotes / totalVotes;
      if (disputeRate > 0.8) {
        shouldBan = true;
        console.warn(`[Auto-Ban] User ${userId} marked for ban. Dispute rate: ${(disputeRate * 100).toFixed(1)}% (${disputeVotes}/${totalVotes})`);
      }
    }
  }

  // Formula:
  // +1 per report filed
  // +3 per resolved report (quality signal)
  // +1 per confirmation given
  // -2 per dispute filed (disputes carry social risk)
  // Floor at 0, no negative scores
  const raw =
    reports * 1 +
    resolvedCount * 3 +
    confirmations * 1 -
    disputes * 2;

  const trustScore = shouldBan ? 0 : Math.max(0, raw);

  await prisma.user.update({
    where: { id: userId },
    data: { 
      trustScore,
      ...(shouldBan && { isBanned: true })
    },
  });

  return trustScore;
}

// Simple scoring logic
export const recalculateScores = async (incidentId) => {
  const incident = await prisma.incident.findUnique({
    where: { id: incidentId },
    include: {
      _count: { select: { reports: true, confirmations: true } },
      confirmations: true,
      reports: { select: { reportedById: true } }
    }
  });

  if (!incident) return;

  const confirms = incident.confirmations.filter((c) => c.type === "CONFIRM").length;
  const disputes = incident.confirmations.filter((c) => c.type === "DISPUTE").length;

  // credibility: reports + confirms - disputes
  const credibilityScore = Math.max(0, incident._count.reports * 1 + confirms * 2 - disputes * 2);

  // severity: credibility weighted by open state
  const statusFactor = ["REPORTED","TRIAGED","ASSIGNED","IN_PROGRESS"].includes(incident.status) ? 1 : 0.5;
  const severityScore = credibilityScore * statusFactor;

  await prisma.incident.update({
    where: { id: incidentId },
    data: { credibilityScore, severityScore }
  });

  // Invalidate caches that could now be stale
  await Promise.all([
    invalidatePrefix('heatmap:'),
    invalidatePrefix('search:'),
  ]).catch(err => {
    console.error('Failed to invalidate prefixes in scoring:', err.message);
  });

  // Automatically update trust scores of users involved in this incident
  const userIdsToUpdate = new Set();
  if (incident.createdById) userIdsToUpdate.add(incident.createdById);
  if (incident.reports) {
    incident.reports.forEach(r => userIdsToUpdate.add(r.reportedById));
  }
  if (incident.confirmations) {
    incident.confirmations.forEach(c => userIdsToUpdate.add(c.userId));
  }

  for (const uid of userIdsToUpdate) {
    await updateUserTrustScore(uid);
  }
};

