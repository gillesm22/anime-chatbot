import { describe, it, expect } from "vitest";
import { chatReducer } from "@/lib/chat/reducer";
import { INITIAL_CHAT_STATE } from "@/lib/chat/types";
import type { ChatState } from "@/lib/chat/types";

describe("chatReducer", () => {
  it("SEND_MESSAGE adds user message and transitions to waiting", () => {
    const state = chatReducer(INITIAL_CHAT_STATE, {
      type: "SEND_MESSAGE",
      payload: { content: "Hello!" },
    });
    expect(state.messages).toHaveLength(1);
    expect(state.messages[0].role).toBe("user");
    expect(state.messages[0].content).toBe("Hello!");
    expect(state.phase).toBe("waiting");
  });

  it("RECEIVE_RESPONSE adds assistant message, splits into lines, transitions to speaking", () => {
    const waiting: ChatState = {
      ...INITIAL_CHAT_STATE,
      phase: "waiting",
      messages: [{ id: "1", role: "user", content: "Hi", timestamp: Date.now() }],
    };
    const state = chatReducer(waiting, {
      type: "RECEIVE_RESPONSE",
      payload: { content: "First sentence. Second sentence. Third sentence. Fourth sentence.", expression: "happy" },
    });
    expect(state.messages).toHaveLength(2);
    expect(state.messages[1].role).toBe("assistant");
    expect(state.phase).toBe("speaking");
    expect(state.currentExpression).toBe("happy");
    expect(state.currentLines.length).toBeGreaterThanOrEqual(1);
    expect(state.currentLineIndex).toBe(0);
    expect(state.isTyping).toBe(true);
  });

  it("LINE_TYPED marks current line as done typing", () => {
    const speaking: ChatState = {
      ...INITIAL_CHAT_STATE,
      phase: "speaking",
      currentLines: ["Line one.", "Line two."],
      currentLineIndex: 0,
      isTyping: true,
    };
    const state = chatReducer(speaking, { type: "LINE_TYPED" });
    expect(state.isTyping).toBe(false);
  });

  it("ADVANCE_LINE moves to next line and starts typing", () => {
    const speaking: ChatState = {
      ...INITIAL_CHAT_STATE,
      phase: "speaking",
      currentLines: ["Line one.", "Line two."],
      currentLineIndex: 0,
      isTyping: false,
    };
    const state = chatReducer(speaking, { type: "ADVANCE_LINE" });
    expect(state.currentLineIndex).toBe(1);
    expect(state.isTyping).toBe(true);
  });

  it("ADVANCE_LINE on last line transitions to idle", () => {
    const speaking: ChatState = {
      ...INITIAL_CHAT_STATE,
      phase: "speaking",
      currentLines: ["Only line."],
      currentLineIndex: 0,
      isTyping: false,
    };
    const state = chatReducer(speaking, { type: "ADVANCE_LINE" });
    expect(state.phase).toBe("idle");
    expect(state.currentLines).toEqual([]);
  });

  it("TOGGLE_AUTO_ADVANCE flips the flag", () => {
    const state = chatReducer(INITIAL_CHAT_STATE, { type: "TOGGLE_AUTO_ADVANCE" });
    expect(state.autoAdvance).toBe(true);
    const state2 = chatReducer(state, { type: "TOGGLE_AUTO_ADVANCE" });
    expect(state2.autoAdvance).toBe(false);
  });

  it("LOAD_HISTORY restores messages", () => {
    const messages = [
      { id: "1", role: "user" as const, content: "Hi", timestamp: 1 },
      { id: "2", role: "assistant" as const, content: "Hello!", expression: "happy" as const, timestamp: 2 },
    ];
    const state = chatReducer(INITIAL_CHAT_STATE, {
      type: "LOAD_HISTORY",
      payload: { messages },
    });
    expect(state.messages).toEqual(messages);
    expect(state.phase).toBe("idle");
  });
});
