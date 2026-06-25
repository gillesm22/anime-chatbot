"use client";

import { createContext, useContext, useReducer, useEffect, type ReactNode, type Dispatch } from "react";
import { chatReducer } from "./reducer";
import type { ChatAction } from "./reducer";
import type { ChatState } from "./types";
import { INITIAL_CHAT_STATE } from "./types";
import { loadHistory } from "./actions";

interface ChatContextValue {
  state: ChatState;
  dispatch: Dispatch<ChatAction>;
}

const ChatContext = createContext<ChatContextValue | null>(null);

function getStorageKey(characterId: string): string {
  return `anime-chatbot-history-${characterId}`;
}

function getNameStorageKey(characterId: string): string {
  return `anime-chatbot-username-${characterId}`;
}

export function getSavedUserName(characterId: string): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(getNameStorageKey(characterId));
}

export function saveUserName(characterId: string, name: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(getNameStorageKey(characterId), name);
}

export function ChatProvider({
  characterId,
  children,
}: {
  characterId: string;
  children: ReactNode;
}) {
  const [state, dispatch] = useReducer(chatReducer, INITIAL_CHAT_STATE);

  useEffect(() => {
    const stored = localStorage.getItem(getStorageKey(characterId));
    if (stored) {
      try {
        const messages = JSON.parse(stored);
        dispatch(loadHistory(messages));
      } catch {
        // Corrupted data, start fresh
        dispatch(loadHistory([]));
      }
    } else {
      dispatch(loadHistory([]));
    }
  }, [characterId]);

  useEffect(() => {
    if (state.messages.length > 0) {
      try {
        // Cap at 200 messages to prevent localStorage overflow
        const toSave = state.messages.length > 200 ? state.messages.slice(-200) : state.messages;
        localStorage.setItem(getStorageKey(characterId), JSON.stringify(toSave));
      } catch {
        // QuotaExceededError - silently fail rather than crash
      }
    }
  }, [state.messages, characterId]);

  return (
    <ChatContext.Provider value={{ state, dispatch }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat(): ChatContextValue {
  const ctx = useContext(ChatContext);
  if (!ctx) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return ctx;
}
