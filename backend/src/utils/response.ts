import type { Response } from "express";

import type { ApiListResponse, ApiSuccessBody } from "../types/api.js";

export function sendData<T>(res: Response, data: T, status = 200): Response {
  const body: ApiSuccessBody<T> = { data };
  return res.status(status).json(body);
}

/** Alias of `sendData`, used throughout the controllers. */
export function ok<T>(res: Response, data: T, status = 200): Response {
  return sendData(res, data, status);
}

export function sendCreated<T>(res: Response, data: T): Response {
  return sendData(res, data, 201);
}

export function sendList<T>(
  res: Response,
  items: T[],
  meta?: Record<string, unknown>,
): Response {
  const body = {
    data: items,
    meta: { total: items.length, ...(meta ?? {}) },
  } as ApiListResponse<T> & Record<string, unknown>;
  return res.status(200).json(body);
}
