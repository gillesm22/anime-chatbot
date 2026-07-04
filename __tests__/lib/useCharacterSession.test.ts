import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock all external dependencies
vi.mock("@/lib/characters", () => ({
  getCharacter: vi.fn((id: string) =>
    id === "arisu"
      ? { id: "arisu", name: "Arisu", theme: { accent: "#f472b6", tint: "#1a0a14" }, sprite: { basePath: "/sprites/arisu" } }
      : null
  ),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: vi.fn() }) }));
vi.mock("@/lib/backgrounds", () => ({
  getCharacterDefaultScene: () => "sakura",
  SCENES: {},
}));
vi.mock("@/lib/affinity", () => ({
  getAffinity: () => ({ points: 0, level: 1, levelName: "Stranger", streak: 0 }),
  addAffinityPoints: vi.fn(() => ({ newMilestones: [], leveledUp: false, data: { level: 1 } })),
  recordVisit: () => ({ daysAbsent: 0, newMilestones: [] }),
  formatAffinityForPrompt: () => "",
  getNextLevelProgress: () => ({ percent: 0 }),
}));
vi.mock("@/lib/mood", () => ({
  getMood: () => "neutral",
  updateMood: vi.fn(() => "cheerful"),
  moodToExpression: () => "happy",
  saveSessionEndMood: vi.fn(),
  getSessionStartMood: () => ({ mood: "neutral" }),
}));
vi.mock("@/lib/ambient", () => ({ startAmbientMusic: vi.fn(), stopAmbientMusic: vi.fn() }));
vi.mock("@/lib/sceneSounds", () => ({ startSceneAudio: vi.fn(), stopSceneAudio: vi.fn() }));
vi.mock("@/lib/humming", () => ({ startIdleTimer: vi.fn(), resetIdleTimer: vi.fn(), stopHumming: vi.fn() }));
vi.mock("@/lib/saveSystem", () => ({
  initSaveSystem: vi.fn(() => Promise.resolve({ restored: false })),
  saveSnapshot: vi.fn(() => Promise.resolve()),
  exportFullBackup: vi.fn(),
}));
vi.mock("@/lib/haptics", () => ({ haptic: { tick: vi.fn(), pulse: vi.fn(), success: vi.fn(), pet: vi.fn(), expression: vi.fn() } }));

import { renderHook, act } from "@testing-library/react";
import { useCharacterSession } from "@/hooks/useCharacterSession";

describe("useCharacterSession", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("returns character data for valid characterId", () => {
    const { result } = renderHook(() => useCharacterSession("arisu"));
    expect(result.current.character).toBeTruthy();
    expect(result.current.character?.name).toBe("Arisu");
  });

  it("defaults outfit to 'default'", () => {
    const { result } = renderHook(() => useCharacterSession("arisu"));
    expect(result.current.outfit).toBe("default");
  });

  it("defaults scene to character default", () => {
    const { result } = renderHook(() => useCharacterSession("arisu"));
    expect(result.current.currentScene).toBe("sakura");
  });

  it("persists outfit to localStorage", () => {
    const { result } = renderHook(() => useCharacterSession("arisu"));
    act(() => result.current.setOutfit("casual"));
    expect(result.current.outfit).toBe("casual");
    expect(localStorage.getItem("anime-chatbot-outfit-arisu")).toBe("casual");
  });

  it("removes outfit key when set back to default", () => {
    localStorage.setItem("anime-chatbot-outfit-arisu", "casual");
    const { result } = renderHook(() => useCharacterSession("arisu"));
    act(() => result.current.setOutfit("default"));
    expect(localStorage.getItem("anime-chatbot-outfit-arisu")).toBeNull();
  });
});
