import type { NextFunction, Request, Response } from "express";
import type { ZodType } from "zod";

import { ApiError } from "../utils/api-error.js";

type Source = "body" | "query" | "params";

/**
 * Validates and *replaces* the given request segment with the parsed result so
 * controllers receive coerced, typed values.
 */
export function validate(schema: ZodType, source: Source = "body") {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      next(ApiError.badRequest("Request validation failed", result.error.issues));
      return;
    }
    if (source === "query") {
      // Express 5 makes req.query a getter; assign through defineProperty.
      Object.defineProperty(req, "query", {
        value: result.data,
        writable: true,
        configurable: true,
      });
    } else {
      req[source] = result.data as never;
    }
    next();
  };
}
