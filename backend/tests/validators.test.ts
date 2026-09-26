import { describe, expect, it } from "vitest";

import {
  appendMessageSchema,
  assistantSchema,
  idParamSchema,
  loginSchema,
  profileUpsertSchema,
  registerSchema,
  scanQuerySchema,
} from "../src/validators/index.js";

describe("registerSchema", () => {
  const valid = {
    name: "টেস্ট নাগরিক",
    mobile: "01700000000",
    password: "supersecret123",
    age: 30,
    district: "ঢাকা",
    gender: "পুরুষ",
    isBangladeshi: true,
  };

  it("accepts a complete registration", () => {
    expect(registerSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects a short password", () => {
    const result = registerSchema.safeParse({ ...valid, password: "short" });
    expect(result.success).toBe(false);
  });

  it("rejects a non-numeric age", () => {
    expect(registerSchema.safeParse({ ...valid, age: "abc" }).success).toBe(false);
  });

  it("rejects an unknown gender", () => {
    expect(registerSchema.safeParse({ ...valid, gender: "other" }).success).toBe(false);
  });

  it("rejects a name that is only whitespace", () => {
    expect(registerSchema.safeParse({ ...valid, name: "   " }).success).toBe(false);
  });
});

describe("loginSchema", () => {
  it("requires both fields", () => {
    expect(loginSchema.safeParse({ mobile: "01700000000" }).success).toBe(false);
  });
});

describe("profileUpsertSchema", () => {
  it("treats an empty optional string as null", () => {
    const result = profileUpsertSchema.parse({
      name: "টেস্ট",
      district: "",
      education: "",
      nidVerified: false,
      wantsTravel: false,
    });
    expect(result.district).toBeNull();
    expect(result.education).toBeNull();
  });

  it("keeps a provided value", () => {
    const result = profileUpsertSchema.parse({
      name: "টেস্ট",
      district: "চট্টগ্রাম",
      nidVerified: true,
      wantsTravel: false,
    });
    expect(result.district).toBe("চট্টগ্রাম");
  });

  it("coerces an age sent as a string", () => {
    const result = profileUpsertSchema.parse({
      name: "টেস্ট",
      age: "42",
      nidVerified: false,
      wantsTravel: false,
    });
    expect(result.age).toBe(42);
  });
});

describe("assistantSchema", () => {
  it("defaults an empty message and language", () => {
    const result = assistantSchema.parse({});
    expect(result.message).toBe("");
    expect(result.language).toBe("bn");
  });

  it("rejects an unsupported language", () => {
    expect(assistantSchema.safeParse({ message: "hi", language: "fr" }).success).toBe(false);
  });
});

describe("appendMessageSchema", () => {
  it("requires a role and non-empty content", () => {
    expect(appendMessageSchema.safeParse({ role: "user", content: "" }).success).toBe(false);
    expect(appendMessageSchema.safeParse({ role: "system", content: "x" }).success).toBe(false);
    expect(appendMessageSchema.safeParse({ role: "user", content: "x" }).success).toBe(true);
  });
});

describe("scanQuerySchema", () => {
  it("only accepts training or job targets", () => {
    expect(scanQuerySchema.safeParse({ target: "training", targetId: "a" }).success).toBe(true);
    expect(scanQuerySchema.safeParse({ target: "job", targetId: "a" }).success).toBe(true);
    expect(scanQuerySchema.safeParse({ target: "passport", targetId: "a" }).success).toBe(false);
  });

  it("requires a targetId", () => {
    expect(scanQuerySchema.safeParse({ target: "job" }).success).toBe(false);
  });
});

describe("idParamSchema", () => {
  it("rejects a blank id", () => {
    expect(idParamSchema.safeParse({ id: "  " }).success).toBe(false);
  });
});
