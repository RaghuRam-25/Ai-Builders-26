import { z } from "zod";

import { GENDER_VALUES } from "../types/citizen-profile.js";

const trimmed = (max: number) => z.string().trim().max(max);
const optionalText = (max: number) =>
  trimmed(max)
    .nullable()
    .optional()
    .transform((value) => (value === "" ? null : value));

export const registerSchema = z.object({
  name: z.string().trim().min(1, "Full name is required").max(160),
  mobile: z
    .string()
    .trim()
    .min(6, "Mobile number is required")
    .max(20)
    .regex(/^[0-9+\-\s()]+$/, "Mobile number contains invalid characters"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128),
  age: z.coerce.number().int().min(0).max(130),
  district: z.string().trim().min(1, "District is required").max(120),
  gender: z.enum(GENDER_VALUES as unknown as [string, ...string[]]),
  isBangladeshi: z.boolean().default(false),
});

export const loginSchema = z.object({
  mobile: z.string().trim().min(6).max(20),
  password: z.string().min(1, "Password is required").max(128),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1, "refreshToken is required"),
});

export const profileUpsertSchema = z.object({
  name: z.string().trim().min(1, "Full name is required").max(160),
  age: z.coerce.number().int().min(0).max(130).nullable().optional(),
  district: optionalText(120),
  education: optionalText(160),
  occupation: optionalText(160),
  income: optionalText(80),
  gender: z.enum(GENDER_VALUES as unknown as [string, ...string[]]).optional(),
  isBangladeshi: z.boolean().optional(),
  jobSeeking: z.boolean().optional(),
  nidVerified: z.boolean().default(false),
  wantsTravel: z.boolean().default(false),
});

export const conversationCreateSchema = z.object({
  title: trimmed(200).optional(),
});

export const appendMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().trim().min(1).max(20_000),
  attachmentName: trimmed(255).optional(),
});

export const assistantSchema = z.object({
  message: trimmed(4000).default(""),
  conversationId: z.string().trim().min(1).nullable().optional(),
  attachmentName: trimmed(255).nullable().optional(),
  language: z.enum(["bn", "en"]).default("bn"),
  context: z
    .object({
      serviceId: z.string().trim().max(64).nullable().optional(),
      optionId: z.string().trim().max(64).nullable().optional(),
      programId: z.string().trim().max(64).nullable().optional(),
      jobId: z.string().trim().max(64).nullable().optional(),
      trainingId: z.string().trim().max(64).nullable().optional(),
    })
    .nullable()
    .optional(),
});

export const scanQuerySchema = z.object({
  target: z.enum(["training", "job"]),
  targetId: z.string().trim().min(1, "targetId is required").max(64),
});

export const idParamSchema = z.object({
  id: z.string().trim().min(1).max(64),
});

export const governmentListQuerySchema = z.object({
  search: z.string().trim().max(200).default(""),
  limit: z.coerce.number().int().positive().max(50).default(50),
  lang: z.enum(["bn", "en"]).default("bn"),
});

export const governmentSearchQuerySchema = z.object({
  query: z.string().trim().max(200).default(""),
  limit: z.coerce.number().int().positive().max(10).default(5),
  lang: z.enum(["bn", "en"]).default("bn"),
});

export const contextQuerySchema = z.object({
  query: z.string().trim().max(200).default(""),
  lang: z.enum(["bn", "en"]).default("bn"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ProfileUpsertInput = z.infer<typeof profileUpsertSchema>;
export type AssistantInput = z.infer<typeof assistantSchema>;
export type AppendMessageInput = z.infer<typeof appendMessageSchema>;
