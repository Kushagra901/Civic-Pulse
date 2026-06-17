import { Router } from "express";
import { validate } from "../../middleware/validate.js";
import { requireAuth } from "../../middleware/auth.js";
import * as c from "./auth.controller.js";
import { registerSchema, loginSchema, refreshSchema } from "./auth.schemas.js";
import { authLimiter, registerLimiter } from "../../middleware/rateLimiter.js";

export const authRouter = Router();

authRouter.post("/register", registerLimiter, validate(registerSchema), c.register);
authRouter.post("/login", authLimiter, validate(loginSchema), c.login);
authRouter.post("/refresh", validate(refreshSchema), c.refresh);
authRouter.post("/logout", requireAuth, c.logout);
