import { Router } from "express";

import * as governmentController from "../controllers/government.controller.js";
import { validate } from "../middleware/validate.middleware.js";
import { asyncHandler } from "../utils/api-error.js";
import {
  contextQuerySchema,
  governmentListQuerySchema,
  governmentSearchQuerySchema,
  idParamSchema,
} from "../validators/index.js";

export const governmentRouter = Router();

governmentRouter.get(
  "/services",
  validate(governmentListQuerySchema, "query"),
  asyncHandler(governmentController.listServices),
);
governmentRouter.get(
  "/services/:id",
  validate(idParamSchema, "params"),
  asyncHandler(governmentController.getService),
);
governmentRouter.get(
  "/search",
  validate(governmentSearchQuerySchema, "query"),
  asyncHandler(governmentController.searchServices),
);
governmentRouter.get(
  "/context",
  validate(contextQuerySchema, "query"),
  asyncHandler(governmentController.resolveContext),
);
governmentRouter.get(
  "/categories",
  asyncHandler(governmentController.listCategories),
);
governmentRouter.get(
  "/suggestions",
  asyncHandler(governmentController.listSuggestions),
);
