import type { ChatState, ChatMessage } from "./types";
import type { Expression } from "@/lib/characters/types";

type ChatAction =
  | { type: "SEND_MESSAGE"; payload: { content: string } }
  | { type: "RECEIVE_RESPONSE"; payload: { content: string; expression: Expression } }
  | { type: "LINE_TYPED" }
  | { type: "ADVANCE_LINE" }
  | { type: "TOGGLE_AUTO_ADVANCE" }
  | { type: "LOAD_HISTORY"; payload: { messages: ChatMessage[] } }
  | { type: "SET_EXPRESSION"; payload: { expression: Expression } };

export type { ChatAction };

function splitIntoLines(text: string): string[] {
  // First split on actual newlines the AI might have used
  const paragraphs = text.split(/\n+/).filter((p) => p.trim());
  if (paragraphs.length > 1) {
    return paragraphs.map((p) => p.trim());
  }

  // Split on sentence boundaries: . ! ? followed by a space and uppercase or end
  const sentences: string[] = [];
  const regex = /[^.!?]*[.!?]+(?:\s+|$)/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    sentences.push(match[0]);
  }
  // Catch any trailing text without punctuation
  const matched = sentences.join("");
  if (matched.length < text.length) {
    const remainder = text.slice(matched.length).trim();
    if (remainder) sentences.push(remainder);
  }

  if (sentences.length === 0) return [text];

  // Group into lines of ~2 sentences each
  const lines: string[] = [];
  let current = "";
  let count = 0;

  for (const sentence of sentences) {
    current += sentence;
    count++;
    if (count >= 2) {
      lines.push(current.trim());
      current = "";
      count = 0;
    }
  }
  if (current.trim()) {
    lines.push(current.trim());
  }
  return lines.length > 0 ? lines : [text];
}

function makeId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case "SEND_MESSAGE": {
      const message: ChatMessage = {
        id: makeId(),
        role: "user",
        content: action.payload.content,
        timestamp: Date.now(),
      };
      return {
        ...state,
        messages: [...state.messages, message],
        phase: "waiting",
        currentExpression: "thinking",
      };
    }

    case "RECEIVE_RESPONSE": {
      const lines = splitIntoLines(action.payload.content);
      const message: ChatMessage = {
        id: makeId(),
        role: "assistant",
        content: action.payload.content,
        expression: action.payload.expression,
        timestamp: Date.now(),
      };
      return {
        ...state,
        messages: [...state.messages, message],
        phase: "speaking",
        currentExpression: action.payload.expression,
        currentLines: lines,
        currentLineIndex: 0,
        isTyping: true,
      };
    }

    case "LINE_TYPED":
      return { ...state, isTyping: false };

    case "ADVANCE_LINE": {
      const nextIndex = state.currentLineIndex + 1;
      if (nextIndex >= state.currentLines.length) {
        return {
          ...state,
          phase: "idle",
          currentLines: [],
          currentLineIndex: 0,
          isTyping: false,
        };
      }
      return {
        ...state,
        currentLineIndex: nextIndex,
        isTyping: true,
      };
    }

    case "TOGGLE_AUTO_ADVANCE":
      return { ...state, autoAdvance: !state.autoAdvance };

    case "LOAD_HISTORY":
      return {
        ...state,
        messages: action.payload.messages,
        phase: "idle",
        historyLoaded: true,
      };

    case "SET_EXPRESSION":
      return { ...state, currentExpression: action.payload.expression };

    default:
      return state;
  }
}
