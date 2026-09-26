/**
 * Government training programmes.
 * Records copied verbatim from the original `shared/training-programs.ts`.
 */
import type { TrainingProgram } from "../types/training-program.js";

export const trainingProgramsSeed: TrainingProgram[] = [
  {
    id: "dyd-computer",
    title: "কম্পিউটার ও ডিজিটাল দক্ষতা",
    provider: "যুব উন্নয়ন অধিদপ্তর",
    summary: "বেসিক কম্পিউটার, অফিস অ্যাপ্লিকেশন ও ডিজিটাল কর্মদক্ষতা।",
    ageMin: 18,
    ageMax: 35,
    requiredDocuments: ["NID বা জন্মনিবন্ধন", "শিক্ষাগত সনদ", "সাম্প্রতিক ছবি"],
    source: "dyd.gov.bd",
    applicationUrl: "https://dyd.gov.bd",
    accent: "#EA580C",
  },
  {
    id: "dyd-freelancing",
    title: "ফ্রিল্যান্সিং ও আউটসোর্সিং",
    provider: "যুব উন্নয়ন অধিদপ্তর",
    summary: "অনলাইন মার্কেটপ্লেস, ডিজাইন ও আয়ের প্রস্তুতিমূলক প্রশিক্ষণ।",
    ageMin: 18,
    ageMax: 40,
    requiredDocuments: ["NID বা জন্মনিবন্ধন", "শিক্ষাগত সনদ", "মোবাইল নম্বর"],
    source: "dyd.gov.bd",
    applicationUrl: "https://dyd.gov.bd",
    accent: "#7C3AED",
  },
  {
    id: "ict-women",
    title: "নারীদের ICT প্রশিক্ষণ",
    provider: "তথ্য ও যোগাযোগ প্রযুক্তি বিভাগ",
    summary: "নারীদের জন্য ডিজিটাল দক্ষতা ও কর্মসংস্থানমুখী প্রশিক্ষণ।",
    ageMin: 18,
    ageMax: 45,
    requiredDocuments: ["NID বা জন্মনিবন্ধন", "শিক্ষাগত সনদ", "সাম্প্রতিক ছবি"],
    source: "ictd.gov.bd",
    applicationUrl: "https://ictd.gov.bd",
    accent: "#0F766E",
  },
];
