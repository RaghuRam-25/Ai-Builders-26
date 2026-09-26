import type { Request, Response } from "express";

import { ok } from "../utils/response.js";
import * as trainingService from "../services/training.service.js";
import * as jobsService from "../services/jobs.service.js";

export async function listTrainingPrograms(req: Request, res: Response) {
  const { search, limit } = req.query as unknown as {
    search?: string;
    limit?: number;
  };
  const programs = await trainingService.listTrainingPrograms({ search, limit });
  return ok(res, { programs });
}

export async function getTrainingProgram(req: Request, res: Response) {
  const { id } = req.params as unknown as { id: string };
  const program = await trainingService.getTrainingProgram(id);
  return ok(res, { program });
}

export async function listJobOpportunities(req: Request, res: Response) {
  const { search, limit } = req.query as unknown as {
    search?: string;
    limit?: number;
  };
  const jobs = await jobsService.listJobOpportunities({ search, limit });
  return ok(res, { jobs });
}

export async function getJobOpportunity(req: Request, res: Response) {
  const { id } = req.params as unknown as { id: string };
  const job = await jobsService.getJobOpportunity(id);
  return ok(res, { job });
}
