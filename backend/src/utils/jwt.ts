import jwt, { type SignOptions } from "jsonwebtoken";

import { env } from "../config/env.js";
import { ApiError } from "./api-error.js";

export type AccessTokenPayload = {
  sub: string;
  role: "user" | "admin";
  mobile: string | null;
  type: "access";
};

export type RefreshTokenPayload = {
  sub: string;
  type: "refresh";
};

function sign(
  payload: AccessTokenPayload | RefreshTokenPayload,
  secret: string,
  expiresIn: string,
): string {
  return jwt.sign(payload, secret, {
    expiresIn: expiresIn as SignOptions["expiresIn"],
    issuer: "janasheba-ai",
    audience: "janasheba-app",
  });
}

export function signAccessToken(payload: Omit<AccessTokenPayload, "type">): string {
  return sign({ ...payload, type: "access" }, env.JWT_ACCESS_SECRET, env.JWT_ACCESS_TTL);
}

export function signRefreshToken(userId: string): string {
  return sign({ sub: userId, type: "refresh" }, env.JWT_REFRESH_SECRET, env.JWT_REFRESH_TTL);
}

function verify<T>(token: string, secret: string, expected: string): T {
  try {
    const decoded = jwt.verify(token, secret, {
      issuer: "janasheba-ai",
      audience: "janasheba-app",
    }) as { sub?: string; type?: string };
    if (decoded.type !== expected || !decoded.sub) {
      throw ApiError.unauthorized("Invalid token");
    }
    return decoded as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw ApiError.unauthorized("Session expired, please sign in again");
  }
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return verify<AccessTokenPayload>(
    token,
    env.JWT_ACCESS_SECRET,
    "access",
  );
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  return verify<RefreshTokenPayload>(
    token,
    env.JWT_REFRESH_SECRET,
    "refresh",
  );
}

/** "15m" → 900 (seconds) */
export function accessTokenTtlSeconds(): number {
  const match = /^(\d+)([smhd])$/.exec(env.JWT_ACCESS_TTL.trim());
  if (!match) return 900;
  const value = Number(match[1]);
  const unit = match[2];
  const multiplier = unit === "s" ? 1 : unit === "m" ? 60 : unit === "h" ? 3600 : 86400;
  return value * multiplier;
}
