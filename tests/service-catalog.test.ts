import { describe, expect, it } from "vitest";

import { findGovernmentServiceContext, findGovernmentServices, getGovernmentServiceById } from "../shared/government-services";
import { services, suggestions } from "../shared/service-catalog";

describe("Janasheba service catalog", () => {
  it("contains complete service guidance for every listed service", () => {
    expect(services.length).toBeGreaterThanOrEqual(4);

    for (const service of services) {
      expect(service.id).toBeTruthy();
      expect(service.title).toBeTruthy();
      expect(service.documents.length).toBeGreaterThanOrEqual(2);
      expect(service.steps.length).toBeGreaterThanOrEqual(3);
      expect(service.officialSource).toMatch(/\./);
    }
  });

  it("offers Bengali starter prompts for the main citizen journeys", () => {
    expect(suggestions).toHaveLength(3);
    expect(suggestions.join(" ")).toContain("NID");
    expect(suggestions.join(" ")).toContain("পাসপোর্ট");
  });

  it("includes verified support programs and the two required NID/Birth paths", () => {
    const support = getGovernmentServiceById("social-support");
    expect(support).toBeTruthy();
    expect(support?.programs?.map((program) => program.title)).toEqual(expect.arrayContaining([
      "বয়স্ক ভাতা",
      "প্রতিবন্ধী ভাতা",
      "শিশু সহায়তা",
      "মাতৃত্বকালীন ভাতা",
      "বিধবা ও স্বামী নিগৃহীতা মহিলা ভাতা",
    ]));

    const nid = getGovernmentServiceById("nid");
    expect(nid?.options).toHaveLength(2);
    expect(nid?.options?.map((option) => option.id)).toEqual(expect.arrayContaining(["new-registration", "correction"]));

    const birth = getGovernmentServiceById("birth");
    expect(birth?.options).toHaveLength(2);
    expect(birth?.options?.map((option) => option.id)).toEqual(expect.arrayContaining(["new-registration", "correction"]));

    const passport = getGovernmentServiceById("passport");
    expect(passport?.options?.map((option) => option.id)).toEqual(expect.arrayContaining(["new-application", "renewal-reissue", "information-correction"]));
  });

  it("finds the correct service records from Bengali and English queries", () => {
    expect(findGovernmentServices("বয়স্ক ভাতা").map((service) => service.id)).toContain("social-support");
    expect(findGovernmentServices("birth certificate correction").map((service) => service.id)).toContain("birth");
    expect(findGovernmentServices("nid correction").map((service) => service.id)).toContain("nid");
  });

  it("resolves a precise option or allowance from Bengali and English questions", () => {
    expect(findGovernmentServiceContext("NID correction")).toMatchObject({ service: { id: "nid" }, optionId: "correction" });
    expect(findGovernmentServiceContext("জন্মনিবন্ধন সংশোধন")).toMatchObject({ service: { id: "birth" }, optionId: "correction" });
    expect(findGovernmentServiceContext("বয়স্ক ভাতা")).toMatchObject({ service: { id: "social-support" }, programId: "older-persons-allowance" });
    expect(findGovernmentServiceContext("passport renewal")).toMatchObject({ service: { id: "passport" }, optionId: "renewal-reissue" });
  });
});
