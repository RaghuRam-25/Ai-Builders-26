import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { config as loadDotenv } from "dotenv";
import { z } from "zod";

/**
 * Locate the `backend/` package root.
 *
 * This module runs both from source (`backend/src/config`, via tsx) and from the
 * bundle (`backend/dist/server.js`), so the root cannot be a fixed number of
 * `..` hops away. Walk up to the nearest `package.json` instead.
 */
const BACKEND_PACKAGE_NAMES = new Set(["janasheba-backend", "@janasheba/backend"]);

function findBackendRoot(start: string): string {
  let dir = start;
  for (;;) {
    const manifest = path.join(dir, "package.json");
    if (existsSync(manifest)) {
      try {
        const { name } = JSON.parse(readFileSync(manifest, "utf8")) as { name?: string };
        if (name && BACKEND_PACKAGE_NAMES.has(name)) return dir;
      } catch {
        // Unreadable manifest: keep walking up.
      }
    }
    const parent = path.dirname(dir);
    if (parent === dir) return start;
    dir = parent;
  }
}

const here = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = findBackendRoot(here);

loadDotenv({ path: path.join(backendRoot, ".env") });
loadDotenv({ path: path.resolve(backendRoot, "../.env") });

const booleanish = z
  .string()
  .optional()
  .transform((value) => value === "true" || value === "1");

const schema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  HOST: z.string().default("0.0.0.0"),

  MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),
  MONGODB_DB_NAME: z.string().default("janasheba"),

  JWT_ACCESS_SECRET: z.string().min(32, "JWT_ACCESS_SECRET must be >= 32 chars"),
  JWT_REFRESH_SECRET: z
    .string()
    .min(32, "JWT_REFRESH_SECRET must be >= 32 chars"),
  JWT_ACCESS_TTL: z.string().default("15m"),
  JWT_REFRESH_TTL: z.string().default("30d"),
  BCRYPT_ROUNDS: z.coerce.number().int().min(4).max(15).default(10),

  OWNER_MOBILE: z.string().optional(),

  CORS_ORIGINS: z.string().default("http://localhost:3000"),

  LLM_API_BASE_URL: z.string().optional(),
  LLM_API_KEY: z.string().optional(),
  LLM_MODEL: z.string().default("gpt-4o-mini"),
  LLM_TIMEOUT_MS: z.coerce.number().int().positive().default(20_000),

  UPLOAD_DIR: z.string().default("uploads"),
  MAX_UPLOAD_MB: z.coerce.number().int().positive().max(50).default(8),

  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(300),
  AUTH_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(20),

  LOG_LEVEL: z
    .enum(["debug", "info", "warn", "error", "silent"])
    .default("info"),

  TRUST_PROXY: booleanish,
  SECURE_COOKIES: booleanish,

  DATABASE_URL_LEGACY: z.string().optional(),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((issue) => `  • ${issue.path.join(".") || "(root)"}: ${issue.message}`)
    .join("\n");
  // eslint-disable-next-line no-console
  console.error(`\n[env] Invalid environment configuration:\n${issues}\n`);
  throw new Error("Invalid environment configuration. See backend/.env.example");
}

const raw = parsed.data;

export const env = {
  ...raw,
  isProduction: raw.NODE_ENV === "production",
  isTest: raw.NODE_ENV === "test",
  corsOrigins: raw.CORS_ORIGINS.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
  uploadDir: path.isAbsolute(raw.UPLOAD_DIR)
    ? raw.UPLOAD_DIR
    : path.join(backendRoot, raw.UPLOAD_DIR),
  llmEnabled: Boolean(raw.LLM_API_BASE_URL && raw.LLM_API_KEY),
} as const;

export type Env = typeof env;
