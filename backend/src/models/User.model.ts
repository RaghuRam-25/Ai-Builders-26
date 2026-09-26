import { Schema, model, type HydratedDocument, type InferSchemaType } from "mongoose";

import type { UserRole } from "../types/citizen-profile.js";

/**
 * Maps the original MySQL `users` table to a MongoDB document.
 * `legacyOpenId` keeps the Manus-era identifier so an existing MySQL export can
 * be reconciled without losing rows.
 */
const userSchema = new Schema(
  {
    mobile: { type: String, trim: true, sparse: true, unique: true, index: true },
    email: { type: String, trim: true, lowercase: true, sparse: true, unique: true },
    passwordHash: { type: String, required: true, select: false },
    name: { type: String, trim: true, maxlength: 160 },
    role: {
      type: String,
      enum: ["user", "admin"] satisfies UserRole[],
      default: "user",
      index: true,
    },
    legacyOpenId: { type: String, sparse: true, unique: true },
    loginMethod: { type: String, trim: true, maxlength: 64 },
    lastSignedInAt: { type: Date, default: Date.now },
    createdAt: { type: Date },
    updatedAt: { type: Date },
  },
  {
    timestamps: true,
    collection: "users",
    versionKey: false,
  },
);

userSchema.index({ createdAt: -1 });

export type UserAttributes = InferSchemaType<typeof userSchema>;
export type UserDocument = HydratedDocument<UserAttributes>;

export const User = model<UserAttributes>("User", userSchema);
