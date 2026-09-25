import { z } from "zod";
import { COOKIE_NAME } from "../shared/const.js";
import { findGovernmentServiceContext, findGovernmentServices, getGovernmentServiceById, governmentServices } from "../shared/government-services";
import { services } from "../shared/service-catalog";
import { getMatchedServiceIds } from "../shared/profile-matching";
import { getSessionCookieOptions } from "./_core/cookies";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { systemRouter } from "./_core/systemRouter";
import { appendChatMessage, createConversation, ensureServiceNotifications, getCitizenProfile, getConversationMessages, listConversations, listServiceNotifications, markServiceNotificationRead, upsertCitizenProfile } from "./db";

export const appRouter = router({
  system: systemRouter,
  government: router({
    search: publicProcedure.input(z.object({
      query: z.string().trim().max(200).default(""),
      limit: z.number().int().positive().max(10).default(5),
    })).query(({ input }) => {
      const query = input.query || "";
      return findGovernmentServices(query, input.limit);
    }),
    byId: publicProcedure.input(z.object({
      id: z.string().trim().min(1).max(64),
    })).query(({ input }) => getGovernmentServiceById(input.id)),
    context: publicProcedure.input(z.object({
      query: z.string().trim().max(200),
    })).query(({ input }) => findGovernmentServiceContext(input.query)),
    list: publicProcedure.query(() => governmentServices),
  }),
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  profile: router({
    me: protectedProcedure.query(({ ctx }) => getCitizenProfile(ctx.user.id)),
    upsert: protectedProcedure.input(z.object({
      name: z.string().trim().min(1).max(160),
      age: z.number().int().min(0).max(130).nullable().optional(),
      district: z.string().trim().max(120).nullable().optional(),
      occupation: z.string().trim().max(160).nullable().optional(),
      income: z.string().trim().max(80).nullable().optional(),
      nidVerified: z.boolean().default(false),
      wantsTravel: z.boolean().default(false),
    })).mutation(async ({ ctx, input }) => {
      const profile = await upsertCitizenProfile(ctx.user.id, {
        name: input.name,
        age: input.age ?? null,
        district: input.district ?? null,
        occupation: input.occupation ?? null,
        income: input.income ?? null,
        nidVerified: input.nidVerified ? 1 : 0,
        wantsTravel: input.wantsTravel ? 1 : 0,
      });
      const matchedIds = getMatchedServiceIds({ name: input.name, age: String(input.age ?? ""), district: input.district ?? "", occupation: input.occupation ?? "", income: input.income ?? "", nidVerified: input.nidVerified, wantsTravel: input.wantsTravel });
      await ensureServiceNotifications(ctx.user.id, services.filter((service) => matchedIds.includes(service.id)).map((service) => ({ serviceId: service.id, title: `${service.title} available`, body: `এই সেবাটি আপনার জন্য available আছে। আপনি চাইলে আবেদন করতে পারেন।` })));
      return { profile, availableServiceIds: matchedIds };
    }),
  }),
  chat: router({
    conversations: protectedProcedure.query(({ ctx }) => listConversations(ctx.user.id)),
    createConversation: protectedProcedure.input(z.object({ title: z.string().trim().max(200).optional() }).optional()).mutation(({ ctx, input }) => createConversation(ctx.user.id, input?.title)),
    messages: protectedProcedure.input(z.object({ conversationId: z.number().int().positive() })).query(({ ctx, input }) => getConversationMessages(ctx.user.id, input.conversationId)),
    addMessage: protectedProcedure.input(z.object({ conversationId: z.number().int().positive(), role: z.enum(["user", "assistant"]), content: z.string().trim().min(1).max(20000), attachmentName: z.string().trim().max(255).optional() })).mutation(({ ctx, input }) => appendChatMessage(ctx.user.id, input.conversationId, input.role, input.content, input.attachmentName)),
  }),
  notifications: router({
    list: protectedProcedure.query(({ ctx }) => listServiceNotifications(ctx.user.id)),
    markRead: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ ctx, input }) => markServiceNotificationRead(ctx.user.id, input.id)),
  }),
});

export type AppRouter = typeof appRouter;
