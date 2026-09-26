import { env } from "../config/env.js";

type Level = "debug" | "info" | "warn" | "error" | "silent";

const order: Record<Level, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
  silent: 100,
};

const threshold = order[env.LOG_LEVEL];

function emit(
  level: Exclude<Level, "silent">,
  message: string,
  meta?: Record<string, unknown>,
): void {
  if (order[level] < threshold) return;

  const record = {
    ts: new Date().toISOString(),
    level,
    service: "janasheba-backend",
    message,
    ...(meta ?? {}),
  };

  const line = env.isProduction
    ? JSON.stringify(record)
    : `${record.ts} ${level.toUpperCase().padEnd(5)} ${message}${
        meta && Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : ""
      }`;

  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export const logger = {
  debug: (message: string, meta?: Record<string, unknown>) =>
    emit("debug", message, meta),
  info: (message: string, meta?: Record<string, unknown>) =>
    emit("info", message, meta),
  warn: (message: string, meta?: Record<string, unknown>) =>
    emit("warn", message, meta),
  error: (message: string, error?: unknown, meta?: Record<string, unknown>) =>
    emit("error", message, {
      ...(meta ?? {}),
      ...(error instanceof Error
        ? { error: error.message, stack: error.stack }
        : error !== undefined
          ? { error }
          : {}),
    }),
};
