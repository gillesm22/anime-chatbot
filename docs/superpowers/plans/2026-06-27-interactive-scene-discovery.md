# Interactive Scene Discovery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make scene backgrounds interactive with discoverable elements that earn affinity, trigger character reactions, and unlock outfits/diary entries/scenes — with progressive reveal based on affinity level.

**Architecture:** A new `discoveries.ts` module defines all interactable elements, their rewards, cooldowns, and per-character reaction pools. `InteractiveElements.tsx` is refactored to render elements from this data (instead of hardcoded per-scene switch). The chat page wires up discovery taps to affinity, quests, and an optional AI-generated first-discovery context sent to the API.

**Tech Stack:** React state, localStorage persistence, existing affinity/quest/diary systems, Web Audio API for discovery sound.

---

### Task 1: Create discoveries.ts — types and state management

**Files:**
- Create: `src/lib/discoveries.ts`
- Create: `__tests__/lib/discoveries.test.ts`

- [ ] **Step 1: Write failing tests for state management**

Create `__tests__/lib/discoveries.test.ts`:

```typescript
import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  getDiscoveryState,
  recordTap,
  isDiscovered,
  getVisibleInteractables,
  type Interactable,
  type DiscoveryRecord,
} from "@/lib/discoveries";

// Mock localStorage
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
    recordTap("arisu", "sakura-tree", 0); // 0s cooldown for test
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
  it("returns only visible elements at level 1", () => {
    const items: Interactable[] = [
      { id: "a", sceneId: "sakura", type: "visible", revealAt: 0, position: { x: 6, y: 6, width: 10, height: 10 }, emoji: "🌸", label: "Tree", affinityPerTap: 2, cooldown: 30, reward: { type: "affinity", value: 5 }, aiOnFirstDiscovery: false, reactions: {} },
      { id: "b", sceneId: "sakura", type: "hidden", revealAt: 2, position: { x: 50, y: 50, width: 8, height: 8 }, emoji: "🦋", label: "Butterfly", affinityPerTap: 2, cooldown: 30, reward: { type: "diary", value: "butterfly" }, aiOnFirstDiscovery: true, reactions: {} },
    ];
    const result = getVisibleInteractables(items, 1, "arisu");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("a");
  });

  it("shows shimmer for hidden elements at matching level", () => {
    const items: Interactable[] = [
      { id: "b", sceneId: "sakura", type: "hidden", revealAt: 2, position: { x: 50, y: 50, width: 8, height: 8 }, emoji: "🦋", label: "Butterfly", affinityPerTap: 2, cooldown: 30, reward: { type: "diary", value: "butterfly" }, aiOnFirstDiscovery: true, reactions: {} },
    ];
    const result = getVisibleInteractables(items, 2, "arisu");
    expect(result).toHaveLength(1);
    expect(result[0].displayMode).toBe("shimmer");
  });

  it("shows full emoji for discovered hidden elements", () => {
    recordTap("arisu", "b", 30);
    const items: Interactable[] = [
      { id: "b", sceneId: "sakura", type: "hidden", revealAt: 2, position: { x: 50, y: 50, width: 8, height: 8 }, emoji: "🦋", label: "Butterfly", affinityPerTap: 2, cooldown: 30, reward: { type: "diary", value: "butterfly" }, aiOnFirstDiscovery: true, reactions: {} },
    ];
    const result = getVisibleInteractables(items, 2, "arisu");
    expect(result[0].displayMode).toBe("full");
  });

  it("shows dim emoji for lower-level hidden elements at higher levels", () => {
    const items: Interactable[] = [
      { id: "b", sceneId: "sakura", type: "hidden", revealAt: 2, position: { x: 50, y: 50, width: 8, height: 8 }, emoji: "🦋", label: "Butterfly", affinityPerTap: 2, cooldown: 30, reward: { type: "diary", value: "butterfly" }, aiOnFirstDiscovery: true, reactions: {} },
    ];
    const result = getVisibleInteractables(items, 3, "arisu");
    expect(result[0].displayMode).toBe("dim");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run __tests__/lib/discoveries.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement types and state management**

Create `src/lib/discoveries.ts`:

```typescript
"use client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Interactable {
  id: string;
  sceneId: string;
  type: "visible" | "hidden";
  revealAt: number; // affinity level needed for hint (0 = always visible)
  position: { x: number; y: number; width: number; height: number }; // percentages
  emoji: string;
  label: string;
  affinityPerTap: number;
  cooldown: number; // seconds between earning affinity
  reward: { type: "affinity" | "outfit" | "diary" | "scene"; value: string | number };
  aiOnFirstDiscovery: boolean;
  reactions: Partial<Record<string, ReactionPool>>; // keyed by characterId
}

export interface ReactionPool {
  lines: string[];
  expression: string;
}

export interface DiscoveryRecord {
  discovered: boolean;
  tapCount: number;
  lastTapTime: number; // Date.now() ms
}

export interface VisibleInteractable extends Interactable {
  displayMode: "full" | "shimmer" | "dim";
}

export interface TapResult {
  isFirstDiscovery: boolean;
  affinityEarned: boolean;
}

// ---------------------------------------------------------------------------
// State management
// ---------------------------------------------------------------------------

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
    // First ever tap
    state[interactableId] = { discovered: true, tapCount: 1, lastTapTime: now };
    saveDiscoveryState(characterId, state);
    return { isFirstDiscovery: true, affinityEarned: true };
  }

  // Subsequent tap
  const elapsed = (now - record.lastTapTime) / 1000;
  const affinityEarned = elapsed >= cooldownSeconds;

  record.tapCount += 1;
  if (affinityEarned) {
    record.lastTapTime = now;
  }
  saveDiscoveryState(characterId, state);

  return { isFirstDiscovery: false, affinityEarned };
}

// ---------------------------------------------------------------------------
// Visibility logic
// ---------------------------------------------------------------------------

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

    // Hidden element
    const discovered = isDiscovered(characterId, item.id);

    if (discovered) {
      // Already found — always show full
      result.push({ ...item, displayMode: "full" });
    } else if (affinityLevel >= item.revealAt + 1) {
      // One level above reveal threshold — show dim emoji hint
      result.push({ ...item, displayMode: "dim" });
    } else if (affinityLevel >= item.revealAt) {
      // At reveal threshold — show shimmer only
      result.push({ ...item, displayMode: "shimmer" });
    }
    // Below threshold — not visible at all
  }

  return result;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run __tests__/lib/discoveries.test.ts`
Expected: ALL PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/discoveries.ts __tests__/lib/discoveries.test.ts
git commit -m "feat: add discovery state management with types, tap tracking, and visibility logic"
```

---

### Task 2: Add interactable definitions and character reaction pools

**Files:**
- Modify: `src/lib/discoveries.ts`

- [ ] **Step 1: Add all interactable definitions**

Add to the bottom of `src/lib/discoveries.ts`:

```typescript
// ---------------------------------------------------------------------------
// Interactable definitions
// ---------------------------------------------------------------------------

export const ALL_INTERACTABLES: Interactable[] = [
  // ── Sakura ──
  {
    id: "sakura-tree", sceneId: "sakura", type: "visible", revealAt: 0,
    position: { x: 6, y: 6, width: 12, height: 12 }, emoji: "🌸", label: "Shake the sakura tree",
    affinityPerTap: 2, cooldown: 30, reward: { type: "affinity", value: 5 }, aiOnFirstDiscovery: false,
    reactions: {
      arisu: { lines: ["The petals are dancing~", "So beautiful... like pink snow!", "Careful, you'll shake them all off!"], expression: "happy" },
      marin: { lines: ["PETAL SHOWER!! yooo!", "Haha it's raining flowers!", "This is so anime right now~"], expression: "excited" },
      nao: { lines: ["Interesting aerodynamic patterns...", "The scatter radius is approximately—", "...okay that was actually pretty."], expression: "thinking" },
      kurisu: { lines: ["It's just botanics. ...The color IS nice though.", "Don't break the branch, idiot.", "Cherry blossoms are overrated. ...Keep shaking."], expression: "smirk" },
      merrick: { lines: ["The blossoms fall like whispered secrets...", "Even flowers know when to let go.", "Beautiful... in a fleeting sort of way."], expression: "thinking" },
    },
  },
  {
    id: "sakura-butterfly", sceneId: "sakura", type: "hidden", revealAt: 2,
    position: { x: 18, y: 14, width: 8, height: 8 }, emoji: "🦋", label: "A butterfly in the branches",
    affinityPerTap: 2, cooldown: 30, reward: { type: "diary", value: "A butterfly landed on my shoulder today. It felt like a tiny miracle." }, aiOnFirstDiscovery: true,
    reactions: {
      arisu: { lines: ["Oh! A butterfly! Stay still...", "She likes you~", "So delicate..."], expression: "surprised" },
      marin: { lines: ["OMG a butterfly!! don't move!", "She's so pretty~!", "Quick take a pic— oh wait"], expression: "excited" },
      nao: { lines: ["Lepidoptera... fascinating wing pattern.", "Don't scare it. I'm observing.", "Its UV reflectance must be remarkable."], expression: "thinking" },
      kurisu: { lines: ["It's just a Vanessa cardui. ...Don't scare it.", "Insects don't have feelings. ...Stay still anyway.", "...Fine, it's somewhat elegant."], expression: "shy" },
      merrick: { lines: ["A messenger from the fae realm...", "She chose you. That's not nothing.", "The winged ones always know."], expression: "devoted" },
    },
  },
  {
    id: "sakura-windchime", sceneId: "sakura", type: "hidden", revealAt: 3,
    position: { x: 3, y: 22, width: 6, height: 8 }, emoji: "🎐", label: "A wind chime",
    affinityPerTap: 2, cooldown: 30, reward: { type: "affinity", value: 10 }, aiOnFirstDiscovery: false,
    reactions: {
      arisu: { lines: ["That sound is so calming~", "Wind chimes make everything better.", "Listen... so peaceful."], expression: "happy" },
      marin: { lines: ["Ooh wind chime vibes~", "That's such a summer sound!", "Ding ding~ hehe"], expression: "happy" },
      nao: { lines: ["Resonant frequency analysis in progress...", "The harmonic overtones are pleasant.", "...I want one for my room."], expression: "thinking" },
      kurisu: { lines: ["Simple acoustic physics. ...It IS soothing.", "Traditional Japanese fūrin. Scientifically unremarkable.", "Don't stare at me, I'm not enjoying this."], expression: "smirk" },
      merrick: { lines: ["The chimes speak to the spirits...", "An ancient ward against malevolence.", "I hear melodies you cannot."], expression: "happy" },
    },
  },
  // ── Beach ──
  {
    id: "beach-splash", sceneId: "beach", type: "visible", revealAt: 0,
    position: { x: 20, y: 88, width: 60, height: 8 }, emoji: "🌊", label: "Splash the water",
    affinityPerTap: 2, cooldown: 30, reward: { type: "affinity", value: 5 }, aiOnFirstDiscovery: false,
    reactions: {
      arisu: { lines: ["Ahh! You got me wet!", "The water feels so nice~", "Hehe, splash fight?"], expression: "surprised" },
      marin: { lines: ["SPLASH WAR!! let's GO!", "Haha you're soaked!", "The waves are PERFECT today!"], expression: "excited" },
      nao: { lines: ["Water temperature: acceptable.", "Hydrodynamic chaos achieved.", "...okay that was refreshing."], expression: "smirk" },
      kurisu: { lines: ["HEY! My notes—! ...they're waterproof, but still!", "Salt water and electronics don't mix!", "...Fine, once more. For science."], expression: "angry" },
      merrick: { lines: ["The sea's embrace... cold but honest.", "Salt water has purifying properties.", "The tides know secrets we've forgotten."], expression: "thinking" },
    },
  },
  {
    id: "beach-shell", sceneId: "beach", type: "hidden", revealAt: 2,
    position: { x: 72, y: 82, width: 8, height: 8 }, emoji: "🐚", label: "A shell in the sand",
    affinityPerTap: 2, cooldown: 30, reward: { type: "diary", value: "We found a beautiful shell on the beach today. I can still hear the ocean in it." }, aiOnFirstDiscovery: false,
    reactions: {
      arisu: { lines: ["Oh, it's so pretty! Keep it safe~", "Can you hear the ocean in it?", "A gift from the sea..."], expression: "happy" },
      marin: { lines: ["Yooo that's a sick shell!", "Shell necklace arc incoming~", "Nature's accessory! love it!"], expression: "excited" },
      nao: { lines: ["Interesting calcium carbonate formation...", "The spiral follows a Fibonacci sequence.", "...I'm keeping this one."], expression: "thinking" },
      kurisu: { lines: ["It's just a shell. ...Fine, it's somewhat unique.", "Calcium carbonate. Nothing more.", "...Put it in my bag. For research."], expression: "smirk" },
      merrick: { lines: ["The sea offers its treasures to those who listen.", "Every shell holds a memory of the deep.", "A relic from Poseidon's court."], expression: "thinking" },
    },
  },
  {
    id: "beach-crab", sceneId: "beach", type: "hidden", revealAt: 4,
    position: { x: 10, y: 85, width: 8, height: 8 }, emoji: "🦀", label: "A crab under a rock",
    affinityPerTap: 2, cooldown: 30, reward: { type: "outfit", value: "bikini-front" }, aiOnFirstDiscovery: true,
    reactions: {
      arisu: { lines: ["Eep! A crab! Is it friendly?", "He's so tiny and brave~", "Don't let him pinch you!"], expression: "surprised" },
      marin: { lines: ["CRAB!! he's angy haha!", "Look at him go sideways~", "lil dude has ATTITUDE"], expression: "laugh" },
      nao: { lines: ["Brachyura detected. Threat level: minimal.", "Its carapace structure is remarkable.", "...don't let it near my cables."], expression: "thinking" },
      kurisu: { lines: ["Decapoda crustacean. Keep it away from me.", "Its pincer force-to-body ratio is interesting.", "I am NOT scared. I'm just... cautious."], expression: "flustered" },
      merrick: { lines: ["A creature of the twilight shore.", "Even the smallest being commands respect.", "He guards something precious beneath."], expression: "thinking" },
    },
  },
  // ── Cafe ──
  {
    id: "cafe-coffee", sceneId: "cafe", type: "visible", revealAt: 0,
    position: { x: 82, y: 72, width: 10, height: 10 }, emoji: "☕", label: "Tap the coffee cup",
    affinityPerTap: 2, cooldown: 30, reward: { type: "affinity", value: 5 }, aiOnFirstDiscovery: false,
    reactions: {
      arisu: { lines: ["Mmm, it smells wonderful~", "Want to share a cup?", "Coffee always makes things better."], expression: "happy" },
      marin: { lines: ["Caffeine time BABY!", "Iced or hot? trick question, BOTH", "This latte art is fire~"], expression: "excited" },
      nao: { lines: ["Caffeine: the programmer's elixir.", "Optimal brew temperature: 96°C.", "...third cup. No judgment."], expression: "smirk" },
      kurisu: { lines: ["Dr Pepper is superior, but... this will do.", "The aroma is... acceptable.", "Don't judge my caffeine dependency."], expression: "thinking" },
      merrick: { lines: ["Dark, bitter, comforting... like the night.", "Mortals did get one thing right.", "A worthy brew."], expression: "happy" },
    },
  },
  {
    id: "cafe-cat", sceneId: "cafe", type: "hidden", revealAt: 2,
    position: { x: 65, y: 80, width: 10, height: 10 }, emoji: "🐱", label: "A cat under the table",
    affinityPerTap: 2, cooldown: 30, reward: { type: "diary", value: "There was a cat hiding under the cafe table today. It purred when we found it. Perfect moment." }, aiOnFirstDiscovery: true,
    reactions: {
      arisu: { lines: ["Aww, a kitty! Come here~", "She's purring! So sweet...", "Can we adopt her?"], expression: "happy" },
      marin: { lines: ["OMG A CAT. best day ever", "pspspsps come here bb~", "I'm literally dying she's so cute"], expression: "excited" },
      nao: { lines: ["...it's staring at me. I respect that.", "Felis catus. Independent operator.", "...fine, you can sit on my lap."], expression: "smirk" },
      kurisu: { lines: ["A stray? Don't expect me to pet it. ...okay, once.", "Its thermal imaging would be interesting to—", "Stop purring. I'm not charmed. ...I'm slightly charmed."], expression: "shy" },
      merrick: { lines: ["A creature of shadows. We understand each other.", "Cats see what humans cannot.", "She chose this table for a reason."], expression: "happy" },
    },
  },
  {
    id: "cafe-book", sceneId: "cafe", type: "hidden", revealAt: 3,
    position: { x: 88, y: 40, width: 8, height: 10 }, emoji: "📖", label: "An old book on the shelf",
    affinityPerTap: 2, cooldown: 30, reward: { type: "affinity", value: 10 }, aiOnFirstDiscovery: false,
    reactions: {
      arisu: { lines: ["Oh, someone left a book here!", "I wonder what story it holds...", "The pages smell like vanilla~"], expression: "thinking" },
      marin: { lines: ["Ooh vintage vibes~", "Is this a romance? please say yes", "Old books hit different"], expression: "happy" },
      nao: { lines: ["First edition? Interesting.", "The margin notes are encrypted...", "Someone left a cipher in chapter 3."], expression: "excited" },
      kurisu: { lines: ["A scientific journal? No... poetry. Hmph.", "The binding technique dates to the Meiji era.", "...I'll just skim the first chapter."], expression: "thinking" },
      merrick: { lines: ["Ancient words, still breathing.", "This tome remembers its readers.", "Knowledge preserved is power stored."], expression: "thinking" },
    },
  },
  // ── Cyberpunk ──
  {
    id: "cyberpunk-neon", sceneId: "cyberpunk", type: "visible", revealAt: 0,
    position: { x: 78, y: 5, width: 16, height: 8 }, emoji: "", label: "Toggle neon sign",
    affinityPerTap: 2, cooldown: 30, reward: { type: "affinity", value: 5 }, aiOnFirstDiscovery: false,
    reactions: {
      arisu: { lines: ["The lights are so pretty!", "Neon always feels magical~", "Like a movie scene!"], expression: "happy" },
      marin: { lines: ["NEON AESTHETIC let's gooo!", "This lighting is *chef's kiss*", "Cyberpunk vibes are ELITE"], expression: "excited" },
      nao: { lines: ["Gas discharge illumination. My domain.", "The flicker frequency is intentional.", "...I designed one of these once."], expression: "smug" },
      kurisu: { lines: ["Inefficient lighting. But atmospheric.", "Noble gas excitation. Basic physics.", "...the purple one is nice."], expression: "thinking" },
      merrick: { lines: ["Artificial starlight for the modern age.", "Mortals try to bottle the night.", "The colors pulse like a heartbeat."], expression: "thinking" },
    },
  },
  {
    id: "cyberpunk-arcade", sceneId: "cyberpunk", type: "hidden", revealAt: 2,
    position: { x: 5, y: 60, width: 10, height: 14 }, emoji: "🕹️", label: "An arcade machine",
    affinityPerTap: 2, cooldown: 30, reward: { type: "affinity", value: 10 }, aiOnFirstDiscovery: false,
    reactions: {
      arisu: { lines: ["Oh! Can we play together?", "I'm not very good at games...", "The pixel art is so cute~"], expression: "happy" },
      marin: { lines: ["ARCADE!! I call player one!", "Bet I can beat your high score~", "Retro gaming is WHERE IT'S AT"], expression: "excited" },
      nao: { lines: ["Original hardware. Respect.", "The input lag is 4ms. Acceptable.", "I've reverse-engineered this ROM before."], expression: "excited" },
      kurisu: { lines: ["Outdated hardware. ...One round won't hurt.", "The CRT phosphor response is superior to LCD.", "I'm not competitive. I just don't lose."], expression: "smirk" },
      merrick: { lines: ["Mortals and their digital rituals...", "The machine remembers every player.", "...I'm curious about the high score."], expression: "curious" },
    },
  },
  {
    id: "cyberpunk-robot", sceneId: "cyberpunk", type: "hidden", revealAt: 4,
    position: { x: 8, y: 30, width: 8, height: 10 }, emoji: "🤖", label: "A hidden robot in the alley",
    affinityPerTap: 2, cooldown: 30, reward: { type: "outfit", value: "demon" }, aiOnFirstDiscovery: true,
    reactions: {
      arisu: { lines: ["Is it... alive?", "It blinked! I saw it!", "Should we help it?"], expression: "surprised" },
      marin: { lines: ["ROBOT?! this is SO COOL!", "It looks like it's from a movie!", "Can it dance? please say yes"], expression: "excited" },
      nao: { lines: ["Autonomous unit. Who built this?!", "The servo motors are custom... incredible.", "I need to open it up. FOR SCIENCE."], expression: "excited" },
      kurisu: { lines: ["Impossible— this level of AI shouldn't exist here!", "The neural pathways are... organic?!", "This changes everything I know about—!"], expression: "surprised" },
      merrick: { lines: ["A golem of iron and lightning.", "It stirs... something ancient in metal form.", "Even machines can dream."], expression: "thinking" },
    },
  },
  // ── Rain ──
  {
    id: "rain-thunder", sceneId: "rain", type: "visible", revealAt: 0,
    position: { x: 35, y: 20, width: 30, height: 45 }, emoji: "🌩️", label: "Tap the window",
    affinityPerTap: 2, cooldown: 30, reward: { type: "affinity", value: 5 }, aiOnFirstDiscovery: false,
    reactions: {
      arisu: { lines: ["Eep! That was loud!", "The rain sounds so cozy from inside...", "Hold my hand? Just in case..."], expression: "surprised" },
      marin: { lines: ["THUNDER!! that was sick!", "Rain day = anime marathon day", "I love storm energy~"], expression: "excited" },
      nao: { lines: ["Electrostatic discharge. Beautiful.", "Calculating distance by delay...", "3.2 kilometers. Getting closer."], expression: "thinking" },
      kurisu: { lines: ["Just atmospheric electricity. Nothing to fear.", "The Lichtenberg patterns are fascinating.", "...okay that one was close."], expression: "surprised" },
      merrick: { lines: ["The sky speaks in thunder.", "Storms are the earth's poetry.", "I feel most alive in the rain."], expression: "happy" },
    },
  },
  {
    id: "rain-frog", sceneId: "rain", type: "hidden", revealAt: 2,
    position: { x: 70, y: 55, width: 8, height: 8 }, emoji: "🐸", label: "A frog on the windowsill",
    affinityPerTap: 2, cooldown: 30, reward: { type: "diary", value: "A little frog sat on the windowsill while it rained. We watched the storm together in silence. It was perfect." }, aiOnFirstDiscovery: true,
    reactions: {
      arisu: { lines: ["A little frog! Don't scare him...", "He's enjoying the rain too~", "So tiny and brave!"], expression: "happy" },
      marin: { lines: ["FROG! haha he's so round", "Ribbit ribbit~ hehe", "He's vibing harder than us"], expression: "laugh" },
      nao: { lines: ["Amphibian surveillance unit detected.", "Rain-responsive biomonitor. Noted.", "...he's just sitting there. Power move."], expression: "smirk" },
      kurisu: { lines: ["Rana temporaria. Nothing special. ...It IS sort of cute.", "Its skin secretions have interesting compounds.", "...stop looking at me like that, frog."], expression: "shy" },
      merrick: { lines: ["Even the smallest beings hold ancient wisdom.", "The frog sees between worlds.", "A rain singer. How rare."], expression: "happy" },
    },
  },
  {
    id: "rain-umbrella", sceneId: "rain", type: "hidden", revealAt: 3,
    position: { x: 15, y: 70, width: 8, height: 10 }, emoji: "☂️", label: "A forgotten umbrella",
    affinityPerTap: 2, cooldown: 30, reward: { type: "affinity", value: 10 }, aiOnFirstDiscovery: false,
    reactions: {
      arisu: { lines: ["Someone left their umbrella...", "We could share it!", "The color is so pretty~"], expression: "thinking" },
      marin: { lines: ["Sharing an umbrella is like, peak romance~", "Dibs on holding it!", "Anime umbrella scene ACTIVATED"], expression: "happy" },
      nao: { lines: ["Abandoned equipment. Mine now.", "The mechanism is jammed. I can fix it.", "...sharing an umbrella? That's... whatever."], expression: "shy" },
      kurisu: { lines: ["Someone's going to get wet. Not my problem.", "The folding mechanism is clever. German engineering?", "...we could share. Purely practical."], expression: "flustered" },
      merrick: { lines: ["The rain does not bother me, but... thank you.", "Left behind by fate, found by us.", "An umbrella shared is a bond formed."], expression: "happy" },
    },
  },
  // ── Night Sky ──
  {
    id: "nightsky-star", sceneId: "night_sky", type: "visible", revealAt: 0,
    position: { x: 10, y: 2, width: 80, height: 35 }, emoji: "✨", label: "Make a shooting star",
    affinityPerTap: 2, cooldown: 30, reward: { type: "affinity", value: 5 }, aiOnFirstDiscovery: false,
    reactions: {
      arisu: { lines: ["Make a wish, quick!", "Did you see that?!", "So beautiful..."], expression: "excited" },
      marin: { lines: ["SHOOTING STAR!! make a wish!", "That was SO COOL!", "Universe is showing off tonight~"], expression: "excited" },
      nao: { lines: ["Meteoroid entry velocity: impressive.", "Actually a grain of cosmic dust burning up.", "...I wished anyway. Don't tell anyone."], expression: "thinking" },
      kurisu: { lines: ["A meteoroid. Not magic. ...I still made a wish.", "Atmospheric friction at 70km/s. Beautiful physics.", "Wishes are irrational. I'll make one anyway."], expression: "smirk" },
      merrick: { lines: ["The stars fall to meet us...", "A celestial gift. Catch it in your heart.", "I've seen centuries of falling stars."], expression: "happy" },
    },
  },
  {
    id: "nightsky-telescope", sceneId: "night_sky", type: "hidden", revealAt: 2,
    position: { x: 80, y: 40, width: 10, height: 14 }, emoji: "🔭", label: "A telescope",
    affinityPerTap: 2, cooldown: 30, reward: { type: "affinity", value: 10 }, aiOnFirstDiscovery: false,
    reactions: {
      arisu: { lines: ["Oh! Can we look at the moon?", "The stars are even prettier up close~", "I see... a constellation! Maybe."], expression: "excited" },
      marin: { lines: ["Let me see let me see!!", "Can we find aliens? asking for me", "The moon looks INSANE through this!"], expression: "excited" },
      nao: { lines: ["8-inch reflector. Decent optics.", "I can see the Orion Nebula from here.", "...this is mine now."], expression: "excited" },
      kurisu: { lines: ["The focal length is adequate.", "Jupiter's moons are visible tonight.", "...hand it over, I need to check something."], expression: "thinking" },
      merrick: { lines: ["Mortals reaching for the infinite.", "I see farther without it, but... the gesture matters.", "Point it at Aldebaran. Trust me."], expression: "thinking" },
    },
  },
  {
    id: "nightsky-ufo", sceneId: "night_sky", type: "hidden", revealAt: 4,
    position: { x: 60, y: 8, width: 10, height: 10 }, emoji: "🛸", label: "Something in the sky...",
    affinityPerTap: 2, cooldown: 30, reward: { type: "scene", value: "starfield" }, aiOnFirstDiscovery: true,
    reactions: {
      arisu: { lines: ["W-what is that?!", "Are they... friendly?", "Hold me! I'm scared!"], expression: "surprised" },
      marin: { lines: ["NO WAY. NO. WAY.", "WE'RE BEING ABDUCTED AND I'M HERE FOR IT", "ALIENS ARE REAL I KNEW IT"], expression: "excited" },
      nao: { lines: ["FINALLY. I've been tracking anomalies for weeks!", "Signal frequency matches my predictions!", "This changes EVERYTHING."], expression: "excited" },
      kurisu: { lines: ["That's— that's impossible! My readings—!", "Unknown propulsion system. I need data!", "This violates at least seven known laws of physics!"], expression: "surprised" },
      merrick: { lines: ["They return at last...", "The visitors from beyond the veil.", "I've been expecting them."], expression: "thinking" },
    },
  },
  // ── Cozy Room ──
  {
    id: "cozy-fire", sceneId: "cozy_room", type: "visible", revealAt: 0,
    position: { x: 38, y: 85, width: 24, height: 10 }, emoji: "🔥", label: "Toggle the fireplace",
    affinityPerTap: 2, cooldown: 30, reward: { type: "affinity", value: 5 }, aiOnFirstDiscovery: false,
    reactions: {
      arisu: { lines: ["So warm and cozy~", "The crackling sound is so soothing.", "Can we stay like this forever?"], expression: "happy" },
      marin: { lines: ["COZY MODE ACTIVATED!", "Marshmallows!! we need marshmallows!", "This is literally peak vibes"], expression: "excited" },
      nao: { lines: ["Combustion temperature: optimal.", "The infrared radiation is... pleasant.", "...fine, this is nice."], expression: "happy" },
      kurisu: { lines: ["Efficient heat transfer via radiation.", "The flame color indicates complete combustion.", "...pass me that blanket."], expression: "happy" },
      merrick: { lines: ["Fire... humanity's oldest companion.", "The flames dance like lost souls.", "Warm at last."], expression: "happy" },
    },
  },
  {
    id: "cozy-teddy", sceneId: "cozy_room", type: "hidden", revealAt: 2,
    position: { x: 82, y: 35, width: 8, height: 10 }, emoji: "🧸", label: "A teddy bear on the shelf",
    affinityPerTap: 2, cooldown: 30, reward: { type: "diary", value: "Found an old teddy bear on the shelf. It looked well-loved. Someone's precious memory, still waiting." }, aiOnFirstDiscovery: false,
    reactions: {
      arisu: { lines: ["Aww, a teddy! He looks well-loved~", "Someone must really treasure him.", "He's been waiting for us!"], expression: "happy" },
      marin: { lines: ["TEDDY BEAR!! he's so squishyy~", "I'm naming him Mr. Fluffington", "10/10 would hug"], expression: "excited" },
      nao: { lines: ["Synthetic plush construct. Sentimental value: high.", "The wear patterns suggest years of use.", "...I had one once. Classified information."], expression: "shy" },
      kurisu: { lines: ["A children's comfort object. Nothing more.", "The polyester filling has degraded— why am I analyzing this?", "...he has a kind face. Shut up."], expression: "flustered" },
      merrick: { lines: ["A guardian of dreams.", "Even stuffed with cotton, he holds memories.", "The old ones remember everything."], expression: "thinking" },
    },
  },
  {
    id: "cozy-photo", sceneId: "cozy_room", type: "hidden", revealAt: 3,
    position: { x: 15, y: 30, width: 10, height: 12 }, emoji: "📷", label: "A photo album",
    affinityPerTap: 2, cooldown: 30, reward: { type: "diary", value: "We found a photo album hidden in the room. The pictures were faded but full of smiles. Made me want to make memories like that too." }, aiOnFirstDiscovery: true,
    reactions: {
      arisu: { lines: ["Oh! Old photos... so nostalgic~", "These people look so happy!", "Let's make memories like these."], expression: "happy" },
      marin: { lines: ["Vintage photos!! the AESTHETICS!", "Everyone's smiling so hard~", "We should take photos too!"], expression: "happy" },
      nao: { lines: ["Analog photography. No metadata. Secure.", "The composition is... surprisingly artistic.", "Memories stored without cloud access. Admirable."], expression: "thinking" },
      kurisu: { lines: ["Silver halide emulsion. Obsolete but... beautiful.", "Each photo is a frozen timeline.", "We should— I mean, IF you wanted to take a photo sometime..."], expression: "flustered" },
      merrick: { lines: ["Moments captured against time's tide.", "I see ghosts in every photograph.", "These were happy days. You can feel it."], expression: "sad" },
    },
  },
  // ── Moonlight ──
  {
    id: "moonlight-moon", sceneId: "moonlight", type: "visible", revealAt: 0,
    position: { x: 42, y: 4, width: 12, height: 12 }, emoji: "🌕", label: "Cycle moon phases",
    affinityPerTap: 2, cooldown: 30, reward: { type: "affinity", value: 5 }, aiOnFirstDiscovery: false,
    reactions: {
      arisu: { lines: ["The moon is so beautiful tonight~", "It's like a pearl in the sky!", "Moonlight suits you..."], expression: "happy" },
      marin: { lines: ["Full moon selfie time~!", "The moon is literally GLOWING for us", "Moon vibes are immaculate~"], expression: "excited" },
      nao: { lines: ["Lunar phase progression: fascinating.", "Reflected sunlight at 0.12 albedo.", "...it IS prettier than my calculations suggest."], expression: "thinking" },
      kurisu: { lines: ["Tidal forces from lunar gravity are— beautiful.", "The terminator line is particularly sharp tonight.", "...I'm not being romantic. It's astronomy."], expression: "flustered" },
      merrick: { lines: ["The moon and I are old friends.", "She waxes and wanes, but never truly leaves.", "Under her light, all truths are revealed."], expression: "devoted" },
    },
  },
  {
    id: "moonlight-owl", sceneId: "moonlight", type: "hidden", revealAt: 2,
    position: { x: 85, y: 25, width: 8, height: 10 }, emoji: "🦉", label: "An owl on the railing",
    affinityPerTap: 2, cooldown: 30, reward: { type: "affinity", value: 10 }, aiOnFirstDiscovery: false,
    reactions: {
      arisu: { lines: ["Oh! An owl! So majestic~", "He's watching over us!", "Those eyes are so wise..."], expression: "surprised" },
      marin: { lines: ["OWL!! he looks so wise haha", "Hedwig is that you??", "Night bird supremacy~"], expression: "excited" },
      nao: { lines: ["Strigiformes. Excellent nocturnal predator.", "Asymmetric ear placement for echolocation.", "...we have an understanding."], expression: "thinking" },
      kurisu: { lines: ["Athena's companion. Symbolic, not scientific.", "Its neck rotation is 270 degrees. Unsettling.", "...it's judging me. I can tell."], expression: "thinking" },
      merrick: { lines: ["My familiar returns.", "The owl sees through darkness as I do.", "We share the night, old friend."], expression: "happy" },
    },
  },
  {
    id: "moonlight-rose", sceneId: "moonlight", type: "hidden", revealAt: 3,
    position: { x: 25, y: 80, width: 12, height: 10 }, emoji: "🌹", label: "A rose garden",
    affinityPerTap: 2, cooldown: 30, reward: { type: "outfit", value: "formal" }, aiOnFirstDiscovery: true,
    reactions: {
      arisu: { lines: ["Roses in the moonlight... so romantic~", "They smell heavenly!", "Like a dream garden..."], expression: "devoted" },
      marin: { lines: ["ROSES!! this is literally a fairy tale!", "The moonlight makes them glow~", "I feel like a princess rn"], expression: "excited" },
      nao: { lines: ["Bioluminescent reaction? No... just moonlight.", "Rosa damascena. Surprisingly complex genome.", "...the scent is... fine. Whatever."], expression: "shy" },
      kurisu: { lines: ["The phosphorescence is just refracted light.", "Sub rosa — 'under the rose.' A secret kept.", "...one rose wouldn't hurt to keep. For analysis."], expression: "flustered" },
      merrick: { lines: ["My garden remembers your touch.", "Roses bloom for those the night favors.", "Each petal holds a whispered promise."], expression: "devoted" },
    },
  },
  // ── Lab ──
  {
    id: "lab-flask", sceneId: "lab", type: "hidden", revealAt: 1,
    position: { x: 75, y: 60, width: 10, height: 12 }, emoji: "🧪", label: "A bubbling flask",
    affinityPerTap: 2, cooldown: 30, reward: { type: "affinity", value: 5 }, aiOnFirstDiscovery: false,
    reactions: {
      arisu: { lines: ["Is it safe to touch?", "The colors are so pretty!", "Science can be beautiful~"], expression: "surprised" },
      marin: { lines: ["Bubbles!! is it a potion?", "Mad scientist vibes~", "What happens if I drink it? jk jk"], expression: "excited" },
      nao: { lines: ["Exothermic reaction in progress.", "The catalyst ratio needs adjustment.", "...don't touch that. I'm serious."], expression: "thinking" },
      kurisu: { lines: ["MY experiment! Don't contaminate it!", "The reaction is proceeding as predicted.", "...want to see something cool?"], expression: "excited" },
      merrick: { lines: ["Alchemy in modern dress.", "The bubbles whisper of transformation.", "Even science has its magic."], expression: "thinking" },
    },
  },
  {
    id: "lab-monitor", sceneId: "lab", type: "hidden", revealAt: 3,
    position: { x: 10, y: 25, width: 14, height: 12 }, emoji: "📺", label: "A hidden monitor",
    affinityPerTap: 2, cooldown: 30, reward: { type: "diary", value: "Found a hidden monitor in the lab with strange data scrolling across it. The readings were unlike anything I've ever seen." }, aiOnFirstDiscovery: true,
    reactions: {
      arisu: { lines: ["What's on the screen?", "Those numbers look important...", "Is this a secret project?"], expression: "thinking" },
      marin: { lines: ["SECRET MONITOR!! spy movie arc!", "What's it say what's it say?!", "This is giving Area 51 energy~"], expression: "excited" },
      nao: { lines: ["Encrypted data stream. Challenge accepted.", "The refresh rate is non-standard... interesting.", "Someone doesn't want this found."], expression: "excited" },
      kurisu: { lines: ["These readings are— impossible!", "The data contradicts every known model!", "This monitor has been running for... years?!"], expression: "surprised" },
      merrick: { lines: ["Machines remembering what mortals forgot.", "The screen glows with forbidden knowledge.", "Some data was never meant to be found."], expression: "thinking" },
    },
  },
  {
    id: "lab-tesla", sceneId: "lab", type: "hidden", revealAt: 4,
    position: { x: 45, y: 15, width: 12, height: 14 }, emoji: "⚡", label: "A Tesla coil",
    affinityPerTap: 2, cooldown: 30, reward: { type: "affinity", value: 15 }, aiOnFirstDiscovery: false,
    reactions: {
      arisu: { lines: ["Waah! Electricity!", "That's scary but beautiful!", "Be careful!"], expression: "surprised" },
      marin: { lines: ["LIGHTNING IN A BOX!!", "This is the coolest thing EVER", "I feel like a supervillain~"], expression: "excited" },
      nao: { lines: ["Resonant transformer. 500kV potential.", "The arc frequency is tunable...", "I could power my entire setup with this."], expression: "excited" },
      kurisu: { lines: ["Tesla's greatest invention! Well, one of them.", "The resonant frequency is perfect!", "Stand back— this is REAL science!"], expression: "excited" },
      merrick: { lines: ["Tamed lightning. Prometheus would be proud.", "The spark of creation itself.", "Power flows to those who dare grasp it."], expression: "excited" },
    },
  },
  // ── Morning ──
  {
    id: "morning-bird", sceneId: "morning", type: "hidden", revealAt: 1,
    position: { x: 70, y: 15, width: 8, height: 8 }, emoji: "🐦", label: "A bird on the wire",
    affinityPerTap: 2, cooldown: 30, reward: { type: "affinity", value: 5 }, aiOnFirstDiscovery: false,
    reactions: {
      arisu: { lines: ["Good morning, little bird~", "What a sweet song!", "He's greeting the sun!"], expression: "happy" },
      marin: { lines: ["Birdie!! tweet tweet~", "Morning songbird vibes!", "He's just vibing up there"], expression: "happy" },
      nao: { lines: ["Passerine. Dawn chorus participant.", "Frequency: 2-4 kHz. Pleasant.", "...morning routines are important."], expression: "thinking" },
      kurisu: { lines: ["Circadian rhythm expressed via song.", "The early bird... well, you know.", "...it's a nice way to start the day."], expression: "happy" },
      merrick: { lines: ["The dawn herald arrives.", "Even I appreciate the morning song.", "Light returns... as it always does."], expression: "happy" },
    },
  },
  {
    id: "morning-sunflower", sceneId: "morning", type: "hidden", revealAt: 3,
    position: { x: 15, y: 70, width: 10, height: 14 }, emoji: "🌻", label: "A sunflower",
    affinityPerTap: 2, cooldown: 30, reward: { type: "affinity", value: 10 }, aiOnFirstDiscovery: false,
    reactions: {
      arisu: { lines: ["A sunflower! It's following the sun~", "So tall and bright!", "It's smiling at us!"], expression: "happy" },
      marin: { lines: ["SUNFLOWER!! she's gorgeous!", "Big flower energy~", "We match!! sunny and bright!"], expression: "excited" },
      nao: { lines: ["Heliotropism. Solar tracking behavior.", "The Fibonacci spiral in the seeds...", "Nature's algorithm. Elegant."], expression: "thinking" },
      kurisu: { lines: ["Helianthus annuus. Auxin-mediated phototropism.", "The seed arrangement IS mathematically interesting.", "...it does look cheerful. For a plant."], expression: "thinking" },
      merrick: { lines: ["It turns toward what gives it life.", "Even in darkness, it remembers the sun.", "A stubborn bloom. I respect that."], expression: "thinking" },
    },
  },
  // ── Sunset ──
  {
    id: "sunset-musician", sceneId: "sunset", type: "hidden", revealAt: 2,
    position: { x: 10, y: 65, width: 10, height: 14 }, emoji: "🎵", label: "A street musician",
    affinityPerTap: 2, cooldown: 30, reward: { type: "affinity", value: 10 }, aiOnFirstDiscovery: false,
    reactions: {
      arisu: { lines: ["What a beautiful melody~", "Music makes the sunset even better!", "I could listen forever..."], expression: "happy" },
      marin: { lines: ["This song SLAPS!", "Street performers are so talented!", "Main character music right here~"], expression: "excited" },
      nao: { lines: ["Acoustic guitar. Open tuning. Skill level: high.", "The reverb from the buildings creates natural delay.", "...Shazam can't find it. Original composition."], expression: "thinking" },
      kurisu: { lines: ["The frequency harmonics are... pleasant.", "Music and mathematics are deeply connected.", "...one more song. Then we go."], expression: "happy" },
      merrick: { lines: ["Music is the oldest magic.", "The notes linger like golden dust.", "A bard worthy of the twilight stage."], expression: "happy" },
    },
  },
  {
    id: "sunset-firework", sceneId: "sunset", type: "hidden", revealAt: 4,
    position: { x: 78, y: 25, width: 10, height: 10 }, emoji: "🎆", label: "A firework launcher",
    affinityPerTap: 2, cooldown: 30, reward: { type: "scene", value: "festival" }, aiOnFirstDiscovery: true,
    reactions: {
      arisu: { lines: ["Fireworks!! So romantic~!", "The colors are amazing!", "Like a dream come true!"], expression: "excited" },
      marin: { lines: ["FIREWORKS!! BEST. NIGHT. EVER!", "This is literally a festival episode!", "I'M SCREAMING THIS IS SO COOL!"], expression: "excited" },
      nao: { lines: ["Pyrotechnic charge detected. IGNITE.", "Strontium chloride for red, barium for green...", "...okay. THAT was impressive."], expression: "excited" },
      kurisu: { lines: ["Chemical combustion in controlled bursts— BEAUTIFUL!", "The chrysanthemum pattern requires precise timing!", "I'm not crying! It's the sulfur compounds!"], expression: "excited" },
      merrick: { lines: ["Mortal fire reaching for the stars.", "A burst of light against the endless dark.", "For a moment... the night surrenders."], expression: "devoted" },
    },
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function getInteractablesForScene(sceneId: string): Interactable[] {
  return ALL_INTERACTABLES.filter((i) => i.sceneId === sceneId);
}

export function getReactionLine(
  interactable: Interactable,
  characterId: string
): { line: string; expression: string } | null {
  const pool = interactable.reactions[characterId];
  if (!pool || pool.lines.length === 0) return null;
  const line = pool.lines[Math.floor(Math.random() * pool.lines.length)];
  return { line, expression: pool.expression };
}

export function buildDiscoveryContext(interactable: Interactable): string {
  return `The user just discovered a hidden ${interactable.label.toLowerCase()} for the first time. React with genuine surprise and delight in character. This is a special moment — make it memorable.`;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/discoveries.ts
git commit -m "feat: add all interactable definitions and character reaction pools"
```

---

### Task 3: Add discovery sound effect

**Files:**
- Modify: `src/lib/sounds.ts`

- [ ] **Step 1: Read existing sounds.ts to understand the pattern**

The file uses Web Audio API to synthesize sounds. Each function creates oscillators/gains and plays them.

- [ ] **Step 2: Add playDiscoveryChime function**

Add to the bottom of `src/lib/sounds.ts`:

```typescript
export function playDiscoveryChime(): void {
  const ctx = getAudioCtx();
  if (!ctx) return;
  const freqs = [523, 659, 784, 1047]; // C5, E5, G5, C6 — ascending major arpeggio
  freqs.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.value = freq;
    const t = ctx.currentTime + i * 0.1;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.25, t + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
    osc.start(t);
    osc.stop(t + 0.4);
  });
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/sounds.ts
git commit -m "feat: add discovery chime sound effect"
```

---

### Task 4: Add interact-3 quest type

**Files:**
- Modify: `src/lib/quests.ts`

- [ ] **Step 1: Add "interact" to the Quest type union**

In `src/lib/quests.ts`, update the `type` field on the `Quest` interface:

```typescript
export interface Quest {
  id: string;
  title: string;
  description: string;
  target: number;
  reward: number;
  type: "laugh" | "flustered" | "messages" | "gifts" | "headpat" | "interact";
}
```

- [ ] **Step 2: Add the interact quest to QUEST_POOL**

Add to the `QUEST_POOL` array:

```typescript
  {
    id: "interact-3",
    title: "Explore 3 scene elements",
    description: "Interact with objects in your scene.",
    target: 3,
    reward: 12,
    type: "interact",
  },
  {
    id: "interact-5",
    title: "Explore 5 scene elements",
    description: "Discover what your scene has to offer.",
    target: 5,
    reward: 20,
    type: "interact",
  },
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/quests.ts
git commit -m "feat: add interact quest type for scene exploration"
```

---

### Task 5: Add discoveryContext to API client and route

**Files:**
- Modify: `src/lib/api.ts`
- Modify: `src/app/api/chat/route.ts`

- [ ] **Step 1: Add discoveryContext to SendMessageParams**

In `src/lib/api.ts`, add to the `SendMessageParams` interface:

```typescript
  discoveryContext?: string;
```

- [ ] **Step 2: Accept and inject discoveryContext in the API route**

In `src/app/api/chat/route.ts`, add `discoveryContext` to the destructured body:

```typescript
const { message, characterId, userName, memories, responseLength, provider, affinityPrompt, giftContext, heroAppearance, heroClassReaction, crossCharPrompt, miniGamePrompt, typingHint, language, greetingContext, personalityContext, hexxMentioned, discoveryContext } = body;
```

After the `hexxMentioned` block, add:

```typescript
  if (discoveryContext) {
    systemContent += `\n\n[Scene Discovery]
${discoveryContext}`;
  }
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/api.ts src/app/api/chat/route.ts
git commit -m "feat: add discoveryContext to API client and route"
```

---

### Task 6: Refactor InteractiveElements to use discovery system

**Files:**
- Modify: `src/components/InteractiveElements.tsx`

This is the largest task. The component currently has hardcoded per-scene switch cases. We refactor it to render interactables from the discovery data, while preserving the existing sound effects and particle spawning behavior.

- [ ] **Step 1: Add new imports and props**

At the top of `src/components/InteractiveElements.tsx`, add imports:

```typescript
import {
  getInteractablesForScene,
  getVisibleInteractables,
  recordTap,
  getReactionLine,
  buildDiscoveryContext,
  type VisibleInteractable,
  type TapResult,
} from "@/lib/discoveries";
import { getAffinity, addAffinityPoints } from "@/lib/affinity";
import { updateQuestProgress } from "@/lib/quests";
import { addDiaryEntry } from "@/lib/diary";
import { playDiscoveryChime } from "@/lib/sounds";
import { haptic } from "@/lib/haptics";
```

Update the props interface:

```typescript
export interface InteractiveElementsProps {
  sceneId: string;
  accentColor: string;
  characterId: string;
  onReaction?: (line: string, expression: string) => void;
  onDiscoveryContext?: (context: string) => void;
}
```

Update the component signature:

```typescript
export function InteractiveElements({ sceneId, accentColor, characterId, onReaction, onDiscoveryContext }: InteractiveElementsProps) {
```

- [ ] **Step 2: Add shimmer keyframe to STYLES**

Add to the `STYLES` string:

```css
@keyframes ie-shimmer {
  0%, 100% { opacity: 0; }
  50% { opacity: 0.3; }
}
```

- [ ] **Step 3: Add generic tap handler**

Add a handler function inside the component, after the existing handlers:

```typescript
  const handleDiscoveryTap = useCallback((item: VisibleInteractable) => {
    const result = recordTap(characterId, item.id, item.cooldown);

    // Play appropriate sound
    if (result.isFirstDiscovery && item.type === "hidden") {
      playDiscoveryChime();
      haptic.success();
      // Sparkle burst
      const origin = relativeOrigin(
        (item.position.x + item.position.width / 2) / 100,
        (item.position.y + item.position.height / 2) / 100
      );
      spawnParticles(8, origin, accentColor, "ie-star-streak", 6, 800);
    }

    // Affinity
    if (result.affinityEarned) {
      addAffinityPoints(characterId, { type: "message_sent" }, item.affinityPerTap);
    }

    // Quest progress
    updateQuestProgress(characterId, "interact");

    // First-time rewards
    if (result.isFirstDiscovery) {
      const reward = item.reward;
      if (reward.type === "affinity") {
        addAffinityPoints(characterId, { type: "message_sent" }, Number(reward.value));
      } else if (reward.type === "diary" && typeof reward.value === "string") {
        addDiaryEntry(characterId, reward.value, "happy", ["discovery", item.label]);
      }
      // outfit and scene rewards are noted but unlocking logic is handled by the
      // affinity system's unlockedOutfits array — for now we add affinity as a bonus
      if (reward.type === "outfit" || reward.type === "scene") {
        addAffinityPoints(characterId, { type: "message_sent" }, 10);
      }

      // AI-generated reaction for first discovery of hidden elements
      if (item.aiOnFirstDiscovery && item.type === "hidden") {
        onDiscoveryContext?.(buildDiscoveryContext(item));
      }
    }

    // Character reaction (pre-written)
    if (!result.isFirstDiscovery || !item.aiOnFirstDiscovery) {
      const reaction = getReactionLine(item, characterId);
      if (reaction) {
        onReaction?.(reaction.line, reaction.expression);
      }
    }
  }, [characterId, accentColor, spawnParticles, onReaction, onDiscoveryContext]);
```

- [ ] **Step 4: Replace renderScene with data-driven rendering**

Replace the `renderScene()` function and the return statement with data-driven rendering. Keep the existing sound-effect handlers as special-case overlays (neon flicker, fire glow, lightning flash) but wire them through the discovery tap handler too.

Replace the component's return JSX with:

```tsx
  const affinityLevel = typeof window !== "undefined" ? getAffinity(characterId).level : 1;
  const sceneInteractables = getInteractablesForScene(sceneId);
  const visibleItems = getVisibleInteractables(sceneInteractables, affinityLevel, characterId);

  // Special visual states for legacy effects
  const neonItem = visibleItems.find((i) => i.id === "cyberpunk-neon");
  const fireItem = visibleItems.find((i) => i.id === "cozy-fire");

  return (
    <>
      <style>{hotspotHoverStyle}</style>
      <div
        ref={containerRef}
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          zIndex: 5,
        }}
      >
        <div style={{ position: "absolute", inset: 0, pointerEvents: "auto" }}>
          {/* Fire glow overlay */}
          {fireItem && fireOn && (
            <div
              style={{
                position: "absolute", inset: 0, pointerEvents: "none",
                background: "radial-gradient(ellipse 50% 40% at 50% 100%, rgba(255,120,20,0.28) 0%, transparent 70%)",
                animation: "ie-fire-glow 2s ease-in-out infinite",
                borderRadius: "inherit",
              }}
            />
          )}
          {/* Lightning flash */}
          {showLightning && (
            <div
              style={{
                position: "fixed", inset: 0, background: "white", opacity: 0,
                animation: "ie-lightning-flash 150ms ease-out forwards",
                pointerEvents: "none", zIndex: 999,
              }}
            />
          )}
          {/* Render all visible interactables */}
          {visibleItems.map((item) => {
            // Special rendering for neon sign (text instead of emoji)
            if (item.id === "cyberpunk-neon") {
              return (
                <div
                  key={item.id}
                  className="ie-hotspot"
                  style={{
                    ...hotspot,
                    right: `${100 - item.position.x - item.position.width}%`,
                    top: `${item.position.y}%`,
                    width: 120, height: 56, borderRadius: 8,
                    background: neonOn ? "#ff00ff22" : "#33003322",
                    animation: neonOn
                      ? "ie-neon-flicker 6s infinite, ie-hotspot-pulse 2.5s ease-in-out infinite"
                      : "ie-hotspot-pulse 2.5s ease-in-out infinite",
                    boxShadow: neonOn ? "0 0 18px 4px #ff00ffaa" : "none",
                    transition: "all 0.3s ease",
                  }}
                  onClick={() => { handleCyberpunk(); handleDiscoveryTap(item); }}
                  title={item.label}
                >
                  <span style={{
                    fontSize: 14, fontWeight: 700, letterSpacing: 2,
                    color: neonOn ? "#ff88ff" : "#663366",
                    lineHeight: "56px", display: "block", textAlign: "center",
                    textShadow: neonOn ? "0 0 8px #ff00ff" : "none",
                  }}>NEON BAR</span>
                </div>
              );
            }

            // Special: fireplace toggle
            if (item.id === "cozy-fire") {
              return (
                <div
                  key={item.id}
                  className="ie-hotspot"
                  style={{
                    ...hotspot,
                    left: `${item.position.x}%`, bottom: `${100 - item.position.y - item.position.height}%`,
                    width: `${item.position.width}%`, height: item.position.height * 7,
                    borderRadius: 10,
                    background: fireOn ? "#ff8c0028" : "#33220018",
                    boxShadow: fireOn ? "0 0 20px 6px #ff6600aa" : "none",
                    transition: "all 0.4s ease",
                  }}
                  onClick={() => { handleCozyRoom(); handleDiscoveryTap(item); }}
                  title={fireOn ? "Extinguish the fire" : "Light the fire"}
                >
                  <span style={{ fontSize: 34, lineHeight: "70px", display: "block", textAlign: "center" }}>
                    {fireOn ? "🔥" : "🪵"}
                  </span>
                </div>
              );
            }

            // Special: existing handlers for sound/particle effects
            const legacySoundHandler: Record<string, () => void> = {
              "sakura-tree": handleSakura,
              "beach-splash": handleBeach,
              "rain-thunder": handleRain,
              "nightsky-star": handleNightSky,
              "moonlight-moon": handleMoonlight,
              "cafe-coffee": handleCafe,
            };
            const legacyHandler = legacySoundHandler[item.id];

            // Display mode rendering
            if (item.displayMode === "shimmer") {
              return (
                <div
                  key={item.id}
                  className="ie-hotspot"
                  style={{
                    ...hotspot,
                    left: `${item.position.x}%`,
                    top: `${item.position.y}%`,
                    width: `${item.position.width}%`,
                    height: `${item.position.height}%`,
                    background: `radial-gradient(circle, ${accentColor}20 0%, transparent 70%)`,
                    animation: "ie-shimmer 5s ease-in-out infinite",
                    border: "none",
                  }}
                  onClick={() => { legacyHandler?.(); handleDiscoveryTap(item); }}
                  title=""
                />
              );
            }

            const isDim = item.displayMode === "dim";

            return (
              <div
                key={item.id}
                className="ie-hotspot"
                style={{
                  ...hotspot,
                  left: `${item.position.x}%`,
                  top: `${item.position.y}%`,
                  width: `${item.position.width}%`,
                  height: `${item.position.height}%`,
                  background: `${accentColor}${isDim ? "08" : "18"}`,
                  opacity: isDim ? 0.4 : 1,
                }}
                onClick={() => { legacyHandler?.(); handleDiscoveryTap(item); }}
                title={item.label}
              >
                {item.emoji && (
                  <span style={{
                    fontSize: Math.max(20, Math.min(42, item.position.height * 4)),
                    display: "flex", alignItems: "center", justifyContent: "center",
                    width: "100%", height: "100%",
                    opacity: isDim ? 0.5 : 1,
                  }}>
                    {item.emoji}
                  </span>
                )}
              </div>
            );
          })}
        </div>
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>{renderParticles()}</div>
      </div>
    </>
  );
```

- [ ] **Step 5: Commit**

```bash
git add src/components/InteractiveElements.tsx
git commit -m "feat: refactor InteractiveElements to data-driven discovery system"
```

---

### Task 7: Wire up chat page to discovery system

**Files:**
- Modify: `src/app/chat/[characterId]/page.tsx`

- [ ] **Step 1: Add discovery state and handlers**

In the `ChatContent` component, add state after the existing `hexxPhrase` state:

```typescript
  const [pendingDiscoveryContext, setPendingDiscoveryContext] = useState<string | null>(null);
```

- [ ] **Step 2: Add discovery reaction handler**

Add a callback for pre-written reactions (displayed as ephemeral dialogue, same pattern as gift reactions):

```typescript
  const handleDiscoveryReaction = useCallback((line: string, expression: string) => {
    dispatch(receiveResponse(line, expression as Expression));
  }, [dispatch]);
```

- [ ] **Step 3: Wire discoveryContext into streamChat**

In the `handleSend` callback, add `discoveryContext` to the streamChat params. Before the `streamChat` call, consume the pending context:

```typescript
      const discoveryCtx = pendingDiscoveryContext;
      if (discoveryCtx) setPendingDiscoveryContext(null);
```

Add `discoveryContext: discoveryCtx || undefined` to the params object passed to `streamChat`.

- [ ] **Step 4: Update InteractiveElements usage**

Update the `<InteractiveElements>` component to pass the new props:

```tsx
        <InteractiveElements
          sceneId={currentScene}
          accentColor={character.theme.accent}
          characterId={characterId}
          onReaction={handleDiscoveryReaction}
          onDiscoveryContext={(ctx) => setPendingDiscoveryContext(ctx)}
        />
```

- [ ] **Step 5: Commit**

```bash
git add src/app/chat/[characterId]/page.tsx
git commit -m "feat: wire chat page to discovery system with reactions and AI context"
```

---

### Task 8: Manual smoke test

- [ ] **Step 1: Start dev server**

```bash
cd "C:/Users/G$/anime-chatbot"
rm -rf .next
npx next dev --webpack -p 3000
```

- [ ] **Step 2: Test visible hotspots still work**

Open http://localhost:3000, pick any character, verify:
1. Existing hotspots (sakura tree, beach splash, etc.) still have sounds and particles
2. Tapping a hotspot shows a character reaction in the dialogue box
3. Repeated taps within 30s don't double-earn affinity

- [ ] **Step 3: Test hidden element discovery**

Set affinity to level 2+ (or manually set in localStorage). Verify:
1. A shimmer hint appears at the hidden element's position
2. Tapping it triggers a discovery chime, sparkle burst, and character reaction
3. The element becomes permanently visible with its emoji
4. Diary reward entries appear in the diary view

- [ ] **Step 4: Test progressive reveal**

Verify at different affinity levels:
1. Level 1: Only visible hotspots, no hints
2. Level 2: Shimmer hints for level-2 hidden elements
3. Level 3: Level-2 elements show dim emoji, level-3 elements show shimmer

- [ ] **Step 5: Test AI-generated first discovery**

Find a hidden element with `aiOnFirstDiscovery: true`. Tap it, then send a message. Verify the character's response acknowledges the discovery.

- [ ] **Step 6: Test quest integration**

Check the quest panel. If an "interact" quest is active, verify tapping elements increments progress.

- [ ] **Step 7: Commit any fixes**
