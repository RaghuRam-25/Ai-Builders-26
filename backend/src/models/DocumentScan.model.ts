import { Schema, model, type HydratedDocument, type InferSchemaType } from "mongoose";

/**
 * Uploaded document scans. Replaces the client-only eligibility check that the
 * original Home screen performed after `expo-document-picker` returned a file.
 */
const documentScanSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    fileName: { type: String, required: true, maxlength: 255 },
    storedName: { type: String, required: true },
    contentType: { type: String, required: true },
    sizeBytes: { type: Number, required: true },
    /** What the scan was evaluated against: `training` or `job`. */
    target: { type: String, enum: ["training", "job"], required: true },
    targetId: { type: String, required: true },
    eligible: { type: Boolean, required: true },
    reasons: { type: [String], default: [] },
    createdAt: { type: Date },
    updatedAt: { type: Date },
  },
  { timestamps: true, collection: "documentscans", versionKey: false },
);

documentScanSchema.index({ user: 1, createdAt: -1 });

export type DocumentScanAttributes = InferSchemaType<typeof documentScanSchema>;
export type DocumentScanDocument = HydratedDocument<DocumentScanAttributes>;

export const DocumentScan = model<DocumentScanAttributes>(
  "DocumentScan",
  documentScanSchema,
);
