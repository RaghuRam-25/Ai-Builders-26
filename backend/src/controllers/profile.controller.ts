import type { Request, Response } from "express";

import { ApiError } from "../utils/api-error.js";
import { ok } from "../utils/response.js";
import * as profileService from "../services/profile.service.js";
import type { ProfileUpsertInput } from "../validators/index.js";

export async function getProfile(req: Request, res: Response) {
  if (!req.user) throw ApiError.unauthorized();
  const profile = await profileService.getCitizenProfile(req.user.id);
  return ok(res, { profile });
}

export async function upsertProfile(req: Request, res: Response) {
  if (!req.user) throw ApiError.unauthorized();
  const profile = await profileService.upsertCitizenProfile(
    req.user.id,
    req.body as ProfileUpsertInput,
  );
  // Ported from the original `profile.upsert` mutation: notify newly matched
  // services and return the available service ids the Home screen uses.
  const { availableServiceIds } = await profileService.syncMatchedNotifications(
    req.user.id,
    profile,
  );
  return ok(res, { profile, availableServiceIds });
}

export async function getMatchedServices(req: Request, res: Response) {
  if (!req.user) throw ApiError.unauthorized();
  const profile = await profileService.getCitizenProfile(req.user.id);
  const availableServiceIds = await profileService.matchedServiceIdsFor(profile);
  return ok(res, { availableServiceIds });
}
