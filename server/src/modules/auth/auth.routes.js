import { Router } from "express";
import { validate } from "../../middleware/validate.js";
import { rateLimit } from "../../middleware/rateLimit.js";
import { requireAuth } from "../../middleware/auth.js";
import * as c from "./auth.controller.js";
import { registerSchema, loginSchema, refreshSchema } from "./auth.schemas.js";

export const authRouter = Router();

authRouter.post("/register", rateLimit({ keyPrefix: "reg", limit: 10, windowSec: 60 }), validate(registerSchema), c.register);
authRouter.post("/login", rateLimit({ keyPrefix: "login", limit: 20, windowSec: 60 }), validate(loginSchema), c.login);
authRouter.post("/refresh", validate(refreshSchema), c.refresh);
authRouter.post("/logout", requireAuth, c.logout);
