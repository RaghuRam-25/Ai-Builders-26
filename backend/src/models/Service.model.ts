import { Schema, model, type HydratedDocument, type InferSchemaType } from "mongoose";

import type { ServiceCategory, Suggestion } from "../types/government-service.js";

/**
 * Government service records. The six services keep their nested `options` and
 * `programs` exactly as defined in the original `shared/government-services.ts`.
 */
const programSchema = new Schema(
  {
    id: { type: String, required: true },
    title: { type: String, required: true },
    department: { type: String, required: true },
    summary: { type: String, required: true },
    eligibility: { type: [String], default: [] },
    requiredDocuments: { type: [String], default: [] },
    applicationProcess: { type: [String], default: [] },
    officialSource: { type: String, required: true },
    applicationUrl: { type: String, required: true },
    tabs: { type: [String], default: undefined },
  },
  { _id: false },
);

const optionSchema = new Schema(
  {
    id: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    eligibility: { type: [String], default: [] },
    requiredDocuments: { type: [String], default: [] },
    applicationProcess: { type: [String], default: [] },
    officialSource: { type: String, required: true },
    applicationUrl: { type: String, required: true },
    trackingUrl: { type: String, default: undefined },
    tabs: { type: [String], default: undefined },
  },
  { _id: false },
);

const translationSchema = new Schema(
  {
    category: { type: String },
    title: { type: String },
    description: { type: String },
    eta: { type: String },
    documents: { type: [String] },
    steps: { type: [String] },
  },
  { _id: false },
);

const serviceSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    category: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    eta: { type: String, required: true },
    documents: { type: [String], default: [] },
    steps: { type: [String], default: [] },
    officialSource: { type: String, required: true },
    accent: { type: String, required: true },
    programs: { type: [programSchema], default: undefined },
    options: { type: [optionSchema], default: undefined },
    translation: { type: translationSchema, default: undefined },
    /** Preserves the original caveat: in-app notices should be synced from a verified feed. */
    source: {
      type: String,
      default: "in-app notice record; verify on the official source before applying",
    },
    order: { type: Number, default: 0, index: true },
    createdAt: { type: Date },
    updatedAt: { type: Date },
  },
  {
    timestamps: true,
    collection: "services",
    versionKey: false,
  },
);

export type ServiceAttributes = InferSchemaType<typeof serviceSchema>;
export type ServiceDocument = HydratedDocument<ServiceAttributes>;

export const Service = model<ServiceAttributes>("Service", serviceSchema);

// ── Home-screen topic tiles ───────────────────────────────────────────────────
const categorySchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    label: { type: String, required: true },
    labelEn: { type: String, required: true },
    icon: { type: String, required: true },
    serviceIds: { type: [String], default: [] },
    order: { type: Number, default: 0 },
  },
  { timestamps: true, collection: "servicecategories", versionKey: false },
);

export type ServiceCategoryAttributes = InferSchemaType<typeof categorySchema>;
export const ServiceCategoryModel = model<ServiceCategoryAttributes>(
  "ServiceCategory",
  categorySchema,
);

// ── Assistant starter prompts ─────────────────────────────────────────────────
const suggestionSchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    label: { type: String, required: true },
    labelEn: { type: String, required: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true, collection: "servicesuggestions", versionKey: false },
);

export type SuggestionAttributes = InferSchemaType<typeof suggestionSchema>;
export const SuggestionModel = model<SuggestionAttributes>(
  "Suggestion",
  suggestionSchema,
);

export type { ServiceCategory, Suggestion };
