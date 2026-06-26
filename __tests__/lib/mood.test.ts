import { describe, it, expect, beforeEach } from "vitest";
import { saveSessionEndMood, getSessionStartMood } from "@/lib/mood";

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

Object.defineProperty(globalThis, "localStorage", {
  value: localStorageMock,
  writable: true,
});

const SESSION_KEY = (charId: string) => `anime-chatbot-session-mood-${charId}`;

describe("saveSessionEndMood", () => {
  beforeEach(() => localStorageMock.clear());

  it("persists the mood to the correct localStorage key", () => {
    saveSessionEndMood("arisu", "cheerful");
    expect(localStorageMock.getItem(SESSION_KEY("arisu"))).toBe("cheerful");
  });

  it("overwrites a previous session mood", () => {
    saveSessionEndMood("arisu", "excited");
    saveSessionEndMood("arisu", "thoughtful");
    expect(localStorageMock.getItem(SESSION_KEY("arisu"))).toBe("thoughtful");
  });

  it("uses the correct key per character", () => {
    saveSessionEndMood("arisu", "cheerful");
    saveSessionEndMood("marin", "excited");
    expect(localStorageMock.getItem(SESSION_KEY("arisu"))).toBe("cheerful");
    expect(localStorageMock.getItem(SESSION_KEY("marin"))).toBe("excited");
  });
});

describe("getSessionStartMood", () => {
  beforeEach(() => localStorageMock.clear());

  it("returns neutral + emotional distance prompt on long absence (>=5 days)", () => {
    saveSessionEndMood("arisu", "cheerful");
    const result = getSessionStartMood("arisu", 5, 1);
    expect(result.mood).toBe("neutral");
    expect(result.prompt).toMatch(/while/i);
  });

  it("returns neutral + fresh start prompt when no prior session exists", () => {
    const result = getSessionStartMood("arisu", 1, 0);
    expect(result.mood).toBe("neutral");
    expect(result.prompt).toMatch(/fresh start/i);
  });

  it("returns thoughtful + check-in prompt when last session was thoughtful", () => {
    saveSessionEndMood("nao", "thoughtful");
    const result = getSessionStartMood("nao", 1, 1);
    expect(result.mood).toBe("thoughtful");
    expect(result.prompt).toMatch(/check in/i);
  });

  it("returns last mood + warm prompt on consecutive days with positive mood (cheerful)", () => {
    saveSessionEndMood("marin", "cheerful");
    const result = getSessionStartMood("marin", 1, 3);
    expect(result.mood).toBe("cheerful");
    expect(result.prompt).toMatch(/warm/i);
  });

  it("returns last mood + warm prompt on consecutive days with positive mood (excited)", () => {
    saveSessionEndMood("kurisu", "excited");
    const result = getSessionStartMood("kurisu", 1, 2);
    expect(result.mood).toBe("excited");
    expect(result.prompt).toMatch(/warm/i);
  });

  it("returns neutral + gap acknowledgement prompt for short absence (2-4 days)", () => {
    saveSessionEndMood("merrick", "cheerful");
    const result = getSessionStartMood("merrick", 3, 1);
    expect(result.mood).toBe("neutral");
    expect(result.prompt).toMatch(/few days/i);
  });

  it("returns stored mood + continuation prompt for same-day return with neutral last mood", () => {
    saveSessionEndMood("arisu", "neutral");
    const result = getSessionStartMood("arisu", 0, 1);
    expect(result.mood).toBe("neutral");
    expect(result.prompt).toMatch(/continue/i);
  });

  it("long absence takes priority over streak", () => {
    saveSessionEndMood("arisu", "cheerful");
    const result = getSessionStartMood("arisu", 7, 10);
    expect(result.mood).toBe("neutral");
    expect(result.prompt).toMatch(/while/i);
  });
});
