import { Schema, model, type HydratedDocument, type InferSchemaType } from "mongoose";

const chatMessageSchema = new Schema(
  {
    conversation: {
      type: Schema.Types.ObjectId,
      ref: "ChatConversation",
      required: true,
      index: true,
    },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    role: { type: String, enum: ["user", "assistant"], required: true },
    content: { type: String, required: true, maxlength: 20_000 },
    attachmentName: { type: String, trim: true, maxlength: 255, default: null },
    attachmentUrl: { type: String, default: null },
    /** Assistant replies carry the resolved government context for later auditing. */
    sources: {
      type: [
        new Schema(
          {
            serviceId: String,
            serviceTitle: String,
            optionId: String,
            programId: String,
            officialSource: String,
          },
          { _id: false },
        ),
      ],
      default: undefined,
    },
    createdAt: { type: Date },
    updatedAt: { type: Date },
  },
  { timestamps: true, collection: "chatmessages", versionKey: false },
);

chatMessageSchema.index({ conversation: 1, createdAt: 1 });

export type ChatMessageAttributes = InferSchemaType<typeof chatMessageSchema>;
export type ChatMessageDocument = HydratedDocument<ChatMessageAttributes>;

export const ChatMessage = model<ChatMessageAttributes>(
  "ChatMessage",
  chatMessageSchema,
);
