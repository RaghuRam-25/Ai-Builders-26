import type { Request, Response } from "express";

import { ApiError } from "../utils/api-error.js";
import { ok } from "../utils/response.js";
import * as notificationService from "../services/notification.service.js";
import * as documentService from "../services/document.service.js";

export async function listNotifications(req: Request, res: Response) {
  if (!req.user) throw ApiError.unauthorized();
  const notifications = await notificationService.listServiceNotifications(req.user.id);
  return ok(res, { notifications });
}

export async function markRead(req: Request, res: Response) {
  if (!req.user) throw ApiError.unauthorized();
  const { id } = req.params as unknown as { id: string };
  const notification =
    await notificationService.markServiceNotificationRead(req.user.id, id);
  if (!notification) throw ApiError.notFound("Notification not found");
  return ok(res, { notification });
}

export async function markAllRead(req: Request, res: Response) {
  if (!req.user) throw ApiError.unauthorized();
  const notifications =
    await notificationService.markAllServiceNotificationsRead(req.user.id);
  return ok(res, { notifications });
}

export async function uploadScan(req: Request, res: Response) {
  if (!req.user) throw ApiError.unauthorized();
  const file = req.file;
  if (!file) throw ApiError.badRequest("A document file is required");

  const { target, targetId } = req.query as unknown as {
    target: "training" | "job";
    targetId: string;
  };

  const scan = await documentService.scanDocumentForEligibility(req.user.id, {
    file,
    target,
    targetId,
  });
  return ok(res, { scan }, 201);
}

export async function listScans(req: Request, res: Response) {
  if (!req.user) throw ApiError.unauthorized();
  const scans = await documentService.listDocumentScans(req.user.id);
  return ok(res, { scans });
}

export async function deleteScan(req: Request, res: Response) {
  if (!req.user) throw ApiError.unauthorized();
  const { id } = req.params as unknown as { id: string };
  const result = await documentService.deleteDocumentScan(req.user.id, id);
  return ok(res, result);
}
