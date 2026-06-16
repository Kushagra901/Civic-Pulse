import { Server } from "socket.io";
import { verifyAccess } from "../../config/jwt.js";
import { prisma } from "../../config/prisma.js";
import { env } from "../../config/env.js";

const log = {
  info: (...args) => console.log("[INFO] [SOCKET]", ...args),
  error: (...args) => console.error("[ERROR] [SOCKET]", ...args),
  debug: (...args) => console.log("[DEBUG] [SOCKET]", ...args),
  child: () => log
};

let io = null;   // module-level singleton — imported by route handlers

export function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin:      env.CORS_ORIGIN || "http://localhost:5173",
      credentials: true,
    },
    // Reconnection handled client-side; ping keeps the connection alive
    pingTimeout:  20000,
    pingInterval: 10000,
  });

  // ── Auth middleware ───────────────────────────────────────
  // Every socket connection must carry a valid JWT in the
  // handshake auth object. Unauthenticated connections are rejected.
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("AUTH_REQUIRED"));

      const payload = verifyAccess(token);
      socket.user = {
        id:   payload.sub,
        role: payload.role,
      };
      next();
    } catch {
      next(new Error("AUTH_INVALID"));
    }
  });

  io.on("connection", (socket) => {
    const { id: userId, role } = socket.user;
    log.info(`Socket connected for user ${userId}, socket ID: ${socket.id}`);

    // Always join the personal room on connect
    socket.join(`user:${userId}`);

    // ── Room subscriptions ──────────────────────────────────

    // Client joins when they open an incident detail page
    socket.on("subscribe:incident", (incidentId) => {
      if (typeof incidentId !== "string") return;
      socket.join(`incident:${incidentId}`);
      log.debug(`User ${userId} subscribed to incident room incident:${incidentId}`);
    });

    socket.on("unsubscribe:incident", (incidentId) => {
      socket.leave(`incident:${incidentId}`);
    });

    // Client joins when they grant location or select an area
    socket.on("subscribe:area", (areaCode) => {
      if (typeof areaCode !== "string") return;
      socket.join(`area:${areaCode}`);
      log.debug(`User ${userId} subscribed to area room area:${areaCode}`);
    });

    socket.on("unsubscribe:area", (areaCode) => {
      socket.leave(`area:${areaCode}`);
    });

    socket.on("disconnect", (reason) => {
      log.info(`Socket disconnected for user ${userId}, reason: ${reason}`);
    });
  });

  log.info("Socket.io initialised");
  return io;
}

// ── Emitter helpers ───────────────────────────────────────────
// Route handlers import these — they never import `io` directly.
// Helpers do nothing gracefully if Socket.io isn't initialised
// (e.g. during tests).

export function emitToUser(userId, event, data) {
  io?.to(`user:${userId}`).emit(event, data);
}

export function emitToIncident(incidentId, event, data) {
  io?.to(`incident:${incidentId}`).emit(event, data);
}

export function emitToArea(areaCode, event, data) {
  io?.to(`area:${areaCode}`).emit(event, data);
}
