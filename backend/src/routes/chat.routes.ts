import { Router } from "express";

import * as chatController from "../controllers/chat.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { asyncHandler } from "../utils/api-error.js";
import {
  appendMessageSchema,
  assistantSchema,
  conversationCreateSchema,
  idParamSchema,
} from "../validators/index.js";

export const chatRouter = Router();

chatRouter.use(requireAuth);

/** Stateless ask endpoint, matching the original `assistant.ask` tRPC route. */
chatRouter.post(
  "/ask",
  validate(assistantSchema),
  asyncHandler(chatController.ask),
);

chatRouter.get("/conversations", asyncHandler(chatController.listConversations));
chatRouter.post(
  "/conversations",
  validate(conversationCreateSchema),
  asyncHandler(chatController.createConversation),
);
chatRouter.get(
  "/conversations/:id/messages",
  validate(idParamSchema, "params"),
  asyncHandler(chatController.getMessages),
);
chatRouter.post(
  "/conversations/:id/messages",
  validate(idParamSchema, "params"),
  validate(appendMessageSchema),
  asyncHandler(chatController.appendMessage),
);
