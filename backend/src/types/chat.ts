export type ChatRole = "user" | "assistant";

export type ChatMessage = {
  id: string;
  conversationId: string;
  role: ChatRole;
  content: string;
  attachmentName?: string | null;
  attachmentUrl?: string | null;
  createdAt: string;
};

export type ChatConversation = {
  id: string;
  title: string | null;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
};

export type AssistantSource = {
  serviceId: string;
  serviceTitle: string;
  optionId?: string;
  programId?: string;
  officialSource: string;
};

export type AssistantRequest = {
  message: string;
  conversationId?: string | null;
  attachmentName?: string | null;
  language?: "bn" | "en";
  /** Currently selected service/job/training context from the client. */
  context?: {
    serviceId?: string | null;
    optionId?: string | null;
    programId?: string | null;
    jobId?: string | null;
    trainingId?: string | null;
  } | null;
};

export type AssistantReply = {
  conversationId: string | null;
  messageId: string | null;
  reply: string;
  serviceIds: string[];
  detailId: string | null;
  isGreeting: boolean;
  asksServices: boolean;
  sources: AssistantSource[];
  pendingQuestion: string | null;
};
