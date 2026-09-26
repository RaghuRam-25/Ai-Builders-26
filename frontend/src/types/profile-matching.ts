/**
 * Profile → service matching.
 *
 * Ported verbatim from the original `shared/profile-matching.ts` so the Profile
 * screen and the backend produce byte-identical match lists. Used on both sides:
 * the backend persists the resulting notifications, the frontend renders the
 * matched cards immediately.
 */

import type { CitizenProfile } from "./citizen-profile";

export function getMatchedServiceIds(profile: CitizenProfile): string[] {
  const matches: string[] = [];
  const age = Number(profile.age);
  const occupation = (profile.occupation ?? "").toLowerCase();
  const education = (profile.education ?? "").toLowerCase();
  const income = (profile.income ?? "").toLowerCase();
  if (!profile.nidVerified) matches.push("nid");
  if (
    profile.isBangladeshi &&
    (age >= 60 || income === "কম" || income === "low")
  )
    matches.push("social-support");
  if (profile.isBangladeshi && profile.jobSeeking && age >= 18 && age <= 59)
    matches.push("jobs");
  if (
    profile.isBangladeshi &&
    (occupation.includes("student") ||
      occupation.includes("শিক্ষা") ||
      occupation.includes("ছাত্র") ||
      education.includes("কারিগরি"))
  )
    matches.push("training");
  if (profile.wantsTravel) matches.push("passport");
  return Array.from(new Set(matches));
}

/** Training programme eligibility, mirroring `scanTrainingDocuments` in the original Home screen. */
export function isEligibleForTraining(
  profile: CitizenProfile,
  isRegistered: boolean,
  program: { ageMin: number; ageMax: number },
  uploadedFileName: string,
): boolean {
  const age = Number(profile.age);
  const ageOk = age >= program.ageMin && age <= program.ageMax;
  const citizenOk = Boolean(profile.isBangladeshi);
  const identityOk =
    Boolean(profile.nidVerified) ||
    /nid|জাতীয়|identity|birth|জন্ম/i.test(uploadedFileName);
  return isRegistered && citizenOk && ageOk && identityOk;
}

/** Job notice eligibility, mirroring `scanJobDocuments` in the original Home screen. */
export function isEligibleForJob(
  profile: CitizenProfile,
  isRegistered: boolean,
  job: { ageMin: number; ageMax: number },
  uploadedFileName: string,
): boolean {
  const age = Number(profile.age);
  const ageOk = age >= job.ageMin && age <= job.ageMax;
  const citizenOk = Boolean(profile.isBangladeshi);
  const identityOk =
    Boolean(profile.nidVerified) ||
    /nid|জাতীয়|identity|birth|জন্ম/i.test(uploadedFileName);
  const educationOk = Boolean(profile.education?.trim());
  return isRegistered && citizenOk && ageOk && identityOk && educationOk;
}
