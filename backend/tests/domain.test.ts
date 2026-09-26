import { describe, expect, it } from "vitest";

import {
  findGovernmentServiceContext,
  findGovernmentServices,
  getGovernmentServiceById,
  supportedQueryTerms,
} from "../src/types/government-search.js";
import { governmentServices } from "../src/data/government-services.seed.js";
import {
  getMatchedServiceIds,
  isEligibleForJob,
  isEligibleForTraining,
} from "../src/types/profile-matching.js";
import type { CitizenProfile } from "../src/types/citizen-profile.js";

const baseProfile: CitizenProfile = {
  name: "টেস্ট",
  age: "30",
  district: "ঢাকা",
  occupation: "",
  income: "",
  education: "",
  gender: "",
  isBangladeshi: true,
  jobSeeking: false,
  nidVerified: false,
  wantsTravel: false,
};

describe("government seed integrity", () => {
  it("contains exactly the six original services", () => {
    expect(governmentServices.map((s) => s.id).sort()).toEqual([
      "birth",
      "jobs",
      "nid",
      "passport",
      "social-support",
      "training",
    ]);
  });

  it("keeps every service id unique", () => {
    const ids = governmentServices.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("stores officialSource as a bare domain, like the original data", () => {
    for (const service of governmentServices) {
      expect(service.officialSource).not.toMatch(/^https?:\/\//);
    }
  });

  it("keeps non-empty documents and steps on every service", () => {
    for (const service of governmentServices) {
      expect(service.documents.length).toBeGreaterThan(0);
      expect(service.steps.length).toBeGreaterThan(0);
      expect(service.officialSource).toBeTruthy();
    }
  });

  it("keeps nested programs on social-support and options on passport", () => {
    const social = getGovernmentServiceById(governmentServices, "social-support");
    const passport = getGovernmentServiceById(governmentServices, "passport");
    expect(social?.programs?.length ?? 0).toBeGreaterThan(0);
    expect(passport?.options?.length ?? 0).toBeGreaterThan(0);
  });
});

describe("government search", () => {
  it("finds a service by its Bengali title", () => {
    const results = findGovernmentServices(governmentServices, "পাসপোর্ট", 5);
    expect(results.map((r) => r.id)).toContain("passport");
  });

  it("resolves a natural-language question to a service", () => {
    const context = findGovernmentServiceContext(
      governmentServices,
      "পাসপোর্টের জন্য কী কাগজ লাগবে?",
    );
    expect(context?.service.id).toBe("passport");
  });

  it("returns null for an unrelated question", () => {
    const context = findGovernmentServiceContext(
      governmentServices,
      "আজকের আবহাওয়া কেমন",
    );
    expect(context).toBeNull();
  });

  it("exposes supported query terms", () => {
    expect(supportedQueryTerms(governmentServices).length).toBeGreaterThan(0);
  });
});

describe("profile matching", () => {
  it("matches nid while the NID is unverified", () => {
    expect(getMatchedServiceIds(baseProfile)).toContain("nid");
  });

  it("drops nid once verified", () => {
    expect(getMatchedServiceIds({ ...baseProfile, nidVerified: true })).not.toContain("nid");
  });

  it("matches social-support for citizens aged 60 or over", () => {
    expect(getMatchedServiceIds({ ...baseProfile, age: "60" })).toContain("social-support");
    expect(getMatchedServiceIds({ ...baseProfile, age: "59" })).not.toContain("social-support");
  });

  it("matches jobs only for job-seeking citizens aged 18-59", () => {
    expect(getMatchedServiceIds({ ...baseProfile, jobSeeking: true, age: "30" })).toContain("jobs");
    expect(getMatchedServiceIds({ ...baseProfile, jobSeeking: false, age: "30" })).not.toContain("jobs");
  });

  it("matches training for students and technical backgrounds", () => {
    expect(getMatchedServiceIds({ ...baseProfile, occupation: "student" })).toContain("training");
    expect(getMatchedServiceIds({ ...baseProfile, education: "কারিগরি" })).toContain("training");
  });

  it("matches passport only when the citizen wants to travel", () => {
    expect(getMatchedServiceIds({ ...baseProfile, wantsTravel: true })).toContain("passport");
    expect(getMatchedServiceIds(baseProfile)).not.toContain("passport");
  });

  it("never duplicates a service id", () => {
    const ids = getMatchedServiceIds({
      ...baseProfile,
      age: "65",
      jobSeeking: true,
      wantsTravel: true,
      occupation: "student",
    });
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("document eligibility", () => {
  const program = { ageMin: 18, ageMax: 30 };

  it("accepts a citizen whose NID is already verified", () => {
    expect(
      isEligibleForTraining(
        { ...baseProfile, age: "25", nidVerified: true },
        true,
        program,
        "anything.pdf",
      ),
    ).toBe(true);
  });

  it("accepts an unverified citizen whose file name looks like an identity document", () => {
    expect(
      isEligibleForTraining(
        { ...baseProfile, age: "25" },
        true,
        program,
        "my-nid.jpg",
      ),
    ).toBe(true);
  });

  it("rejects an out-of-range age", () => {
    expect(
      isEligibleForTraining(
        { ...baseProfile, age: "45", nidVerified: true },
        true,
        program,
        "nid.jpg",
      ),
    ).toBe(false);
  });

  it("rejects non-citizens", () => {
    expect(
      isEligibleForTraining(
        { ...baseProfile, age: "25", isBangladeshi: false, nidVerified: true },
        true,
        program,
        "nid.jpg",
      ),
    ).toBe(false);
  });

  it("requires a known education level for job notices", () => {
    expect(
      isEligibleForJob(
        { ...baseProfile, age: "25", nidVerified: true },
        true,
        program,
        "nid.jpg",
      ),
    ).toBe(false);
    expect(
      isEligibleForJob(
        { ...baseProfile, age: "25", nidVerified: true, education: "বিএ" },
        true,
        program,
        "nid.jpg",
      ),
    ).toBe(true);
  });

  it("rejects anonymous users", () => {
    expect(
      isEligibleForTraining({ ...baseProfile, age: "25", nidVerified: true }, false, program, "nid.jpg"),
    ).toBe(false);
  });
});
