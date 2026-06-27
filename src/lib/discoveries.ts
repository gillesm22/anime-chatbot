"use client";

// Types
export interface Interactable {
  id: string;
  sceneId: string;
  type: "visible" | "hidden";
  revealAt: number;
  position: { x: number; y: number; width: number; height: number };
  emoji: string;
  label: string;
  affinityPerTap: number;
  cooldown: number;
  reward: { type: "affinity" | "outfit" | "diary" | "scene"; value: string | number };
  aiOnFirstDiscovery: boolean;
  reactions: Partial<Record<string, ReactionPool>>;
}

export interface ReactionPool {
  lines: string[];
  expression: string;
}

export interface DiscoveryRecord {
  discovered: boolean;
  tapCount: number;
  lastTapTime: number;
}

export interface VisibleInteractable extends Interactable {
  displayMode: "full" | "shimmer" | "dim";
}

export interface TapResult {
  isFirstDiscovery: boolean;
  affinityEarned: boolean;
}

// State management
function storageKey(characterId: string): string {
  return `anime-chatbot-discoveries-${characterId}`;
}

export function getDiscoveryState(characterId: string): Record<string, DiscoveryRecord> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(storageKey(characterId));
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, DiscoveryRecord>;
  } catch {
    return {};
  }
}

function saveDiscoveryState(characterId: string, state: Record<string, DiscoveryRecord>): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(storageKey(characterId), JSON.stringify(state));
}

export function isDiscovered(characterId: string, interactableId: string): boolean {
  const state = getDiscoveryState(characterId);
  return state[interactableId]?.discovered ?? false;
}

export function recordTap(
  characterId: string,
  interactableId: string,
  cooldownSeconds: number
): TapResult {
  const state = getDiscoveryState(characterId);
  const now = Date.now();
  const record = state[interactableId];

  if (!record) {
    state[interactableId] = { discovered: true, tapCount: 1, lastTapTime: now };
    saveDiscoveryState(characterId, state);
    return { isFirstDiscovery: true, affinityEarned: true };
  }

  const elapsed = (now - record.lastTapTime) / 1000;
  const affinityEarned = elapsed >= cooldownSeconds;

  record.tapCount += 1;
  if (affinityEarned) {
    record.lastTapTime = now;
  }
  saveDiscoveryState(characterId, state);

  return { isFirstDiscovery: false, affinityEarned };
}

// Visibility logic
export function getVisibleInteractables(
  interactables: Interactable[],
  affinityLevel: number,
  characterId: string
): VisibleInteractable[] {
  const result: VisibleInteractable[] = [];

  for (const item of interactables) {
    if (item.type === "visible") {
      result.push({ ...item, displayMode: "full" });
      continue;
    }

    const discovered = isDiscovered(characterId, item.id);

    if (discovered) {
      result.push({ ...item, displayMode: "full" });
    } else if (affinityLevel >= item.revealAt + 1) {
      result.push({ ...item, displayMode: "dim" });
    } else if (affinityLevel >= item.revealAt) {
      result.push({ ...item, displayMode: "shimmer" });
    }
  }

  return result;
}
