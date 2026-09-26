import { Schema, model, type HydratedDocument, type InferSchemaType } from "mongoose";

const jobOpportunitySchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    organization: { type: String, required: true },
    summary: { type: String, required: true },
    status: { type: String, required: true },
    deadline: { type: String, required: true },
    deadlineIso: { type: Date, default: null, index: true },
    ageMin: { type: Number, required: true },
    ageMax: { type: Number, required: true },
    education: { type: String, required: true },
    requiredDocuments: { type: [String], default: [] },
    officialSource: { type: String, required: true },
    applicationUrl: { type: String, required: true },
    accent: { type: String, required: true },
    source: {
      type: String,
      default: "in-app notice record; verify on the official source before applying",
    },
    order: { type: Number, default: 0 },
    createdAt: { type: Date },
    updatedAt: { type: Date },
  },
  { timestamps: true, collection: "jobopportunities", versionKey: false },
);

export type JobOpportunityAttributes = InferSchemaType<typeof jobOpportunitySchema>;
export type JobOpportunityDocument = HydratedDocument<JobOpportunityAttributes>;

export const JobOpportunityModel = model<JobOpportunityAttributes>(
  "JobOpportunity",
  jobOpportunitySchema,
);
