import { Server } from "socket.io";
import { verifyAccess } from "../../config/jwt.js";
import { prisma } from "../../config/prisma.js";
import { env } from "../../config/env.js";
import logger from "../../config/logger.js";

const log = logger.child({ module: "socket" });


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
    const { id: userId } = socket.user;
    const log_socket = log.child({ userId, socketId: socket.id });
    log_socket.info("Socket connected");

    // Always join the personal room on connect
    socket.join(`user:${userId}`);

    // ── Room subscriptions ──────────────────────────────────

    // Client joins when they open an incident detail page
    socket.on("subscribe:incident", (incidentId) => {
      try {
        if (typeof incidentId !== "string") {
          throw new Error("Invalid incidentId type");
        }
        socket.join(`incident:${incidentId}`);
        log_socket.debug({ incidentId }, "Subscribed to incident room");
      } catch (err) {
        log_socket.warn({ err, incidentId }, "subscribe:incident failed");
      }
    });

    socket.on("unsubscribe:incident", (incidentId) => {
      socket.leave(`incident:${incidentId}`);
    });

    // Client joins when they grant location or select an area
    socket.on("subscribe:area", (areaCode) => {
      try {
        if (typeof areaCode !== "string") {
          throw new Error("Invalid areaCode type");
        }
        socket.join(`area:${areaCode}`);
        log_socket.debug({ areaCode }, "Subscribed to area room");
      } catch (err) {
        log_socket.warn({ err, areaCode }, "subscribe:area failed");
      }
    });

    socket.on("unsubscribe:area", (areaCode) => {
      socket.leave(`area:${areaCode}`);
    });

    // Socket.io's own error event — fires on transport-level issues
    socket.on("error", (err) => {
      log_socket.error({ err }, "Socket error");
    });

    socket.on("disconnect", (reason) => {
      log_socket.info({ reason }, "Socket disconnected");
    });
  });

  // Server-level connection errors — auth failures land here too
  io.on("connect_error", (err) => {
    log.warn({ err }, "Socket connection rejected");
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
