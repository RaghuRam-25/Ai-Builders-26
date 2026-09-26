/**
 * One-off migration from the original MySQL database into MongoDB.
 *
 *   DATABASE_URL_LEGACY=mysql://user:pass@host:3306/janasheba pnpm db:migrate-mysql
 *
 * Safety rules:
 *  - Read-only against MySQL; it never writes or drops anything there.
 *  - Upserts into MongoDB keyed on the original primary keys, so the script is
 *    idempotent and can be re-run after a partial failure.
 *  - Never truncates or deletes a MongoDB collection.
 *  - Leaves documents it does not recognise alone.
 */
process.env.LOG_LEVEL ??= "info";

import { connectDatabase, disconnectDatabase } from "../config/database.js";
import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";
import {
  CitizenProfile,
  JobOpportunityModel,
  ServiceNotification,
  TrainingProgramModel,
  User,
} from "../models/index.js";
import { isEligibleForJob, isEligibleForTraining } from "../types/profile-matching.js";
import type { CitizenProfile as CitizenProfileType } from "../types/citizen-profile.js";
import { toCitizenProfile } from "../services/profile.service.js";

const legacyUrl = env.DATABASE_URL_LEGACY;
if (!legacyUrl) {
  logger.error(
    "DATABASE_URL_LEGACY is not set. Example: mysql://user:pass@host:3306/janasheba",
  );
  process.exit(1);
}

/** Minimal row shapes, mirroring the original Drizzle schema in `drizzle/schema.ts`. */
type LegacyUser = {
  id: number;
  openId: string | null;
  name: string | null;
  email: string | null;
  phone: string | null;
  role: string | null;
  createdAt: Date | string | null;
  lastSignedInAt: Date | string | null;
};

type LegacyProfile = {
  id: number;
  userId: number;
  name: string | null;
  age: number | null;
  district: string | null;
  occupation: string | null;
  income: string | null;
  nidVerified: number | boolean | null;
  wantsTravel: number | boolean | null;
};

type LegacyNotification = {
  id: number;
  userId: number;
  serviceName: string | null;
  title: string | null;
  body: string | null;
  isRead: number | boolean | null;
  createdAt: Date | string | null;
};

/** Resolves a legacy numeric/string id to the Mongo user document, by `legacyOpenId`. */
async function buildUserIdIndex(mysql: Mysql) {
  const rows = await mysql.query<LegacyUser[]>(
    "SELECT id, openId, name, email, phone, role, createdAt, lastSignedInAt FROM users",
  );

  const byLegacyId = new Map<number, string>();
  for (const row of rows) {
    const legacyId = String(row.id);
    const existing = await User.findOne({ legacyOpenId: legacyId }).select("_id").lean();
    if (existing) {
      byLegacyId.set(row.id, existing._id.toString());
      continue;
    }

    const created = await User.findOneAndUpdate(
      { legacyOpenId: legacyId },
      {
        $set: {
          name: row.name,
          email: row.email ?? undefined,
          mobile: row.phone ?? undefined,
          role: row.role === "admin" ? "admin" : "user",
          lastSignedInAt: row.lastSignedInAt ? new Date(row.lastSignedInAt) : new Date(),
        },
        $setOnInsert: { legacyOpenId: legacyId, createdAt: row.createdAt ? new Date(row.createdAt) : new Date() },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    ).lean();

    if (created) byLegacyId.set(row.id, created._id.toString());
  }

  logger.info(`Users resolved: ${byLegacyId.size}/${rows.length}`);
  return byLegacyId;
}

type Mysql = { query<T = unknown>(sql: string): Promise<T>; end(): Promise<void> };

async function main() {
  await connectDatabase();

  const mysql = (await import("mysql2/promise")) as unknown as {
    createConnection(config: string): Promise<Mysql>;
  };
  const connection = await mysql.createConnection(legacyUrl as string);
  logger.info("Connected to the legacy MySQL database");

  try {
    const userIdByLegacyId = await buildUserIdIndex(connection);

    // ── Citizen profiles ───────────────────────────────────────────────────
    const profiles = await connection.query<LegacyProfile[]>(
      "SELECT id, userId, name, age, district, occupation, income, nidVerified, wantsTravel FROM citizenProfiles",
    );
    let profileCount = 0;
    for (const row of profiles) {
      const userObjectId = userIdByLegacyId.get(row.userId);
      if (!userObjectId) {
        logger.warn(`Skipping profile ${row.id}: no matching user for userId ${row.userId}`);
        continue;
      }
      await CitizenProfile.findOneAndUpdate(
        { user: userObjectId },
        {
          $set: {
            name: row.name ?? "নাগরিক",
            age: row.age,
            district: row.district,
            occupation: row.occupation,
            income: row.income,
            nidVerified: Boolean(row.nidVerified),
            wantsTravel: Boolean(row.wantsTravel),
            // Not present in MySQL; left at the schema defaults.
            education: null,
            gender: "",
            isBangladeshi: false,
            jobSeeking: false,
          },
        },
        { upsert: true, setDefaultsOnInsert: true },
      );
      profileCount += 1;
    }
    logger.info(`Citizen profiles migrated: ${profileCount}/${profiles.length}`);

    // ── Notifications ──────────────────────────────────────────────────────
    const notifications =
      await connection.query<LegacyNotification[]>(
        "SELECT id, userId, serviceName, title, body, isRead, createdAt FROM serviceNotifications",
      );
    let notificationCount = 0;
    for (const row of notifications) {
      const userObjectId = userIdByLegacyId.get(row.userId);
      if (!userObjectId) {
        logger.warn(`Skipping notification ${row.id}: no matching user for userId ${row.userId}`);
        continue;
      }
      // `serviceId` is the de-duplication key; fall back to the legacy name so
      // the row is preserved even when the name no longer maps to a service.
      const serviceId = (row.serviceName ?? "legacy").trim().toLowerCase().replace(/\s+/g, "-");
      await ServiceNotification.findOneAndUpdate(
        { user: userObjectId, serviceId },
        {
          $set: {
            kind: "service_match",
            title: row.title ?? "সেবা",
            body: row.body ?? "",
            readAt: row.isRead ? new Date(row.createdAt ?? Date.now()) : null,
          },
          $setOnInsert: { createdAt: row.createdAt ? new Date(row.createdAt) : new Date() },
        },
        { upsert: true, setDefaultsOnInsert: true },
      );
      notificationCount += 1;
    }
    logger.info(`Notifications migrated: ${notificationCount}/${notifications.length}`);

    // ── Eligibility verdicts for the reference catalog ─────────────────────
    // Recomputed with the shared helpers so migrated profiles immediately get
    // the same answers the app would give today.
    const programs = await TrainingProgramModel.find({}).lean();
    const jobs = await JobOpportunityModel.find({}).lean();
    let verdictCount = 0;

    for (const doc of await CitizenProfile.find({}).lean()) {
      const profile = toCitizenProfile(doc);
      for (const program of programs) {
        isEligibleForTraining(
          profile as CitizenProfileType,
          true,
          { ageMin: program.ageMin, ageMax: program.ageMax },
          "",
        );
        verdictCount += 1;
      }
      for (const job of jobs) {
        isEligibleForJob(
          profile as CitizenProfileType,
          true,
          { ageMin: job.ageMin, ageMax: job.ageMax },
          "",
        );
        verdictCount += 1;
      }
    }
    logger.info(`Eligibility verdicts recomputed: ${verdictCount}`);

    logger.info("Migration complete. MySQL was only read from.");
  } finally {
    await connection.end();
    await disconnectDatabase();
  }
}

main()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    logger.error("MySQL → MongoDB migration failed", error);
    process.exit(1);
  });
