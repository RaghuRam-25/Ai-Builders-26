/**
 * Home-screen topic tiles and starter prompts.
 * Copied verbatim from the original `shared/service-catalog.ts`; the English
 * label map is taken from the `isEnglish ? {...}[item.id] : item.label`
 * branch inside `app/(tabs)/index.tsx`.
 */
import type { ServiceCategory, Suggestion } from "../types/government-service.js";

export const serviceCategoriesSeed: ServiceCategory[] = [
  { id: "popular", label: "জনপ্রিয়", labelEn: "Popular", icon: "★" },
  { id: "identity", label: "পরিচয়", labelEn: "Identity", icon: "▣" },
  { id: "education", label: "শিক্ষা", labelEn: "Skills", icon: "⌁" },
  { id: "support", label: "সহায়তা", labelEn: "Support", icon: "✦" },
  { id: "travel", label: "ভ্রমণ", labelEn: "Travel", icon: "↗" },
];

/** Category → service ids, from `app/(tabs)/index.tsx`. */
export const categoryServiceIds: Record<string, string[]> = {
  identity: ["nid", "birth"],
  education: ["training", "jobs"],
  support: ["social-support"],
  travel: ["passport"],
};

export const suggestionsSeed: Suggestion[] = [
  { id: "nid-fix", label: "NID ঠিক করতে চাই", labelEn: "I want to correct my NID" },
  { id: "old-age", label: "বয়স্ক ভাতা কীভাবে পাবো?", labelEn: "How do I get the old-age allowance?" },
  { id: "passport-docs", label: "পাসপোর্ট করতে কী লাগবে?", labelEn: "What do I need for a passport?" },
];
