import { Schema, model, type HydratedDocument, type InferSchemaType } from "mongoose";

const chatConversationSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, trim: true, maxlength: 200, default: null },
    lastMessageAt: { type: Date, default: Date.now, index: true },
    createdAt: { type: Date },
    updatedAt: { type: Date },
  },
  { timestamps: true, collection: "chatconversations", versionKey: false },
);

chatConversationSchema.index({ user: 1, lastMessageAt: -1 });

export type ChatConversationAttributes = InferSchemaType<typeof chatConversationSchema>;
export type ChatConversationDocument = HydratedDocument<ChatConversationAttributes>;

export const ChatConversation = model<ChatConversationAttributes>(
  "ChatConversation",
  chatConversationSchema,
);
