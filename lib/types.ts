export type AIProvider = "gpt" | "claude" | "gemini" | "groq";

export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface AgentReply {
  reply: string;
  agent: string;
  provider: AIProvider;
}
