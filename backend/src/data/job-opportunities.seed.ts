/**
 * Government job notices.
 * Records copied verbatim from the original `shared/job-opportunities.ts`,
 * including its caveat that production should sync from a verified official feed.
 */
import type { JobOpportunity } from "../types/job-opportunity.js";

export const jobOpportunitiesSeed: JobOpportunity[] = [
  {
    id: "govt-admin",
    title: "সরকারি প্রশাসনিক নিয়োগ বিজ্ঞপ্তি",
    organization: "বাংলাদেশ সরকারি কর্ম কমিশন",
    summary: "প্রশাসনিক ও সাধারণ ক্যাডারধর্মী পদের জন্য নিয়োগের তথ্য।",
    status: "আবেদন চলছে",
    deadline: "১৫ অক্টোবর ২০২৬",
    ageMin: 21,
    ageMax: 30,
    education: "স্নাতক বা সমমান",
    requiredDocuments: [
      "NID বা জন্মনিবন্ধন",
      "শিক্ষাগত সনদ",
      "সাম্প্রতিক ছবি",
      "মোবাইল নম্বর",
    ],
    officialSource: "bpsc.gov.bd",
    applicationUrl: "https://bpsc.gov.bd",
    accent: "#7C3AED",
  },
  {
    id: "railway",
    title: "রেলওয়ে সহকারী পদ",
    organization: "বাংলাদেশ রেলওয়ে",
    summary: "সহকারী পর্যায়ের সরকারি চাকরির পদ ও আবেদন নির্দেশনা।",
    status: "আবেদন চলছে",
    deadline: "৩০ সেপ্টেম্বর ২০২৬",
    ageMin: 18,
    ageMax: 32,
    education: "HSC বা সমমান",
    requiredDocuments: [
      "NID বা জন্মনিবন্ধন",
      "শিক্ষাগত সনদ",
      "ছবি",
      "মোবাইল নম্বর",
    ],
    officialSource: "railway.gov.bd",
    applicationUrl: "https://railway.gov.bd",
    accent: "#0F766E",
  },
  {
    id: "primary-teacher",
    title: "সহকারী শিক্ষক নিয়োগ",
    organization: "প্রাথমিক শিক্ষা অধিদপ্তর",
    summary: "সরকারি প্রাথমিক বিদ্যালয়ে সহকারী শিক্ষক পদে আবেদনের তথ্য।",
    status: "শিগগির শেষ হবে",
    deadline: "০৫ নভেম্বর ২০২৬",
    ageMin: 21,
    ageMax: 30,
    education: "স্নাতক বা সমমান",
    requiredDocuments: [
      "NID বা জন্মনিবন্ধন",
      "শিক্ষাগত সনদ",
      "সাম্প্রতিক ছবি",
      "মোবাইল নম্বর",
    ],
    officialSource: "dpe.gov.bd",
    applicationUrl: "https://dpe.gov.bd",
    accent: "#EA580C",
  },
];
