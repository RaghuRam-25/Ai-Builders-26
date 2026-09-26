import type { Types } from "mongoose";

import type { AssistantRequest, AssistantSource } from "../types/chat.js";
import type { GovernmentService } from "../types/government-service.js";
import { findGovernmentServiceContext } from "../types/government-search.js";

import { env } from "../config/env.js";
import { CitizenProfile } from "../models/index.js";
import { logger } from "../utils/logger.js";
import { toCitizenProfile } from "./profile.service.js";

export type AssistantContext = NonNullable<AssistantRequest["context"]>;

export type AssistantResult = {
  reply: string;
  sources: AssistantSource[];
  resolvedService: GovernmentService | null;
  context: {
    serviceId: string | null;
    optionId: string | null;
    programId: string | null;
  };
};

const SYSTEM_PROMPT_BN = [
  "তুমি জনসেবা, বাংলাদেশের সরকারি সেবা সহায়ক।",
  "তোমার উত্তর শুধুমাত্র যাচাই করা সরকারি তথ্যের ভিত্তিতে দাও।",
  "তথ্য নিশ্চিত না হলে স্পষ্টভাবে জানাও যে এটি যাচাই করা তথ্য নয় এবং সংশ্লিষ্ট সরকারি ওয়েবসাইটে দেখতে বলো।",
  "উত্তর সংক্ষিপ্ত, সহজবাচ্য বাংলায় দাও এবং প্রয়োজনে ধাপে ধাপে নির্দেশনা দাও।",
].join(" ");

const SYSTEM_PROMPT_EN = [
  "You are Janasheba, a Bangladeshi government services assistant.",
  "Answer only from verified government service records.",
  "If you are not certain, say so plainly and point the citizen to the official source.",
  "Be concise, practical, and list required documents and steps when relevant.",
].join(" ");

function buildServiceBrief(service: GovernmentService): string {
  const lines = [
    `সেবা: ${service.title}`,
    `বিবরণ: ${service.description}`,
  ];
  if (service.eta) lines.push(`সময়: ${service.eta}`);
  if (service.documents.length) {
    lines.push(`প্রয়োজনীয় কাগজপত্র: ${service.documents.join(", ")}`);
  }
  if (service.steps.length) {
    lines.push(
      `ধাপ: ${service.steps.map((step, index) => `${index + 1}. ${step}`).join(" ")}`,
    );
  }
  if (service.officialSource) {
    lines.push(`অফিসিয়াল সোর্স: ${service.officialSource}`);
  }
  return lines.join("\n");
}

function toSource(service: GovernmentService, context: AssistantContext): AssistantSource {
  return {
    serviceId: service.id,
    serviceTitle: service.title,
    ...(context.optionId ? { optionId: context.optionId } : {}),
    ...(context.programId ? { programId: context.programId } : {}),
    officialSource: service.officialSource,
  };
}

async function loadProfile(userId: Types.ObjectId | string) {
  const doc = await CitizenProfile.findOne({ user: userId }).lean();
  return doc ? toCitizenProfile(doc) : null;
}

/** Deterministic reply used when no AI key is configured. */
function buildFallbackReply(
  service: GovernmentService | null,
  lang: "bn" | "en",
): string {
  if (lang === "en") {
    if (!service) {
      return "I could not match that to a verified government service. Please try naming the service, for example NID correction or a passport application.";
    }
    return [
      service.description,
      service.documents.length
        ? `Required documents: ${service.documents.join(", ")}.`
        : "",
      service.officialSource ? `Official source: ${service.officialSource}` : "",
    ]
      .filter(Boolean)
      .join("\n\n");
  }

  if (!service) {
    return "এটি কোনো যাচাই করা সরকারি সেবার সাথে মেলেনি। সেবার নাম উল্লেখ করে আবার চেষ্টা করুন, যেমন: এনআইডি সংশোধন বা পাসপোর্ট আবেদন।";
  }
  return [
    service.description,
    service.eta ? `সময় লাগবে: ${service.eta}` : "",
    service.documents.length
      ? `প্রয়োজনীয় কাগজপত্র: ${service.documents.join(", ")}`
      : "",
    service.officialSource ? `অফিসিয়াল সোর্স: ${service.officialSource}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");
}

async function callAiProvider(
  systemPrompt: string,
  userMessage: string,
  lang: "bn" | "en",
): Promise<string | null> {
  if (!env.llmEnabled || !env.LLM_API_BASE_URL || !env.LLM_API_KEY) return null;

  const baseUrl = env.LLM_API_BASE_URL.replace(/\/$/, "");

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.LLM_API_KEY}`,
      },
      body: JSON.stringify({
        model: env.LLM_MODEL,
        temperature: 0.2,
        max_tokens: 1024,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
      }),
      signal: AbortSignal.timeout(env.LLM_TIMEOUT_MS),
    });

    if (!response.ok) {
      logger.warn("LLM provider returned a non-OK status", {
        status: response.status,
        lang,
      });
      return null;
    }

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    return payload.choices?.[0]?.message?.content?.trim() || null;
  } catch (error) {
    logger.error("LLM provider call failed", undefined, {
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

export async function answerAssistantQuery(input: {
  userId: Types.ObjectId | string;
  message: string;
  lang: "bn" | "en";
  context?: AssistantContext | null;
  services: GovernmentService[];
}): Promise<AssistantResult> {
  const { services } = input;
  const context = input.context ?? null;

  let resolvedService: GovernmentService | null = null;
  if (context?.serviceId) {
    resolvedService = services.find((service) => service.id === context.serviceId) ?? null;
  }

  let resolvedContext = {
    serviceId: resolvedService?.id ?? null,
    optionId: context?.optionId ?? null,
    programId: context?.programId ?? null,
  };

  if (!resolvedService) {
    const derived = findGovernmentServiceContext(services, input.message);
    if (derived) {
      resolvedService = derived.service;
      resolvedContext = {
        serviceId: derived.service.id,
        optionId: context?.optionId ?? derived.optionId ?? null,
        programId: context?.programId ?? derived.programId ?? null,
      };
    }
  }

  const sources = resolvedService
    ? [toSource(resolvedService, { ...context, ...resolvedContext })]
    : [];

  const systemPrompt = input.lang === "en" ? SYSTEM_PROMPT_EN : SYSTEM_PROMPT_BN;
  const profile = await loadProfile(input.userId);
  const profileBrief = profile
    ? input.lang === "en"
      ? `Citizen profile: age ${profile.age || "unknown"}, district ${profile.district || "unknown"}, education ${profile.education || "unknown"}.`
      : `নাগরিকের প্রোফাইল: বয়স ${profile.age || "জানা নেই"}, জেলা ${profile.district || "জানা নেই"}, শিক্ষাগত যোগ্যতা ${profile.education || "জানা নেই"}।`
    : "";

  const questionLabel = input.lang === "en" ? "Citizen question" : "নাগরিকের প্রশ্ন";

  const userMessage = [
    resolvedService ? buildServiceBrief(resolvedService) : "",
    profileBrief,
    `${questionLabel}: ${input.message}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  const aiReply = await callAiProvider(systemPrompt, userMessage, input.lang);
  const reply = aiReply ?? buildFallbackReply(resolvedService, input.lang);

  return { reply, sources, resolvedService, context: resolvedContext };
}
