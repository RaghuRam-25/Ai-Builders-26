import { Router } from "express";

import * as authController from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { authLimiter } from "../middleware/rate-limit.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { asyncHandler } from "../utils/api-error.js";
import { loginSchema, refreshSchema, registerSchema } from "../validators/index.js";

export const authRouter = Router();

authRouter.post(
  "/register",
  authLimiter,
  validate(registerSchema),
  asyncHandler(authController.register),
);
authRouter.post(
  "/login",
  authLimiter,
  validate(loginSchema),
  asyncHandler(authController.login),
);
authRouter.post(
  "/refresh",
  authLimiter,
  validate(refreshSchema),
  asyncHandler(authController.refresh),
);
authRouter.get("/me", requireAuth, asyncHandler(authController.me));
