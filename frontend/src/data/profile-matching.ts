import type { CitizenProfile } from "@/lib/profile-context";

export function getMatchedServiceIds(profile: CitizenProfile) {
  const matches: string[] = [];
  const age = Number(profile.age);
  const occupation = (profile.occupation ?? "").toLowerCase();
  const education = (profile.education ?? "").toLowerCase();
  const income = (profile.income ?? "").toLowerCase();
  if (!profile.nidVerified) matches.push("nid");
  if (profile.isBangladeshi && (age >= 60 || income === "কম" || income === "low")) matches.push("social-support");
  if (profile.isBangladeshi && profile.jobSeeking && age >= 18 && age <= 59) matches.push("jobs");
  if (profile.isBangladeshi && (occupation.includes("student") || occupation.includes("শিক্ষা") || occupation.includes("ছাত্র") || education.includes("কারিগরি"))) matches.push("training");
  if (profile.wantsTravel) matches.push("passport");
  return Array.from(new Set(matches));
}
