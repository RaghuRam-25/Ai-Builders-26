/**
 * Government service domain types.
 *
 * Shape is identical to the original `shared/government-services.ts` so that the
 * data seeded into MongoDB renders exactly the same UI as the Expo app did.
 */

export type GovernmentProgram = {
  id: string;
  title: string;
  department: string;
  summary: string;
  eligibility: string[];
  requiredDocuments: string[];
  applicationProcess: string[];
  officialSource: string;
  applicationUrl: string;
  tabs?: string[];
};

export type GovernmentOption = {
  id: string;
  title: string;
  description: string;
  eligibility: string[];
  requiredDocuments: string[];
  applicationProcess: string[];
  officialSource: string;
  applicationUrl: string;
  trackingUrl?: string;
  tabs?: string[];
};

export type GovernmentService = {
  id: string;
  category: string;
  title: string;
  description: string;
  eta: string;
  documents: string[];
  steps: string[];
  officialSource: string;
  accent: string;
  programs?: GovernmentProgram[];
  options?: GovernmentOption[];
};

/** English overrides applied when the client requests `lang=en`. */
export type ServiceTranslation = {
  id: string;
  category?: string;
  title?: string;
  description?: string;
  eta?: string;
  documents?: string[];
  steps?: string[];
};

export type GovernmentServiceContext = {
  service: GovernmentService;
  optionId?: string;
  programId?: string;
};

export type ServiceCategory = {
  id: string;
  label: string;
  labelEn: string;
  icon: string;
};

export type Suggestion = {
  id: string;
  label: string;
  labelEn: string;
};
