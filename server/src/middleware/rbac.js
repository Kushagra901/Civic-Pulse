import { ApiError } from "../utils/ApiError.js";

export const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) throw new ApiError(401, "Unauthorized");
  if (!roles.includes(req.user.role)) throw new ApiError(403, "Forbidden");
  next();
};
