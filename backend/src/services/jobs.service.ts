import type { JobOpportunity } from "../types/job-opportunity.js";

import { JobOpportunityModel } from "../models/index.js";
import { ApiError } from "../utils/api-error.js";

type JobDoc = {
  id: string;
  title: string;
  organization: string;
  summary: string;
  status: string;
  deadline: string;
  ageMin: number;
  ageMax: number;
  education: string;
  requiredDocuments: string[];
  officialSource: string;
  applicationUrl: string;
  accent: string;
};

function toJob(doc: JobDoc): JobOpportunity {
  return {
    id: doc.id,
    title: doc.title,
    organization: doc.organization,
    summary: doc.summary,
    status: doc.status,
    deadline: doc.deadline,
    ageMin: doc.ageMin,
    ageMax: doc.ageMax,
    education: doc.education,
    requiredDocuments: doc.requiredDocuments ?? [],
    officialSource: doc.officialSource,
    applicationUrl: doc.applicationUrl,
    accent: doc.accent,
  };
}

export async function listJobOpportunities(
  options: { search?: string; limit?: number } = {},
): Promise<JobOpportunity[]> {
  const { search = "", limit = 50 } = options;
  const docs = await JobOpportunityModel.find({}).sort({ order: 1 }).lean();
  const jobs = docs.map((doc) => toJob(doc as unknown as JobDoc));

  const term = search.trim().toLowerCase();
  if (!term) return jobs.slice(0, limit);

  return jobs
    .filter((job) =>
      `${job.id} ${job.title} ${job.organization} ${job.summary} ${job.status} ${job.education}`
        .toLowerCase()
        .includes(term),
    )
    .slice(0, limit);
}

export async function getJobOpportunity(id: string): Promise<JobOpportunity> {
  const doc = await JobOpportunityModel.findOne({ id }).lean();
  if (!doc) throw ApiError.notFound(`Job notice "${id}" was not found`);
  return toJob(doc as unknown as JobDoc);
}
