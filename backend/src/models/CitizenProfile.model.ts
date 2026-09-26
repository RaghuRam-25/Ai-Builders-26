import { Schema, model, type HydratedDocument, type InferSchemaType, type Types } from "mongoose";

import { GENDER_VALUES } from "../types/citizen-profile.js";

/**
 * Maps the original MySQL `citizen_profiles` table.
 * `education`, `gender`, `isBangladeshi` and `jobSeeking` are added because the
 * existing Profile form already edits them but the MySQL table never persisted
 * them — that silent data loss is fixed here.
 */
const citizenProfileSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    name: { type: String, required: true, trim: true, maxlength: 160 },
    age: { type: Number, min: 0, max: 130, default: null },
    district: { type: String, trim: true, maxlength: 120, default: null },
    education: { type: String, trim: true, maxlength: 160, default: null },
    occupation: { type: String, trim: true, maxlength: 160, default: null },
    income: { type: String, trim: true, maxlength: 80, default: null },
    gender: {
      type: String,
      enum: GENDER_VALUES as unknown as string[],
      default: "",
    },
    isBangladeshi: { type: Boolean, default: false },
    jobSeeking: { type: Boolean, default: false },
    nidVerified: { type: Boolean, default: false },
    wantsTravel: { type: Boolean, default: false },
    createdAt: { type: Date },
    updatedAt: { type: Date },
  },
  {
    timestamps: true,
    collection: "citizenprofiles",
    versionKey: false,
  },
);

export type CitizenProfileAttributes = InferSchemaType<typeof citizenProfileSchema>;
export type CitizenProfileDocument = HydratedDocument<CitizenProfileAttributes>;

export const CitizenProfile = model<CitizenProfileAttributes>(
  "CitizenProfile",
  citizenProfileSchema,
);

export type CitizenProfileRef = Types.ObjectId;
