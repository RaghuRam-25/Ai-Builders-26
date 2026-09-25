import { describe, expect, it } from "vitest";
import { getMatchedServiceIds } from "../shared/profile-matching";

describe("profile-based service matching", () => {
  it("suggests NID correction when the profile is not verified", () => {
    const ids = getMatchedServiceIds({ name: "A", age: "32", district: "Dhaka", occupation: "Business", income: "medium", isBangladeshi: true, jobSeeking: false, nidVerified: false, wantsTravel: false });
    expect(ids).toContain("nid");
  });
  it("suggests senior allowance only for a Bangladeshi senior citizen", () => {
    const ids = getMatchedServiceIds({ name: "A", age: "65", district: "Dhaka", occupation: "Retired", income: "low", isBangladeshi: true, jobSeeking: false, nidVerified: true, wantsTravel: true });
    expect(ids).toEqual(expect.arrayContaining(["social-support", "passport"]));
  });
  it("suggests jobs for a Bangladeshi working-age citizen looking for work", () => {
    const ids = getMatchedServiceIds({ name: "A", age: "30", district: "Dhaka", occupation: "Graduate", education: "কারিগরি", income: "medium", isBangladeshi: true, jobSeeking: true, nidVerified: true, wantsTravel: false });
    expect(ids).toEqual(expect.arrayContaining(["jobs", "training"]));
  });
});
