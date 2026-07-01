import { ApiError } from "../utils/ApiError.js";
import { env } from "../config/env.js";
import logger from "../config/logger.js";

const log = logger.child({ module: "errorHandler" });

export const errorHandler = (err, req, res, next) => {
  const isOperational = err instanceof ApiError;
  const statusCode = err.status || err.statusCode || 500;

  const logContext = {
    userId: req.user?.id,
    method: req.method,
    url: req.originalUrl,
    statusCode,
    isOperational,
  };

  if (statusCode >= 500) {
    log.error({ ...logContext, err }, "Unhandled server error");
  } else if (statusCode >= 400) {
    log.warn({ ...logContext, message: err.message }, "Client error");
  }

  const payload = {
    success: false,
    message: env.NODE_ENV === "production" && !isOperational
      ? "Internal server error"
      : err.message || "Internal Server Error"
  };

  if (err instanceof ApiError && err.details) payload.details = err.details;

  if (env.NODE_ENV !== "production") {
    payload.stack = err.stack;
  }

  res.status(statusCode).json(payload);
};

export const notFoundHandler = (req, res, next) => {
  log.warn({ method: req.method, url: req.originalUrl }, "Route not found");
  res.status(404).json({ success: false, message: "Route not found" });
};

