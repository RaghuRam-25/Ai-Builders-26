import type { Types } from "mongoose";

import type { CitizenProfile as CitizenProfileType } from "../types/citizen-profile.js";
import { getMatchedServiceIds } from "../types/profile-matching.js";
import type { GovernmentService } from "../types/government-service.js";

import { CitizenProfile } from "../models/index.js";
import { listServices } from "./government.service.js";
import { ensureServiceNotifications } from "./notification.service.js";

/** Normalises a Mongo document into the exact shape the original UI consumed. */
export function toCitizenProfile(doc: {
  name?: string | null;
  age?: number | null;
  district?: string | null;
  education?: string | null;
  occupation?: string | null;
  income?: string | null;
  gender?: string | null;
  isBangladeshi?: boolean | null;
  jobSeeking?: boolean | null;
  nidVerified?: boolean | null;
  wantsTravel?: boolean | null;
}): CitizenProfileType {
  return {
    name: doc.name ?? "",
    age: doc.age === null || doc.age === undefined ? "" : String(doc.age),
    district: doc.district ?? "",
    education: doc.education ?? "",
    occupation: doc.occupation ?? "",
    income: doc.income ?? "",
    gender: (doc.gender ?? "") as CitizenProfileType["gender"],
    isBangladeshi: Boolean(doc.isBangladeshi),
    jobSeeking: Boolean(doc.jobSeeking),
    nidVerified: Boolean(doc.nidVerified),
    wantsTravel: Boolean(doc.wantsTravel),
  };
}

export async function getCitizenProfile(
  userId: Types.ObjectId | string,
): Promise<CitizenProfileType | null> {
  const doc = await CitizenProfile.findOne({ user: userId }).lean();
  return doc ? toCitizenProfile(doc) : null;
}

export type UpsertProfileInput = {
  name: string;
  age?: number | null;
  district?: string | null;
  education?: string | null;
  occupation?: string | null;
  income?: string | null;
  gender?: string;
  isBangladeshi?: boolean;
  jobSeeking?: boolean;
  nidVerified: boolean;
  wantsTravel: boolean;
};

export async function upsertCitizenProfile(
  userId: Types.ObjectId | string,
  input: UpsertProfileInput,
) {
  const doc = await CitizenProfile.findOneAndUpdate(
    { user: userId },
    { $set: { ...input, user: userId } },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  ).lean();

  return toCitizenProfile(doc);
}

export async function matchedServiceIdsFor(
  profile: CitizenProfileType | null,
): Promise<string[]> {
  if (!profile) return [];
  return getMatchedServiceIds(profile);
}

/**
 * Mirrors `profile.upsert` in the original tRPC router: after saving, create a
 * notification for every newly matched service.
 */
export async function syncMatchedNotifications(
  userId: Types.ObjectId | string,
  profile: CitizenProfileType,
) {
  const matchedIds = getMatchedServiceIds(profile);
  if (!matchedIds.length) return { availableServiceIds: matchedIds };

  const services = await listServices({ limit: 50, lang: "bn" });
  const byId = new Map<string, GovernmentService>(
    services.map((service) => [service.id, service]),
  );

  const matches = matchedIds
    .map((id) => byId.get(id))
    .filter((service): service is GovernmentService => Boolean(service))
    .map((service) => ({
      serviceId: service.id,
      title: `${service.title} available`,
      body: "এই সেবাটি আপনার জন্য available আছে। আপনি চাইলে আবেদন করতে পারেন।",
    }));

  await ensureServiceNotifications(userId, matches);
  return { availableServiceIds: matchedIds };
}
