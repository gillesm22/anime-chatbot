import { describe, it, expect, beforeEach } from "vitest";
import { getAffinity, addAffinityPoints, getNextLevelProgress, LEVELS, getTitleForLevel, formatAffinityForPrompt } from "@/lib/affinity";

describe("affinity - 10 level system", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("has 10 levels", () => {
    expect(LEVELS).toHaveLength(10);
  });

  it("level thresholds increase", () => {
    for (let i = 1; i < LEVELS.length; i++) {
      expect(LEVELS[i].threshold).toBeGreaterThan(LEVELS[i - 1].threshold);
    }
  });

  it("starts at level 1 with 0 points", () => {
    const data = getAffinity("test-char");
    expect(data.level).toBe(1);
    expect(data.points).toBe(0);
  });

  it("levels up at correct thresholds", () => {
    // Add 30 points to reach level 2
    let result = addAffinityPoints("test-char", { type: "daily_visit" }); // 10
    result = addAffinityPoints("test-char", { type: "daily_visit" }); // 20
    result = addAffinityPoints("test-char", { type: "daily_visit" }); // 30
    expect(result.data.level).toBe(2);
    expect(result.leveledUp).toBe(true);
  });

  it("max level is 10 at 2000 points", () => {
    // Manually set high points
    localStorage.setItem("anime-chatbot-affinity-test-char", JSON.stringify({
      points: 2000, level: 1, levelName: "", totalMessages: 0,
      lastVisit: "2026-07-05", streak: 0, longestStreak: 0,
      nickname: null, unlockedOutfits: [], milestones: [],
    }));
    const result = addAffinityPoints("test-char", { type: "message_sent" });
    expect(result.data.level).toBe(10);
  });

  it("progress shows 100% at max level", () => {
    localStorage.setItem("anime-chatbot-affinity-test-char", JSON.stringify({
      points: 2500, level: 10, levelName: "", totalMessages: 0,
      lastVisit: "2026-07-05", streak: 0, longestStreak: 0,
      nickname: null, unlockedOutfits: [], milestones: [],
    }));
    const data = getAffinity("test-char");
    const progress = getNextLevelProgress(data);
    expect(progress.percent).toBe(100);
  });

  it("returns title for character at level", () => {
    expect(getTitleForLevel("arisu", 1)).toBe("");
    expect(getTitleForLevel("arisu", 5)).toBe("My quiet comfort");
    expect(getTitleForLevel("arisu", 10)).toBe("My everything");
    expect(getTitleForLevel("kurisu", 7)).toBe("Essential constant");
  });

  it("returns empty title for unknown character", () => {
    expect(getTitleForLevel("unknown", 5)).toBe("");
  });

  it("formatAffinityForPrompt includes conversation depth", () => {
    localStorage.setItem("anime-chatbot-affinity-test-char", JSON.stringify({
      points: 300, level: 5, levelName: "", totalMessages: 50,
      lastVisit: "2026-07-05", streak: 3, longestStreak: 5,
      nickname: null, unlockedOutfits: [], milestones: [],
    }));
    const prompt = formatAffinityForPrompt("test-char");
    expect(prompt).toContain("Level 5/10");
    expect(prompt).toContain("comfortable");
  });
});
