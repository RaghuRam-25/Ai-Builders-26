import { randomUUID } from "node:crypto";

import type { NextFunction, Request, Response } from "express";

import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";

/** Tags every request with an id and logs method, path, status and duration. */
export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const requestId = req.headers["x-request-id"]?.toString() || randomUUID();
  req.requestId = requestId;
  res.setHeader("X-Request-Id", requestId);

  if (env.isTest) {
    next();
    return;
  }

  const startedAt = process.hrtime.bigint();
  res.on("finish", () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1e6;
    const meta = {
      requestId,
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      durationMs: Math.round(durationMs * 100) / 100,
      ...(req.user ? { userId: req.user.id } : {}),
    };
    const line = `${req.method} ${req.originalUrl} ${res.statusCode} ${Math.round(durationMs)}ms`;
    if (res.statusCode >= 500) logger.error(line, undefined, meta);
    else if (res.statusCode >= 400) logger.warn(line, meta);
    else logger.info(line, meta);
  });

  next();
}
