import type { Types } from "mongoose";

import type { ServiceNotification, ServiceNotificationKind } from "../types/api.js";

import { Service, ServiceNotification as ServiceNotificationModel } from "../models/index.js";

type NotificationDoc = {
  _id: Types.ObjectId;
  serviceId: string;
  kind: ServiceNotificationKind;
  title: string;
  body: string;
  readAt: Date | null;
  createdAt: Date;
};

function toNotification(doc: NotificationDoc): ServiceNotification {
  return {
    id: doc._id.toString(),
    serviceId: doc.serviceId,
    kind: doc.kind,
    title: doc.title,
    body: doc.body,
    readAt: doc.readAt ? doc.readAt.toISOString() : null,
    createdAt: doc.createdAt.toISOString(),
  };
}

export async function listServiceNotifications(
  userId: Types.ObjectId | string,
): Promise<ServiceNotification[]> {
  const docs = await ServiceNotificationModel.find({ user: userId })
    .sort({ createdAt: -1 })
    .lean();
  return docs.map((doc) => toNotification(doc as unknown as NotificationDoc));
}

export async function markServiceNotificationRead(
  userId: Types.ObjectId | string,
  id: string,
) {
  const updated = await ServiceNotificationModel.findOneAndUpdate(
    { _id: id, user: userId },
    { $set: { readAt: new Date() } },
    { new: true },
  ).lean();

  if (!updated) return null;
  return toNotification(updated as unknown as NotificationDoc);
}

export async function markAllServiceNotificationsRead(
  userId: Types.ObjectId | string,
) {
  await ServiceNotificationModel.updateMany(
    { user: userId, readAt: null },
    { $set: { readAt: new Date() } },
  );
  return listServiceNotifications(userId);
}

/**
 * Creates notifications for services the user has not been notified about yet.
 * Ported from `ensureServiceNotifications` in the original `server/db.ts`.
 */
export async function ensureServiceNotifications(
  userId: Types.ObjectId | string,
  matches: Array<{ serviceId: string; title: string; body: string }>,
) {
  if (!matches.length) return listServiceNotifications(userId);

  const serviceIds = matches.map((match) => match.serviceId);
  const existing = await ServiceNotificationModel.find({
    user: userId,
    serviceId: { $in: serviceIds },
  })
    .select({ serviceId: 1 })
    .lean();
  const existingIds = new Set(existing.map((item) => item.serviceId));

  const serviceDocs = await Service.find({ id: { $in: serviceIds } })
    .select({ id: 1, _id: 1 })
    .lean();
  const serviceObjectIds = new Map(
    serviceDocs.map((doc) => [doc.id, doc._id]),
  );

  const toCreate = matches
    .filter((match) => !existingIds.has(match.serviceId))
    .map((match) => ({
      user: userId,
      service: serviceObjectIds.get(match.serviceId) ?? null,
      serviceId: match.serviceId,
      kind: "service_match" as const,
      title: match.title,
      body: match.body,
    }));

  if (toCreate.length) {
    await ServiceNotificationModel.insertMany(toCreate, { ordered: false });
  }

  return listServiceNotifications(userId);
}

export async function createServiceNotification(input: {
  user: Types.ObjectId | string;
  serviceId: string;
  kind?: ServiceNotificationKind;
  title: string;
  body: string;
  meta?: Record<string, unknown>;
}) {
  const serviceDoc = await Service.findOne({ id: input.serviceId })
    .select({ _id: 1 })
    .lean();
  return ServiceNotificationModel.create({
    user: input.user,
    service: serviceDoc?._id ?? null,
    serviceId: input.serviceId,
    kind: input.kind ?? "service_match",
    title: input.title,
    body: input.body,
    ...(input.meta ? { meta: input.meta } : {}),
  });
}
