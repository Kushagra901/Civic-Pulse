import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { env } from "./config/env.js";
import { errorHandler } from "./middleware/error.js";

import { authRouter } from "./modules/auth/auth.routes.js";
import { incidentsRouter } from "./modules/incidents/incidents.routes.js";
import userRoutes from "./modules/users/users.routes.js";
import uploadRoutes from "./modules/uploads/uploads.routes.js";
import adminRoutes from "./modules/admin/admin.routes.js";
import notificationRoutes from "./modules/realtime/notifications.routes.js";

export const createApp = () => {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());
  app.use(morgan("dev"));

  app.get("/", (req, res) => res.json({ message: "Civic Pulse API v1" }));
  app.get("/health", (req, res) => res.json({ ok: true }));

  app.use("/api/auth", authRouter);
  app.use("/api/incidents", incidentsRouter);
  app.use("/api/users", userRoutes);
  app.use("/api/uploads", uploadRoutes);
  app.use("/api/admin", adminRoutes);
  app.use("/api/notifications", notificationRoutes);

  app.use(errorHandler);
  return app;
};
