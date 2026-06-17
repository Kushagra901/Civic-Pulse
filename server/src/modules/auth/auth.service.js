import bcrypt from "bcryptjs";
import { prisma } from "../../config/prisma.js";
import { ApiError } from "../../utils/ApiError.js";
import { signAccessToken, signRefreshToken, verifyRefresh } from "../../config/jwt.js";
import { recordLoginFailure, clearLoginFailures, isAccountLocked } from "../../middleware/accountLockout.js";

export const register = async ({ name, email, password }) => {
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) throw new ApiError(409, "Email already registered");

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { name, email, passwordHash }
  });

  const accessToken = signAccessToken({ sub: user.id, role: user.role });
  const refreshToken = signRefreshToken({ sub: user.id });

  await prisma.user.update({ where: { id: user.id }, data: { refreshToken } });

  return { user: sanitize(user), accessToken, refreshToken };
};

export const login = async ({ email, password }) => {
  // Check lockout BEFORE hitting the database
  const lockout = await isAccountLocked(email);
  if (lockout.locked) {
    const mins = Math.ceil(lockout.retryAfterSecs / 60);
    throw new ApiError(429, `Account temporarily locked. Try again in ${mins} minutes.`);
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !await bcrypt.compare(password, user.passwordHash)) {
    await recordLoginFailure(email);
    throw new ApiError(401, "Invalid email or password.");
  }

  // Successful login — clear lockout record
  await clearLoginFailures(email);

  const accessToken = signAccessToken({ sub: user.id, role: user.role });
  const refreshToken = signRefreshToken({ sub: user.id });

  await prisma.user.update({ where: { id: user.id }, data: { refreshToken } });

  return { user: sanitize(user), accessToken, refreshToken };
};

export const refresh = async ({ refreshToken }) => {
  let decoded;
  try {
    decoded = verifyRefresh(refreshToken);
  } catch {
    throw new ApiError(401, "Invalid refresh token");
  }

  const user = await prisma.user.findUnique({ where: { id: decoded.sub } });
  if (!user || user.refreshToken !== refreshToken) {
    throw new ApiError(401, "Refresh token revoked");
  }

  const newAccessToken = signAccessToken({ sub: user.id, role: user.role });
  const newRefreshToken = signRefreshToken({ sub: user.id });

  await prisma.user.update({ where: { id: user.id }, data: { refreshToken: newRefreshToken } });

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
};

export const logout = async (userId) => {
  await prisma.user.update({ where: { id: userId }, data: { refreshToken: null } });
  return true;
};

const sanitize = (u) => ({
  id: u.id,
  name: u.name,
  email: u.email,
  role: u.role,
  trustScore: u.trustScore,
  createdAt: u.createdAt
});
