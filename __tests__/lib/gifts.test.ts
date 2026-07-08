import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock localStorage
const store: Record<string, string> = {};
beforeEach(() => {
  Object.keys(store).forEach((k) => delete store[k]);
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, val: string) => { store[key] = val; },
    removeItem: (key: string) => { delete store[key]; },
  });
});

import {
  getCharacterReaction,
  getGiftById,
  GIFT_PREFERENCES,
  type Gift,
} from "@/lib/gifts";

describe("gift preferences", () => {
  it("returns a unique favorite reaction for kurisu + coffee", () => {
    const gift = getGiftById("coffee")!;
    const reaction = getCharacterReaction("kurisu", gift);
    // Should NOT be the generic common reaction
    expect(reaction.dialogue).not.toBe("You didn't have to — it's not like I was expecting... anyway. Thank you.");
    expect(reaction.dialogue.length).toBeGreaterThan(0);
  });

  it("returns a unique dislike reaction for kurisu + candy", () => {
    const gift = getGiftById("candy")!;
    const reaction = getCharacterReaction("kurisu", gift);
    expect(reaction.dialogue).not.toBe("You didn't have to — it's not like I was expecting... anyway. Thank you.");
  });

  it("falls through to rarity-based reaction for non-preference gifts", () => {
    const gift = getGiftById("flower")!;
    const reaction = getCharacterReaction("kurisu", gift);
    // flower is not in kurisu's preferences, so she gets the rarity-based reaction
    expect(reaction.expression).toBe("flustered");
  });

  it("applies affinity multiplier for favorite gifts", () => {
    const prefs = GIFT_PREFERENCES["kurisu"];
    const coffeeEntry = prefs?.find((p) => p.giftId === "coffee");
    expect(coffeeEntry).toBeDefined();
    expect(coffeeEntry!.multiplier).toBeGreaterThan(1);
  });

  it("applies affinity multiplier for disliked gifts", () => {
    const prefs = GIFT_PREFERENCES["kurisu"];
    const candyEntry = prefs?.find((p) => p.giftId === "candy");
    expect(candyEntry).toBeDefined();
    expect(candyEntry!.multiplier).toBeLessThan(1);
  });

  it("new character-themed gifts exist in catalog", () => {
    expect(getGiftById("beaker")).toBeDefined();
    expect(getGiftById("voodoo_doll")).toBeDefined();
    expect(getGiftById("dead_rose")).toBeDefined();
    expect(getGiftById("lab_notebook")).toBeDefined();
    expect(getGiftById("hex_candle")).toBeDefined();
    expect(getGiftById("poison_vial")).toBeDefined();
  });
});
