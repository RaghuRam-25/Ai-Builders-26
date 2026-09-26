import bcrypt from "bcryptjs";
import type { Types } from "mongoose";

import type { PublicUser, UserRole } from "../types/citizen-profile.js";
import { env } from "../config/env.js";
import { CitizenProfile, User, type UserDocument } from "../models/index.js";
import { ApiError } from "../utils/api-error.js";
import { signAccessToken, signRefreshToken } from "../utils/jwt.js";
import type { AuthTokens } from "../types/api.js";

function toPublicUser(user: UserDocument): PublicUser {
  return {
    id: user.id as string,
    name: user.name ?? "",
    mobile: user.mobile ?? null,
    email: user.email ?? null,
    role: (user.role ?? "user") as UserRole,
    lastSignedInAt: (user.lastSignedInAt ?? new Date()).toISOString(),
    createdAt: (user.createdAt ?? new Date()).toISOString(),
  };
}

function issueTokens(user: UserDocument): AuthTokens {
  return {
    accessToken: signAccessToken({
      sub: user.id as string,
      role: (user.role ?? "user") as UserRole,
      mobile: user.mobile ?? null,
    }),
    refreshToken: signRefreshToken(user.id as string),
    expiresIn: 900,
  };
}

export type RegisterPayload = {
  name: string;
  mobile: string;
  password: string;
  age: number;
  district: string;
  gender: string;
  isBangladeshi: boolean;
};

export type LoginPayload = {
  mobile: string;
  password: string;
};

export async function registerUser(payload: RegisterPayload) {
  const mobile = payload.mobile.trim();
  const existing = await User.findOne({ mobile }).lean();
  if (existing) {
    throw ApiError.conflict("An account with this mobile number already exists");
  }

  const passwordHash = await bcrypt.hash(payload.password, env.BCRYPT_ROUNDS);
  const role: UserRole =
    env.OWNER_MOBILE && env.OWNER_MOBILE === mobile ? "admin" : "user";

  const created = await User.create({
    mobile,
    name: payload.name.trim(),
    passwordHash,
    role,
    loginMethod: "mobile",
  });

  // The registration form already collected these, so persist them immediately.
  await CitizenProfile.create({
    user: created._id,
    name: payload.name.trim(),
    age: payload.age,
    district: payload.district.trim(),
    gender: payload.gender,
    isBangladeshi: payload.isBangladeshi,
    occupation: null,
    education: null,
    income: null,
    jobSeeking: false,
    nidVerified: false,
    wantsTravel: false,
  });

  return { user: toPublicUser(created), tokens: issueTokens(created) };
}

export async function loginUser(payload: LoginPayload) {
  const user = await User.findOne({ mobile: payload.mobile.trim() }).select(
    "+passwordHash",
  );
  if (!user) {
    // Constant-ish work factor to avoid user enumeration by timing.
    await bcrypt.compare(payload.password, "$2a$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidin");
    throw ApiError.unauthorized("Mobile number or password is incorrect");
  }

  const valid = await bcrypt.compare(payload.password, user.passwordHash);
  if (!valid) {
    throw ApiError.unauthorized("Mobile number or password is incorrect");
  }

  user.lastSignedInAt = new Date();
  await user.save();

  return { user: toPublicUser(user), tokens: issueTokens(user) };
}

export async function refreshSession(refreshToken: string) {
  const { verifyRefreshToken } = await import("../utils/jwt.js");
  const payload = verifyRefreshToken(refreshToken);
  const user = await User.findById(payload.sub);
  if (!user) throw ApiError.unauthorized("Account no longer exists");
  return { user: toPublicUser(user), tokens: issueTokens(user) };
}

export async function getPublicUser(userId: Types.ObjectId | string) {
  const user = await User.findById(userId);
  if (!user) throw ApiError.notFound("User not found");
  return toPublicUser(user);
}

export { toPublicUser };
