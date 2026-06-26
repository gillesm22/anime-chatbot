import { describe, it, expect, beforeEach, vi } from "vitest";
import { buildGreetingContext } from "@/lib/greetingContext";

// ---------------------------------------------------------------------------
// localStorage mock
// ---------------------------------------------------------------------------

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(globalThis, "localStorage", {
  value: localStorageMock,
  writable: true,
});

// ---------------------------------------------------------------------------
// Stub out affinity so getCrossCharacterContext doesn't blow up in jsdom
// (getAffinity reads localStorage; without real data it returns level 0 / 0 pts
//  which means rival points < 20 → prompt is empty, which is fine for these tests)
// ---------------------------------------------------------------------------

describe("buildGreetingContext", () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.restoreAllMocks();
  });

  it("returns a non-empty string", () => {
    const result = buildGreetingContext("arisu", 0, 1);
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });

  it("includes a time of day reference", () => {
    const result = buildGreetingContext("arisu", 0, 1);
    expect(result).toMatch(/\[Time Context\]/);
    expect(result).toMatch(
      /It is (morning|afternoon|evening|late night)\./
    );
  });

  it("includes absence info when daysAbsent >= 2", () => {
    const result = buildGreetingContext("nao", 3, 1);
    expect(result).toMatch(/\[Absence\]/);
    expect(result).toMatch(/3 days/);
  });

  it("does not include absence info when daysAbsent < 2", () => {
    const result = buildGreetingContext("marin", 1, 1);
    expect(result).not.toMatch(/\[Absence\]/);
  });

  it("includes streak info when streak > 1", () => {
    const result = buildGreetingContext("arisu", 0, 5);
    expect(result).toMatch(/\[Visit Streak\]/);
    expect(result).toMatch(/5 days in a row/);
  });

  it("does not include streak info when streak is 1", () => {
    const result = buildGreetingContext("arisu", 0, 1);
    expect(result).not.toMatch(/\[Visit Streak\]/);
  });

  it("includes memory section when memories exist", () => {
    const memories = [
      {
        id: "1",
        category: "fact",
        content: "They love ramen",
        context: "mentioned directly",
        strength: 3,
        timestamp: Date.now(),
        lastReferenced: Date.now(),
      },
    ];
    localStorageMock.setItem(
      "anime-chatbot-memories-arisu",
      JSON.stringify(memories)
    );

    const result = buildGreetingContext("arisu", 0, 1);
    expect(result).toMatch(/\[Things You Remember\]/);
    expect(result).toMatch(/They love ramen/);
  });

  it("includes last conversation summary when one exists", () => {
    const summaries = [
      {
        date: "2026-06-25",
        summary: "We talked about space and stars.",
        mood: "cheerful",
        topicsDiscussed: ["space"],
        emotionalHighlight: "They seemed excited.",
        messageCount: 12,
      },
    ];
    localStorageMock.setItem(
      "anime-chatbot-summaries-arisu",
      JSON.stringify(summaries)
    );

    const result = buildGreetingContext("arisu", 0, 1);
    expect(result).toMatch(/\[Last Conversation\]/);
    expect(result).toMatch(/space and stars/);
  });

  it("sections are joined with double newlines", () => {
    const result = buildGreetingContext("arisu", 0, 1);
    // The output must have at least one section separator
    expect(result).toMatch(/\n\n/);
  });
});
