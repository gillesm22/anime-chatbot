# HEXXII VN Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform HEXXII from a chat-app-with-anime-pictures into an immersive visual novel with assistant-ready spatial architecture.

**Architecture:** Decompose the 1178-line chat page into focused custom hooks. Restructure the viewport so scene+sprite fills the screen and dialogue overlays the bottom 25%. Replace the mobile-app BottomNav with a hidden VN-style radial menu. Add scene transitions and a scene-objects framework for future assistant features. All existing features preserved — just re-housed in a clean architecture.

**Tech Stack:** Next.js 16, React 19, Tailwind CSS v4, framer-motion v10, TypeScript 5

---

## File Structure

### New files
| File | Responsibility |
|------|---------------|
| `src/hooks/useCharacterSession.ts` | Character loading, affinity, mood, streaks, milestones, outfit persistence, save system init, session lifecycle |
| `src/hooks/useMessageHandler.ts` | Memory extraction, name recognition, message sending, SSE streaming, expression/mood tracking |
| `src/hooks/useVNControls.ts` | Auto-advance timer, swipe gestures, keyboard shortcuts |
| `src/hooks/useExpressionEffects.ts` | Visual effects (sparkle/shake/blush/dim/flash) triggered by expression changes |
| `src/hooks/usePanels.ts` | Panel visibility state machine (diary, gifts, outfits, quests, scenes, history, charInfo) — only one open at a time |
| `src/components/VNLayout.tsx` | Fullscreen VN viewport: scene background fills screen, sprite centered and dominant, dialogue overlays bottom |
| `src/components/VNMenu.tsx` | Hidden radial/fan menu replacing BottomNav — triggered by corner button or long-press |
| `src/components/VNTransition.tsx` | Scene transition effects (fade-to-black, dissolve, flash-white) |
| `src/components/SceneObjects.tsx` | Interactive world objects in scenes — foundation for assistant features |

### Modified files
| File | Changes |
|------|---------|
| `src/app/chat/[characterId]/page.tsx` | Gutted to ~150 lines: imports hooks, composes VNLayout + panels |
| `src/components/DialogueBox.tsx` | Restyled as semi-transparent overlay positioned over the scene, not below it. Input field integrated into dialogue area. |
| `src/styles/globals.css` | Add VN overlay styles, transition keyframes, radial menu styles |

### Retired files
| File | Reason |
|------|--------|
| `src/components/BottomNav.tsx` | Replaced by VNMenu |
| `src/components/ControlBar.tsx` | Absorbed into VNLayout minimal header |
| `src/components/ChatInput.tsx` | Input integrated into DialogueBox |
| `src/components/AffinityProgressBar.tsx` | Moved into VNMenu info panel (not always visible) |
| `src/components/PageTransition.tsx` | Replaced by VNLayout |

---

## Task 1: Extract `useCharacterSession` hook

**Files:**
- Create: `src/hooks/useCharacterSession.ts`
- Test: `__tests__/lib/useCharacterSession.test.ts`

This hook owns all per-character session state that currently lives in ChatContent: affinity, mood, milestones, outfit, save system, scene audio, humming, theme-color meta tag, and session lifecycle (beforeunload mood save).

- [ ] **Step 1: Write the hook file**

```typescript
// src/hooks/useCharacterSession.ts
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getCharacter } from "@/lib/characters";
import type { Expression } from "@/lib/characters/types";
import type { SceneId } from "@/lib/backgrounds";
import { getCharacterDefaultScene } from "@/lib/backgrounds";
import {
  getAffinity,
  addAffinityPoints,
  recordVisit,
  formatAffinityForPrompt,
  getNextLevelProgress,
} from "@/lib/affinity";
import type { AffinityEvent } from "@/lib/affinity";
import { getMood, updateMood, moodToExpression, saveSessionEndMood, getSessionStartMood } from "@/lib/mood";
import { startAmbientMusic, stopAmbientMusic } from "@/lib/ambient";
import { startSceneAudio, stopSceneAudio } from "@/lib/sceneSounds";
import { startIdleTimer, resetIdleTimer, stopHumming } from "@/lib/humming";
import { initSaveSystem, saveSnapshot, exportFullBackup } from "@/lib/saveSystem";
import { haptic } from "@/lib/haptics";

export type Outfit = string;

export interface CharacterSession {
  character: ReturnType<typeof getCharacter>;
  outfit: Outfit;
  setOutfit: (o: Outfit) => void;
  currentScene: SceneId;
  setCurrentScene: (s: SceneId) => void;
  currentMood: string;
  updateMoodFromExpressions: (expressions: string[]) => string;
  milestoneQueue: string[];
  setMilestoneQueue: React.Dispatch<React.SetStateAction<string[]>>;
  levelUpMilestone: { level: number; levelName: string } | null;
  setLevelUpMilestone: React.Dispatch<React.SetStateAction<{ level: number; levelName: string } | null>>;
  addAffinity: (event: AffinityEvent, bonus?: number) => {
    newMilestones: string[];
    leveledUp: boolean;
    data: ReturnType<typeof getAffinity>;
  };
  handleSave: () => Promise<void>;
  saveToast: { message: string; type: "save" | "restore" } | null;
  setSaveToast: React.Dispatch<React.SetStateAction<{ message: string; type: "save" | "restore" } | null>>;
  resetIdle: () => void;
  userName: string | null;
  setUserName: (name: string) => void;
  textSpeed: number;
  responseLength: "short" | "medium" | "long";
  aiProvider: string;
}

export function useCharacterSession(characterId: string): CharacterSession {
  const character = getCharacter(characterId);
  const router = useRouter();
  const currentMoodRef = useRef<string>("neutral");
  const saveInitialized = useRef(false);

  // Outfit persistence
  const [outfit, setOutfitState] = useState<Outfit>(() => {
    if (typeof window === "undefined") return "default";
    return localStorage.getItem(`anime-chatbot-outfit-${characterId}`) || "default";
  });

  const setOutfit = useCallback((o: Outfit) => {
    setOutfitState(o);
    if (o !== "default") {
      try { localStorage.setItem(`anime-chatbot-outfit-${characterId}`, o); } catch {}
    } else {
      localStorage.removeItem(`anime-chatbot-outfit-${characterId}`);
    }
  }, [characterId]);

  // Scene
  const [currentScene, setCurrentScene] = useState<SceneId>(() => getCharacterDefaultScene(characterId));

  // Milestones
  const [milestoneQueue, setMilestoneQueue] = useState<string[]>([]);
  const [levelUpMilestone, setLevelUpMilestone] = useState<{ level: number; levelName: string } | null>(null);

  // Save toast
  const [saveToast, setSaveToast] = useState<{ message: string; type: "save" | "restore" } | null>(null);

  // User settings
  const [userName, setUserNameState] = useState<string | null>(null);
  const [textSpeed, setTextSpeed] = useState(12);
  const [responseLength, setResponseLength] = useState<"short" | "medium" | "long">("medium");
  const [aiProvider, setAiProvider] = useState("gpt-4o");

  const setUserName = useCallback((name: string) => {
    setUserNameState(name);
    // Also persist via the chat context's saveUserName (called by useMessageHandler)
  }, []);

  // --- Lifecycle effects ---

  // Session mood persistence
  useEffect(() => {
    const saveState = () => saveSessionEndMood(characterId, currentMoodRef.current);
    const handleVisibility = () => { if (document.visibilityState === "hidden") saveState(); };
    window.addEventListener("beforeunload", saveState);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      saveState();
      window.removeEventListener("beforeunload", saveState);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [characterId]);

  // Load settings + start ambient music
  useEffect(() => {
    currentMoodRef.current = getMood(characterId);
    if (typeof window !== "undefined") {
      const savedName = localStorage.getItem(`anime-chatbot-username-${characterId}`);
      if (savedName) setUserNameState(savedName);
      const savedSpeed = localStorage.getItem("anime-chatbot-text-speed");
      if (savedSpeed) setTextSpeed(Number(savedSpeed));
      const savedLength = localStorage.getItem("anime-chatbot-response-length");
      if (savedLength) setResponseLength(savedLength as "short" | "medium" | "long");
      const savedProvider = localStorage.getItem("anime-chatbot-ai-provider");
      if (savedProvider) setAiProvider(savedProvider);
    }

    const startMusic = () => {
      startAmbientMusic();
      document.removeEventListener("click", startMusic);
      document.removeEventListener("keydown", startMusic);
    };
    document.addEventListener("click", startMusic);
    document.addEventListener("keydown", startMusic);
    return () => {
      stopAmbientMusic();
      document.removeEventListener("click", startMusic);
      document.removeEventListener("keydown", startMusic);
    };
  }, [characterId]);

  // Scene audio
  useEffect(() => {
    startSceneAudio(currentScene, characterId);
    return () => { stopSceneAudio(); };
  }, [characterId, currentScene]);

  // Humming
  useEffect(() => {
    const timer = setTimeout(() => startIdleTimer(characterId), 2000);
    return () => { clearTimeout(timer); stopHumming(); };
  }, [characterId]);

  // Save system
  useEffect(() => {
    if (saveInitialized.current) return;
    saveInitialized.current = true;
    initSaveSystem().then(({ restored }) => {
      if (restored) setSaveToast({ message: "Progress restored from backup", type: "restore" });
    }).catch(() => {});
  }, []);

  // Theme-color meta
  useEffect(() => {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", character?.theme.tint || "#0d0d12");
    return () => {
      const m = document.querySelector('meta[name="theme-color"]');
      if (m) m.setAttribute("content", "#0d0d12");
    };
  }, [character]);

  // Redirect if character not found
  useEffect(() => {
    if (!character) router.replace("/");
  }, [character, router]);

  // --- Actions ---

  const addAffinity = useCallback((event: AffinityEvent, bonus?: number) => {
    const result = addAffinityPoints(characterId, { type: event }, bonus);
    if (result.newMilestones.length > 0) {
      setMilestoneQueue(prev => [...prev, ...result.newMilestones]);
    }
    if (result.leveledUp && result.data.level >= 2 && result.data.level <= 4) {
      setLevelUpMilestone({ level: result.data.level, levelName: result.data.levelName });
      haptic.success();
    }
    return result;
  }, [characterId]);

  const updateMoodFromExpressions = useCallback((expressions: string[]) => {
    const newMood = updateMood(characterId, expressions);
    currentMoodRef.current = newMood;
    return newMood;
  }, [characterId]);

  const handleSave = useCallback(async () => {
    haptic.tick();
    await saveSnapshot();
    exportFullBackup();
    setSaveToast({ message: "Progress saved!", type: "save" });
  }, []);

  return {
    character,
    outfit,
    setOutfit,
    currentScene,
    setCurrentScene,
    currentMood: currentMoodRef.current,
    updateMoodFromExpressions,
    milestoneQueue,
    setMilestoneQueue,
    levelUpMilestone,
    setLevelUpMilestone,
    addAffinity,
    handleSave,
    saveToast,
    setSaveToast,
    resetIdle: resetIdleTimer,
    userName,
    setUserName,
    textSpeed,
    responseLength,
    aiProvider,
  };
}
```

- [ ] **Step 2: Write test**

```typescript
// __tests__/lib/useCharacterSession.test.ts
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
```

- [ ] **Step 3: Run test to verify it passes**

Run: `cd "C:/Users/G$/Kikaku 企画/anime-chatbot" && npx vitest run __tests__/lib/useCharacterSession.test.ts`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
cd "C:/Users/G$/Kikaku 企画/anime-chatbot"
git add src/hooks/useCharacterSession.ts __tests__/lib/useCharacterSession.test.ts
git commit -m "refactor: extract useCharacterSession hook from chat page"
```

---

## Task 2: Extract `useMessageHandler` hook

**Files:**
- Create: `src/hooks/useMessageHandler.ts`
- Test: `__tests__/lib/useMessageHandler.test.ts`

This hook owns: memory pattern extraction, name recognition from introductions, the `handleSend` function (message dispatch, SSE streaming, affinity events, mood updates, personality tracking), and `handleGift`.

- [ ] **Step 1: Write the hook file**

```typescript
// src/hooks/useMessageHandler.ts
"use client";

import { useCallback, useRef } from "react";
import { useChat, saveUserName } from "@/lib/chat/context";
import {
  sendMessage,
  receiveResponse,
  setExpression,
} from "@/lib/chat/actions";
import { streamChat } from "@/lib/api";
import { formatMemoriesForPrompt, saveMemory } from "@/lib/memory";
import { moodToExpression } from "@/lib/mood";
import type { Expression } from "@/lib/characters/types";
import {
  formatAffinityForPrompt,
  getAffinity,
} from "@/lib/affinity";
import type { AffinityEvent } from "@/lib/affinity";
import { getEngagementGreeting, getStreakMessage } from "@/lib/engagement";
import { getCrossCharacterContext } from "@/lib/crosschar";
import { detectMiniGame, getMiniGamePrompt } from "@/lib/minigames";
import { formatGiftContextForPrompt } from "@/lib/gifts";
import type { Gift, CharacterReaction } from "@/lib/gifts";
import { getHeroAppearanceForPrompt, getHeroClassReactionForPrompt } from "@/lib/heroAvatar";
import { buildGreetingContext } from "@/lib/greetingContext";
import { getPersonalityContext, updateUserStyle } from "@/lib/personality";
import { TypingTracker } from "@/lib/typingReactions";
import { addDiaryEntry } from "@/lib/diary";
import { canConfess } from "@/lib/confession";
import { playSendSwoosh, playExpressionChange, playMessageReceived } from "@/lib/sounds";
import { triggerScreenShake } from "@/lib/screenShake";
import { haptic } from "@/lib/haptics";
import { prefetchSpeech } from "@/lib/speech";
import type { SceneId } from "@/lib/backgrounds";

// --- Memory extraction patterns ---
const MEMORY_PATTERNS: Array<{ pattern: RegExp; topic: string; group: number }> = [
  { pattern: /i (?:really )?like (\w[\w\s]{0,30}?\w)/i, topic: "likes", group: 1 },
  { pattern: /i love (\w[\w\s]{0,30}?\w)/i, topic: "loves", group: 1 },
  { pattern: /i hate (\w[\w\s]{0,30}?\w)/i, topic: "dislikes", group: 1 },
  { pattern: /i(?:'m| am) (?:a |an )?(\w[\w\s]{0,30}?\w)/i, topic: "identity", group: 1 },
  { pattern: /i work (?:at|for|in) (\w[\w\s]{0,30}?\w)/i, topic: "work", group: 1 },
  { pattern: /my favorite (\w+) is (\w[\w\s]{0,30}?\w)/i, topic: "favorite", group: 0 },
  { pattern: /i have (?:a |an )?(\w[\w\s]{0,30}?\w)/i, topic: "has", group: 1 },
  { pattern: /i(?:'m| am) from (\w[\w\s]{0,30}?\w)/i, topic: "origin", group: 1 },
  { pattern: /i live in (\w[\w\s]{0,30}?\w)/i, topic: "location", group: 1 },
  { pattern: /i(?:'m| am) (\d+) years old/i, topic: "age", group: 1 },
  { pattern: /i study (\w[\w\s]{0,30}?\w)/i, topic: "studies", group: 1 },
  { pattern: /i play (\w[\w\s]{0,30}?\w)/i, topic: "plays", group: 1 },
];

function extractMemoriesFromMessage(message: string): Array<{ topic: string; detail: string }> {
  const results: Array<{ topic: string; detail: string }> = [];
  for (const { pattern, topic, group } of MEMORY_PATTERNS) {
    const match = message.match(pattern);
    if (match) {
      const detail = group === 0 ? match[0] : match[group];
      if (detail && detail.length > 1) {
        results.push({ topic: `${topic}:${detail.toLowerCase().trim()}`, detail: match[0].trim() });
      }
    }
  }
  return results;
}

const NAME_PATTERNS = [
  /my name(?:'s| is) (\w+)/i,
  /i'm (\w+)/i,
  /i am (\w+)/i,
  /call me (\w+)/i,
  /they call me (\w+)/i,
  /the name(?:'s| is) (\w+)/i,
  /^(\w+)[.,!]? (?:here|nice to meet you|pleased to meet you)/i,
];

function extractNameFromIntroduction(message: string): string | null {
  const ignore = new Set(["a", "the", "an", "not", "just", "very", "so", "really", "here", "there", "fine", "good", "okay", "ok", "well", "sure", "sorry", "glad", "happy", "sad", "tired", "busy", "new", "back", "done", "ready"]);
  for (const pattern of NAME_PATTERNS) {
    const match = message.match(pattern);
    if (match) {
      const name = match[match.length - 1];
      if (name && !ignore.has(name.toLowerCase())) {
        return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
      }
    }
  }
  return null;
}

// --- Exports for testing ---
export { extractMemoriesFromMessage, extractNameFromIntroduction };

interface UseMessageHandlerArgs {
  characterId: string;
  userName: string | null;
  setUserName: (name: string) => void;
  responseLength: "short" | "medium" | "long";
  aiProvider: string;
  addAffinity: (event: AffinityEvent, bonus?: number) => {
    newMilestones: string[];
    leveledUp: boolean;
    data: ReturnType<typeof getAffinity>;
  };
  updateMoodFromExpressions: (expressions: string[]) => string;
  resetIdle: () => void;
  currentMood: string;
  pendingDiscoveryContext: string | null;
  clearDiscoveryContext: () => void;
  onSceneChange: (sceneId: SceneId) => void;
  onHexxPhrase: (phrase: string) => void;
  onConfessionCheck: () => void;
}

export function useMessageHandler({
  characterId,
  userName,
  setUserName,
  responseLength,
  aiProvider,
  addAffinity,
  updateMoodFromExpressions,
  resetIdle,
  currentMood,
  pendingDiscoveryContext,
  clearDiscoveryContext,
  onSceneChange,
  onHexxPhrase,
  onConfessionCheck,
}: UseMessageHandlerArgs) {
  const { state, dispatch } = useChat();
  const recentExpressionsRef = useRef<string[]>([]);
  const typingTrackerRef = useRef(new TypingTracker());

  const handleSend = useCallback(
    async (message: string) => {
      if (state.phase === "waiting" || state.phase === "speaking") return;

      resetIdle();
      playSendSwoosh();
      haptic.pulse();
      dispatch(sendMessage(message));

      const msgEvent: AffinityEvent = message.length > 50 ? "long_message" : "message_sent";
      addAffinity(msgEvent);

      const history = state.messages.map((m) => ({ role: m.role, content: m.content }));
      const memories = formatMemoriesForPrompt(characterId);

      let fullText = "";
      let expression = "neutral" as Expression;

      const affinityPrompt = formatAffinityForPrompt(characterId);
      const giftContext = formatGiftContextForPrompt(characterId);
      const heroAppearance = getHeroAppearanceForPrompt();
      const heroClassReaction = getHeroClassReactionForPrompt(characterId);
      const crossChar = getCrossCharacterContext(characterId);
      const miniGame = detectMiniGame(message);
      const miniGamePrompt = miniGame ? getMiniGamePrompt(miniGame, getAffinity(characterId).level) : undefined;
      const typingHint = typingTrackerRef.current.getReactionHint();
      const greetingCtx = state.messages.length === 0
        ? buildGreetingContext(characterId, 0, getAffinity(characterId).streak)
        : undefined;
      const personalityCtx = getPersonalityContext(characterId) || undefined;
      const hexxMentioned = message.toLowerCase().includes("hexx");
      const discoveryCtx = pendingDiscoveryContext;
      if (discoveryCtx) clearDiscoveryContext();

      try {
        await streamChat(
          {
            message, characterId, history, userName, memories, responseLength,
            provider: aiProvider, affinityPrompt, giftContext, heroAppearance,
            heroClassReaction, crossCharPrompt: crossChar.prompt, miniGamePrompt,
            typingHint,
            language: (typeof window !== "undefined" ? localStorage.getItem("anime-chatbot-language") : null) ?? "en",
            greetingContext: greetingCtx, personalityContext: personalityCtx,
            hexxMentioned, discoveryContext: discoveryCtx || undefined,
          },
          (event) => {
            switch (event.type) {
              case "expression":
                expression = event.expression;
                dispatch(setExpression(expression));
                playExpressionChange();
                haptic.expression(expression);
                playMessageReceived();
                if (expression === "angry" || expression === "surprised") {
                  triggerScreenShake(expression === "angry" ? "heavy" : "medium");
                }
                break;
              case "text":
                fullText += event.content;
                break;
              case "scene":
                if (event.sceneId) onSceneChange(event.sceneId as SceneId);
                break;
              case "hexx":
                onHexxPhrase(event.content);
                break;
              case "error":
                console.error("[chat] SSE error:", event.message);
                fullText = "I'm sorry, something went wrong. Please try again.";
                break;
            }
          }
        );
      } catch {
        fullText = fullText || "Connection lost. Please try again.";
      }

      // Name extraction
      if (!userName) {
        const nameFromUser = extractNameFromIntroduction(message);
        if (nameFromUser && fullText.toLowerCase().includes(nameFromUser.toLowerCase())) {
          saveUserName(characterId, nameFromUser);
          setUserName(nameFromUser);
        }
      }

      // Memory extraction
      const newMemories = extractMemoriesFromMessage(message);
      for (const mem of newMemories) {
        const category = ["likes", "loves", "dislikes", "favorite"].includes(mem.topic.split(":")[0])
          ? "preference" as const
          : "fact" as const;
        saveMemory(characterId, category, mem.detail, message);
      }

      // Mood tracking
      recentExpressionsRef.current.push(expression);
      if (recentExpressionsRef.current.length > 10) {
        recentExpressionsRef.current = recentExpressionsRef.current.slice(-10);
      }
      updateMoodFromExpressions(recentExpressionsRef.current);

      // Personality tracking
      updateUserStyle(characterId, { expressionTriggered: expression, messageLength: message.length });

      // Expression-based affinity bonuses
      if (expression === "laugh") addAffinity("made_her_laugh");
      if (expression === "flustered") addAffinity("made_her_flustered");

      dispatch(receiveResponse(fullText || "...", expression));

      // Check confession eligibility after response
      onConfessionCheck();
    },
    [dispatch, state.messages, state.phase, characterId, userName, responseLength, aiProvider,
     addAffinity, updateMoodFromExpressions, resetIdle, pendingDiscoveryContext, clearDiscoveryContext,
     onSceneChange, onHexxPhrase, onConfessionCheck, setUserName]
  );

  const handleGift = useCallback((gift: Gift, reaction: CharacterReaction) => {
    haptic.success();
    const exprParts = reaction.expression.split("/");
    const validExpr = (exprParts[0] || "happy") as Expression;
    dispatch(receiveResponse(reaction.dialogue, validExpr));
    addAffinity("message_sent", gift.affinityBonus);
    return { gift, reaction };
  }, [dispatch, addAffinity]);

  return {
    handleSend,
    handleGift,
    typingTracker: typingTrackerRef.current,
  };
}
```

- [ ] **Step 2: Write test for extraction functions**

```typescript
// __tests__/lib/useMessageHandler.test.ts
import { describe, it, expect } from "vitest";
import { extractMemoriesFromMessage, extractNameFromIntroduction } from "@/hooks/useMessageHandler";

describe("extractMemoriesFromMessage", () => {
  it("extracts likes", () => {
    const result = extractMemoriesFromMessage("i really like chocolate");
    expect(result).toHaveLength(1);
    expect(result[0].topic).toBe("likes:chocolate");
  });

  it("extracts identity", () => {
    const result = extractMemoriesFromMessage("i am a software engineer");
    expect(result).toHaveLength(1);
    expect(result[0].topic).toContain("identity");
  });

  it("returns empty for no matches", () => {
    expect(extractMemoriesFromMessage("hello there")).toHaveLength(0);
  });
});

describe("extractNameFromIntroduction", () => {
  it("extracts name from 'my name is X'", () => {
    expect(extractNameFromIntroduction("my name is Gilles")).toBe("Gilles");
  });

  it("extracts name from 'call me X'", () => {
    expect(extractNameFromIntroduction("call me Ace")).toBe("Ace");
  });

  it("ignores common words", () => {
    expect(extractNameFromIntroduction("I'm fine")).toBeNull();
    expect(extractNameFromIntroduction("I'm happy")).toBeNull();
  });

  it("returns null for no match", () => {
    expect(extractNameFromIntroduction("what's up")).toBeNull();
  });
});
```

- [ ] **Step 3: Run test**

Run: `cd "C:/Users/G$/Kikaku 企画/anime-chatbot" && npx vitest run __tests__/lib/useMessageHandler.test.ts`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/hooks/useMessageHandler.ts __tests__/lib/useMessageHandler.test.ts
git commit -m "refactor: extract useMessageHandler hook with memory/name extraction"
```

---

## Task 3: Extract `usePanels` and `useVNControls` hooks

**Files:**
- Create: `src/hooks/usePanels.ts`
- Create: `src/hooks/useVNControls.ts`

- [ ] **Step 1: Write usePanels hook**

```typescript
// src/hooks/usePanels.ts
"use client";

import { useCallback, useState } from "react";
import { haptic } from "@/lib/haptics";

export type PanelId = "history" | "charInfo" | "diary" | "gifts" | "outfits" | "quests" | "scenes" | "screenshot" | "more" | null;

export function usePanels() {
  const [activePanel, setActivePanel] = useState<PanelId>(null);

  const openPanel = useCallback((panel: PanelId) => {
    haptic.tick();
    setActivePanel(panel);
  }, []);

  const closePanel = useCallback(() => {
    haptic.tick();
    setActivePanel(null);
  }, []);

  const togglePanel = useCallback((panel: PanelId) => {
    haptic.tick();
    setActivePanel(prev => prev === panel ? null : panel);
  }, []);

  return {
    activePanel,
    openPanel,
    closePanel,
    togglePanel,
    isOpen: (panel: PanelId) => activePanel === panel,
  };
}
```

- [ ] **Step 2: Write useVNControls hook**

```typescript
// src/hooks/useVNControls.ts
"use client";

import { useCallback, useEffect, useRef } from "react";
import { useChat } from "@/lib/chat/context";
import { advanceLine, lineTyped, toggleAutoAdvance } from "@/lib/chat/actions";
import { haptic } from "@/lib/haptics";
import { prefetchSpeech } from "@/lib/speech";
import { useSwipeGesture } from "@/lib/useSwipeGesture";
import type { PanelId } from "./usePanels";

interface UseVNControlsArgs {
  characterId: string;
  containerRef: React.RefObject<HTMLDivElement | null>;
  activePanel: PanelId;
  openPanel: (panel: PanelId) => void;
  closePanel: () => void;
}

export function useVNControls({
  characterId,
  containerRef,
  activePanel,
  openPanel,
  closePanel,
}: UseVNControlsArgs) {
  const { state, dispatch } = useChat();
  const autoAdvanceTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Auto-advance timer
  useEffect(() => {
    if (state.autoAdvance && state.phase === "speaking" && !state.isTyping) {
      autoAdvanceTimerRef.current = setTimeout(() => {
        dispatch(advanceLine());
      }, 1500);
      return () => {
        if (autoAdvanceTimerRef.current) clearTimeout(autoAdvanceTimerRef.current);
      };
    }
  }, [state.autoAdvance, state.phase, state.isTyping, state.currentLineIndex, dispatch]);

  // Swipe gestures
  useSwipeGesture(containerRef, (result) => {
    if (result.direction === "right" && result.fromEdge && !activePanel) {
      openPanel("history");
    } else if (result.direction === "left" && activePanel) {
      closePanel();
    }
  });

  const handleAdvance = useCallback(() => {
    haptic.tick();
    dispatch(advanceLine());
  }, [dispatch]);

  const handleTypeComplete = useCallback(() => {
    const nextIndex = state.currentLineIndex + 1;
    if (nextIndex < state.currentLines.length) {
      prefetchSpeech(state.currentLines[nextIndex], characterId);
    }
    dispatch(lineTyped());
  }, [dispatch, state.currentLineIndex, state.currentLines, characterId]);

  const handleToggleAutoAdvance = useCallback(() => {
    dispatch(toggleAutoAdvance());
  }, [dispatch]);

  return {
    handleAdvance,
    handleTypeComplete,
    handleToggleAutoAdvance,
    currentLine: state.currentLines[state.currentLineIndex] || "",
    showInput: state.phase === "idle",
    showDialogue: state.phase === "speaking" || state.phase === "waiting",
    isTalking: state.phase === "speaking" && state.isTyping,
    showAdvanceIndicator: state.phase === "speaking" && !state.isTyping,
    isWaiting: state.phase === "waiting",
  };
}
```

- [ ] **Step 3: Commit**

```bash
git add src/hooks/usePanels.ts src/hooks/useVNControls.ts
git commit -m "refactor: extract usePanels and useVNControls hooks"
```

---

## Task 4: Extract `useExpressionEffects` hook

**Files:**
- Create: `src/hooks/useExpressionEffects.ts`

- [ ] **Step 1: Write the hook**

```typescript
// src/hooks/useExpressionEffects.ts
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useChat } from "@/lib/chat/context";
import { setExpression } from "@/lib/chat/actions";
import { moodToExpression } from "@/lib/mood";
import type { Expression } from "@/lib/characters/types";
import { getExpressionEffect, type ExpressionEffect } from "@/lib/expressionEffects";

interface UseExpressionEffectsArgs {
  currentMood: string;
}

export function useExpressionEffects({ currentMood }: UseExpressionEffectsArgs) {
  const { state, dispatch } = useChat();
  const [activeEffect, setActiveEffect] = useState<ExpressionEffect | null>(null);
  const prevPhaseRef = useRef(state.phase);

  // Reset expression to mood-based default when conversation ends
  useEffect(() => {
    if (prevPhaseRef.current !== "idle" && state.phase === "idle") {
      dispatch(setExpression(moodToExpression(currentMood)));
    }
    prevPhaseRef.current = state.phase;
  }, [state.phase, dispatch, currentMood]);

  const handleExpressionChange = useCallback((effect: ExpressionEffect) => {
    setActiveEffect(effect);
    setTimeout(() => setActiveEffect(null), effect.durationMs);
  }, []);

  // Flustered reaction on idle sprite tap
  const handleSpriteTap = useCallback(() => {
    if (state.phase === "idle") {
      dispatch(setExpression("flustered"));
      setTimeout(() => dispatch(setExpression(moodToExpression(currentMood))), 2000);
    }
  }, [state.phase, dispatch, currentMood]);

  return {
    activeEffect,
    handleExpressionChange,
    handleSpriteTap,
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/useExpressionEffects.ts
git commit -m "refactor: extract useExpressionEffects hook"
```

---

## Task 5: Create `VNLayout` component — the immersive viewport

**Files:**
- Create: `src/components/VNLayout.tsx`

This is the visual transformation. The scene background fills the entire viewport. The sprite is centered and dominant (60-70% height). The dialogue box overlays the bottom 25% as a semi-transparent panel. No separate sections — everything is layered.

- [ ] **Step 1: Write VNLayout component**

```typescript
// src/components/VNLayout.tsx
"use client";

import React from "react";
import type { Character } from "@/lib/characters/types";
import type { Expression } from "@/lib/characters/types";
import type { SceneId } from "@/lib/backgrounds";
import type { ExpressionEffect } from "@/lib/expressionEffects";
import { SceneBackground } from "./SceneBackground";
import { CharacterSprite } from "./CharacterSprite";
import { InteractiveElements } from "./InteractiveElements";

interface VNLayoutProps {
  character: Character;
  characterId: string;
  expression: Expression;
  isTalking: boolean;
  outfit: string;
  currentScene: SceneId;
  activeEffect: ExpressionEffect | null;
  onHeadpat: () => void;
  onExpressionChange: (effect: ExpressionEffect) => void;
  onSpriteTap: () => void;
  onDiscoveryReaction: (line: string, expression: string) => void;
  onDiscoveryContext: (ctx: string) => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
  /** Rendered in the bottom overlay zone (dialogue, input, starters) */
  children: React.ReactNode;
  /** Extra overlays (panels, toasts, menus) rendered on top */
  overlays?: React.ReactNode;
  /** Minimal top-left controls */
  headerLeft?: React.ReactNode;
  /** Minimal top-right controls */
  headerRight?: React.ReactNode;
}

export function VNLayout({
  character,
  characterId,
  expression,
  isTalking,
  outfit,
  currentScene,
  activeEffect,
  onHeadpat,
  onExpressionChange,
  onSpriteTap,
  onDiscoveryReaction,
  onDiscoveryContext,
  containerRef,
  children,
  overlays,
  headerLeft,
  headerRight,
}: VNLayoutProps) {
  return (
    <div
      ref={containerRef}
      id="chat-container"
      className="vn-viewport"
      suppressHydrationWarning
    >
      {/* Layer 1: Scene background — fills entire viewport */}
      <SceneBackground sceneId={currentScene} characterAccent={character.theme.accent} />

      {/* Layer 2: Interactive scene elements */}
      <InteractiveElements
        sceneId={currentScene}
        accentColor={character.theme.accent}
        characterId={characterId}
        onReaction={onDiscoveryReaction}
        onDiscoveryContext={onDiscoveryContext}
      />

      {/* Layer 3: Expression effects */}
      {activeEffect?.type === "sparkle" && (
        <div className="vn-effect" style={{
          background: `radial-gradient(circle at 50% 40%, ${character.theme.accent}40 0%, transparent 60%)`,
        }} />
      )}
      {activeEffect?.type === "shake" && (
        <div className="vn-effect" style={{
          background: "radial-gradient(ellipse at center, transparent 50%, rgba(239,68,68,0.2) 100%)",
        }} />
      )}
      {activeEffect?.type === "blush" && (
        <div className="vn-effect" style={{
          background: "radial-gradient(circle at 50% 35%, rgba(244,114,182,0.3) 0%, transparent 50%)",
        }} />
      )}
      {activeEffect?.type === "dim" && <div className="vn-effect vn-effect--dim" />}
      {activeEffect?.type === "flash" && (
        <div className="vn-effect" style={{ background: "rgba(255,255,255,0.15)" }} />
      )}

      {/* Layer 4: Character sprite — dominant, centered */}
      <div className="vn-sprite-zone" onClick={onSpriteTap}>
        <CharacterSprite
          character={character}
          expression={expression}
          isTalking={isTalking}
          outfit={outfit}
          onHeadpat={onHeadpat}
          onExpressionChange={onExpressionChange}
        />
      </div>

      {/* Layer 5: Minimal header — glass bar, only essentials */}
      <div className="vn-header">
        <div className="vn-header__left">{headerLeft}</div>
        <div className="vn-header__right">{headerRight}</div>
      </div>

      {/* Layer 6: Bottom zone — dialogue + input overlay */}
      <div className="vn-bottom-zone">
        {children}
      </div>

      {/* Layer 7: Overlays (panels, modals, menus) */}
      {overlays}
    </div>
  );
}
```

- [ ] **Step 2: Add VN layout CSS to globals.css**

Append to `src/styles/globals.css`:

```css
/* ===== VN Layout System ===== */
.vn-viewport {
  position: relative;
  width: 100%;
  height: 100dvh;
  overflow: hidden;
  background: #000;
}

.vn-sprite-zone {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 5;
  pointer-events: none;
  padding-bottom: 20%;
}
.vn-sprite-zone > * {
  pointer-events: auto;
}

.vn-effect {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 15;
}
.vn-effect--dim {
  background: rgba(0, 0, 0, 0.3);
}

.vn-header {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  padding-top: calc(8px + env(safe-area-inset-top, 0px));
  background: linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, transparent 100%);
  pointer-events: none;
}
.vn-header > * {
  pointer-events: auto;
}
.vn-header__left,
.vn-header__right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.vn-bottom-zone {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 20;
  padding-bottom: env(safe-area-inset-bottom, 0px);
}

/* VN Dialogue overlay styling */
.vn-dialogue {
  background: linear-gradient(
    to bottom,
    rgba(10, 10, 16, 0) 0%,
    rgba(10, 10, 16, 0.85) 15%,
    rgba(10, 10, 16, 0.92) 100%
  );
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  padding: 20px 16px 16px;
  min-height: 140px;
  cursor: pointer;
  position: relative;
}

.vn-dialogue__nameplate {
  position: absolute;
  top: -14px;
  left: 20px;
  padding: 4px 16px;
  border-radius: 8px 8px 0 0;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.04em;
  backdrop-filter: blur(12px);
}

.vn-dialogue__text {
  font-family: var(--font-dialogue, "Zen Maru Gothic", sans-serif);
  font-size: 15px;
  line-height: 1.7;
  color: var(--color-dialogue-text, #e8e0e8);
}

@media (min-width: 768px) {
  .vn-dialogue {
    padding: 28px 32px 24px;
    min-height: 160px;
  }
  .vn-dialogue__nameplate {
    left: 32px;
    font-size: 14px;
    padding: 5px 20px;
  }
  .vn-dialogue__text {
    font-size: 16px;
  }
  .vn-header {
    padding: 12px 24px;
  }
}

/* VN Input — integrated into dialogue zone */
.vn-input-zone {
  padding: 12px 16px 16px;
  background: linear-gradient(
    to bottom,
    rgba(10, 10, 16, 0) 0%,
    rgba(10, 10, 16, 0.7) 30%,
    rgba(10, 10, 16, 0.85) 100%
  );
  backdrop-filter: blur(6px);
}

.vn-input {
  width: 100%;
  padding: 12px 20px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.06);
  border: 1.5px solid rgba(255, 255, 255, 0.12);
  color: var(--color-text, #e8e0e8);
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s, background 0.2s;
}
.vn-input:focus {
  background: rgba(255, 255, 255, 0.1);
}
.vn-input::placeholder {
  color: rgba(255, 255, 255, 0.3);
}

/* VN Menu button */
.vn-menu-trigger {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 25;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: none;
  background: rgba(10, 10, 16, 0.7);
  backdrop-filter: blur(10px);
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s, background 0.2s;
  padding-bottom: env(safe-area-inset-bottom, 0px);
}
.vn-menu-trigger:hover {
  background: rgba(10, 10, 16, 0.85);
  transform: scale(1.05);
}
.vn-menu-trigger--open {
  transform: rotate(45deg) !important;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/VNLayout.tsx src/styles/globals.css
git commit -m "feat: add VNLayout component with immersive fullscreen viewport"
```

---

## Task 6: Create `VNMenu` — hidden radial menu replacing BottomNav

**Files:**
- Create: `src/components/VNMenu.tsx`

A floating button in the bottom-right that opens a fan/arc of options when tapped. Replaces the always-visible BottomNav. Options: Outfits, Gifts, Diary, Quests, Scenes, Save, Settings. The menu dismisses after selection.

- [ ] **Step 1: Write VNMenu component**

```typescript
// src/components/VNMenu.tsx
"use client";

import React, { useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { haptic } from "@/lib/haptics";
import type { PanelId } from "@/hooks/usePanels";

interface MenuItem {
  id: PanelId;
  label: string;
  icon: React.ReactNode;
}

interface VNMenuProps {
  accentColor: string;
  onSelect: (panel: PanelId) => void;
  onSave: () => void;
}

const MENU_ITEMS: MenuItem[] = [
  {
    id: "outfits",
    label: "Outfits",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M10 2L6 6H4v10h12V6h-2L10 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    id: "gifts",
    label: "Gifts",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect x="2" y="9" width="16" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M10 9v9M2 12.5h16" stroke="currentColor" strokeWidth="1" opacity="0.5"/>
        <path d="M10 9C10 9 7.5 7 6 5.5S5 2 7 2s3 3 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M10 9C10 9 12.5 7 14 5.5S15 2 13 2s-3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: "diary",
    label: "Diary",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect x="3" y="2" width="14" height="16" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M6 6h8M6 9h8M6 12h5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.6"/>
        <path d="M5 2v16" stroke="currentColor" strokeWidth="1.5"/>
      </svg>
    ),
  },
  {
    id: "quests",
    label: "Quests",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M10 5v5l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    id: "scenes",
    label: "Scenes",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect x="2" y="3" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M2 13l4.5-3.5L10 12l4-4L18 12" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" strokeLinecap="round"/>
        <circle cx="14" cy="7" r="1.5" stroke="currentColor" strokeWidth="1"/>
      </svg>
    ),
  },
  {
    id: "history",
    label: "Log",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M3 5h14M3 10h10M3 15h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
];

export function VNMenu({ accentColor, onSelect, onSave }: VNMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  const toggle = useCallback(() => {
    haptic.tick();
    setIsOpen(prev => !prev);
  }, []);

  const select = useCallback((id: PanelId) => {
    haptic.tick();
    setIsOpen(false);
    onSelect(id);
  }, [onSelect]);

  const handleSave = useCallback(() => {
    haptic.tick();
    setIsOpen(false);
    onSave();
  }, [onSave]);

  // Fan layout: items arc upward from the trigger button
  const arcRadius = 90;
  const arcStart = -180; // degrees (left)
  const arcEnd = -90;    // degrees (up)
  const totalItems = MENU_ITEMS.length + 1; // +1 for save
  const arcStep = (arcEnd - arcStart) / (totalItems - 1);

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-40"
            style={{ background: "rgba(0,0,0,0.3)" }}
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      <div className="fixed z-50" style={{
        bottom: `calc(20px + env(safe-area-inset-bottom, 0px))`,
        right: "20px",
      }}>
        {/* Menu items */}
        <AnimatePresence>
          {isOpen && (
            <>
              {MENU_ITEMS.map((item, i) => {
                const angle = (arcStart + i * arcStep) * (Math.PI / 180);
                const x = Math.cos(angle) * arcRadius;
                const y = Math.sin(angle) * arcRadius;
                return (
                  <motion.button
                    key={item.id}
                    initial={{ opacity: 0, x: 0, y: 0, scale: 0.3 }}
                    animate={{ opacity: 1, x, y, scale: 1 }}
                    exit={{ opacity: 0, x: 0, y: 0, scale: 0.3 }}
                    transition={{ duration: 0.2, delay: i * 0.03 }}
                    onClick={() => select(item.id)}
                    className="absolute flex flex-col items-center gap-1"
                    style={{
                      bottom: "8px",
                      right: "8px",
                    }}
                    title={item.label}
                  >
                    <div
                      className="w-11 h-11 rounded-full flex items-center justify-center"
                      style={{
                        background: "rgba(10, 10, 16, 0.85)",
                        backdropFilter: "blur(10px)",
                        border: `1.5px solid ${accentColor}40`,
                        color: accentColor,
                      }}
                    >
                      {item.icon}
                    </div>
                    <span style={{
                      fontSize: "9px",
                      color: "rgba(255,255,255,0.7)",
                      fontWeight: 500,
                      textShadow: "0 1px 3px rgba(0,0,0,0.8)",
                    }}>
                      {item.label}
                    </span>
                  </motion.button>
                );
              })}

              {/* Save button — last item in the arc */}
              <motion.button
                initial={{ opacity: 0, x: 0, y: 0, scale: 0.3 }}
                animate={{
                  opacity: 1,
                  x: Math.cos((arcStart + MENU_ITEMS.length * arcStep) * (Math.PI / 180)) * arcRadius,
                  y: Math.sin((arcStart + MENU_ITEMS.length * arcStep) * (Math.PI / 180)) * arcRadius,
                  scale: 1,
                }}
                exit={{ opacity: 0, x: 0, y: 0, scale: 0.3 }}
                transition={{ duration: 0.2, delay: MENU_ITEMS.length * 0.03 }}
                onClick={handleSave}
                className="absolute flex flex-col items-center gap-1"
                style={{ bottom: "8px", right: "8px" }}
                title="Save"
              >
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center"
                  style={{
                    background: "rgba(10, 10, 16, 0.85)",
                    backdropFilter: "blur(10px)",
                    border: `1.5px solid ${accentColor}40`,
                    color: accentColor,
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M4 2h10l4 4v10a2 2 0 01-2 2H4a2 2 0 01-2-2V4a2 2 0 012-2z" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M6 2v5h6V2" stroke="currentColor" strokeWidth="1.3"/>
                    <rect x="5" y="11" width="8" height="5" rx="1" stroke="currentColor" strokeWidth="1"/>
                  </svg>
                </div>
                <span style={{
                  fontSize: "9px",
                  color: "rgba(255,255,255,0.7)",
                  fontWeight: 500,
                  textShadow: "0 1px 3px rgba(0,0,0,0.8)",
                }}>Save</span>
              </motion.button>
            </>
          )}
        </AnimatePresence>

        {/* Trigger button */}
        <button
          onClick={toggle}
          className="vn-menu-trigger"
          style={{
            position: "relative",
            borderColor: isOpen ? `${accentColor}60` : "rgba(255,255,255,0.1)",
            border: `1.5px solid ${isOpen ? accentColor + "60" : "rgba(255,255,255,0.15)"}`,
          }}
        >
          <motion.div
            animate={{ rotate: isOpen ? 45 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <path d="M11 5v12M5 11h12" stroke={isOpen ? accentColor : "currentColor"} strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </motion.div>
        </button>
      </div>
    </>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/VNMenu.tsx
git commit -m "feat: add VNMenu radial fan menu replacing BottomNav"
```

---

## Task 7: Create `VNTransition` component

**Files:**
- Create: `src/components/VNTransition.tsx`

Scene transitions: fade-to-black, dissolve, and flash-white. Used when switching scenes or entering special scenes (confession, milestone).

- [ ] **Step 1: Write VNTransition component**

```typescript
// src/components/VNTransition.tsx
"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export type TransitionType = "fade" | "flash" | "dissolve";

interface VNTransitionProps {
  active: boolean;
  type?: TransitionType;
  duration?: number; // ms
  onComplete?: () => void;
}

export function VNTransition({
  active,
  type = "fade",
  duration = 600,
  onComplete,
}: VNTransitionProps) {
  const [phase, setPhase] = useState<"in" | "hold" | "out" | "done">("done");

  useEffect(() => {
    if (!active) return;
    setPhase("in");
    const holdTimer = setTimeout(() => setPhase("hold"), duration / 2);
    const outTimer = setTimeout(() => {
      setPhase("out");
      onComplete?.();
    }, duration / 2 + 100);
    const doneTimer = setTimeout(() => setPhase("done"), duration + 100);
    return () => {
      clearTimeout(holdTimer);
      clearTimeout(outTimer);
      clearTimeout(doneTimer);
    };
  }, [active, duration, onComplete]);

  if (phase === "done") return null;

  const bg = type === "flash"
    ? "rgba(255,255,255,1)"
    : "rgba(0,0,0,1)";

  const durationS = duration / 2000;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{
        opacity: phase === "in" || phase === "hold" ? 1 : 0,
      }}
      transition={{ duration: durationS, ease: "easeInOut" }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        background: bg,
        pointerEvents: "none",
      }}
    />
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/VNTransition.tsx
git commit -m "feat: add VNTransition component for scene transitions"
```

---

## Task 8: Create `SceneObjects` foundation

**Files:**
- Create: `src/components/SceneObjects.tsx`
- Create: `src/lib/sceneObjects.ts`

Interactive world objects that will serve as the assistant feature entry points. Each scene can have objects (desk, notebook, clock, phone) that are tappable and open mini UI panels. This task builds the framework — actual assistant panels come later.

- [ ] **Step 1: Write scene objects data**

```typescript
// src/lib/sceneObjects.ts

export interface SceneObject {
  id: string;
  label: string;
  /** Position as percentage of viewport */
  x: number;
  y: number;
  /** Visual size in px */
  size: number;
  /** Icon displayed */
  icon: string;
  /** Which scenes this object appears in */
  scenes: string[];
  /** Feature it opens — for now just an identifier */
  action: string;
}

export const SCENE_OBJECTS: SceneObject[] = [
  {
    id: "notebook",
    label: "Notebook",
    x: 12,
    y: 65,
    size: 36,
    icon: "📓",
    scenes: ["cozy_room", "cafe", "lab"],
    action: "notebook",
  },
  {
    id: "clock",
    label: "Clock",
    x: 88,
    y: 15,
    size: 32,
    icon: "🕐",
    scenes: ["cozy_room", "lab", "cyberpunk"],
    action: "timer",
  },
  {
    id: "phone",
    label: "Phone",
    x: 85,
    y: 70,
    size: 30,
    icon: "📱",
    scenes: ["cozy_room", "cafe", "morning", "bedroom"],
    action: "reminders",
  },
  {
    id: "pinboard",
    label: "Board",
    x: 15,
    y: 25,
    size: 34,
    icon: "📌",
    scenes: ["cozy_room", "lab", "cyberpunk"],
    action: "todos",
  },
  {
    id: "bookshelf",
    label: "Books",
    x: 10,
    y: 40,
    size: 34,
    icon: "📚",
    scenes: ["cozy_room", "lab"],
    action: "notes",
  },
];

export function getObjectsForScene(sceneId: string): SceneObject[] {
  return SCENE_OBJECTS.filter(obj => obj.scenes.includes(sceneId));
}
```

- [ ] **Step 2: Write SceneObjects component**

```typescript
// src/components/SceneObjects.tsx
"use client";

import React, { useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getObjectsForScene, type SceneObject } from "@/lib/sceneObjects";
import { haptic } from "@/lib/haptics";

interface SceneObjectsProps {
  sceneId: string;
  accentColor: string;
  onObjectTap: (action: string) => void;
}

function SceneObjectButton({
  obj,
  accentColor,
  onTap,
}: {
  obj: SceneObject;
  accentColor: string;
  onTap: () => void;
}) {
  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 0.7, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5 }}
      whileHover={{ opacity: 1, scale: 1.15 }}
      whileTap={{ scale: 0.9 }}
      transition={{ duration: 0.3 }}
      onClick={() => {
        haptic.tick();
        onTap();
      }}
      className="absolute flex flex-col items-center gap-1"
      style={{
        left: `${obj.x}%`,
        top: `${obj.y}%`,
        transform: "translate(-50%, -50%)",
        zIndex: 12,
      }}
      title={obj.label}
    >
      <div
        style={{
          width: obj.size,
          height: obj.size,
          borderRadius: "50%",
          background: "rgba(10, 10, 16, 0.5)",
          backdropFilter: "blur(6px)",
          border: `1px solid ${accentColor}30`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: obj.size * 0.45,
          cursor: "pointer",
        }}
      >
        {obj.icon}
      </div>
      <span style={{
        fontSize: "8px",
        color: "rgba(255,255,255,0.5)",
        fontWeight: 500,
        textShadow: "0 1px 4px rgba(0,0,0,0.9)",
      }}>
        {obj.label}
      </span>
    </motion.button>
  );
}

export function SceneObjects({ sceneId, accentColor, onObjectTap }: SceneObjectsProps) {
  const objects = getObjectsForScene(sceneId);

  const handleTap = useCallback((action: string) => {
    onObjectTap(action);
  }, [onObjectTap]);

  return (
    <AnimatePresence mode="wait">
      {objects.map(obj => (
        <SceneObjectButton
          key={obj.id}
          obj={obj}
          accentColor={accentColor}
          onTap={() => handleTap(obj.action)}
        />
      ))}
    </AnimatePresence>
  );
}
```

- [ ] **Step 3: Write test for scene objects data**

```typescript
// __tests__/lib/sceneObjects.test.ts
import { describe, it, expect } from "vitest";
import { getObjectsForScene, SCENE_OBJECTS } from "@/lib/sceneObjects";

describe("getObjectsForScene", () => {
  it("returns objects for cozy_room", () => {
    const objects = getObjectsForScene("cozy_room");
    expect(objects.length).toBeGreaterThan(0);
    expect(objects.every(o => o.scenes.includes("cozy_room"))).toBe(true);
  });

  it("returns empty for unknown scene", () => {
    expect(getObjectsForScene("nonexistent")).toHaveLength(0);
  });

  it("all objects have valid positions", () => {
    for (const obj of SCENE_OBJECTS) {
      expect(obj.x).toBeGreaterThanOrEqual(0);
      expect(obj.x).toBeLessThanOrEqual(100);
      expect(obj.y).toBeGreaterThanOrEqual(0);
      expect(obj.y).toBeLessThanOrEqual(100);
    }
  });
});
```

- [ ] **Step 4: Run tests**

Run: `cd "C:/Users/G$/Kikaku 企画/anime-chatbot" && npx vitest run __tests__/lib/sceneObjects.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/sceneObjects.ts src/components/SceneObjects.tsx __tests__/lib/sceneObjects.test.ts
git commit -m "feat: add SceneObjects framework for assistant-ready interactive world objects"
```

---

## Task 9: Restyle `DialogueBox` as VN overlay

**Files:**
- Modify: `src/components/DialogueBox.tsx`

Transform from a card-in-layout to a semi-transparent overlay that sits over the scene. The nameplate floats above the dialogue area. Input is integrated into the dialogue zone when idle. The click-to-continue and typewriter remain unchanged.

- [ ] **Step 1: Restyle DialogueBox**

Replace the outer wrapper's className/style with VN overlay classes. The component keeps all its internal logic (typewriter, TTS, etc.) but the visual container changes:

Current outer div (approximate):
```tsx
<div className="relative px-4 py-3 ..." style={{ background: "var(--color-surface-alpha)" }}>
```

New outer div:
```tsx
<div className="vn-dialogue" onClick={...}>
  <div className="vn-dialogue__nameplate" style={{ background: `${accentColor}dd`, color: "var(--color-nameplate-text)" }}>
    {characterName}
  </div>
  <div className="vn-dialogue__text">
    {/* typewriter content unchanged */}
  </div>
</div>
```

The key changes:
- Remove the existing background/border/padding/rounded styling
- Use `vn-dialogue` class (defined in Task 5 CSS)
- Nameplate becomes an absolutely-positioned tab above the dialogue
- Remove the decorative corner accents (they clutter the clean overlay)
- Keep: typewriter logic, TTS hooks, click-to-continue, expression border glow

- [ ] **Step 2: Verify typewriter and TTS still work**

Run: `cd "C:/Users/G$/Kikaku 企画/anime-chatbot" && npx vitest run`
Expected: All existing tests pass

- [ ] **Step 3: Commit**

```bash
git add src/components/DialogueBox.tsx
git commit -m "refactor: restyle DialogueBox as semi-transparent VN overlay"
```

---

## Task 10: Rewrite chat page to compose new architecture

**Files:**
- Modify: `src/app/chat/[characterId]/page.tsx`

The 1178-line monster becomes ~200 lines: import hooks, compose VNLayout, wire panels. All logic lives in hooks; all layout lives in VNLayout; all navigation lives in VNMenu.

- [ ] **Step 1: Rewrite ChatContent**

```typescript
// src/app/chat/[characterId]/page.tsx
"use client";

import { use, useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChatProvider, useChat } from "@/lib/chat/context";
import { receiveResponse, setExpression } from "@/lib/chat/actions";
import { useCharacterSession } from "@/hooks/useCharacterSession";
import { useMessageHandler } from "@/hooks/useMessageHandler";
import { usePanels } from "@/hooks/usePanels";
import { useVNControls } from "@/hooks/useVNControls";
import { useExpressionEffects } from "@/hooks/useExpressionEffects";
import { VNLayout } from "@/components/VNLayout";
import { VNMenu } from "@/components/VNMenu";
import { VNTransition } from "@/components/VNTransition";
import { SceneObjects } from "@/components/SceneObjects";
import { DialogueBox } from "@/components/DialogueBox";
import { ChatHistory } from "@/components/ChatHistory";
import { CharacterInfo } from "@/components/CharacterInfo";
import { OutfitCarousel } from "@/components/OutfitCarousel";
import { ConfessionScene } from "@/components/ConfessionScene";
import { MilestoneScene } from "@/components/MilestoneScene";
import { MilestoneToast } from "@/components/MilestoneToast";
import { SaveToast } from "@/components/SaveToast";
import { DiaryView } from "@/components/DiaryView";
import { GiftShop } from "@/components/GiftShop";
import { QuestPanel } from "@/components/QuestPanel";
import { BloodBat } from "@/components/BloodBat";
import { ScreenshotMode } from "@/components/ScreenshotMode";
import { VoiceToggle } from "@/components/VoiceToggle";
import { ThemeToggle } from "@/components/ThemeToggle";
import { OutfitSelector } from "@/components/OutfitSelector";
import { getStarters } from "@/lib/conversationStarters";
import { getEngagementGreeting, getStreakMessage } from "@/lib/engagement";
import { getSessionStartMood } from "@/lib/mood";
import { getAffinity, recordVisit } from "@/lib/affinity";
import { canConfess, getConfessionScript, markConfessed } from "@/lib/confession";
import { addDiaryEntry } from "@/lib/diary";
import { SCENES, type SceneId } from "@/lib/backgrounds";
import type { Gift, CharacterReaction } from "@/lib/gifts";
import type { Expression } from "@/lib/characters/types";

function ChatContent({ characterId }: { characterId: string }) {
  const { state, dispatch } = useChat();
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);

  // --- Hooks ---
  const session = useCharacterSession(characterId);
  const panels = usePanels();
  const effects = useExpressionEffects({ currentMood: session.currentMood });

  // Panel-specific state
  const [showConfession, setShowConfession] = useState(false);
  const [giftReaction, setGiftReaction] = useState<{ gift: Gift; reaction: CharacterReaction } | null>(null);
  const [starters, setStarters] = useState<string[]>([]);
  const [hexxPhrase, setHexxPhrase] = useState<string | null>(null);
  const [pendingDiscoveryContext, setPendingDiscoveryContext] = useState<string | null>(null);
  const [discoveryToast, setDiscoveryToast] = useState<{ line: string; expression: string } | null>(null);
  const [currentMilestone, setCurrentMilestone] = useState<string | null>(null);
  const [sceneTransition, setSceneTransition] = useState(false);

  const messageHandler = useMessageHandler({
    characterId,
    userName: session.userName,
    setUserName: session.setUserName,
    responseLength: session.responseLength,
    aiProvider: session.aiProvider,
    addAffinity: session.addAffinity,
    updateMoodFromExpressions: session.updateMoodFromExpressions,
    resetIdle: session.resetIdle,
    currentMood: session.currentMood,
    pendingDiscoveryContext,
    clearDiscoveryContext: () => setPendingDiscoveryContext(null),
    onSceneChange: (sceneId) => {
      setSceneTransition(true);
      setTimeout(() => session.setCurrentScene(sceneId), 300);
    },
    onHexxPhrase: setHexxPhrase,
    onConfessionCheck: () => {
      if (canConfess(characterId) && Math.random() < 0.2) setShowConfession(true);
    },
  });

  const vnControls = useVNControls({
    characterId,
    containerRef,
    activePanel: panels.activePanel,
    openPanel: panels.openPanel,
    closePanel: panels.closePanel,
  });

  // --- Greeting on first visit ---
  const greetingShownRef = useRef(false);
  useEffect(() => {
    if (!greetingShownRef.current && state.historyLoaded && state.messages.length === 0 && session.character) {
      greetingShownRef.current = true;
      const { daysAbsent, newMilestones } = recordVisit(characterId);
      if (newMilestones.length > 0) session.setMilestoneQueue(prev => [...prev, ...newMilestones]);
      const affinityData = getAffinity(characterId);
      const { mood: startMood } = getSessionStartMood(characterId, daysAbsent, affinityData.streak);
      if (startMood === "cheerful") dispatch(setExpression("happy"));
      else if (startMood === "thoughtful") dispatch(setExpression("thinking"));
      const greeting = getEngagementGreeting(characterId, daysAbsent);
      const streakMsg = getStreakMessage(affinityData.streak, characterId);
      const fullGreeting = streakMsg ? `${greeting} ${streakMsg}` : greeting;
      dispatch(receiveResponse(fullGreeting, daysAbsent >= 4 ? "sad" : "happy"));
    }
  }, [session.character, state.historyLoaded, state.messages.length, dispatch, characterId, session]);

  // Conversation starters
  useEffect(() => {
    if (state.historyLoaded && state.messages.length === 0) setStarters(getStarters(characterId));
    else setStarters([]);
  }, [state.historyLoaded, state.messages.length, characterId]);

  // Milestone queue consumer
  useEffect(() => {
    if (session.milestoneQueue.length > 0 && !currentMilestone) {
      setCurrentMilestone(session.milestoneQueue[0]);
      session.setMilestoneQueue(prev => prev.slice(1));
    }
  }, [session.milestoneQueue, currentMilestone, session]);

  // Diary auto-entry
  useEffect(() => {
    const msgCount = state.messages.filter(m => m.role === "user").length;
    if (msgCount > 0 && msgCount % 5 === 0 && state.phase === "idle" && session.character) {
      const lastAssistant = state.messages.slice(-10).filter(m => m.role === "assistant").map(m => m.content);
      const topics = state.messages.slice(-10).filter(m => m.role === "user").map(m => m.content.split(" ").slice(0, 3).join(" ")).slice(-3);
      const entry = lastAssistant.length > 0
        ? `We talked about many things today. ${lastAssistant[lastAssistant.length - 1]?.slice(0, 100)}... It was a good conversation.`
        : "Had a nice chat today.";
      addDiaryEntry(characterId, entry, session.currentMood, topics);
    }
  }, [state.messages.length, state.phase, characterId, session.character, session.currentMood, state.messages]);

  if (!session.character) return null;
  const character = session.character;

  const handleDiscoveryReaction = useCallback((line: string, expression: string) => {
    dispatch(setExpression(expression as Expression));
    setDiscoveryToast({ line, expression });
    setTimeout(() => setDiscoveryToast(null), 3500);
  }, [dispatch]);

  const handleGift = useCallback((gift: Gift, reaction: CharacterReaction) => {
    const result = messageHandler.handleGift(gift, reaction);
    setGiftReaction(result);
    panels.closePanel();
    setTimeout(() => setGiftReaction(null), 5000);
  }, [messageHandler, panels]);

  const handleSceneObjectTap = useCallback((action: string) => {
    // Future: open assistant panels. For now, log it.
    console.log("[SceneObject]", action);
  }, []);

  return (
    <>
      <VNLayout
        character={character}
        characterId={characterId}
        expression={state.currentExpression}
        isTalking={vnControls.isTalking}
        outfit={session.outfit}
        currentScene={session.currentScene}
        activeEffect={effects.activeEffect}
        onHeadpat={() => session.addAffinity("headpat")}
        onExpressionChange={effects.handleExpressionChange}
        onSpriteTap={effects.handleSpriteTap}
        onDiscoveryReaction={handleDiscoveryReaction}
        onDiscoveryContext={(ctx) => setPendingDiscoveryContext(ctx)}
        containerRef={containerRef}
        headerLeft={
          <>
            <button
              onClick={() => router.push("/")}
              className="flex items-center gap-1 text-white/70 hover:text-white transition-colors text-xs"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <span className="text-xs font-medium" style={{ color: character.theme.accent }}>
              {character.name}
            </span>
            <VoiceToggle />
            <ThemeToggle />
          </>
        }
        headerRight={
          <button
            onClick={() => dispatch(vnControls.handleToggleAutoAdvance())}
            className="flex items-center gap-1 text-xs transition-colors"
            style={{ color: state.autoAdvance ? character.theme.accent : "rgba(255,255,255,0.5)" }}
          >
            <div className="w-7 h-3.5 rounded-full relative transition-colors"
              style={{ backgroundColor: state.autoAdvance ? `${character.theme.accent}40` : "rgba(255,255,255,0.15)" }}>
              <div className="absolute top-0.5 w-2.5 h-2.5 rounded-full transition-all"
                style={{
                  backgroundColor: state.autoAdvance ? character.theme.accent : "rgba(255,255,255,0.4)",
                  left: state.autoAdvance ? "calc(100% - 12px)" : "2px",
                }}/>
            </div>
            Auto
          </button>
        }
        overlays={
          <>
            {/* Scene objects */}
            <SceneObjects
              sceneId={session.currentScene}
              accentColor={character.theme.accent}
              onObjectTap={handleSceneObjectTap}
            />

            {/* VN Menu */}
            <VNMenu
              accentColor={character.theme.accent}
              onSelect={(panel) => panels.openPanel(panel)}
              onSave={session.handleSave}
            />

            {/* Toasts */}
            {currentMilestone && (
              <MilestoneToast
                milestone={currentMilestone}
                accentColor={character.theme.accent}
                onDone={() => setCurrentMilestone(null)}
              />
            )}
            {session.saveToast && (
              <SaveToast
                message={session.saveToast.message}
                type={session.saveToast.type}
                onDone={() => session.setSaveToast(null)}
              />
            )}
            {discoveryToast && (
              <div style={{
                position: "absolute", bottom: 180, left: "50%", transform: "translateX(-50%)",
                zIndex: 25, maxWidth: "85%", padding: "10px 20px", borderRadius: 16,
                background: "rgba(10,10,16,0.88)", backdropFilter: "blur(10px)",
                border: `1px solid ${character.theme.accent}30`,
                color: "var(--color-dialogue-text, #e8e0e8)", fontSize: "14px",
                fontFamily: "var(--font-dialogue, 'Zen Maru Gothic', sans-serif)",
                textAlign: "center", animation: "fadeIn 0.3s ease-out, fadeIn 0.3s ease-in 3s reverse forwards",
                pointerEvents: "none",
              }}>
                <span style={{ color: character.theme.accent, fontWeight: 600, fontSize: "11px", letterSpacing: "0.05em", marginRight: 6 }}>
                  {character.name}:
                </span>
                {discoveryToast.line}
              </div>
            )}

            {/* Panels */}
            <ChatHistory
              messages={state.messages}
              characterName={character.name}
              accentColor={character.theme.accent}
              visible={panels.isOpen("history")}
              onClose={panels.closePanel}
            />
            <CharacterInfo
              character={character}
              visible={panels.isOpen("charInfo")}
              onClose={panels.closePanel}
            />
            {panels.isOpen("outfits") && (
              <OutfitCarousel
                characterId={characterId}
                basePath={character.sprite.basePath}
                accentColor={character.theme.accent}
                currentOutfit={session.outfit}
                onSelectOutfit={session.setOutfit}
                isOpen={true}
                onClose={panels.closePanel}
              />
            )}
            {panels.isOpen("diary") && (
              <DiaryView
                characterId={characterId}
                characterName={character.name}
                accentColor={character.theme.accent}
                onClose={panels.closePanel}
              />
            )}
            {panels.isOpen("gifts") && (
              <GiftShop
                characterId={characterId}
                characterName={character.name}
                accentColor={character.theme.accent}
                onGift={handleGift}
                onClose={panels.closePanel}
              />
            )}
            {panels.isOpen("quests") && (
              <QuestPanel
                characterId={characterId}
                accentColor={character.theme.accent}
                onClose={panels.closePanel}
                onClaimReward={(points) => session.addAffinity("message_sent")}
              />
            )}
            {panels.isOpen("scenes") && (
              <div style={{
                position: "fixed", bottom: 80, left: 0, right: 0, zIndex: 35,
                background: "rgba(10,10,16,0.9)", backdropFilter: "blur(14px)",
                borderTop: "1px solid rgba(255,255,255,0.1)", padding: "12px 12px 16px",
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(255,255,255,0.5)" }}>Scenes</span>
                  <button onClick={panels.closePanel} style={{ background: "rgba(255,255,255,0.1)", border: "none", borderRadius: "50%", width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "rgba(255,255,255,0.5)", fontSize: 14 }}>✕</button>
                </div>
                <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 2 }}>
                  {(Object.values(SCENES) as { id: SceneId; name: string; gradient: string }[]).map(scene => (
                    <button key={scene.id} onClick={() => { setSceneTransition(true); setTimeout(() => { session.setCurrentScene(scene.id); panels.closePanel(); }, 300); }}
                      style={{ flex: "0 0 auto", width: 60, display: "flex", flexDirection: "column", alignItems: "center", gap: 5, background: "transparent", border: "none", cursor: "pointer", padding: 0 }}>
                      <div style={{ width: 60, height: 40, borderRadius: 8, border: scene.id === session.currentScene ? `2px solid ${character.theme.accent}` : "2px solid rgba(255,255,255,0.1)", boxShadow: scene.id === session.currentScene ? `0 0 10px ${character.theme.accent}66` : "none", background: scene.gradient }} />
                      <span style={{ fontSize: 8, color: scene.id === session.currentScene ? character.theme.accent : "rgba(255,255,255,0.4)", fontWeight: scene.id === session.currentScene ? 600 : 400 }}>{scene.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Full-screen overlays */}
            {showConfession && (
              <ConfessionScene characterId={characterId} script={getConfessionScript(characterId)} onComplete={() => { markConfessed(characterId); setShowConfession(false); }} />
            )}
            {session.levelUpMilestone && (
              <MilestoneScene characterId={characterId} characterName={character.name} accentColor={character.theme.accent} level={session.levelUpMilestone.level} levelName={session.levelUpMilestone.levelName} onComplete={() => session.setLevelUpMilestone(null)} />
            )}
            {panels.isOpen("screenshot") && (
              <ScreenshotMode character={character} expression={state.currentExpression} lastLine={[...state.messages].reverse().find(m => m.role === "assistant")?.content || ""} visible={true} onClose={panels.closePanel} />
            )}

            {/* Hexx */}
            <BloodBat
              expression={state.currentExpression}
              accentColor={character.theme.accent}
              isIdle={state.phase === "idle" && state.messages.length > 0}
              chatPhrase={hexxPhrase}
              onChatPhraseDone={() => setHexxPhrase(null)}
            />

            {/* Scene transition */}
            <VNTransition active={sceneTransition} onComplete={() => setSceneTransition(false)} />
          </>
        }
      >
        {/* Bottom zone: dialogue or input */}
        {vnControls.showDialogue && (
          <DialogueBox
            characterName={character.name}
            characterId={characterId}
            accentColor={character.theme.accent}
            line={vnControls.isWaiting ? "..." : vnControls.currentLine}
            isTyping={state.isTyping}
            onAdvance={vnControls.handleAdvance}
            onTypeComplete={vnControls.handleTypeComplete}
            showAdvance={vnControls.showAdvanceIndicator}
            typeSpeed={session.textSpeed}
            expression={state.currentExpression}
          />
        )}

        {/* Conversation starters */}
        {starters.length > 0 && vnControls.showInput && (
          <div className="flex flex-wrap gap-2 px-4 mb-2 animate-[fadeIn_0.4s_ease-out]" style={{ position: "relative", zIndex: 22 }}>
            {starters.map(text => (
              <button key={text} onClick={() => { messageHandler.handleSend(text); setStarters([]); }}
                className="px-3 py-1.5 rounded-full text-xs transition-all hover:scale-105"
                style={{ background: `${character.theme.accent}15`, border: `1px solid ${character.theme.accent}30`, color: character.theme.accent }}>
                {text}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        {vnControls.showInput && (
          <div className="vn-input-zone">
            <form onSubmit={(e) => {
              e.preventDefault();
              const input = e.currentTarget.querySelector("input") as HTMLInputElement;
              if (input.value.trim()) { messageHandler.handleSend(input.value.trim()); input.value = ""; }
            }}>
              <input
                type="text"
                placeholder={`Talk to ${character.name}...`}
                autoFocus
                className="vn-input"
                style={{ borderColor: `${character.theme.accent}30` }}
                onFocus={(e) => { e.currentTarget.style.borderColor = `${character.theme.accent}80`; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = `${character.theme.accent}30`; }}
              />
            </form>
          </div>
        )}
      </VNLayout>
    </>
  );
}

function LoadingSkeleton() {
  return (
    <div className="h-screen bg-black flex flex-col items-center justify-center overflow-hidden relative">
      <style>{`
        @keyframes skeleton-shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        @keyframes skeleton-pulse-outline { 0%, 100% { opacity: 0.15; } 50% { opacity: 0.4; } }
        .skeleton-silhouette { width: 180px; height: 320px; border-radius: 24px; background: linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.03) 75%); background-size: 200% 100%; animation: skeleton-shimmer 1.8s ease-in-out infinite; position: relative; }
        .skeleton-silhouette::after { content: ''; position: absolute; inset: -2px; border-radius: 26px; border: 2px solid rgba(255,255,255,0.2); animation: skeleton-pulse-outline 2s ease-in-out infinite; pointer-events: none; }
        .skeleton-bar { height: 12px; border-radius: 6px; background: linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%); background-size: 200% 100%; animation: skeleton-shimmer 1.8s ease-in-out infinite; }
      `}</style>
      <div className="skeleton-silhouette" />
      <div style={{ marginTop: 32, width: 220, display: "flex", flexDirection: "column", gap: 8 }}>
        <div className="skeleton-bar" style={{ width: "60%" }} />
        <div className="skeleton-bar" style={{ width: "90%" }} />
        <div className="skeleton-bar" style={{ width: "40%" }} />
      </div>
    </div>
  );
}

function ClientOnly({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <LoadingSkeleton />;
  return <>{children}</>;
}

export default function ChatPage({ params }: { params: Promise<{ characterId: string }> }) {
  const { characterId } = use(params);
  return (
    <ClientOnly>
      <ChatProvider characterId={characterId}>
        <ChatContent characterId={characterId} />
      </ChatProvider>
    </ClientOnly>
  );
}
```

- [ ] **Step 2: Verify the build compiles**

Run: `cd "C:/Users/G$/Kikaku 企画/anime-chatbot" && npx next build 2>&1 | head -50`
Expected: No TypeScript errors. Build succeeds or only warns.

- [ ] **Step 3: Run all tests**

Run: `cd "C:/Users/G$/Kikaku 企画/anime-chatbot" && npx vitest run`
Expected: All tests pass

- [ ] **Step 4: Commit**

```bash
git add src/app/chat/\\[characterId\\]/page.tsx
git commit -m "refactor: rewrite chat page using extracted hooks and VN layout"
```

---

## Task 11: Visual QA and polish pass

**Files:**
- Possibly modify: `src/components/CharacterSprite.tsx`, `src/components/VNLayout.tsx`, `src/styles/globals.css`

- [ ] **Step 1: Start dev server and test in browser**

Run: `cd "C:/Users/G$/Kikaku 企画/anime-chatbot" && rm -rf .next && npx next dev --webpack -p 3000`

Open http://localhost:3000 and test:
1. Landing page still works, character cards navigate to chat
2. Chat page: scene fills viewport, sprite is centered and dominant
3. Dialogue box overlays the bottom of the scene (semi-transparent gradient)
4. Input field appears at bottom when idle, feels integrated
5. VN menu (bottom-right +) opens fan of options
6. Each menu option opens the correct panel (outfits, gifts, diary, quests, scenes)
7. Panels close properly (tap menu item or close button)
8. Expression changes still work (sparkle, shake, blush effects)
9. Auto-advance toggle works
10. Swipe right opens history on mobile
11. BloodBat still visible and interactive
12. Conversation starters appear on first visit
13. TTS and typewriter work
14. Scene transitions fade to black when switching scenes

- [ ] **Step 2: Fix any visual issues found**

Adjust VNLayout, CSS, or component styling as needed. Common fixes:
- Sprite positioning/sizing in the viewport
- Dialogue box height on different screens
- VN menu position on mobile vs desktop
- z-index layering between menu, panels, and dialogue

- [ ] **Step 3: Run full test suite**

Run: `cd "C:/Users/G$/Kikaku 企画/anime-chatbot" && npx vitest run`
Expected: All tests pass

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "fix: visual QA polish for VN layout, menu, and dialogue overlay"
```

---

## Task 12: Clean up retired components

**Files:**
- Delete: `src/components/BottomNav.tsx` (replaced by VNMenu)
- Delete: `src/components/ControlBar.tsx` (absorbed into VNLayout header)
- Delete: `src/components/ChatInput.tsx` (input integrated into chat page)
- Delete: `src/components/PageTransition.tsx` (replaced by VNLayout)
- Modify: Any remaining imports of deleted components

- [ ] **Step 1: Search for remaining imports of retired components**

Run: `cd "C:/Users/G$/Kikaku 企画/anime-chatbot" && grep -rn "BottomNav\|ControlBar\|ChatInput\|PageTransition" src/ --include="*.tsx" --include="*.ts" | grep -v node_modules`

Fix any remaining imports found. The chat page should no longer import these.

- [ ] **Step 2: Delete retired files**

```bash
cd "C:/Users/G$/Kikaku 企画/anime-chatbot"
rm src/components/BottomNav.tsx
rm src/components/ControlBar.tsx
rm src/components/ChatInput.tsx
rm src/components/PageTransition.tsx
```

- [ ] **Step 3: Verify build still compiles**

Run: `cd "C:/Users/G$/Kikaku 企画/anime-chatbot" && npx next build 2>&1 | head -30`
Expected: No import errors

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: remove retired components (BottomNav, ControlBar, ChatInput, PageTransition)"
```

---

## Summary of transformation

| Before | After |
|--------|-------|
| 1178-line chat page doing everything | ~200-line page composing 5 hooks + VNLayout |
| Chat app layout (sections stacked vertically) | Fullscreen VN viewport (layers stacked visually) |
| BottomNav with 6 always-visible buttons | Hidden radial VNMenu, triggered by corner button |
| DialogueBox as a card below the sprite | Semi-transparent overlay on the scene |
| No scene transitions | Fade-to-black transitions between scenes |
| No assistant architecture | SceneObjects framework ready for notebooks, clocks, reminders |
| AffinityProgressBar always visible | Moved to VNMenu (on-demand) |
| Control bar with 12+ buttons | Minimal glass header: back, name, voice, theme, auto |
| Multiple overlapping panels from different directions | Single panel state machine (usePanels) — one at a time |
