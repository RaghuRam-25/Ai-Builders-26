import { index, int, mysqlEnum, mysqlTable, text, timestamp, varchar, uniqueIndex } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const citizenProfiles = mysqlTable("citizen_profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 160 }).notNull(),
  age: int("age"),
  district: varchar("district", { length: 120 }),
  occupation: varchar("occupation", { length: 160 }),
  income: varchar("income", { length: 80 }),
  nidVerified: int("nidVerified").default(0).notNull(),
  wantsTravel: int("wantsTravel").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({ userIdUnique: uniqueIndex("citizen_profiles_user_id_unique").on(table.userId) }));
export type CitizenProfile = typeof citizenProfiles.$inferSelect;
export type InsertCitizenProfile = typeof citizenProfiles.$inferInsert;

export const chatConversations = mysqlTable("chat_conversations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 200 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({ userIndex: index("chat_conversations_user_id_idx").on(table.userId) }));
export type ChatConversation = typeof chatConversations.$inferSelect;

export const chatMessages = mysqlTable("chat_messages", {
  id: int("id").autoincrement().primaryKey(),
  conversationId: int("conversationId").notNull().references(() => chatConversations.id, { onDelete: "cascade" }),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  role: mysqlEnum("role", ["user", "assistant"]).notNull(),
  content: text("content").notNull(),
  attachmentName: varchar("attachmentName", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({ conversationIndex: index("chat_messages_conversation_id_idx").on(table.conversationId), userIndex: index("chat_messages_user_id_idx").on(table.userId) }));
export type ChatMessage = typeof chatMessages.$inferSelect;

export const serviceNotifications = mysqlTable("service_notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  serviceId: varchar("serviceId", { length: 80 }).notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  body: text("body").notNull(),
  readAt: timestamp("readAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({ userIndex: index("service_notifications_user_id_idx").on(table.userId), unreadIndex: index("service_notifications_user_read_idx").on(table.userId, table.readAt) }));
export type ServiceNotification = typeof serviceNotifications.$inferSelect;
