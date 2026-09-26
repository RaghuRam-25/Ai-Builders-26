import type { NextFunction, Request, Response } from "express";
import type { Types } from "mongoose";

import type { UserRole } from "../types/citizen-profile.js";
import { ApiError } from "../utils/api-error.js";
import { verifyAccessToken } from "../utils/jwt.js";

export type AuthenticatedUser = {
  id: string;
  objectId: Types.ObjectId;
  role: UserRole;
  mobile: string | null;
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      requestId?: string;
    }
  }
}

function extractToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) return header.slice(7).trim();
  const cookies = (req as Request & { cookies?: Record<string, string> }).cookies;
  if (cookies?.accessToken) return cookies.accessToken;
  return null;
}

function resolveUser(req: Request): AuthenticatedUser | null {
  const token = extractToken(req);
  if (!token) return null;
  try {
    const payload = verifyAccessToken(token);
    return {
      id: payload.sub,
      objectId: payload.sub as unknown as Types.ObjectId,
      role: payload.role,
      mobile: payload.mobile,
    };
  } catch {
    return null;
  }
}

/** Attaches `req.user` when a valid token is present, but never rejects. */
export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const user = resolveUser(req);
  if (user) req.user = user;
  next();
}

/** Rejects the request with 401 unless a valid access token is present. */
export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const user = resolveUser(req);
  if (!user) {
    next(ApiError.unauthorized());
    return;
  }
  req.user = user;
  next();
}

/** Rejects the request with 403 unless the authenticated user is an admin. */
export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  if (!req.user) {
    next(ApiError.unauthorized());
    return;
  }
  if (req.user.role !== "admin") {
    next(ApiError.forbidden("Administrator access required"));
    return;
  }
  next();
}
