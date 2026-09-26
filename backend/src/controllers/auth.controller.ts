import type { Request, Response } from "express";

import { ApiError } from "../utils/api-error.js";
import { ok } from "../utils/response.js";
import * as authService from "../services/auth.service.js";
import type { LoginInput, RegisterInput } from "../validators/index.js";

export async function register(req: Request, res: Response) {
  const result = await authService.registerUser(req.body as RegisterInput);
  return ok(res, result, 201);
}

export async function login(req: Request, res: Response) {
  const result = await authService.loginUser(req.body as LoginInput);
  return ok(res, result);
}

export async function refresh(req: Request, res: Response) {
  const { refreshToken } = req.body as { refreshToken: string };
  const result = await authService.refreshSession(refreshToken);
  return ok(res, result);
}

export async function me(req: Request, res: Response) {
  if (!req.user) throw ApiError.unauthorized();
  const user = await authService.getPublicUser(req.user.id);
  return ok(res, { user });
}
