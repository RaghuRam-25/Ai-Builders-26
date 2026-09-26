export type AppErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "PAYLOAD_TOO_LARGE"
  | "UNSUPPORTED_MEDIA_TYPE"
  | "INTERNAL_ERROR";

/**
 * Ported from the original `shared/_core/errors.ts` so client error handling
 * keeps the same discriminated union.
 */
export type AppErrorShape = {
  code: AppErrorCode;
  message: string;
  status?: number;
  details?: unknown;
};

export function isAppError(value: unknown): value is AppErrorShape {
  return (
    typeof value === "object" &&
    value !== null &&
    "code" in value &&
    "message" in value
  );
}
