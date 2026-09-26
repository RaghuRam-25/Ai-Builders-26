import type { TrainingProgram } from "../types/training-program.js";

import { TrainingProgramModel } from "../models/index.js";
import { ApiError } from "../utils/api-error.js";

function toProgram(doc: {
  id: string;
  title: string;
  provider: string;
  summary: string;
  ageMin: number;
  ageMax: number;
  requiredDocuments: string[];
  source: string;
  applicationUrl: string;
  accent: string;
}): TrainingProgram {
  return {
    id: doc.id,
    title: doc.title,
    provider: doc.provider,
    summary: doc.summary,
    ageMin: doc.ageMin,
    ageMax: doc.ageMax,
    requiredDocuments: doc.requiredDocuments ?? [],
    source: doc.source,
    applicationUrl: doc.applicationUrl,
    accent: doc.accent,
  };
}

export async function listTrainingPrograms(
  options: { search?: string; limit?: number } = {},
): Promise<TrainingProgram[]> {
  const { search = "", limit = 50 } = options;
  const docs = await TrainingProgramModel.find({}).sort({ order: 1 }).lean();

  const programs = docs.map((doc) =>
    toProgram(doc as unknown as Parameters<typeof toProgram>[0]),
  );

  const term = search.trim().toLowerCase();
  if (!term) return programs.slice(0, limit);

  return programs
    .filter((program) =>
      `${program.id} ${program.title} ${program.provider} ${program.summary} ${program.requiredDocuments.join(" ")}`
        .toLowerCase()
        .includes(term),
    )
    .slice(0, limit);
}

export async function getTrainingProgram(id: string): Promise<TrainingProgram> {
  const doc = await TrainingProgramModel.findOne({ id }).lean();
  if (!doc) throw ApiError.notFound(`Training program "${id}" was not found`);
  return toProgram(doc as unknown as Parameters<typeof toProgram>[0]);
}
