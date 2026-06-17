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

  // Prevent path traversal attacks
  app.use((req, res, next) => {
    try {
      const decodedPath = decodeURIComponent(req.path);
      if (
        decodedPath.includes("..") ||
        req.path.includes("..") ||
        req.path.includes("%2e%2e") ||
        req.path.includes("%2E%2E")
      ) {
        return res.status(400).json({ success: false, message: "Invalid request path" });
      }
    } catch (err) {
      return res.status(400).json({ success: false, message: "Malformed request URI" });
    }
    next();
  });

  // Strict Helmet headers with Content Security Policy
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https://res.cloudinary.com"],
        connectSrc: ["'self'", "ws:", "wss:"],
        frameAncestors: ["'none'"]
      }
    },
    frameguard: { action: "deny" },
    referrerPolicy: { policy: "strict-origin-when-cross-origin" }
  }));

  // Parse CORS allowed origins list
  const allowedOrigins = (env.ALLOWED_ORIGINS || "")
    .split(",")
    .map(origin => origin.trim())
    .filter(Boolean);

  app.use(cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, postman, or curl)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin) || allowedOrigins.includes("*")) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true
  }));

  // Restrict JSON body size to 50kb to prevent buffer flooding
  app.use(express.json({ limit: "50kb" }));
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
