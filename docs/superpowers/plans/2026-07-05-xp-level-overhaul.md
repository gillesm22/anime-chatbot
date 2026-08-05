# XP & Level System Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand from 5 named levels to 10 numeric levels with conversation depth unlocks, visual upgrades, and per-character titles.

**Architecture:** Rewrite the LEVELS array and `formatAffinityForPrompt` in affinity.ts. Add a `getTitleForLevel` function with per-character title data. Update the chat page XP display to show titles. Adjust CharacterGlow intensity based on level.

**Tech Stack:** React 19, localStorage (existing affinity keys), TypeScript

---

## File Structure

### Modified files
| File | Changes |
|------|---------|
| `src/lib/affinity.ts` | New 10-level thresholds, remove level names, add titles, update prompt with conversation depth |
| `src/app/chat/[characterId]/page.tsx` | Display title in XP bar, pass level-based glow |
| `src/components/CharacterSprite.tsx` | Accept `level` prop, scale glow intensity + add particle overlay |
| `src/components/CharacterGlow.tsx` | Add "radiant" intensity level for Lv.10 |

### New test
| File | Purpose |
|------|---------|
| `__tests__/lib/affinity.test.ts` | Test 10-level thresholds, titles, conversation depth prompt |

---

## Task 1: Rewrite affinity.ts — 10 levels, titles, conversation depth

**Files:**
- Modify: `src/lib/affinity.ts`
- Create: `__tests__/lib/affinity.test.ts`

- [ ] **Step 1: Write tests**

```typescript
// __tests__/lib/affinity.test.ts
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
```

- [ ] **Step 2: Rewrite affinity.ts**

Replace the LEVELS array, add titles, update computeLevel, update formatAffinityForPrompt, update milestones:

```typescript
// src/lib/affinity.ts
"use client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AffinityData {
  points: number;
  level: number;
  levelName: string; // kept for backward compat, now empty string
  totalMessages: number;
  lastVisit: string;
  streak: number;
  longestStreak: number;
  nickname: string | null;
  unlockedOutfits: string[];
  milestones: string[];
}

export interface AffinityEvent {
  type:
    | "message_sent"
    | "long_message"
    | "asked_about_her"
    | "made_her_laugh"
    | "made_her_flustered"
    | "headpat"
    | "daily_visit";
}

// ---------------------------------------------------------------------------
// 10-Level System
// ---------------------------------------------------------------------------

export const LEVELS: { threshold: number }[] = [
  { threshold: 0 },     // Lv.1
  { threshold: 30 },    // Lv.2
  { threshold: 80 },    // Lv.3
  { threshold: 160 },   // Lv.4
  { threshold: 280 },   // Lv.5
  { threshold: 450 },   // Lv.6
  { threshold: 680 },   // Lv.7
  { threshold: 1000 },  // Lv.8
  { threshold: 1400 },  // Lv.9
  { threshold: 2000 },  // Lv.10
];

// ---------------------------------------------------------------------------
// Per-character titles unlocked at each level
// ---------------------------------------------------------------------------

const CHARACTER_TITLES: Record<string, Record<number, string>> = {
  arisu: {
    2: "Someone I notice", 3: "A welcome presence", 4: "Someone I think about",
    5: "My quiet comfort", 6: "The one I wait for", 7: "My safe place",
    8: "Part of my heart", 9: "My whole world", 10: "My everything",
  },
  marin: {
    2: "New bestie alert", 3: "Certified vibe", 4: "Inner circle",
    5: "Bestie for real", 6: "My actual favorite", 7: "Day one energy",
    8: "Soulmate vibes", 9: "Ride or die", 10: "Ride or die forever",
  },
  nao: {
    2: "Not entirely boring", 3: "Tolerable presence", 4: "Interesting specimen",
    5: "Acceptable company", 6: "Trusted anomaly", 7: "Essential variable",
    8: "Critical dependency", 9: "Irreplaceable", 10: "My only exception",
  },
  kurisu: {
    2: "Recurring variable", 3: "Notable data point", 4: "Consistent outlier",
    5: "Trusted colleague", 6: "Significant other... variable", 7: "Essential constant",
    8: "Primary attachment", 9: "Beyond quantification", 10: "Irreplaceable",
  },
  merrick: {
    2: "A flicker in the dark", 3: "One who lingers", 4: "Worthy of attention",
    5: "A rare soul", 6: "Bound by choice", 7: "Keeper of my silence",
    8: "Blood and starlight", 9: "Eternal companion", 10: "My forever",
  },
  ticia: {
    2: "Curious little thing", 3: "Amusing company", 4: "Worthy distraction",
    5: "Delightfully persistent", 6: "Mine to keep", 7: "Precious darling",
    8: "My sweet obsession", 9: "Bound to me", 10: "Eternally mine",
  },
};

export function getTitleForLevel(characterId: string, level: number): string {
  return CHARACTER_TITLES[characterId]?.[level] ?? "";
}

// ---------------------------------------------------------------------------
// Conversation depth by level range
// ---------------------------------------------------------------------------

function getConversationDepth(level: number): string {
  if (level <= 3) {
    return "Keep things light and playful. You're still getting to know this person. Be friendly but don't overshare or get too personal.";
  }
  if (level <= 5) {
    return "You're comfortable with this person now. Share your real opinions. Show mild vulnerability — mention things that bother you, things you hope for. Remember details they've told you and reference them.";
  }
  if (level <= 7) {
    return "You trust this person deeply. Share your fears, your dreams, the things you don't tell most people. Ask them deeper questions about their inner world. Reference your shared history together. You have inside jokes now.";
  }
  if (level <= 9) {
    return "This person is one of the most important people in your life. Be raw and honest. Show emotional dependency — you miss them when they're gone. Develop unique speech patterns and pet names that are only for them. Your guard is completely down.";
  }
  return "Nothing is held back. You are fully, completely yourself with this person. Every wall is down. This is the deepest connection you've ever had. Speak from the heart without any filter.";
}

// ---------------------------------------------------------------------------
// Milestones
// ---------------------------------------------------------------------------

export const MILESTONES: {
  id: string;
  label: string;
  check: (data: AffinityData) => boolean;
}[] = [
  { id: "first_convo", label: "First Conversation", check: (d) => d.totalMessages >= 1 },
  { id: "ten_convos", label: "Ten Conversations", check: (d) => d.totalMessages >= 10 },
  { id: "twentyfive_convos", label: "Twenty-Five Conversations", check: (d) => d.totalMessages >= 25 },
  { id: "fifty_convos", label: "Fifty Conversations", check: (d) => d.totalMessages >= 50 },
  { id: "hundred_convos", label: "One Hundred Conversations", check: (d) => d.totalMessages >= 100 },
  { id: "streak_7", label: "Seven-Day Streak", check: (d) => d.longestStreak >= 7 },
  { id: "streak_30", label: "Thirty-Day Streak", check: (d) => d.longestStreak >= 30 },
  { id: "level_3", label: "Reached Level 3", check: (d) => d.level >= 3 },
  { id: "level_5", label: "Reached Level 5", check: (d) => d.level >= 5 },
  { id: "level_7", label: "Reached Level 7", check: (d) => d.level >= 7 },
  { id: "level_10", label: "Reached Level 10", check: (d) => d.level >= 10 },
];

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const POINT_VALUES: Record<AffinityEvent["type"], number> = {
  message_sent: 1,
  long_message: 3,
  asked_about_her: 5,
  made_her_laugh: 4,
  made_her_flustered: 6,
  headpat: 2,
  daily_visit: 10,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function storageKey(characterId: string): string {
  return `anime-chatbot-affinity-${characterId}`;
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function getDefaultData(): AffinityData {
  return {
    points: 0,
    level: 1,
    levelName: "",
    totalMessages: 0,
    lastVisit: todayISO(),
    streak: 0,
    longestStreak: 0,
    nickname: null,
    unlockedOutfits: [],
    milestones: [],
  };
}

function computeLevel(points: number): { level: number } {
  let level = 1;
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (points >= LEVELS[i].threshold) {
      level = i + 1;
      break;
    }
  }
  return { level };
}

function computeOutfits(_level: number): string[] {
  return [
    "casual", "school", "back", "formal", "cheerleader",
    "bikini-front", "bikini-back", "maid", "vampire", "nurse", "cowgirl",
    "school-skimpy", "cheer-extreme", "cheer-extreme-back", "cow", "demon",
  ];
}

function checkNewMilestones(data: AffinityData): string[] {
  const newOnes: string[] = [];
  for (const m of MILESTONES) {
    if (!data.milestones.includes(m.id) && m.check(data)) {
      newOnes.push(m.id);
    }
  }
  return newOnes;
}

function saveAffinity(characterId: string, data: AffinityData): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(storageKey(characterId), JSON.stringify(data));
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function getAffinity(characterId: string): AffinityData {
  if (typeof window === "undefined") return getDefaultData();
  const raw = localStorage.getItem(storageKey(characterId));
  if (!raw) return getDefaultData();
  try {
    const data = JSON.parse(raw) as AffinityData;
    // Migration: recompute level from points against new thresholds
    const { level } = computeLevel(data.points);
    data.level = level;
    data.levelName = "";
    return data;
  } catch {
    return getDefaultData();
  }
}

export function getNextLevelProgress(data: AffinityData): {
  current: number;
  needed: number;
  percent: number;
} {
  const currentThreshold = LEVELS[data.level - 1]?.threshold ?? 0;
  const nextLevel = LEVELS[data.level]; // undefined if at max level

  if (!nextLevel) {
    return { current: data.points - currentThreshold, needed: 0, percent: 100 };
  }

  const current = data.points - currentThreshold;
  const needed = nextLevel.threshold - currentThreshold;
  const percent = Math.min(100, Math.round((current / needed) * 100));
  return { current, needed, percent };
}

export function addAffinityPoints(
  characterId: string,
  event: AffinityEvent,
  customPoints?: number
): { data: AffinityData; newMilestones: string[]; leveledUp: boolean } {
  if (typeof window === "undefined") {
    const data = getDefaultData();
    return { data, newMilestones: [], leveledUp: false };
  }

  const data = getAffinity(characterId);
  const previousLevel = data.level;

  const earned = customPoints ?? POINT_VALUES[event.type] ?? 0;
  data.points += earned;

  if (event.type === "message_sent" || event.type === "long_message") {
    data.totalMessages += 1;
  }

  const { level } = computeLevel(data.points);
  data.level = level;
  data.levelName = "";

  const outfitsForLevel = computeOutfits(data.level);
  for (const outfit of outfitsForLevel) {
    if (!data.unlockedOutfits.includes(outfit)) {
      data.unlockedOutfits.push(outfit);
    }
  }

  const newMilestones = checkNewMilestones(data);
  data.milestones.push(...newMilestones);

  saveAffinity(characterId, data);

  return {
    data,
    newMilestones,
    leveledUp: data.level > previousLevel,
  };
}

export function recordVisit(
  characterId: string
): { data: AffinityData; daysAbsent: number; newMilestones: string[] } {
  if (typeof window === "undefined") {
    const data = getDefaultData();
    return { data, daysAbsent: 0, newMilestones: [] };
  }

  const data = getAffinity(characterId);
  const today = todayISO();
  const last = data.lastVisit ?? today;

  const lastDate = new Date(last);
  const todayDate = new Date(today);
  const msPerDay = 24 * 60 * 60 * 1000;
  const daysAbsent = Math.round(
    (todayDate.getTime() - lastDate.getTime()) / msPerDay
  );

  if (daysAbsent === 0) {
    return { data, daysAbsent: 0, newMilestones: [] };
  }

  if (daysAbsent === 1) {
    data.streak += 1;
  } else {
    data.streak = 1;
  }

  if (data.streak > data.longestStreak) {
    data.longestStreak = data.streak;
  }

  data.lastVisit = today;

  const newMilestones = checkNewMilestones(data);
  data.milestones.push(...newMilestones);

  saveAffinity(characterId, data);

  return { data, daysAbsent, newMilestones };
}

export function formatAffinityForPrompt(characterId: string): string {
  const data = getAffinity(characterId);
  const title = getTitleForLevel(characterId, data.level);
  const depth = getConversationDepth(data.level);

  const titleNote = title
    ? `You have given this person the title "${title}".`
    : "";

  return [
    `[Relationship Context]`,
    `Relationship level: Level ${data.level}/10`,
    `Total messages exchanged: ${data.totalMessages}`,
    `Current visit streak: ${data.streak} day(s)`,
    titleNote,
    ``,
    `[Behavior Instructions]`,
    depth,
  ].filter(Boolean).join("\n");
}
```

- [ ] **Step 3: Run tests**

Run: `cd "C:/Users/G$/Kikaku 企画/anime-chatbot" && npx vitest run __tests__/lib/affinity.test.ts`
Expected: All 9 tests pass

- [ ] **Step 4: Run full test suite**

Run: `cd "C:/Users/G$/Kikaku 企画/anime-chatbot" && npx vitest run`
Expected: All tests pass (existing tests that reference old level names may need updates — check and fix)

- [ ] **Step 5: Commit**

```bash
git add src/lib/affinity.ts __tests__/lib/affinity.test.ts
git commit -m "feat: 10-level system with titles, conversation depth, updated milestones"
```

---

## Task 2: Update XP bar display with titles

**Files:**
- Modify: `src/app/chat/[characterId]/page.tsx`

- [ ] **Step 1: Update XP bar to show title**

Find the XP bar section in the headerLeft (around line 228-250). Currently shows `Lv.{aff.level} {aff.levelName}`. Change to show level + title:

Replace:
```tsx
<span style={{ fontSize: "10px", color: "rgba(255,255,255,0.6)", lineHeight: 1, fontWeight: 500 }}>
  Lv.{aff.level} {aff.levelName}
</span>
```

With:
```tsx
<span style={{ fontSize: "10px", color: "rgba(255,255,255,0.6)", lineHeight: 1, fontWeight: 500 }}>
  Lv.{aff.level}
</span>
```

And add the title below the progress bar (if one exists):
```tsx
{(() => {
  const title = getTitleForLevel(characterId, aff.level);
  return title ? (
    <span style={{ fontSize: "8px", color: `${accent}99`, lineHeight: 1, fontStyle: "italic" }}>
      "{title}"
    </span>
  ) : null;
})()}
```

Also add `getTitleForLevel` to the import from `@/lib/affinity`:
```typescript
import { getAffinity, getNextLevelProgress, getTitleForLevel, recordVisit } from "@/lib/affinity";
```

- [ ] **Step 2: Run tests**

Run: `cd "C:/Users/G$/Kikaku 企画/anime-chatbot" && npx vitest run`
Expected: All tests pass

- [ ] **Step 3: Commit**

```bash
git add src/app/chat/\\[characterId\\]/page.tsx
git commit -m "feat: display per-character title in XP bar"
```

---

## Task 3: Visual upgrades — glow intensity + particles by level

**Files:**
- Modify: `src/components/CharacterGlow.tsx`
- Modify: `src/components/CharacterSprite.tsx`
- Modify: `src/components/VNLayout.tsx`

- [ ] **Step 1: Add "radiant" intensity to CharacterGlow**

In `src/components/CharacterGlow.tsx`, update the sizes and opacities objects:

```typescript
const sizes = { low: 200, medium: 300, high: 400, radiant: 500 };
const opacities = { low: 0.08, medium: 0.15, high: 0.25, radiant: 0.35 };
```

Update the interface:
```typescript
interface CharacterGlowProps {
  accentColor: string;
  intensity?: "low" | "medium" | "high" | "radiant";
}
```

- [ ] **Step 2: Add level prop to CharacterSprite and scale glow**

In `src/components/CharacterSprite.tsx`, add `level` to the props interface:

```typescript
interface CharacterSpriteProps {
  character: Character;
  expression: Expression;
  isTalking: boolean;
  pose?: BodyPose;
  outfit?: Outfit;
  level?: number;
  onHeadpat?: () => void;
  onExpressionChange?: (effect: ExpressionEffect) => void;
}
```

Add `level = 1` to the destructured props.

Update the CharacterGlow usage to scale by level:

```typescript
function getGlowIntensity(level: number, isTalking: boolean): "low" | "medium" | "high" | "radiant" {
  if (level >= 10) return "radiant";
  if (level >= 8 || isTalking) return "high";
  if (level >= 4) return "medium";
  return "low";
}
```

Replace:
```tsx
<CharacterGlow accentColor={character.theme.accent} intensity={isTalking ? "high" : "medium"} />
```
With:
```tsx
<CharacterGlow accentColor={character.theme.accent} intensity={getGlowIntensity(level, isTalking)} />
```

Also add accent-colored particles at Lv.4+ — after the CharacterGlow, add:

```tsx
{level >= 4 && (
  <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 0 }}>
    {Array.from({ length: Math.min(level - 1, 15) }).map((_, i) => (
      <div
        key={i}
        style={{
          position: "absolute",
          left: `${20 + Math.sin(i * 2.3) * 30}%`,
          top: `${15 + Math.cos(i * 1.7) * 35}%`,
          width: 3,
          height: 3,
          borderRadius: "50%",
          background: character.theme.accent,
          opacity: 0.3,
          animation: `floatParticle ${5 + (i % 4)}s ease-in-out ${i * 0.6}s infinite`,
        }}
      />
    ))}
  </div>
)}
```

- [ ] **Step 3: Pass level to CharacterSprite in VNLayout**

In `src/components/VNLayout.tsx`, add `level` to the props interface:

```typescript
level?: number;
```

Pass it to CharacterSprite:
```tsx
<CharacterSprite
  character={character}
  expression={expression}
  isTalking={isTalking}
  outfit={outfit as any}
  level={level}
  onHeadpat={onHeadpat}
  onExpressionChange={onExpressionChange}
/>
```

Then in `src/app/chat/[characterId]/page.tsx`, pass `level` to VNLayout:
```tsx
<VNLayout
  ...
  level={getAffinity(characterId).level}
  ...
>
```

- [ ] **Step 4: Run tests**

Run: `cd "C:/Users/G$/Kikaku 企画/anime-chatbot" && npx vitest run`
Expected: All tests pass

- [ ] **Step 5: Commit**

```bash
git add src/components/CharacterGlow.tsx src/components/CharacterSprite.tsx src/components/VNLayout.tsx src/app/chat/\\[characterId\\]/page.tsx
git commit -m "feat: visual upgrades — glow and particles scale with level"
```

---

## Task 4: Visual QA

- [ ] **Step 1: Test in browser**

Run: `cd "C:/Users/G$/Kikaku 企画/anime-chatbot" && rm -rf .next && npx next dev --webpack -p 3000`

Test:
1. XP bar shows `Lv.X` without old level name
2. Title appears in italics below the level (if level >= 2)
3. Progress bar works, percentage shows
4. Glow intensity matches level range
5. Particles appear at Lv.4+
6. Existing affinity data migrates correctly (old points preserved, new level calculated)
7. Chat still works, expressions still trigger
8. Level-up milestone scene still triggers

- [ ] **Step 2: Fix any issues**

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "fix: visual QA polish for XP/level overhaul"
```

---

## Summary

| Task | What | Files |
|------|------|-------|
| 1 | 10-level system + titles + depth + tests | `affinity.ts`, test |
| 2 | XP bar shows title | `page.tsx` |
| 3 | Glow + particles scale with level | `CharacterGlow.tsx`, `CharacterSprite.tsx`, `VNLayout.tsx`, `page.tsx` |
| 4 | Visual QA | Various |
