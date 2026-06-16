import { ApiError } from "../utils/ApiError.js";
import { verifyAccess } from "../config/jwt.js";
import { prisma } from "../config/prisma.js";

export const requireAuth = async (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) throw new ApiError(401, "Missing token");

  const token = auth.split(" ")[1];
  let decoded;
  try {
    decoded = verifyAccess(token);
  } catch {
    throw new ApiError(401, "Invalid/expired token");
  }

  const user = await prisma.user.findUnique({ where: { id: decoded.sub } });
  if (!user) throw new ApiError(401, "User not found");

  req.user = { id: user.id, role: user.role, email: user.email, name: user.name };
  next();
};

export const authenticate = ({ optional = false } = {}) => {
  return async (req, res, next) => {
    try {
      const auth = req.headers.authorization;
      if (!auth?.startsWith("Bearer ")) {
        if (optional) return next();
        throw new ApiError(401, "Missing token");
      }

      const token = auth.split(" ")[1];
      let decoded;
      try {
        decoded = verifyAccess(token);
      } catch {
        if (optional) return next();
        throw new ApiError(401, "Invalid/expired token");
      }

      const user = await prisma.user.findUnique({ where: { id: decoded.sub } });
      if (!user) {
        if (optional) return next();
        throw new ApiError(401, "User not found");
      }

      req.user = { id: user.id, role: user.role, email: user.email, name: user.name };
      next();
    } catch (error) {
      next(error);
    }
  };
};

