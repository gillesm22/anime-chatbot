import type { ChatAction } from "./reducer";
import type { ChatMessage } from "./types";
import type { Expression } from "@/lib/characters/types";

export function sendMessage(content: string): ChatAction {
  return { type: "SEND_MESSAGE", payload: { content } };
}

export function receiveResponse(content: string, expression: Expression): ChatAction {
  return { type: "RECEIVE_RESPONSE", payload: { content, expression } };
}

export function lineTyped(): ChatAction {
  return { type: "LINE_TYPED" };
}

export function advanceLine(): ChatAction {
  return { type: "ADVANCE_LINE" };
}

export function toggleAutoAdvance(): ChatAction {
  return { type: "TOGGLE_AUTO_ADVANCE" };
}

export function loadHistory(messages: ChatMessage[]): ChatAction {
  return { type: "LOAD_HISTORY", payload: { messages } };
}

export function setExpression(expression: Expression): ChatAction {
  return { type: "SET_EXPRESSION", payload: { expression } };
}
