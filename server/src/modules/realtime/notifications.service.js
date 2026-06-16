import { prisma } from "../../config/prisma.js";
import { emitToUser } from "./socket.js";

const log = {
  info: (...args) => console.log("[INFO] [NOTIFICATIONS]", ...args),
  error: (...args) => console.error("[ERROR] [NOTIFICATIONS]", ...args),
  debug: (...args) => console.log("[DEBUG] [NOTIFICATIONS]", ...args),
  child: () => log
};

export async function persistNotification(userId, { type, title, body, incidentId }) {
  try {
    const notification = await prisma.notification.create({
      data: { userId, type, title, body, incidentId },
    });

    // Push to the user's personal socket room immediately
    emitToUser(userId, "notification:new", {
      id:         notification.id,
      type,
      title,
      body,
      incidentId,
      createdAt:  notification.createdAt,
    });

    return notification;
  } catch (err) {
    // Never let a notification failure break the main request
    log.error(`Failed to persist notification for user ${userId}, type: ${type}`, err);
    return null;
  }
}
