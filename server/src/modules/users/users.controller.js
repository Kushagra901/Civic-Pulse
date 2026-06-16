import { prisma } from '../../config/prisma.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiError } from '../../utils/ApiError.js';
import { getReputationTier } from '../../utils/reputation.js';

export const getUserProfile = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,          // only expose if own profile
      role: true,
      trustScore: true,
      createdAt: true,
      _count: {
        select: {
          reports: true,
          confirmations: true,
        },
      },
    },
  });

  if (!user) throw new ApiError(404, 'User not found');

  // Hide email if viewing someone else's profile
  const isSelf = req.user?.id === userId;
  if (!isSelf) delete user.email;

  // Add tier info
  user.tier = getReputationTier(user.trustScore);

  // Fetch incident stats the user is associated with
  const [resolvedCount, disputeCount, recentReports] = await Promise.all([
    // Incidents the user reported that reached RESOLVED or beyond
    prisma.incident.count({
      where: {
        reports: { some: { reportedById: userId } },
        status: { in: ['RESOLVED', 'VERIFIED', 'CLOSED'] },
      },
    }),

    // How many times user's confirmations were DISPUTE type
    prisma.confirmation.count({
      where: { userId, type: 'DISPUTE' },
    }),

    // Last 5 reports filed by user
    prisma.report.findMany({
      where: { reportedById: userId },
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        createdAt: true,
        incident: {
          select: {
            id: true,
            title: true,
            category: true,
            status: true,
            credibilityScore: true,
          },
        },
      },
    }),
  ]);

  res.json({
    user,
    stats: {
      totalReports: user._count.reports,
      totalConfirmations: user._count.confirmations,
      resolvedReports: resolvedCount,
      disputesFiled: disputeCount,
      // Resolution rate: % of their reports that got resolved
      resolutionRate: user._count.reports > 0
        ? Math.round((resolvedCount / user._count.reports) * 100)
        : 0,
    },
    recentReports,
  });
});
