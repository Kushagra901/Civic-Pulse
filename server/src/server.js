import { env } from "./config/env.js"; // validates env — must be first import
import http from "http";
import { createApp } from "./app.js";
import { initSocket } from "./modules/realtime/socket.js";
import logger from "./config/logger.js";
import { prisma } from "./config/prisma.js";
import { redis } from "./config/redis.js";

const log = logger.child({ module: "process" });

// ── Catches promise rejections that weren't awaited/caught anywhere ──
process.on("unhandledRejection", (reason) => {
  log.fatal({ reason }, "Unhandled promise rejection — this is a bug, fix the missing catch");
  if (env.NODE_ENV !== "production") {
    process.exit(1);
  }
});

// ── Catches synchronous errors thrown outside Express's request cycle ──
process.on("uncaughtException", (err) => {
  log.fatal({ err }, "Uncaught exception — process will exit");
  process.exit(1);
});

const app = createApp();
const server = http.createServer(app);
const io = initSocket(server);

app.set("io", io);

// ── Graceful shutdown on platform-issued termination ──────────────────
process.on("SIGTERM", async () => {
  log.info("SIGTERM received — shutting down gracefully");

  server.close(() => {
    log.info("HTTP server closed");
  });

  try {
    await prisma.$disconnect();
    await redis.quit();
  } catch (err) {
    log.error({ err }, "Error during disconnect");
  }

  process.exit(0);
});

server.listen(env.PORT, () => {
  log.info(`✅ API running on http://localhost:${env.PORT}`);
});

