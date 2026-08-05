# PWA & Mobile Polish — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the app feel like a native iOS app — works offline, vibrates on interactions, responds to gestures, fills the screen properly, and welcomes you back when you've been away.

**Architecture:** Six independent features layered onto the existing app. Foundation modules (haptics, swipe hook, notifications) are built first with tests, then integrated into existing components. CSS and meta tag changes are grouped into a single mobile UI task. No new dependencies — all Web APIs.

**Tech Stack:** Service Worker + Cache API, Vibration API, Touch Events, CSS env() safe areas, 100dvh viewport units.

**Run commands:**
- Dev server: `cd "C:/Users/G$/Kikaku 企画/anime-chatbot" && rm -rf .next && npx next dev --webpack -p 3000`
- Type check: `npx tsc --noEmit`
- Tests: `npm test`
- Single test: `npx vitest run __tests__/lib/<file>.test.ts`

**Important notes:**
- MUST use `--webpack` flag (Turbopack crashes due to `$` in path)
- Re-read files before editing (Google Drive can revert silently)
- Character ID `nao` displays as `Suzuka` in UI
- Test on iOS Safari — it has the most quirks

---

## Task 1: Service Worker Upgrade

**Files:**
- Modify: `public/sw.js`
- Modify: `public/manifest.json`

The existing service worker already has cache-first for sprites and network-first for API/pages with an offline SSE fallback. The manifest already has `"display": "standalone"`. We need to:
1. Update manifest metadata (name, description, all 5 characters)
2. Bump cache version to force refresh of new assets
3. Add font caching to the static assets strategy

- [ ] **Step 1: Update manifest.json**

Replace the content of `public/manifest.json`:

```json
{
  "name": "HEXXII",
  "short_name": "HEXXII",
  "description": "Chat with Arisu, Marin, Suzuka, Kurisu, and Merrick",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0d0d12",
  "theme_color": "#0d0d12",
  "orientation": "portrait",
  "icons": [
    {
      "src": "/icons/icon-192.svg",
      "sizes": "192x192",
      "type": "image/svg+xml"
    },
    {
      "src": "/icons/icon-512.svg",
      "sizes": "512x512",
      "type": "image/svg+xml"
    }
  ]
}
```

- [ ] **Step 2: Update service worker cache version and add font caching**

Open `public/sw.js`. Change line 1:

```javascript
const CACHE_NAME = "anime-chatbot-v3";
```

In the fetch handler, add font caching alongside sprites/backgrounds. Find the condition on line 62 and update:

```javascript
  if (url.pathname.startsWith("/sprites/") || url.pathname.startsWith("/backgrounds/") || url.pathname.startsWith("/icons/") || url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") {
```

- [ ] **Step 3: Commit**

```bash
git add public/sw.js public/manifest.json
git commit -m "feat: update PWA manifest to HEXXII branding and add font caching"
```

---

## Task 2: Haptic Feedback Module

**Files:**
- Create: `src/lib/haptics.ts`
- Create: `__tests__/lib/haptics.test.ts`

- [ ] **Step 1: Write failing tests**

Create `__tests__/lib/haptics.test.ts`:

```typescript
import { describe, it, expect, beforeEach, vi } from "vitest";
import { haptic } from "@/lib/haptics";

describe("haptics", () => {
  beforeEach(() => {
    vi.stubGlobal("navigator", { vibrate: vi.fn(() => true) });
    vi.stubGlobal("localStorage", {
      getItem: () => null,
      setItem: () => {},
    });
  });

  it("tick fires a short vibration", () => {
    haptic.tick();
    expect(navigator.vibrate).toHaveBeenCalledWith(5);
  });

  it("pulse fires a medium vibration", () => {
    haptic.pulse();
    expect(navigator.vibrate).toHaveBeenCalledWith(10);
  });

  it("success fires a pattern", () => {
    haptic.success();
    expect(navigator.vibrate).toHaveBeenCalledWith([10, 30, 20, 30, 30]);
  });

  it("pet fires a petting pattern", () => {
    haptic.pet();
    expect(navigator.vibrate).toHaveBeenCalledWith([8, 40, 8, 40, 8]);
  });

  it("expression maps angry to rumble", () => {
    haptic.expression("angry");
    expect(navigator.vibrate).toHaveBeenCalledWith([15, 30, 15, 30, 15]);
  });

  it("expression maps happy to soft", () => {
    haptic.expression("happy");
    expect(navigator.vibrate).toHaveBeenCalledWith(8);
  });

  it("expression maps surprised to doubleTap", () => {
    haptic.expression("surprised");
    expect(navigator.vibrate).toHaveBeenCalledWith([10, 50, 10]);
  });

  it("does nothing when vibrate is not supported", () => {
    vi.stubGlobal("navigator", {});
    haptic.tick(); // should not throw
  });

  it("does nothing when haptics disabled in settings", () => {
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => key === "anime-chatbot-haptics-enabled" ? "false" : null,
      setItem: () => {},
    });
    haptic.tick();
    expect(navigator.vibrate).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run __tests__/lib/haptics.test.ts`
Expected: FAIL — module does not exist.

- [ ] **Step 3: Implement haptics module**

Create `src/lib/haptics.ts`:

```typescript
import type { Expression } from "@/lib/characters/types";

type VibrationPattern = number | number[];

function vibrate(pattern: VibrationPattern): void {
  if (typeof navigator === "undefined") return;
  if (typeof navigator.vibrate !== "function") return;
  if (typeof localStorage !== "undefined") {
    if (localStorage.getItem("anime-chatbot-haptics-enabled") === "false") return;
  }
  try {
    navigator.vibrate(pattern);
  } catch {}
}

const EXPRESSION_PATTERNS: Partial<Record<Expression, VibrationPattern>> = {
  angry: [15, 30, 15, 30, 15],
  surprised: [10, 50, 10],
  flustered: [10, 50, 10],
  excited: [10, 50, 10],
  happy: 8,
  laugh: 8,
  devoted: 8,
  sad: 12,
  crying: [12, 40, 12],
};

export const haptic = {
  /** Micro feedback — nav taps, dialogue advance */
  tick: () => vibrate(5),

  /** Short pulse — message send */
  pulse: () => vibrate(10),

  /** Double tap — surprise/expression change */
  doubleTap: () => vibrate([10, 50, 10]),

  /** Rumble — anger */
  rumble: () => vibrate([15, 30, 15, 30, 15]),

  /** Soft — happy/devoted */
  soft: () => vibrate(8),

  /** Petting pattern — headpat */
  pet: () => vibrate([8, 40, 8, 40, 8]),

  /** Celebration — milestone/level-up */
  success: () => vibrate([10, 30, 20, 30, 30]),

  /** Expression-aware — picks pattern by expression */
  expression: (expr: Expression) => {
    const pattern = EXPRESSION_PATTERNS[expr];
    if (pattern) vibrate(pattern);
  },
};
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run __tests__/lib/haptics.test.ts`
Expected: PASS

- [ ] **Step 5: Type check and commit**

Run: `npx tsc --noEmit`
Expected: No errors

```bash
git add src/lib/haptics.ts __tests__/lib/haptics.test.ts
git commit -m "feat: add haptic feedback module with expression-aware patterns"
```

---

## Task 3: Swipe Gesture Hook

**Files:**
- Create: `src/lib/useSwipeGesture.ts`
- Create: `__tests__/lib/useSwipeGesture.test.ts`

- [ ] **Step 1: Write failing tests**

Create `__tests__/lib/useSwipeGesture.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { detectSwipe, type SwipeResult } from "@/lib/useSwipeGesture";

describe("detectSwipe", () => {
  it("detects right swipe", () => {
    const result = detectSwipe(
      { x: 10, y: 200, time: 0 },
      { x: 120, y: 205, time: 200 }
    );
    expect(result).not.toBeNull();
    expect(result!.direction).toBe("right");
  });

  it("detects left swipe", () => {
    const result = detectSwipe(
      { x: 200, y: 200, time: 0 },
      { x: 80, y: 195, time: 200 }
    );
    expect(result).not.toBeNull();
    expect(result!.direction).toBe("left");
  });

  it("returns null for short swipe", () => {
    const result = detectSwipe(
      { x: 100, y: 200, time: 0 },
      { x: 120, y: 200, time: 500 }
    );
    expect(result).toBeNull();
  });

  it("returns null for vertical swipe", () => {
    const result = detectSwipe(
      { x: 100, y: 100, time: 0 },
      { x: 105, y: 250, time: 200 }
    );
    expect(result).toBeNull();
  });

  it("detects fast flick even with short distance", () => {
    const result = detectSwipe(
      { x: 10, y: 200, time: 0 },
      { x: 55, y: 202, time: 80 }
    );
    expect(result).not.toBeNull();
    expect(result!.direction).toBe("right");
  });

  it("detects edge swipe", () => {
    const result = detectSwipe(
      { x: 15, y: 200, time: 0 },
      { x: 120, y: 205, time: 200 }
    );
    expect(result).not.toBeNull();
    expect(result!.fromEdge).toBe(true);
  });

  it("non-edge swipe flagged correctly", () => {
    const result = detectSwipe(
      { x: 100, y: 200, time: 0 },
      { x: 250, y: 205, time: 200 }
    );
    expect(result).not.toBeNull();
    expect(result!.fromEdge).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run __tests__/lib/useSwipeGesture.test.ts`
Expected: FAIL — module does not exist.

- [ ] **Step 3: Implement swipe detection logic and React hook**

Create `src/lib/useSwipeGesture.ts`:

```typescript
"use client";

import { useEffect, useRef, useCallback } from "react";

interface TouchPoint {
  x: number;
  y: number;
  time: number;
}

export interface SwipeResult {
  direction: "left" | "right";
  distance: number;
  velocity: number;
  fromEdge: boolean;
}

const MIN_DISTANCE = 50;
const MIN_FLICK_VELOCITY = 0.5; // px/ms
const EDGE_ZONE = 30; // px from left edge

export function detectSwipe(
  start: TouchPoint,
  end: TouchPoint
): SwipeResult | null {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const distance = Math.abs(dx);
  const elapsed = Math.max(end.time - start.time, 1);
  const velocity = distance / elapsed;

  // Ignore vertical swipes (vertical movement > horizontal)
  if (Math.abs(dy) > Math.abs(dx)) return null;

  // Must meet distance threshold OR velocity threshold
  if (distance < MIN_DISTANCE && velocity < MIN_FLICK_VELOCITY) return null;
  // Minimum absolute distance even for flicks
  if (distance < 30) return null;

  return {
    direction: dx > 0 ? "right" : "left",
    distance,
    velocity,
    fromEdge: start.x <= EDGE_ZONE,
  };
}

export function useSwipeGesture(
  ref: React.RefObject<HTMLElement | null>,
  onSwipe: (result: SwipeResult) => void
): void {
  const startRef = useRef<TouchPoint | null>(null);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    const touch = e.touches[0];
    startRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    };
  }, []);

  const handleTouchEnd = useCallback(
    (e: TouchEvent) => {
      if (!startRef.current) return;
      const touch = e.changedTouches[0];
      const end: TouchPoint = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now(),
      };
      const result = detectSwipe(startRef.current, end);
      if (result) {
        onSwipe(result);
      }
      startRef.current = null;
    },
    [onSwipe]
  );

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    el.addEventListener("touchstart", handleTouchStart, { passive: true });
    el.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      el.removeEventListener("touchstart", handleTouchStart);
      el.removeEventListener("touchend", handleTouchEnd);
    };
  }, [ref, handleTouchStart, handleTouchEnd]);
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run __tests__/lib/useSwipeGesture.test.ts`
Expected: PASS

- [ ] **Step 5: Type check and commit**

Run: `npx tsc --noEmit`
Expected: No errors

```bash
git add src/lib/useSwipeGesture.ts __tests__/lib/useSwipeGesture.test.ts
git commit -m "feat: add swipe gesture detection hook with edge and velocity support"
```

---

## Task 4: Away Notifications Module

**Files:**
- Create: `src/lib/awayNotifications.ts`
- Create: `__tests__/lib/awayNotifications.test.ts`

- [ ] **Step 1: Write failing tests**

Create `__tests__/lib/awayNotifications.test.ts`:

```typescript
import { describe, it, expect, beforeEach, vi } from "vitest";
import { getAwayNotifications, type AwayNotification } from "@/lib/awayNotifications";

const store: Record<string, string> = {};
beforeEach(() => {
  Object.keys(store).forEach((k) => delete store[k]);
  vi.stubGlobal("window", {});
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, val: string) => { store[key] = val; },
    removeItem: (key: string) => { delete store[key]; },
    length: 0,
    key: () => null,
  });
});

function setAffinity(charId: string, level: number, daysAgo: number) {
  const lastVisit = new Date();
  lastVisit.setDate(lastVisit.getDate() - daysAgo);
  store[`anime-chatbot-affinity-${charId}`] = JSON.stringify({
    points: level === 2 ? 60 : level === 3 ? 200 : level === 4 ? 400 : 10,
    level,
    levelName: "Test",
    totalMessages: 20,
    lastVisit: lastVisit.toISOString().slice(0, 10),
    streak: 0,
    longestStreak: 0,
    nickname: null,
    unlockedOutfits: [],
    milestones: [],
  });
}

describe("getAwayNotifications", () => {
  it("returns empty array when no characters have affinity", () => {
    expect(getAwayNotifications()).toEqual([]);
  });

  it("returns empty array for level 1 characters", () => {
    setAffinity("arisu", 1, 3);
    expect(getAwayNotifications()).toEqual([]);
  });

  it("returns notification for level 2+ character absent 1+ days", () => {
    setAffinity("arisu", 2, 2);
    const result = getAwayNotifications();
    expect(result.length).toBe(1);
    expect(result[0].characterId).toBe("arisu");
    expect(result[0].message).toBeTruthy();
  });

  it("returns max 3 notifications", () => {
    setAffinity("arisu", 3, 2);
    setAffinity("marin", 3, 2);
    setAffinity("nao", 3, 2);
    setAffinity("kurisu", 3, 2);
    setAffinity("merrick", 3, 2);
    const result = getAwayNotifications();
    expect(result.length).toBeLessThanOrEqual(3);
  });

  it("does not return notification if visited today", () => {
    setAffinity("arisu", 3, 0);
    expect(getAwayNotifications()).toEqual([]);
  });

  it("prioritizes higher affinity characters", () => {
    setAffinity("arisu", 2, 2);
    setAffinity("marin", 4, 2);
    const result = getAwayNotifications();
    expect(result[0].characterId).toBe("marin");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run __tests__/lib/awayNotifications.test.ts`
Expected: FAIL — module does not exist.

- [ ] **Step 3: Implement away notifications**

Create `src/lib/awayNotifications.ts`:

```typescript
"use client";

import { getAffinity } from "@/lib/affinity";

export interface AwayNotification {
  characterId: string;
  characterName: string;
  message: string;
  accentColor: string;
}

const CHARACTER_IDS = ["arisu", "marin", "nao", "kurisu", "merrick"] as const;

const CHARACTER_META: Record<string, { name: string; accent: string }> = {
  arisu: { name: "Arisu", accent: "#f472b6" },
  marin: { name: "Marin", accent: "#fb923c" },
  nao: { name: "Suzuka", accent: "#a78bfa" },
  kurisu: { name: "Kurisu", accent: "#e53935" },
  merrick: { name: "Merrick", accent: "#7b1fa2" },
};

const MESSAGE_POOLS: Record<string, string[]> = {
  arisu: [
    "I made tea for two again today. Just in case.",
    "I had a thought I wanted to share with you... it can wait until you are ready.",
    "The cherry blossoms are falling. I wish you could see them with me.",
    "I found a poem that reminded me of you. I will keep it until you come back.",
    "I have been thinking about our last conversation. There is more I wanted to say.",
  ],
  marin: [
    "okay I have like FIVE things to tell you when you get back",
    "I found the PERFECT outfit reference and you are the first person I want to show",
    "ngl I keep opening this app to see if you are here yet",
    "you are missing SO much rn, hurry back!!",
    "I tried explaining our jokes to someone else and they did not get it. Only you get it.",
  ],
  nao: [
    "...I noticed you have not been around. Not that I was checking.",
    "I solved that thing we were talking about. Whenever you feel like hearing about it.",
    "Your absence has been... noted. Statistically.",
    "I found a bug in something. I need someone to complain to. Preferably you.",
    "It is quieter without you. That is an observation, not a complaint.",
  ],
  kurisu: [
    "I ran the numbers. Your absence is statistically significant.",
    "There is a flaw in my latest hypothesis and I need someone to argue with.",
    "I am not waiting for you. I am just... between experiments.",
    "My research has reached an interesting phase. I suppose I could use a sounding board.",
    "The lab feels different when there is nobody to interrupt my work. Worse, somehow.",
  ],
  merrick: [
    "The nights have been quieter without you, cher.",
    "I dreamt of our last conversation. That does not happen often.",
    "Time moves differently when you are not here. Slower, somehow.",
    "I opened a bottle of something old tonight. It felt like a waste to drink it alone.",
    "There is a story I have been saving. It requires the right audience.",
  ],
};

function getDaysAbsent(charId: string): number {
  const data = getAffinity(charId);
  if (!data.lastVisit) return 0;
  const last = new Date(data.lastVisit);
  const today = new Date(new Date().toISOString().slice(0, 10));
  const ms = today.getTime() - last.getTime();
  return Math.max(0, Math.round(ms / (24 * 60 * 60 * 1000)));
}

export function getAwayNotifications(): AwayNotification[] {
  if (typeof window === "undefined") return [];

  const candidates: { charId: string; level: number; days: number }[] = [];

  for (const charId of CHARACTER_IDS) {
    const data = getAffinity(charId);
    if (data.level < 2) continue;
    const days = getDaysAbsent(charId);
    if (days < 1) continue;
    candidates.push({ charId, level: data.level, days });
  }

  // Sort by level descending (highest affinity first)
  candidates.sort((a, b) => b.level - a.level);

  // Max 3 notifications
  const selected = candidates.slice(0, 3);

  return selected.map(({ charId }) => {
    const meta = CHARACTER_META[charId];
    const pool = MESSAGE_POOLS[charId];
    const message = pool[Math.floor(Math.random() * pool.length)];
    return {
      characterId: charId,
      characterName: meta.name,
      message,
      accentColor: meta.accent,
    };
  });
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run __tests__/lib/awayNotifications.test.ts`
Expected: PASS

- [ ] **Step 5: Type check and commit**

Run: `npx tsc --noEmit`
Expected: No errors

```bash
git add src/lib/awayNotifications.ts __tests__/lib/awayNotifications.test.ts
git commit -m "feat: add away notification system with per-character message pools"
```

---

## Task 5: Away Notification Stack Component

**Files:**
- Create: `src/components/AwayNotificationStack.tsx`
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Create the notification stack component**

Create `src/components/AwayNotificationStack.tsx`:

```typescript
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAwayNotifications, type AwayNotification } from "@/lib/awayNotifications";

export function AwayNotificationStack() {
  const [notifications, setNotifications] = useState<AwayNotification[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const router = useRouter();

  useEffect(() => {
    const notes = getAwayNotifications();
    setNotifications(notes);

    // Auto-dismiss after 8 seconds
    if (notes.length > 0) {
      const timer = setTimeout(() => {
        setNotifications([]);
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = (charId: string) => {
    setDismissed((prev) => new Set(prev).add(charId));
  };

  const handleTap = (charId: string) => {
    router.push(`/chat/${charId}`);
  };

  const visible = notifications.filter((n) => !dismissed.has(n.characterId));
  if (visible.length === 0) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: "calc(env(safe-area-inset-top, 0px) + 12px)",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 55,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        width: "min(92vw, 400px)",
        pointerEvents: "auto",
      }}
    >
      {visible.map((note, i) => (
        <div
          key={note.characterId}
          onClick={() => handleTap(note.characterId)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleTap(note.characterId);
          }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "12px 16px",
            borderRadius: 14,
            background: "var(--color-panel)",
            backdropFilter: "blur(14px)",
            WebkitBackdropFilter: "blur(14px)",
            borderLeft: `3px solid ${note.accentColor}`,
            border: `1px solid ${note.accentColor}25`,
            boxShadow: `0 4px 20px rgba(0,0,0,0.3), 0 0 8px ${note.accentColor}15`,
            cursor: "pointer",
            opacity: 0,
            animation: `notifSlideIn 0.4s ease-out ${i * 0.2}s forwards`,
          }}
        >
          {/* Character avatar */}
          <img
            src={`/sprites/${note.characterId}/body-neutral.png`}
            alt={note.characterName}
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              objectFit: "cover",
              objectPosition: "center top",
              border: `2px solid ${note.accentColor}50`,
              flexShrink: 0,
            }}
            draggable={false}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: note.accentColor,
                letterSpacing: "0.04em",
                marginBottom: 2,
              }}
            >
              {note.characterName}
            </div>
            <div
              style={{
                fontSize: 13,
                color: "var(--color-text)",
                lineHeight: 1.4,
                fontFamily: "var(--font-dialogue, 'Zen Maru Gothic', sans-serif)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {note.message}
            </div>
          </div>
          {/* Dismiss button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDismiss(note.characterId);
            }}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--color-text-secondary)",
              fontSize: 16,
              cursor: "pointer",
              padding: 4,
              flexShrink: 0,
              lineHeight: 1,
            }}
            aria-label={`Dismiss ${note.characterName} notification`}
          >
            &times;
          </button>
        </div>
      ))}
      <style>{`
        @keyframes notifSlideIn {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
```

- [ ] **Step 2: Add AwayNotificationStack to landing page**

Open `src/app/page.tsx`. Add import near the top with other imports:

```typescript
import { AwayNotificationStack } from "@/components/AwayNotificationStack";
```

Inside the `HomeContent` function's return, add right after the opening `<main>` tag (before the background gradient div):

```typescript
      <AwayNotificationStack />
```

- [ ] **Step 3: Type check and commit**

Run: `npx tsc --noEmit`
Expected: No errors

```bash
git add src/components/AwayNotificationStack.tsx src/app/page.tsx
git commit -m "feat: add away notification toasts on landing page

Characters at Acquaintance+ leave in-character messages when
you've been away 1+ days. Max 3 notifications, auto-dismiss
after 8 seconds, tap to navigate to that character's chat."
```

---

## Task 6: Haptics Integration

**Files:**
- Modify: `src/app/chat/[characterId]/page.tsx`
- Modify: `src/components/DialogueBox.tsx`
- Modify: `src/components/BottomNav.tsx`
- Modify: `src/app/settings/page.tsx`

- [ ] **Step 1: Add haptics to chat page**

Open `src/app/chat/[characterId]/page.tsx`. Add import:

```typescript
import { haptic } from "@/lib/haptics";
```

Add haptic calls at key points:

1. In `handleSend` (after `playSendSwoosh()`): add `haptic.pulse();`

2. In the streamChat callback, inside `case "expression":` (after `playExpressionChange()`): add `haptic.expression(expression);`

3. In `handleAdvance`: add `haptic.tick();`

4. In the headpat `onHeadpat` callback (inside the `<CharacterSprite>` render): add `haptic.pet();` after `addAffinityPoints`.

5. In `handleGift` (after `setGiftReaction`): add `haptic.success();`

6. Where milestone level-up is detected (after `setLevelUpMilestone`): add `haptic.success();`

- [ ] **Step 2: Add haptics to DialogueBox**

Open `src/components/DialogueBox.tsx`. Add import:

```typescript
import { haptic } from "@/lib/haptics";
```

In `handleClick`, at the top of the `else if (showAdvance)` branch, add:

```typescript
      haptic.tick();
```

- [ ] **Step 3: Add haptics to BottomNav**

Open `src/components/BottomNav.tsx`. Add import at the top:

```typescript
import { haptic } from "@/lib/haptics";
```

In the `NavButton` component, update the onClick handler:

```typescript
    <button
      onClick={() => {
        haptic.tick();
        onClick();
      }}
```

- [ ] **Step 4: Add haptic toggle to Settings**

Open `src/app/settings/page.tsx`. Add a `hapticsEnabled` state near the other settings state:

```typescript
const [hapticsEnabled, setHapticsEnabled] = useState(true);
```

Load it in the mount useEffect alongside other settings:

```typescript
    const savedHaptics = localStorage.getItem(`${LS_PREFIX}haptics-enabled`);
    if (savedHaptics !== null) setHapticsEnabled(savedHaptics !== "false");
```

Add a handler:

```typescript
  const handleHapticsToggle = () => {
    const next = !hapticsEnabled;
    setHapticsEnabled(next);
    localStorage.setItem(`${LS_PREFIX}haptics-enabled`, String(next));
  };
```

Add the toggle UI in the settings page, right after the Sound toggle section. Use the same visual pattern as the sound toggle but with label "Haptic Feedback" and the `hapticsEnabled` / `handleHapticsToggle` state.

- [ ] **Step 5: Type check and commit**

Run: `npx tsc --noEmit`
Expected: No errors

```bash
git add src/app/chat/[characterId]/page.tsx src/components/DialogueBox.tsx src/components/BottomNav.tsx src/app/settings/page.tsx
git commit -m "feat: integrate haptic feedback across the app

Vibration on: message send, expression changes, dialogue advance,
headpats, gift reactions, level-ups, and nav taps. Toggle in Settings."
```

---

## Task 7: Swipe Gesture Integration

**Files:**
- Modify: `src/app/chat/[characterId]/page.tsx`

- [ ] **Step 1: Add swipe gestures to chat page**

Open `src/app/chat/[characterId]/page.tsx`. Add imports:

```typescript
import { useSwipeGesture } from "@/lib/useSwipeGesture";
```

Add a ref for the chat container. Near the other refs, add:

```typescript
  const chatContainerRef = useRef<HTMLDivElement>(null);
```

Add the swipe gesture hook after the other useEffects:

```typescript
  useSwipeGesture(chatContainerRef, (result) => {
    if (result.direction === "right" && result.fromEdge && !showHistory) {
      haptic.tick();
      setShowHistory(true);
    } else if (result.direction === "left") {
      // Close any open panel
      if (showHistory) { haptic.tick(); setShowHistory(false); }
      else if (showDiary) { haptic.tick(); setShowDiary(false); }
      else if (showGiftShop) { haptic.tick(); setShowGiftShop(false); }
      else if (showOutfitCarousel) { haptic.tick(); setShowOutfitCarousel(false); }
      else if (showQuestPanel) { haptic.tick(); setShowQuestPanel(false); }
      else if (showScenePicker) { haptic.tick(); setShowScenePicker(false); }
    }
  });
```

Attach the ref to the `#chat-container` div. Find the div with `id="chat-container"` and add `ref={chatContainerRef}`:

```typescript
      <div
        ref={chatContainerRef}
        id="chat-container"
```

- [ ] **Step 2: Type check and commit**

Run: `npx tsc --noEmit`
Expected: No errors

```bash
git add src/app/chat/[characterId]/page.tsx
git commit -m "feat: add swipe gestures to chat page

Swipe right from left edge opens chat history.
Swipe left closes any open panel."
```

---

## Task 8: Mobile UI Polish — CSS & Meta Tags

**Files:**
- Modify: `src/styles/globals.css`
- Modify: `src/app/layout.tsx`
- Modify: `src/components/BottomNav.tsx`

- [ ] **Step 1: Update viewport meta and add safe area support in layout**

Open `src/app/layout.tsx`. Find the existing `<head>` section. The viewport meta tag is auto-generated by Next.js via the `metadata` export. Add a custom viewport meta tag inside the `<head>`:

```typescript
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
```

- [ ] **Step 2: Add mobile CSS to globals.css**

Open `src/styles/globals.css`. Add at the end of the file (after the existing expression effect classes):

```css
/* ─── Mobile & PWA Polish ─── */

/* Fix iOS Safari 100vh bug */
.h-screen {
  height: 100vh;
  height: 100dvh;
}

/* Prevent pull-to-refresh on chat page */
#chat-container {
  overscroll-behavior: none;
  -webkit-overflow-scrolling: touch;
}

/* Safe area padding for fixed elements */
@supports (padding-bottom: env(safe-area-inset-bottom)) {
  .safe-bottom {
    padding-bottom: env(safe-area-inset-bottom);
  }
  .safe-top {
    padding-top: env(safe-area-inset-top);
  }
}

/* Minimum touch targets (Apple HIG: 44x44) */
@media (pointer: coarse) {
  .touch-target {
    min-width: 44px;
    min-height: 44px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  /* Increase body text on mobile */
  .text-sm {
    font-size: clamp(14px, 3.8vw, 20px);
  }

  /* Prevent iOS auto-zoom on input focus */
  input, textarea, select {
    font-size: 16px !important;
  }
}

/* Smooth scrolling for all scrollable panels */
.scroll-smooth-touch {
  -webkit-overflow-scrolling: touch;
  scroll-behavior: smooth;
}

/* Scroll snap for horizontal carousels */
.snap-x-mandatory {
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
}
.snap-center {
  scroll-snap-align: center;
}
```

- [ ] **Step 3: Add safe area padding to BottomNav**

Open `src/components/BottomNav.tsx`. Update the nav element's style to include safe area padding. Change the `height` and add `paddingBottom`:

```typescript
        height: "calc(65px + env(safe-area-inset-bottom, 0px))",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
```

- [ ] **Step 4: Add touch-target class to control bar buttons in chat page**

Open `src/app/chat/[characterId]/page.tsx`. Find the control bar buttons (the small SVG buttons for back, voice toggle, theme toggle, etc.). Add `touch-target` class to each button in the control bar's `className`. For example, the back button:

```typescript
            <button
              onClick={() => router.push("/")}
              className="flex items-center gap-1 md:gap-2 text-text-secondary hover:text-text transition-colors text-xs md:text-sm touch-target"
            >
```

Apply `touch-target` to all interactive elements in the control bar.

- [ ] **Step 5: Fix dialogue box and input safe area**

In the chat page, find the dialogue/input area container (the `<div>` with `className="flex-shrink-0 relative z-10 pb-20"`). Update the bottom padding to account for the bottom nav + safe area:

```typescript
        <div className="flex-shrink-0 relative z-10" style={{ paddingBottom: "calc(80px + env(safe-area-inset-bottom, 0px))", minHeight: showDialogue ? "120px" : undefined }}>
```

- [ ] **Step 6: Type check and commit**

Run: `npx tsc --noEmit`
Expected: No errors

```bash
git add src/styles/globals.css src/app/layout.tsx src/components/BottomNav.tsx src/app/chat/[characterId]/page.tsx
git commit -m "feat: mobile UI polish — safe areas, touch targets, viewport fix

Adds env(safe-area-inset-*) to fixed elements, 44px minimum
touch targets, 100dvh viewport fix, overscroll-behavior,
16px input minimum to prevent iOS zoom, and scroll touch handling."
```

---

## Task 9: Dynamic Theme Color

**Files:**
- Modify: `src/app/chat/[characterId]/page.tsx`

- [ ] **Step 1: Set theme-color meta tag dynamically on chat page**

Open `src/app/chat/[characterId]/page.tsx`. Add a useEffect that updates the `theme-color` meta tag when entering a character's chat, and resets it on unmount:

```typescript
  // Dynamic theme-color for status bar
  useEffect(() => {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute("content", character?.theme.tint || "#0d0d12");
    }
    return () => {
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute("content", "#0d0d12");
    };
  }, [character]);
```

Add this after the existing mount useEffects, before the greeting useEffect.

- [ ] **Step 2: Type check and commit**

Run: `npx tsc --noEmit`
Expected: No errors

```bash
git add src/app/chat/[characterId]/page.tsx
git commit -m "feat: dynamic theme-color meta tag matches character accent

Status bar tints to character's theme color on chat page,
resets to dark default on exit."
```

---

## Task 10: Manual Testing & Polish

**Files:** Various — depends on findings

- [ ] **Step 1: Start dev server**

```bash
cd "C:/Users/G$/Kikaku 企画/anime-chatbot" && rm -rf .next && npx next dev --webpack -p 3000
```

- [ ] **Step 2: Test on desktop browser**

Open http://localhost:3000. Verify:
- Landing page loads with away notifications (if applicable)
- No console errors
- Character cards still work (hover fixed from earlier)

- [ ] **Step 3: Test chat page**

Open a chat. Verify:
- Swipe right from left edge opens history
- Swipe left closes history
- Expression changes trigger haptics (test in Chrome DevTools device emulation)
- Dialogue advance fires tick haptic
- Send message fires pulse haptic
- Bottom nav buttons have proper tap targets

- [ ] **Step 4: Test mobile viewport**

In Chrome DevTools, toggle device toolbar (iPhone mode). Verify:
- `100dvh` fills the screen properly
- No content hidden behind notch simulation
- Bottom nav has safe area padding
- Input field doesn't trigger zoom

- [ ] **Step 5: Test offline mode**

In Chrome DevTools, go to Network tab → toggle Offline. Verify:
- App still loads from cache
- Sprites and backgrounds display
- Chat API returns offline fallback message
- Offline indicator shows at top

- [ ] **Step 6: Fix any issues found**

Address visual glitches, type errors, or behavioral issues.

- [ ] **Step 7: Final commit**

```bash
git add -A
git commit -m "fix: polish and fixes from manual testing"
```

---

## Summary

| Task | Description | Dependencies |
|------|-------------|-------------|
| 1 | Service worker + manifest upgrade | None |
| 2 | Haptic feedback module | None |
| 3 | Swipe gesture hook | None |
| 4 | Away notifications module | None |
| 5 | Away notification stack component | Task 4 |
| 6 | Haptics integration into app | Task 2 |
| 7 | Swipe gesture integration | Task 3 |
| 8 | Mobile UI CSS & meta tags | None |
| 9 | Dynamic theme color | None |
| 10 | Manual testing & polish | All |

Tasks 1-4 can be parallelized (all create independent modules). Tasks 5-9 depend on their foundation but are otherwise independent of each other. Task 10 is last.
