import { Router } from "express";

import * as profileController from "../controllers/profile.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { asyncHandler } from "../utils/api-error.js";
import { profileUpsertSchema } from "../validators/index.js";

export const profileRouter = Router();

profileRouter.use(requireAuth);

profileRouter.get("/", asyncHandler(profileController.getProfile));
profileRouter.put(
  "/",
  validate(profileUpsertSchema),
  asyncHandler(profileController.upsertProfile),
);
profileRouter.get(
  "/matched-services",
  asyncHandler(profileController.getMatchedServices),
);
