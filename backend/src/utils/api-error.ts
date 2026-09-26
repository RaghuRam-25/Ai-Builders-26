import type { NextFunction, Request, Response } from "express";
import { MongoServerError } from "mongodb";
import { ZodError } from "zod";

import { env } from "../config/env.js";
import { logger } from "./logger.js";

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;
  readonly isOperational = true;

  constructor(
    status: number,
    code: string,
    message: string,
    details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
    Error.captureStackTrace?.(this, ApiError);
  }

  static badRequest(message: string, details?: unknown) {
    return new ApiError(400, "VALIDATION_ERROR", message, details);
  }
  static unauthorized(message = "Authentication required") {
    return new ApiError(401, "UNAUTHORIZED", message);
  }
  static forbidden(message = "You do not have access to this resource") {
    return new ApiError(403, "FORBIDDEN", message);
  }
  static notFound(message = "Resource not found") {
    return new ApiError(404, "NOT_FOUND", message);
  }
  static conflict(message: string) {
    return new ApiError(409, "CONFLICT", message);
  }
  static payloadTooLarge(message: string) {
    return new ApiError(413, "PAYLOAD_TOO_LARGE", message);
  }
  static unsupportedMediaType(message: string) {
    return new ApiError(415, "UNSUPPORTED_MEDIA_TYPE", message);
  }
  static tooManyRequests(message = "Too many requests, please try again later") {
    return new ApiError(429, "RATE_LIMITED", message);
  }
  static internal(message = "Something went wrong") {
    return new ApiError(500, "INTERNAL_ERROR", message);
  }
}

/** Wraps an async route handler so rejected promises reach the error middleware. */
export function asyncHandler<T extends Request = Request>(
  handler: (req: T, res: Response, next: NextFunction) => Promise<unknown>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    void Promise.resolve(handler(req as T, res, next)).catch(next);
  };
}

export function notFoundHandler(req: Request, _res: Response, next: NextFunction) {
  next(ApiError.notFound(`Route ${req.method} ${req.originalUrl} does not exist`));
}

export function errorHandler(
  error: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (res.headersSent) {
    next(error);
    return;
  }

  let apiError: ApiError;

  if (error instanceof ApiError) {
    apiError = error;
  } else if (error instanceof ZodError) {
    apiError = ApiError.badRequest("Request validation failed", error.issues);
  } else if (error instanceof MongoServerError) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern ?? {})[0] ?? "field";
      apiError = ApiError.conflict(`A record with that ${field} already exists`);
    } else {
      apiError = ApiError.internal("Database error");
    }
  } else if (
    error instanceof SyntaxError &&
    "body" in (error as unknown as Record<string, unknown>)
  ) {
    apiError = ApiError.badRequest("Malformed JSON request body");
  } else {
    apiError = ApiError.internal();
  }

  if (apiError.status >= 500) {
    logger.error(
      `${req.method} ${req.originalUrl} failed`,
      error,
      { requestId: (req as Request & { requestId?: string }).requestId },
    );
  } else {
    logger.debug(`${req.method} ${req.originalUrl} → ${apiError.status}`, {
      code: apiError.code,
      requestId: (req as Request & { requestId?: string }).requestId,
    });
  }

  res.status(apiError.status).json({
    error: {
      code: apiError.code,
      message: apiError.message,
      ...(apiError.details ? { details: apiError.details } : {}),
      ...(env.isProduction ? {} : { stack: (error as Error)?.stack }),
      requestId: (req as Request & { requestId?: string }).requestId,
    },
  });
}
