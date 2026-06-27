import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  getDiscoveryState,
  recordTap,
  isDiscovered,
  getVisibleInteractables,
  type Interactable,
  type DiscoveryRecord,
} from "@/lib/discoveries";

const store: Record<string, string> = {};
beforeEach(() => {
  Object.keys(store).forEach((k) => delete store[k]);
  vi.stubGlobal("localStorage", {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => { store[k] = v; },
    removeItem: (k: string) => { delete store[k]; },
  });
});

describe("getDiscoveryState", () => {
  it("returns empty object when no state saved", () => {
    expect(getDiscoveryState("arisu")).toEqual({});
  });

  it("returns saved state", () => {
    const state: Record<string, DiscoveryRecord> = {
      "sakura-tree": { discovered: true, tapCount: 3, lastTapTime: 1000 },
    };
    store["anime-chatbot-discoveries-arisu"] = JSON.stringify(state);
    expect(getDiscoveryState("arisu")).toEqual(state);
  });
});

describe("recordTap", () => {
  it("creates new record on first tap", () => {
    const result = recordTap("arisu", "sakura-tree", 30);
    expect(result.isFirstDiscovery).toBe(true);
    expect(result.affinityEarned).toBe(true);
    const state = getDiscoveryState("arisu");
    expect(state["sakura-tree"].discovered).toBe(true);
    expect(state["sakura-tree"].tapCount).toBe(1);
  });

  it("respects cooldown — no affinity earned within cooldown", () => {
    recordTap("arisu", "sakura-tree", 30);
    const result = recordTap("arisu", "sakura-tree", 30);
    expect(result.isFirstDiscovery).toBe(false);
    expect(result.affinityEarned).toBe(false);
  });

  it("earns affinity after cooldown expires", () => {
    recordTap("arisu", "sakura-tree", 0);
    const result = recordTap("arisu", "sakura-tree", 0);
    expect(result.affinityEarned).toBe(true);
    expect(result.isFirstDiscovery).toBe(false);
  });
});

describe("isDiscovered", () => {
  it("returns false for undiscovered element", () => {
    expect(isDiscovered("arisu", "sakura-tree")).toBe(false);
  });

  it("returns true after tap", () => {
    recordTap("arisu", "sakura-tree", 30);
    expect(isDiscovered("arisu", "sakura-tree")).toBe(true);
  });
});

describe("getVisibleInteractables", () => {
  it("returns all elements — visible as full, hidden as shimmer at level 1", () => {
    const items: Interactable[] = [
      { id: "a", sceneId: "sakura", type: "visible", revealAt: 0, position: { x: 6, y: 6, width: 10, height: 10 }, emoji: "🌸", label: "Tree", affinityPerTap: 2, cooldown: 30, reward: { type: "affinity", value: 5 }, aiOnFirstDiscovery: false, reactions: {} },
      { id: "b", sceneId: "sakura", type: "hidden", revealAt: 2, position: { x: 50, y: 50, width: 8, height: 8 }, emoji: "🦋", label: "Butterfly", affinityPerTap: 2, cooldown: 30, reward: { type: "diary", value: "butterfly" }, aiOnFirstDiscovery: true, reactions: {} },
    ];
    const result = getVisibleInteractables(items, 1, "arisu");
    expect(result).toHaveLength(2);
    expect(result[0].displayMode).toBe("full");
    expect(result[1].displayMode).toBe("shimmer");
  });

  it("shows dim for hidden elements at matching reveal level", () => {
    const items: Interactable[] = [
      { id: "b", sceneId: "sakura", type: "hidden", revealAt: 2, position: { x: 50, y: 50, width: 8, height: 8 }, emoji: "🦋", label: "Butterfly", affinityPerTap: 2, cooldown: 30, reward: { type: "diary", value: "butterfly" }, aiOnFirstDiscovery: true, reactions: {} },
    ];
    const result = getVisibleInteractables(items, 2, "arisu");
    expect(result).toHaveLength(1);
    expect(result[0].displayMode).toBe("dim");
  });

  it("shows full emoji for discovered hidden elements", () => {
    recordTap("arisu", "b", 30);
    const items: Interactable[] = [
      { id: "b", sceneId: "sakura", type: "hidden", revealAt: 2, position: { x: 50, y: 50, width: 8, height: 8 }, emoji: "🦋", label: "Butterfly", affinityPerTap: 2, cooldown: 30, reward: { type: "diary", value: "butterfly" }, aiOnFirstDiscovery: true, reactions: {} },
    ];
    const result = getVisibleInteractables(items, 2, "arisu");
    expect(result[0].displayMode).toBe("full");
  });

  it("shows dim for hidden elements at higher levels when not discovered", () => {
    const items: Interactable[] = [
      { id: "b", sceneId: "sakura", type: "hidden", revealAt: 2, position: { x: 50, y: 50, width: 8, height: 8 }, emoji: "🦋", label: "Butterfly", affinityPerTap: 2, cooldown: 30, reward: { type: "diary", value: "butterfly" }, aiOnFirstDiscovery: true, reactions: {} },
    ];
    const result = getVisibleInteractables(items, 3, "arisu");
    expect(result[0].displayMode).toBe("dim");
  });
});
