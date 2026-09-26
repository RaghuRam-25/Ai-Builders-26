"use client";

/**
 * REST client for the Express API (`/api/v1`).
 *
 * Replaces the original Manus/tRPC bridge (`lib/_core/api.ts`). All backend
 * responses are wrapped as `{ data }` (see `backend/src/utils/response.ts`), so
 * `request` unwraps that envelope and normalizes errors.
 */

import type { AuthTokens, ApiErrorBody } from "@/types/api";
import type { PublicUser } from "@/types/citizen-profile";

/**
 * Where the API lives.
 *
 * A build-time `NEXT_PUBLIC_API_URL` cannot cover every case, because the same
 * APK is installed on emulators and physical phones that reach the developer
 * machine at different addresses. Resolution order:
 *
 *   1. `localStorage["janasheba.apiUrl"]` - runtime override, so one build can be
 *      pointed at a LAN host from the in-app settings screen.
 *   2. `NEXT_PUBLIC_API_URL` baked in at build time.
 *   3. Platform default: `10.0.2.2` on Android (the emulator's alias for the
 *      host machine, since `localhost` there means the phone itself) and
 *      `localhost` on the web.
 */
const API_URL_STORAGE_KEY = "janasheba.apiUrl";

const DEFAULT_API_HOST =
  typeof window !== "undefined" && /Android/i.test(navigator.userAgent)
    ? "http://10.0.2.2:4000"
    : "http://localhost:4000";

function normalizeApiUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim().replace(/\/+$/, "");
  return trimmed.length > 0 ? trimmed : null;
}

function readStoredApiUrl(): string | null {
  try {
    return normalizeApiUrl(window.localStorage.getItem(API_URL_STORAGE_KEY));
  } catch {
    // Private mode / storage disabled: fall through to the build-time value.
    return null;
  }
}

/** Persist a new API origin at runtime. Throws if the value is not a valid URL. */
export function setApiUrl(next: string): string {
  const normalized = normalizeApiUrl(next);
  if (!normalized) throw new Error("API URL must not be empty");
  new URL(normalized); // validate
  window.localStorage.setItem(API_URL_STORAGE_KEY, normalized);
  return normalized;
}

export function getApiUrl(): string {
  return (
    readStoredApiUrl() ??
    normalizeApiUrl(process.env.NEXT_PUBLIC_API_URL) ??
    `${DEFAULT_API_HOST}/api/v1`
  );
}

export const API_URL = getApiUrl();

export type ApiErrorShape = {
  status: number;
  code: string;
  message: string;
  details?: unknown;
  requestId?: string;
};

export class ApiError extends Error implements ApiErrorShape {
  status: number;
  code: string;
  details?: unknown;
  requestId?: string;

  constructor({ status, code, message, details, requestId }: ApiErrorShape) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
    this.requestId = requestId;
  }
}

const ACCESS_KEY = "janasheba-access-token";
const REFRESH_KEY = "janasheba-refresh-token";

type StoredTokens = { accessToken: string; refreshToken: string };

let memoryTokens: StoredTokens | null = null;
let refreshing: Promise<StoredTokens | null> | null = null;

function readTokens(): StoredTokens | null {
  if (typeof window === "undefined") return memoryTokens;
  const accessToken = window.localStorage.getItem(ACCESS_KEY);
  const refreshToken = window.localStorage.getItem(REFRESH_KEY);
  if (!accessToken || !refreshToken) return memoryTokens;
  return { accessToken, refreshToken };
}

function writeTokens(tokens: AuthTokens | null) {
  memoryTokens = tokens
    ? { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken }
    : null;
  if (typeof window === "undefined") return;
  if (!tokens) {
    window.localStorage.removeItem(ACCESS_KEY);
    window.localStorage.removeItem(REFRESH_KEY);
    return;
  }
  window.localStorage.setItem(ACCESS_KEY, tokens.accessToken);
  window.localStorage.setItem(REFRESH_KEY, tokens.refreshToken);
}

export function getAccessToken() {
  return readTokens()?.accessToken ?? null;
}

export function isSignedIn() {
  return readTokens() !== null;
}

function parseError(status: number, body: unknown, requestId?: string): ApiError {
  const error = (body as ApiErrorBody | null)?.error;
  return new ApiError({
    status,
    code: error?.code ?? "UNKNOWN_ERROR",
    message: error?.message ?? `Request failed with status ${status}`,
    details: error?.details,
    requestId,
  });
}

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  /** Internal: prevents infinite refresh recursion. */
  retry?: boolean;
  signal?: AbortSignal;
};

/** Every 2xx response from the API is `{ data: ... }`; typed endpoints see the inner value. */
function unwrap<T>(body: unknown, path: string): T {
  if (body && typeof body === "object" && "data" in body) {
    return (body as { data: T }).data;
  }
  throw new ApiError({
    status: 502,
    code: "MALFORMED_RESPONSE",
    message: `Malformed API response for ${path}: missing "data" envelope`,
  });
}

async function raw(path: string, options: RequestOptions, accessToken?: string | null) {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (options.body !== undefined) headers["Content-Type"] = "application/json";
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

  const response = await fetch(`${API_URL}${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    signal: options.signal,
    credentials: "omit",
  });

  const requestId = response.headers.get("x-request-id") ?? undefined;
  const isJson = response.headers.get("content-type")?.includes("application/json");
  const body = isJson ? await response.json().catch(() => null) : null;

  if (!response.ok) {
    throw { __status: response.status, error: parseError(response.status, body, requestId) };
  }
  return { body, requestId };
}

/** Single-flight refresh so parallel 401s do not stampede the auth endpoint. */
async function refreshTokens(): Promise<StoredTokens | null> {
  const current = readTokens();
  if (!current) return null;
  if (refreshing) return refreshing;

  refreshing = (async () => {
    try {
      const { body } = await raw("/auth/refresh", {
        method: "POST",
        body: { refreshToken: current.refreshToken },
      });
      const tokens = unwrap<{ tokens: AuthTokens }>(body, "/auth/refresh").tokens;
      writeTokens(tokens);
      return { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken };
    } catch {
      writeTokens(null);
      return null;
    } finally {
      refreshing = null;
    }
  })();

  return refreshing;
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const tokens = readTokens();
  try {
    const result = await raw(path, options, tokens?.accessToken);
    return unwrap(result.body, path);
  } catch (caught) {
    const failure = caught as { __status?: number; error: ApiError };
    if (failure.__status === 401 && options.retry !== false && tokens?.refreshToken) {
      const next = await refreshTokens();
      if (next) {
        const retried = await raw(path, options, next.accessToken);
        return unwrap(retried.body, path);
      }
    }
    throw failure.error ?? caught;
  }
}

/* -------------------------------------------------------------------------- */
/* Typed endpoints used by the app                                            */
/* -------------------------------------------------------------------------- */

export type AuthResult = { user: PublicUser; tokens: AuthTokens };

export const api = {
  register: (payload: {
    name: string;
    mobile: string;
    password: string;
    age: number;
    district: string;
    gender: string;
    isBangladeshi: boolean;
  }) => request<AuthResult>("/auth/register", { method: "POST", body: payload, retry: false }),

  login: (payload: { mobile: string; password: string }) =>
    request<AuthResult>("/auth/login", { method: "POST", body: payload, retry: false }),

  me: () => request<{ user: PublicUser }>("/auth/me"),

  refresh: () => refreshTokens(),

  signOutLocal: () => writeTokens(null),

  getProfile: <T>() => request<{ profile: T; availableServiceIds?: string[] }>("/profile"),

  putProfile: <T>(payload: unknown) =>
    request<{ profile: T; availableServiceIds: string[] }>("/profile", {
      method: "PUT",
      body: payload,
    }),

  getMatchedServices: () => request<{ availableServiceIds: string[] }>("/profile/matched-services"),

  listServices: <T>(params: { lang?: "bn" | "en"; search?: string; limit?: number }) => {
    const query = new URLSearchParams();
    if (params.lang) query.set("lang", params.lang);
    if (params.search) query.set("search", params.search);
    if (params.limit) query.set("limit", String(params.limit));
    return request<{ services: T[] }>(`/government/services?${query}`);
  },

  getService: <T>(id: string, lang: "bn" | "en" = "bn") =>
    request<{ service: T }>(`/government/services/${id}?lang=${lang}`),

  searchServices: <T>(query: string, limit?: number, lang: "bn" | "en" = "bn") => {
    const params = new URLSearchParams({ query, lang });
    if (limit) params.set("limit", String(limit));
    return request<{ results: T[] }>(`/government/search?${params}`);
  },

  resolveContext: <T>(query: string, lang: "bn" | "en" = "bn") =>
    request<{ context: T }>(`/government/context?query=${encodeURIComponent(query)}&lang=${lang}`),

  listCategories: <T>(lang: "bn" | "en" = "bn") =>
    request<{ categories: T[] }>(`/government/categories?lang=${lang}`),

  listSuggestions: <T>(lang: "bn" | "en" = "bn") =>
    request<{ suggestions: T[] }>(`/government/suggestions?lang=${lang}`),

  listTraining: <T>(params: { search?: string; limit?: number } = {}) => {
    const query = new URLSearchParams();
    if (params.search) query.set("search", params.search);
    if (params.limit) query.set("limit", String(params.limit));
    return request<{ programs: T[] }>(`/catalog/training?${query}`);
  },

  getTraining: <T>(id: string) => request<{ program: T }>(`/catalog/training/${id}`),

  listJobs: <T>(params: { search?: string; limit?: number } = {}) => {
    const query = new URLSearchParams();
    if (params.search) query.set("search", params.search);
    if (params.limit) query.set("limit", String(params.limit));
    return request<{ jobs: T[] }>(`/catalog/jobs?${query}`);
  },

  getJob: <T>(id: string) => request<{ job: T }>(`/catalog/jobs/${id}`),
};

/** Convenience: pull the access token out of an auth response and persist it. */
export function persistSession(result: AuthResult) {
  writeTokens(result.tokens);
  return result.user;
}
