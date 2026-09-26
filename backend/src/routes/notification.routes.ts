import { Router } from "express";

import * as notificationController from "../controllers/notification.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { documentUpload } from "../middleware/upload.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { asyncHandler } from "../utils/api-error.js";
import { idParamSchema, scanQuerySchema } from "../validators/index.js";

export const notificationRouter = Router();

notificationRouter.use(requireAuth);

notificationRouter.get("/", asyncHandler(notificationController.listNotifications));
notificationRouter.patch(
  "/:id/read",
  validate(idParamSchema, "params"),
  asyncHandler(notificationController.markRead),
);
notificationRouter.post(
  "/read-all",
  asyncHandler(notificationController.markAllRead),
);

export const documentRouter = Router();

documentRouter.use(requireAuth);

documentRouter.post(
  "/scan",
  validate(scanQuerySchema, "query"),
  documentUpload,
  asyncHandler(notificationController.uploadScan),
);
documentRouter.get("/scan", asyncHandler(notificationController.listScans));
documentRouter.delete(
  "/scan/:id",
  validate(idParamSchema, "params"),
  asyncHandler(notificationController.deleteScan),
);
