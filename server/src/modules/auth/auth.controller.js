import { asyncHandler } from "../../utils/asyncHandler.js";
import * as service from "./auth.service.js";

export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.validated.body;
  const data = await service.register({ name, email, password });
  res.json({ success: true, ...data });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.validated.body;
  const data = await service.login({ email, password });
  res.json({ success: true, ...data });
});

export const refresh = asyncHandler(async (req, res) => {
  const { refreshToken } = req.validated.body;
  const data = await service.refresh({ refreshToken });
  res.json({ success: true, ...data });
});

export const logout = asyncHandler(async (req, res) => {
  await service.logout(req.user.id);
  res.json({ success: true });
});
