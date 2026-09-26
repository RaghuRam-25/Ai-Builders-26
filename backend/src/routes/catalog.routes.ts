import { Router } from "express";

import * as catalogController from "../controllers/catalog.controller.js";
import { validate } from "../middleware/validate.middleware.js";
import { asyncHandler } from "../utils/api-error.js";
import { idParamSchema } from "../validators/index.js";

export const catalogRouter = Router();

catalogRouter.get(
  "/training",
  asyncHandler(catalogController.listTrainingPrograms),
);
catalogRouter.get(
  "/training/:id",
  validate(idParamSchema, "params"),
  asyncHandler(catalogController.getTrainingProgram),
);
catalogRouter.get(
  "/jobs",
  asyncHandler(catalogController.listJobOpportunities),
);
catalogRouter.get(
  "/jobs/:id",
  validate(idParamSchema, "params"),
  asyncHandler(catalogController.getJobOpportunity),
);
