import { prisma } from "../../config/prisma.js";

// Simple scoring logic (expand later)
export const recalculateScores = async (incidentId) => {
  const incident = await prisma.incident.findUnique({
    where: { id: incidentId },
    include: {
      _count: { select: { reports: true, confirmations: true } },
      confirmations: true
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
};
