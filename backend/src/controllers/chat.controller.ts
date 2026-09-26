import type { Request, Response } from "express";

import { ApiError } from "../utils/api-error.js";
import { ok } from "../utils/response.js";
import * as chatService from "../services/chat.service.js";
import * as assistantService from "../services/assistant.service.js";
import * as governmentService from "../services/government.service.js";
import type { AssistantInput, AppendMessageInput } from "../validators/index.js";

export async function listConversations(req: Request, res: Response) {
  if (!req.user) throw ApiError.unauthorized();
  const conversations = await chatService.listConversations(req.user.id);
  return ok(res, { conversations });
}

export async function createConversation(req: Request, res: Response) {
  if (!req.user) throw ApiError.unauthorized();
  const { title } = req.body as { title?: string };
  const conversation = await chatService.createConversation(req.user.id, title);
  return ok(res, { conversation }, 201);
}

export async function getMessages(req: Request, res: Response) {
  if (!req.user) throw ApiError.unauthorized();
  const { id } = req.params as unknown as { id: string };
  const messages = await chatService.getConversationMessages(req.user.id, id);
  return ok(res, { messages });
}

export async function appendMessage(req: Request, res: Response) {
  if (!req.user) throw ApiError.unauthorized();
  const { id } = req.params as unknown as { id: string };
  const message = await chatService.appendChatMessage(req.user.id, id, {
    ...(req.body as AppendMessageInput),
  });
  return ok(res, { message }, 201);
}

export async function ask(req: Request, res: Response) {
  if (!req.user) throw ApiError.unauthorized();
  const input = req.body as AssistantInput;

  const services = await governmentService.listServices({ limit: 50, lang: "bn" });
  const result = await assistantService.answerAssistantQuery({
    userId: req.user.id,
    message: input.message,
    lang: input.language,
    context: input.context ?? null,
    services,
  });

  return ok(res, {
    reply: result.reply,
    sources: result.sources,
    context: result.context,
    serviceId: result.context.serviceId,
  });
}
