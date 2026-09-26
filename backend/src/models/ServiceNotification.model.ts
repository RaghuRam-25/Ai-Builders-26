import { Schema, model, type HydratedDocument, type InferSchemaType } from "mongoose";

import type { ServiceNotificationKind } from "../types/api.js";

const serviceNotificationSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    service: { type: Schema.Types.ObjectId, ref: "Service", default: null },
    serviceId: { type: String, required: true },
    kind: {
      type: String,
      enum: ["service_match", "job_deadline", "training_batch", "system"] satisfies ServiceNotificationKind[],
      default: "service_match",
    },
    title: { type: String, required: true, maxlength: 200 },
    body: { type: String, required: true },
    readAt: { type: Date, default: null },
    meta: { type: Schema.Types.Mixed, default: undefined },
    createdAt: { type: Date },
    updatedAt: { type: Date },
  },
  { timestamps: true, collection: "servicenotifications", versionKey: false },
);

serviceNotificationSchema.index({ user: 1, readAt: 1 });
serviceNotificationSchema.index({ user: 1, serviceId: 1 }, { unique: true });

export type ServiceNotificationAttributes = InferSchemaType<
  typeof serviceNotificationSchema
>;
export type ServiceNotificationDocument =
  HydratedDocument<ServiceNotificationAttributes>;

export const ServiceNotification = model<ServiceNotificationAttributes>(
  "ServiceNotification",
  serviceNotificationSchema,
);
