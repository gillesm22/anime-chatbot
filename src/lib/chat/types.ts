import type { Expression } from "@/lib/characters/types";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  expression?: Expression;
  timestamp: number;
}

export type ChatPhase = "idle" | "user_typing" | "waiting" | "speaking";

export interface ChatState {
  messages: ChatMessage[];
  phase: ChatPhase;
  currentExpression: Expression;
  currentLines: string[];
  currentLineIndex: number;
  isTyping: boolean;
  autoAdvance: boolean;
  historyLoaded: boolean;
}

export const INITIAL_CHAT_STATE: ChatState = {
  messages: [],
  phase: "idle",
  currentExpression: "neutral",
  currentLines: [],
  currentLineIndex: 0,
  isTyping: false,
  autoAdvance: false,
  historyLoaded: false,
};
