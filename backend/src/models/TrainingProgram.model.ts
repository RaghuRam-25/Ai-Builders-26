import { Schema, model, type HydratedDocument, type InferSchemaType } from "mongoose";

const trainingProgramSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    provider: { type: String, required: true },
    summary: { type: String, required: true },
    ageMin: { type: Number, required: true },
    ageMax: { type: Number, required: true },
    requiredDocuments: { type: [String], default: [] },
    source: { type: String, required: true },
    applicationUrl: { type: String, required: true },
    accent: { type: String, required: true },
    order: { type: Number, default: 0 },
    createdAt: { type: Date },
    updatedAt: { type: Date },
  },
  { timestamps: true, collection: "trainingprograms", versionKey: false },
);

export type TrainingProgramAttributes = InferSchemaType<typeof trainingProgramSchema>;
export type TrainingProgramDocument = HydratedDocument<TrainingProgramAttributes>;

export const TrainingProgramModel = model<TrainingProgramAttributes>(
  "TrainingProgram",
  trainingProgramSchema,
);
