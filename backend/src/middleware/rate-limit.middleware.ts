import rateLimit from "express-rate-limit";

import { env } from "../config/env.js";

function build(limit: number, message: string) {
  return rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    limit,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    // The Capacitor Android WebView and the static export both share one IP
    // in local testing, so key on user id when available and skip localhost.
    skip: () => env.isTest,
    handler: (_req, res) => {
      res.status(429).json({
        error: { code: "RATE_LIMITED", message },
      });
    },
  });
}

export const apiLimiter = build(
  env.RATE_LIMIT_MAX,
  "Too many requests, please try again shortly",
);

export const authLimiter = build(
  env.AUTH_RATE_LIMIT_MAX,
  "Too many authentication attempts, please try again later",
);
