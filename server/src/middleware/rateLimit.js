import { redis } from "../config/redis.js";
import { ApiError } from "../utils/ApiError.js";

export const rateLimit = ({ keyPrefix, limit, windowSec }) => {
  return async (req, res, next) => {
    const key = `${keyPrefix}:${req.ip}`;
    const count = await redis.incr(key);
    if (count === 1) await redis.expire(key, windowSec);
    if (count > limit) throw new ApiError(429, "Too many requests");
    next();
  };
};
