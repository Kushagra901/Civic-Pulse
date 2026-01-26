import { ApiError } from "../utils/ApiError.js";

export const errorHandler = (err, req, res, next) => {
  const status = err instanceof ApiError ? err.status : 500;

  const payload = {
    success: false,
    message: err.message || "Internal Server Error"
  };

  if (err instanceof ApiError && err.details) payload.details = err.details;

  if (process.env.NODE_ENV !== "production") {
    payload.stack = err.stack;
  }

  res.status(status).json(payload);
};
