import { and, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { chatConversations, chatMessages, citizenProfiles, InsertUser, serviceNotifications, users, type CitizenProfile } from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try { _db = drizzle(process.env.DATABASE_URL); } catch (error) { console.warn("[Database] Failed to connect:", error); _db = null; }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  for (const field of textFields) { if (user[field] !== undefined) { values[field] = user[field] ?? null; updateSet[field] = user[field] ?? null; } }
  if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
  if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
  else if (user.openId === ENV.ownerOpenId) { values.role = "admin"; updateSet.role = "admin"; }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (!Object.keys(updateSet).length) updateSet.lastSignedIn = new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb(); if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function getCitizenProfile(userId: number) {
  const db = await getDb(); if (!db) return undefined;
  const result = await db.select().from(citizenProfiles).where(eq(citizenProfiles.userId, userId)).limit(1);
  return result[0];
}

export async function upsertCitizenProfile(userId: number, input: Omit<typeof citizenProfiles.$inferInsert, "userId">) {
  const db = await getDb(); if (!db) throw new Error("Database is not configured");
  await db.insert(citizenProfiles).values({ ...input, userId }).onDuplicateKeyUpdate({ set: { ...input, updatedAt: new Date() } });
  return getCitizenProfile(userId);
}

export async function createConversation(userId: number, title?: string) {
  const db = await getDb(); if (!db) throw new Error("Database is not configured");
  const ids = await db.insert(chatConversations).values({ userId, title: title ?? null }).$returningId();
  return ids[0]?.id;
}

export async function listConversations(userId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(chatConversations).where(eq(chatConversations.userId, userId)).orderBy(desc(chatConversations.updatedAt));
}

export async function getConversationMessages(userId: number, conversationId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(chatMessages).where(and(eq(chatMessages.userId, userId), eq(chatMessages.conversationId, conversationId))).orderBy(chatMessages.createdAt);
}

export async function appendChatMessage(userId: number, conversationId: number, role: "user" | "assistant", content: string, attachmentName?: string) {
  const db = await getDb(); if (!db) throw new Error("Database is not configured");
  const conversation = await db.select({ id: chatConversations.id }).from(chatConversations).where(and(eq(chatConversations.id, conversationId), eq(chatConversations.userId, userId))).limit(1);
  if (!conversation[0]) throw new Error("Conversation not found");
  const ids = await db.insert(chatMessages).values({ userId, conversationId, role, content, attachmentName: attachmentName ?? null }).$returningId();
  return ids[0]?.id;
}

export async function listServiceNotifications(userId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(serviceNotifications).where(eq(serviceNotifications.userId, userId)).orderBy(desc(serviceNotifications.createdAt));
}

export async function markServiceNotificationRead(userId: number, id: number) {
  const db = await getDb(); if (!db) throw new Error("Database is not configured");
  await db.update(serviceNotifications).set({ readAt: new Date() }).where(and(eq(serviceNotifications.id, id), eq(serviceNotifications.userId, userId)));
  return { success: true } as const;
}

export async function ensureServiceNotifications(userId: number, matches: Array<{ serviceId: string; title: string; body: string }>) {
  const db = await getDb(); if (!db) throw new Error("Database is not configured");
  const existing = await db.select({ serviceId: serviceNotifications.serviceId }).from(serviceNotifications).where(eq(serviceNotifications.userId, userId));
  const existingIds = new Set(existing.map((item) => item.serviceId));
  for (const match of matches) {
    if (!existingIds.has(match.serviceId)) {
      await db.insert(serviceNotifications).values({ userId, serviceId: match.serviceId, title: match.title, body: match.body });
    }
  }
  return listServiceNotifications(userId);
}

export async function createServiceNotification(input: typeof serviceNotifications.$inferInsert) {
  const db = await getDb(); if (!db) throw new Error("Database is not configured");
  const ids = await db.insert(serviceNotifications).values(input).$returningId();
  return ids[0]?.id;
}

export type StoredCitizenProfile = CitizenProfile;
