import { Router } from "express";
import { prisma } from "../../config/prisma.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { authenticate } from "../../middleware/auth.js";

const router = Router();
router.use(authenticate());

// GET /api/notifications — paginated, newest first
router.get("/", asyncHandler(async (req, res) => {
  const limit  = Math.min(parseInt(req.query.limit  || "20"), 50);
  const cursor = req.query.cursor || null;

  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: {
        userId: req.user.id,
        ...(cursor && { id: { lt: cursor } }),
      },
      take:    limit + 1,
      orderBy: { createdAt: "desc" },
    }),
    prisma.notification.count({
      where: { userId: req.user.id, readAt: null },
    }),
  ]);

  const hasNextPage = notifications.length > limit;
  const items       = hasNextPage ? notifications.slice(0, limit) : notifications;

  res.json({
    notifications: items,
    unreadCount,
    nextCursor:  hasNextPage ? items[items.length - 1].id : null,
    hasNextPage,
  });
}));

// PATCH /api/notifications/:id/read
router.patch("/:id/read", asyncHandler(async (req, res) => {
  await prisma.notification.updateMany({
    where: { id: req.params.id, userId: req.user.id },
    data:  { readAt: new Date() },
  });
  res.json({ success: true });
}));

// PATCH /api/notifications/read-all
router.patch("/read-all", asyncHandler(async (req, res) => {
  const { count } = await prisma.notification.updateMany({
    where: { userId: req.user.id, readAt: null },
    data:  { readAt: new Date() },
  });
  res.json({ success: true, marked: count });
}));

export default router;
