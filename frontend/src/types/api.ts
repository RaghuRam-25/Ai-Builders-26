export type ServiceNotificationKind =
  | "service_match"
  | "job_deadline"
  | "training_batch"
  | "system";

export type ServiceNotification = {
  id: string;
  serviceId: string;
  kind: ServiceNotificationKind;
  title: string;
  body: string;
  readAt: string | null;
  createdAt: string;
};

export type ApiErrorBody = {
  error: {
    code: string;
    message: string;
    details?: unknown;
    requestId?: string;
  };
};

export type ApiSuccessBody<T> = {
  data: T;
  meta?: Record<string, unknown>;
};

export type ApiListResponse<T> = ApiSuccessBody<T[]> & {
  meta: { total: number; limit: number; offset: number };
};

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
};

export type AuthResponse = ApiSuccessBody<{
  user: import("./citizen-profile").PublicUser;
  tokens: AuthTokens;
}>;

export type ProfileResponse = ApiSuccessBody<{
  profile: import("./citizen-profile").CitizenProfile | null;
  availableServiceIds: string[];
}>;
