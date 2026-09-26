import { Types } from "mongoose";

import type { AssistantSource, ChatConversation, ChatMessage, ChatRole } from "../types/chat.js";

import { ChatConversation as ChatConversationModel, ChatMessage as ChatMessageModel } from "../models/index.js";
import { ApiError } from "../utils/api-error.js";

type ConversationDoc = {
  _id: Types.ObjectId;
  title: string | null;
  createdAt: Date;
  updatedAt: Date;
  messageCount?: number;
};

type MessageDoc = {
  _id: Types.ObjectId;
  conversation: Types.ObjectId;
  role: ChatRole;
  content: string;
  attachmentName: string | null;
  attachmentUrl: string | null;
  createdAt: Date;
};

function toConversation(doc: ConversationDoc): ChatConversation {
  return {
    id: doc._id.toString(),
    title: doc.title ?? null,
    messageCount: doc.messageCount ?? 0,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

function toMessage(doc: MessageDoc): ChatMessage {
  return {
    id: doc._id.toString(),
    conversationId: doc.conversation.toString(),
    role: doc.role,
    content: doc.content,
    attachmentName: doc.attachmentName,
    attachmentUrl: doc.attachmentUrl,
    createdAt: doc.createdAt.toISOString(),
  };
}

export async function createConversation(
  userId: Types.ObjectId | string,
  title?: string,
): Promise<ChatConversation> {
  const doc = await ChatConversationModel.create({
    user: userId,
    title: title ?? null,
    lastMessageAt: new Date(),
  });
  return toConversation(doc.toObject() as unknown as ConversationDoc);
}

export async function listConversations(
  userId: Types.ObjectId | string,
): Promise<ChatConversation[]> {
  const docs = await ChatConversationModel.aggregate<ConversationDoc>([
    { $match: { user: new Types.ObjectId(String(userId)) } },
    {
      $lookup: {
        from: "chatmessages",
        localField: "_id",
        foreignField: "conversation",
        as: "messages",
      },
    },
    {
      $addFields: {
        messageCount: { $size: "$messages" },
      },
    },
    { $project: { messages: 0 } },
    { $sort: { lastMessageAt: -1, updatedAt: -1 } },
  ]);

  return docs.map((doc) => toConversation(doc as unknown as ConversationDoc));
}

async function assertOwnership(
  userId: Types.ObjectId | string,
  conversationId: string,
) {
  const exists = await ChatConversationModel.exists({
    _id: conversationId,
    user: userId,
  });
  if (!exists) throw ApiError.notFound("Conversation not found");
}

export async function getConversationMessages(
  userId: Types.ObjectId | string,
  conversationId: string,
): Promise<ChatMessage[]> {
  await assertOwnership(userId, conversationId);
  const docs = await ChatMessageModel.find({ conversation: conversationId, user: userId })
    .sort({ createdAt: 1 })
    .lean();
  return docs.map((doc) => toMessage(doc as unknown as MessageDoc));
}

export async function appendChatMessage(
  userId: Types.ObjectId | string,
  conversationId: string,
  input: {
    role: ChatRole;
    content: string;
    attachmentName?: string | null;
    sources?: AssistantSource[];
  },
): Promise<ChatMessage> {
  await assertOwnership(userId, conversationId);

  const doc = await ChatMessageModel.create({
    conversation: conversationId,
    user: userId,
    role: input.role,
    content: input.content,
    attachmentName: input.attachmentName ?? null,
    ...(input.sources ? { sources: input.sources } : {}),
  });

  await ChatConversationModel.updateOne(
    { _id: conversationId },
    { $set: { lastMessageAt: new Date() } },
  );

  return toMessage(doc.toObject() as unknown as MessageDoc);
}

export { toConversation, toMessage };
