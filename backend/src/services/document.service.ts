import fs from "node:fs";
import path from "node:path";

import type { Types } from "mongoose";

import { isEligibleForJob, isEligibleForTraining } from "../types/profile-matching.js";

import { env } from "../config/env.js";
import { CitizenProfile, DocumentScan as DocumentScanModel } from "../models/index.js";
import { ApiError } from "../utils/api-error.js";
import { logger } from "../utils/logger.js";
import { getJobOpportunity } from "./jobs.service.js";
import { toCitizenProfile } from "./profile.service.js";
import { getTrainingProgram } from "./training.service.js";

/**
 * Replaces the client-only eligibility check the original Home screen ran after
 * `expo-document-picker` returned a file. The rules come from the shared
 * `profile-matching` module so the verdict is identical on both sides; this
 * service only adds persistence and human-readable reasons.
 *
 * The route is authenticated, so `isRegistered` is always true here.
 */
export async function scanDocumentForEligibility(
  userId: Types.ObjectId | string,
  input: {
    file: Express.Multer.File;
    target: "training" | "job";
    targetId: string;
  },
) {
  const { file } = input;
  const reasons: string[] = [];

  const profileDoc = await CitizenProfile.findOne({ user: userId }).lean();
  const profile = profileDoc ? toCitizenProfile(profileDoc) : null;

  let eligible = false;
  let title = "";

  if (!profile) {
    reasons.push("প্রোফাইল তৈরি করা হয়নি, তাই যোগ্যতা যাচাই করা যায়নি।");
  } else if (input.target === "training") {
    const program = await getTrainingProgram(input.targetId);
    title = program.title;
    eligible = isEligibleForTraining(
      profile,
      true,
      { ageMin: program.ageMin, ageMax: program.ageMax },
      file.originalname,
    );
    reasons.push(...describeTraining(profile, program.ageMin, program.ageMax, eligible));
  } else {
    const job = await getJobOpportunity(input.targetId);
    title = job.title;
    eligible = isEligibleForJob(
      profile,
      true,
      { ageMin: job.ageMin, ageMax: job.ageMax },
      file.originalname,
    );
    reasons.push(...describeJob(profile, job.ageMin, job.ageMax, eligible));
  }

  const scan = await DocumentScanModel.create({
    user: userId,
    fileName: file.originalname,
    storedName: file.filename,
    contentType: file.mimetype,
    sizeBytes: file.size,
    target: input.target,
    targetId: input.targetId,
    eligible,
    reasons,
  });

  return {
    id: scan.id as string,
    fileName: scan.fileName,
    target: scan.target,
    targetId: scan.targetId,
    eligible: scan.eligible,
    reasons: scan.reasons,
    summary: eligible
      ? `আপনি "${title}" এর জন্য যোগ্য।`
      : `আপনি "${title}" এর জন্য এখনো যোগ্য নন।`,
    createdAt: (scan.createdAt ?? new Date()).toISOString(),
  };
}

function describeTraining(
  profile: {
    age: string;
    isBangladeshi?: boolean;
    nidVerified: boolean;
  },
  ageMin: number,
  ageMax: number,
  eligible: boolean,
): string[] {
  const reasons: string[] = [];
  const age = Number(profile.age);

  if (!profile.isBangladeshi) reasons.push("বাংলাদেশি নাগরিক হিসেবে যাচাই করা হয়নি।");
  if (Number.isNaN(age) || age < ageMin || age > ageMax) {
    reasons.push(`এই প্রশিক্ষণের বয়স সীমা ${ageMin}-${ageMax} বছর।`);
  }
  if (!profile.nidVerified) {
    reasons.push("জাতীয় পরিচয়পত্র যাচাই করা হয়নি বা কাগজের নাম মিলেনি।");
  }
  if (reasons.length === 0) {
    reasons.push(
      eligible
        ? `বয়স ${ageMin}-${ageMax} সীমার মধ্যে এবং প্রয়োজনীয় কাগজপত্র পাওয়া গেছে।`
        : "প্রয়োজনীয় শর্ত পূরণ করা হয়নি।",
    );
  }
  return reasons;
}

function describeJob(
  profile: {
    age: string;
    isBangladeshi?: boolean;
    nidVerified: boolean;
    education?: string;
  },
  ageMin: number,
  ageMax: number,
  eligible: boolean,
): string[] {
  const reasons: string[] = [];
  const age = Number(profile.age);

  if (!profile.isBangladeshi) reasons.push("বাংলাদেশি নাগরিক হিসেবে যাচাই করা হয়নি।");
  if (Number.isNaN(age) || age < ageMin || age > ageMax) {
    reasons.push(`এই চাকরির বয়স সীমা ${ageMin}-${ageMax} বছর।`);
  }
  if (!profile.nidVerified) {
    reasons.push("জাতীয় পরিচয়পত্র যাচাই করা হয়নি বা কাগজের নাম মিলেনি।");
  }
  if (!profile.education?.trim()) reasons.push("শিক্ষাগত যোগ্যতার তথ্য দেওয়া হয়নি।");
  if (reasons.length === 0) {
    reasons.push(
      eligible
        ? `বয়স ${ageMin}-${ageMax} সীমার মধ্যে এবং প্রয়োজনীয় শিক্ষাগত যোগ্যতা পূরণ করা হয়েছে।`
        : "প্রয়োজনীয় শর্ত পূরণ করা হয়নি।",
    );
  }
  return reasons;
}

export async function listDocumentScans(userId: Types.ObjectId | string) {
  const scans = await DocumentScanModel.find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  return scans.map((scan) => ({
    id: scan._id.toString(),
    fileName: scan.fileName,
    target: scan.target,
    targetId: scan.targetId,
    eligible: scan.eligible,
    reasons: scan.reasons,
    createdAt: scan.createdAt.toISOString(),
  }));
}

export async function deleteDocumentScan(
  userId: Types.ObjectId | string,
  id: string,
) {
  const scan = await DocumentScanModel.findOneAndDelete({
    _id: id,
    user: userId,
  }).lean();
  if (!scan) throw ApiError.notFound("Document scan not found");

  // Best-effort cleanup: never fail the request if the file is already gone.
  const filePath = path.join(env.uploadDir, scan.storedName);
  fs.promises
    .unlink(filePath)
    .catch((error: unknown) => {
      logger.warn("Failed to remove uploaded document", {
        filePath,
        error: error instanceof Error ? error.message : String(error),
      });
    });

  return { id };
}
