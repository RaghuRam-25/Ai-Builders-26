export type Language = "bn" | "en";

export type Gender = "পুরুষ" | "নারী" | "অন্যান্য" | "";

/** Single source of truth for the Gender choice control in the Profile form. */
export const GENDER_OPTIONS = [
  "পুরুষ",
  "নারী",
  "অন্যান্য",
] as const satisfies readonly Gender[];

export const GENDER_VALUES: readonly Gender[] = ["", ...GENDER_OPTIONS];

/**
 * Citizen profile. Field set is taken verbatim from the original
 * `lib/profile-context.tsx` so the existing Profile form keeps every control.
 */
export type CitizenProfile = {
  name: string;
  age: string;
  district: string;
  occupation: string;
  income: string;
  education?: string;
  gender?: Gender;
  isBangladeshi?: boolean;
  jobSeeking?: boolean;
  nidVerified: boolean;
  wantsTravel: boolean;
};

export type CitizenProfileInput = Omit<CitizenProfile, "age"> & {
  age?: number | null;
};

export type RegistrationDetails = {
  name: string;
  mobile: string;
  password: string;
  age: string;
  district: string;
  gender: Gender;
  isBangladeshi: boolean;
};

export type UserRole = "user" | "admin";

export type PublicUser = {
  id: string;
  name: string;
  mobile: string | null;
  email: string | null;
  role: UserRole;
  lastSignedInAt: string;
  createdAt: string;
};

export type DocumentScanResult = {
  id: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  eligible: boolean;
  reasons: string[];
  checkedAt: string;
};
