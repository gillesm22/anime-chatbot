import { describe, it, expect, beforeEach } from "vitest";
import { updateUserStyle, getPersonalityContext } from "@/lib/personality";

// ---------------------------------------------------------------------------
// localStorage mock
// ---------------------------------------------------------------------------

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

const STYLE_KEY = (charId: string) => `anime-chatbot-user-style-${charId}`;

// ---------------------------------------------------------------------------
// updateUserStyle
// ---------------------------------------------------------------------------

describe("updateUserStyle", () => {
  beforeEach(() => localStorageMock.clear());

  it("initializes a default style on first call", () => {
    updateUserStyle("arisu", { expressionTriggered: "happy", messageLength: 50 });

    const raw = localStorageMock.getItem(STYLE_KEY("arisu"));
    expect(raw).not.toBeNull();
    const style = JSON.parse(raw!);
    expect(style.totalInteractions).toBe(1);
    expect(style.humorHits).toBe(1);
    expect(style.flirtHits).toBe(0);
    expect(style.deepHits).toBe(0);
    expect(style.totalMessageLength).toBe(50);
    expect(style.avgMessageLength).toBe(50);
  });

  it("accumulates stats across multiple calls", () => {
    updateUserStyle("marin", { expressionTriggered: "laugh", messageLength: 40 });
    updateUserStyle("marin", { expressionTriggered: "flustered", messageLength: 60 });
    updateUserStyle("marin", { expressionTriggered: "thinking", messageLength: 20 });

    const raw = localStorageMock.getItem(STYLE_KEY("marin"));
    const style = JSON.parse(raw!);
    expect(style.totalInteractions).toBe(3);
    expect(style.humorHits).toBe(1);
    expect(style.flirtHits).toBe(1);
    expect(style.deepHits).toBe(1);
    expect(style.totalMessageLength).toBe(120);
    expect(style.avgMessageLength).toBeCloseTo(40);
  });

  it("correctly increments excited into humorHits", () => {
    updateUserStyle("suzuka", { expressionTriggered: "excited", messageLength: 10 });
    const style = JSON.parse(localStorageMock.getItem(STYLE_KEY("suzuka"))!);
    expect(style.humorHits).toBe(1);
  });

  it("correctly increments devoted and shy into flirtHits", () => {
    updateUserStyle("kurisu", { expressionTriggered: "devoted", messageLength: 10 });
    updateUserStyle("kurisu", { expressionTriggered: "shy", messageLength: 10 });
    const style = JSON.parse(localStorageMock.getItem(STYLE_KEY("kurisu"))!);
    expect(style.flirtHits).toBe(2);
  });

  it("correctly increments sad into deepHits", () => {
    updateUserStyle("merrick", { expressionTriggered: "sad", messageLength: 10 });
    const style = JSON.parse(localStorageMock.getItem(STYLE_KEY("merrick"))!);
    expect(style.deepHits).toBe(1);
  });

  it("does not increment any category for neutral expression", () => {
    updateUserStyle("arisu", { expressionTriggered: "neutral", messageLength: 30 });
    const style = JSON.parse(localStorageMock.getItem(STYLE_KEY("arisu"))!);
    expect(style.humorHits).toBe(0);
    expect(style.flirtHits).toBe(0);
    expect(style.deepHits).toBe(0);
  });

  it("uses separate keys per character", () => {
    updateUserStyle("arisu", { expressionTriggered: "happy", messageLength: 20 });
    updateUserStyle("marin", { expressionTriggered: "sad", messageLength: 80 });

    const arisuStyle = JSON.parse(localStorageMock.getItem(STYLE_KEY("arisu"))!);
    const marinStyle = JSON.parse(localStorageMock.getItem(STYLE_KEY("marin"))!);
    expect(arisuStyle.humorHits).toBe(1);
    expect(marinStyle.deepHits).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// getPersonalityContext
// ---------------------------------------------------------------------------

describe("getPersonalityContext", () => {
  beforeEach(() => localStorageMock.clear());

  it("returns empty string when fewer than 10 interactions", () => {
    for (let i = 0; i < 9; i++) {
      updateUserStyle("arisu", { expressionTriggered: "happy", messageLength: 50 });
    }
    expect(getPersonalityContext("arisu")).toBe("");
  });

  it("returns empty string with zero interactions", () => {
    expect(getPersonalityContext("suzuka")).toBe("");
  });

  it("returns a prompt string after 10 interactions", () => {
    for (let i = 0; i < 10; i++) {
      updateUserStyle("marin", { expressionTriggered: "neutral", messageLength: 50 });
    }
    const result = getPersonalityContext("marin");
    expect(result).toContain("[Personality Adaptation]");
  });

  it("includes humor mention after enough laugh interactions", () => {
    // 15 laughs out of 15 interactions → humorRatio = 1.0 (> 0.3)
    for (let i = 0; i < 15; i++) {
      updateUserStyle("kurisu", { expressionTriggered: "laugh", messageLength: 50 });
    }
    const result = getPersonalityContext("kurisu");
    expect(result).toContain("[Personality Adaptation]");
    expect(result.toLowerCase()).toMatch(/laugh|playful|wit/);
  });

  it("includes flirt mention when flirtRatio > 0.2", () => {
    // 5 flirt out of 10 interactions → flirtRatio = 0.5 (> 0.2)
    for (let i = 0; i < 5; i++) {
      updateUserStyle("merrick", { expressionTriggered: "flustered", messageLength: 50 });
    }
    for (let i = 0; i < 5; i++) {
      updateUserStyle("merrick", { expressionTriggered: "neutral", messageLength: 50 });
    }
    const result = getPersonalityContext("merrick");
    expect(result.toLowerCase()).toMatch(/flustered|vulnerable/);
  });

  it("includes deep mention when deepRatio > 0.25", () => {
    // 4 deep out of 10 interactions → deepRatio = 0.4 (> 0.25)
    for (let i = 0; i < 4; i++) {
      updateUserStyle("arisu", { expressionTriggered: "thinking", messageLength: 50 });
    }
    for (let i = 0; i < 6; i++) {
      updateUserStyle("arisu", { expressionTriggered: "neutral", messageLength: 50 });
    }
    const result = getPersonalityContext("arisu");
    expect(result.toLowerCase()).toMatch(/deep|meaningful|thoughtfully/);
  });

  it("mentions long message adaptation when avgMessageLength > 100", () => {
    for (let i = 0; i < 10; i++) {
      updateUserStyle("marin", { expressionTriggered: "neutral", messageLength: 150 });
    }
    const result = getPersonalityContext("marin");
    expect(result.toLowerCase()).toMatch(/long messages|detailed/);
  });

  it("mentions short message adaptation when avgMessageLength < 30", () => {
    for (let i = 0; i < 10; i++) {
      updateUserStyle("suzuka", { expressionTriggered: "neutral", messageLength: 15 });
    }
    const result = getPersonalityContext("suzuka");
    expect(result.toLowerCase()).toMatch(/short|concise|punchy/);
  });
});
