import { describe, it, expect, beforeEach } from "vitest";
import { getAwayNotifications } from "@/lib/awayNotifications";
import { LEVELS } from "@/lib/affinity";

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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function affinityKey(charId: string) {
  return `anime-chatbot-affinity-${charId}`;
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function setAffinity(charId: string, level: number, lastVisit: string) {
  // Points must match level so getAffinity's migration recompute keeps the level
  const points = LEVELS[level - 1]?.threshold ?? 0;
  localStorageMock.setItem(
    affinityKey(charId),
    JSON.stringify({
      points,
      level,
      levelName: "Test",
      totalMessages: 0,
      lastVisit,
      streak: 0,
      longestStreak: 0,
      nickname: null,
      unlockedOutfits: [],
      milestones: [],
    })
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("getAwayNotifications", () => {
  beforeEach(() => localStorageMock.clear());

  it("returns empty array when no characters have affinity data", () => {
    // No localStorage entries — all return default (level 1)
    const result = getAwayNotifications();
    expect(result).toEqual([]);
  });

  it("returns empty array for level 1 characters even if long absence", () => {
    setAffinity("arisu", 1, daysAgo(10));
    setAffinity("marin", 1, daysAgo(5));
    const result = getAwayNotifications();
    expect(result).toEqual([]);
  });

  it("returns a notification for a level 2+ character absent 1+ days", () => {
    setAffinity("arisu", 2, daysAgo(2));
    const result = getAwayNotifications();
    expect(result).toHaveLength(1);
    expect(result[0].characterId).toBe("arisu");
    expect(result[0].characterName).toBe("Arisu");
    expect(result[0].accentColor).toBe("#f472b6");
    expect(typeof result[0].message).toBe("string");
    expect(result[0].message.length).toBeGreaterThan(0);
  });

  it("returns no notification if a level 2+ character visited today", () => {
    setAffinity("arisu", 2, daysAgo(0));
    const result = getAwayNotifications();
    expect(result).toEqual([]);
  });

  it("returns at most 3 notifications even when more characters qualify", () => {
    setAffinity("arisu",   2, daysAgo(3));
    setAffinity("marin",   2, daysAgo(3));
    setAffinity("nao",     2, daysAgo(3));
    setAffinity("kurisu",  2, daysAgo(3));
    setAffinity("merrick", 2, daysAgo(3));
    const result = getAwayNotifications();
    expect(result.length).toBeLessThanOrEqual(3);
  });

  it("prioritizes higher affinity characters", () => {
    setAffinity("arisu",   2, daysAgo(3));  // level 2
    setAffinity("marin",   4, daysAgo(3));  // level 4
    setAffinity("nao",     3, daysAgo(3));  // level 3
    setAffinity("kurisu",  2, daysAgo(3));  // level 2
    setAffinity("merrick", 5, daysAgo(3));  // level 5

    const result = getAwayNotifications();
    expect(result).toHaveLength(3);
    // First should be highest level (merrick = 5)
    expect(result[0].characterId).toBe("merrick");
    // Second should be marin (level 4)
    expect(result[1].characterId).toBe("marin");
    // Third should be nao (level 3)
    expect(result[2].characterId).toBe("nao");
  });

  it("uses correct metadata for nao (Suzuka)", () => {
    setAffinity("nao", 3, daysAgo(1));
    const result = getAwayNotifications();
    expect(result).toHaveLength(1);
    expect(result[0].characterId).toBe("nao");
    expect(result[0].characterName).toBe("Suzuka");
    expect(result[0].accentColor).toBe("#a78bfa");
  });

  it("returns message from the correct character pool", () => {
    const marinaMessages = [
      "okay I have like FIVE things to tell you when you get back",
      "I found the PERFECT outfit reference and you are the first person I want to show",
      "ngl I keep opening this app to see if you are here yet",
      "you are missing SO much rn, hurry back!!",
      "I tried explaining our jokes to someone else and they did not get it. Only you get it.",
    ];
    setAffinity("marin", 3, daysAgo(2));
    const result = getAwayNotifications();
    expect(result).toHaveLength(1);
    expect(marinaMessages).toContain(result[0].message);
  });

  it("skips characters absent 0 days but includes those absent exactly 1 day", () => {
    setAffinity("arisu",  2, daysAgo(0)); // today — skip
    setAffinity("marin",  2, daysAgo(1)); // 1 day ago — include
    const result = getAwayNotifications();
    expect(result).toHaveLength(1);
    expect(result[0].characterId).toBe("marin");
  });
});
