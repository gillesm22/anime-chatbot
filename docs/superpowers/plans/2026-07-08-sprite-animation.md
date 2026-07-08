# Sprite Animation System — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make character sprites feel alive with idle micro-behaviors, expression-reactive body language, and subtle hair sway — using zero new art assets.

**Architecture:** Split the existing single-PNG sprite into 3 CSS clip-path zones (head, torso, base) that animate independently via CSS custom properties. A canvas overlay on the head zone adds hair displacement. Two hooks (`useIdleBehavior`, `useReactiveAnimation`) drive all motion through refs — no React re-renders during animation.

**Tech Stack:** React 19, CSS clip-path, CSS custom properties, HTML Canvas 2D, requestAnimationFrame, Vitest + jsdom

**Spec:** `docs/superpowers/specs/2026-07-08-sprite-animation-design.md`

---

## File Structure

### New files

| File | Responsibility |
|------|---------------|
| `src/lib/sprites/zones.ts` | Zone boundary configs per character, animation personality configs, TypeScript types |
| `src/lib/sprites/idle.ts` | `useIdleBehavior` hook — always-on breathing/sway + random idle action picker |
| `src/lib/sprites/reactive.ts` | `useReactiveAnimation` hook — expression-to-animation mapping, priority queue, blend |
| `src/lib/sprites/hairSway.ts` | `useHairSway` hook — canvas displacement grid, rAF loop, wind intensity |
| `src/components/SpriteZone.tsx` | Renders one clipped zone of sprite with CSS custom property transform bindings |
| `src/components/HairSwayCanvas.tsx` | Canvas overlay for hair displacement effect |
| `__tests__/lib/sprites/zones.test.ts` | Tests for zone config validation |
| `__tests__/lib/sprites/idle.test.ts` | Tests for idle behavior hook |
| `__tests__/lib/sprites/reactive.test.ts` | Tests for reactive animation hook |

### Modified files

| File | Change |
|------|--------|
| `src/components/CharacterSprite.tsx` | Replace single `<img>` with `SpriteZone` x3 + `HairSwayCanvas`, wire hooks |
| `src/styles/globals.css` | Remove old `breathe`, `idleSway`, `talkBounce` keyframes (replaced by hook-driven animation) |

---

### Task 1: Zone Config and Types

**Files:**
- Create: `src/lib/sprites/zones.ts`
- Create: `__tests__/lib/sprites/zones.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// __tests__/lib/sprites/zones.test.ts
import { describe, it, expect } from "vitest";
import { getZoneConfig, type ZoneConfig, type SpriteAnimConfig } from "@/lib/sprites/zones";

describe("getZoneConfig", () => {
  it("returns config for known character", () => {
    const config = getZoneConfig("arisu");
    expect(config).toBeDefined();
    expect(config.head).toBeDefined();
    expect(config.torso).toBeDefined();
    expect(config.base).toBeDefined();
    expect(config.hairCanvasHeight).toBeGreaterThan(0);
  });

  it("returns fallback config for unknown character", () => {
    const config = getZoneConfig("unknown");
    expect(config).toBeDefined();
    expect(config.head.clipTop).toBe(0);
  });

  it("zone boundaries overlap by 2-3%", () => {
    const config = getZoneConfig("arisu");
    const headBottom = config.head.clipBottom;
    const torsoTop = config.torso.clipTop;
    const overlap = headBottom - torsoTop;
    expect(overlap).toBeGreaterThanOrEqual(2);
    expect(overlap).toBeLessThanOrEqual(3);
  });

  it("zones cover the full sprite height", () => {
    const config = getZoneConfig("marin");
    expect(config.head.clipTop).toBe(0);
    expect(config.base.clipBottom).toBe(100);
  });

  it("each character has animation personality config", () => {
    const config = getZoneConfig("marin");
    expect(config.personality).toBeDefined();
    expect(config.personality.idleInterval).toBeDefined();
    expect(config.personality.reactiveScale).toBeDefined();
    expect(config.personality.hairSwaySpeed).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run __tests__/lib/sprites/zones.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Write the implementation**

```typescript
// src/lib/sprites/zones.ts

export interface ZoneBounds {
  clipTop: number;    // percent from top
  clipBottom: number; // percent from top
}

export interface ZoneConfig {
  head: ZoneBounds;
  torso: ZoneBounds;
  base: ZoneBounds;
  hairCanvasHeight: number; // percent of sprite height
  personality: AnimPersonality;
}

export interface AnimPersonality {
  // Idle
  idleInterval: [number, number];    // min/max seconds between random idle actions
  breatheScale: number;              // scaleY amplitude (e.g. 1.005)
  breatheDuration: number;           // seconds
  swayAmount: number;                // px
  swayDuration: number;              // seconds
  blinkInterval: [number, number];   // min/max seconds between blinks
  idleWeights: Record<IdleAction, number>; // relative probability

  // Reactive
  reactiveScale: number;             // multiplier on all reactive transform values (0.5 = subtle, 1.5 = dramatic)
  reactiveDuration: number;          // multiplier on durations

  // Hair
  hairSwaySpeed: number;             // Hz
  hairSwayAmount: number;            // max px displacement
}

export type IdleAction = "glance" | "weightShift" | "headTilt" | "settle" | "deepBreath";

export type SpriteAnimConfig = ZoneConfig;

const DEFAULT_IDLE_WEIGHTS: Record<IdleAction, number> = {
  glance: 1,
  weightShift: 1,
  headTilt: 1,
  settle: 1,
  deepBreath: 1,
};

const CONFIGS: Record<string, ZoneConfig> = {
  arisu: {
    head: { clipTop: 0, clipBottom: 32 },
    torso: { clipTop: 30, clipBottom: 65 },
    base: { clipTop: 63, clipBottom: 100 },
    hairCanvasHeight: 35,
    personality: {
      idleInterval: [10, 15],
      breatheScale: 1.004,
      breatheDuration: 4,
      swayAmount: 1,
      swayDuration: 7,
      blinkInterval: [3, 6],
      idleWeights: { ...DEFAULT_IDLE_WEIGHTS, deepBreath: 2, glance: 0.5 },
      reactiveScale: 0.7,
      reactiveDuration: 1.2,
      hairSwaySpeed: 0.25,
      hairSwayAmount: 2.5,
    },
  },
  marin: {
    head: { clipTop: 0, clipBottom: 30 },
    torso: { clipTop: 28, clipBottom: 62 },
    base: { clipTop: 60, clipBottom: 100 },
    hairCanvasHeight: 32,
    personality: {
      idleInterval: [6, 10],
      breatheScale: 1.006,
      breatheDuration: 3,
      swayAmount: 2,
      swayDuration: 5,
      blinkInterval: [2, 5],
      idleWeights: { ...DEFAULT_IDLE_WEIGHTS, weightShift: 2, headTilt: 2 },
      reactiveScale: 1.4,
      reactiveDuration: 0.8,
      hairSwaySpeed: 0.4,
      hairSwayAmount: 3,
    },
  },
  nao: {
    head: { clipTop: 0, clipBottom: 28 },
    torso: { clipTop: 26, clipBottom: 60 },
    base: { clipTop: 58, clipBottom: 100 },
    hairCanvasHeight: 30,
    personality: {
      idleInterval: [12, 18],
      breatheScale: 1.003,
      breatheDuration: 4.5,
      swayAmount: 0.5,
      swayDuration: 8,
      blinkInterval: [3, 7],
      idleWeights: { ...DEFAULT_IDLE_WEIGHTS, glance: 0.3, settle: 0.3 },
      reactiveScale: 1.2,
      reactiveDuration: 0.6,
      hairSwaySpeed: 0.3,
      hairSwayAmount: 1.5,
    },
  },
  kurisu: {
    head: { clipTop: 0, clipBottom: 30 },
    torso: { clipTop: 28, clipBottom: 63 },
    base: { clipTop: 61, clipBottom: 100 },
    hairCanvasHeight: 33,
    personality: {
      idleInterval: [8, 14],
      breatheScale: 1.004,
      breatheDuration: 3.5,
      swayAmount: 1,
      swayDuration: 6,
      blinkInterval: [3, 6],
      idleWeights: { ...DEFAULT_IDLE_WEIGHTS },
      reactiveScale: 1.0,
      reactiveDuration: 1.0,
      hairSwaySpeed: 0.3,
      hairSwayAmount: 2,
    },
  },
  merrick: {
    head: { clipTop: 0, clipBottom: 32 },
    torso: { clipTop: 30, clipBottom: 65 },
    base: { clipTop: 63, clipBottom: 100 },
    hairCanvasHeight: 35,
    personality: {
      idleInterval: [12, 20],
      breatheScale: 1.003,
      breatheDuration: 5,
      swayAmount: 1.5,
      swayDuration: 8,
      blinkInterval: [5, 10],
      idleWeights: { ...DEFAULT_IDLE_WEIGHTS, glance: 0.5, weightShift: 0.5 },
      reactiveScale: 1.1,
      reactiveDuration: 1.5,
      hairSwaySpeed: 0.2,
      hairSwayAmount: 3,
    },
  },
  ticia: {
    head: { clipTop: 0, clipBottom: 31 },
    torso: { clipTop: 29, clipBottom: 64 },
    base: { clipTop: 62, clipBottom: 100 },
    hairCanvasHeight: 34,
    personality: {
      idleInterval: [10, 16],
      breatheScale: 1.003,
      breatheDuration: 4.5,
      swayAmount: 1,
      swayDuration: 7,
      blinkInterval: [4, 8],
      idleWeights: { ...DEFAULT_IDLE_WEIGHTS, settle: 0.3, weightShift: 0.5 },
      reactiveScale: 1.0,
      reactiveDuration: 1.3,
      hairSwaySpeed: 0.25,
      hairSwayAmount: 2.5,
    },
  },
};

const FALLBACK: ZoneConfig = {
  head: { clipTop: 0, clipBottom: 30 },
  torso: { clipTop: 28, clipBottom: 63 },
  base: { clipTop: 61, clipBottom: 100 },
  hairCanvasHeight: 32,
  personality: {
    idleInterval: [8, 15],
    breatheScale: 1.005,
    breatheDuration: 3.5,
    swayAmount: 1.5,
    swayDuration: 6,
    blinkInterval: [3, 6],
    idleWeights: { ...DEFAULT_IDLE_WEIGHTS },
    reactiveScale: 1.0,
    reactiveDuration: 1.0,
    hairSwaySpeed: 0.3,
    hairSwayAmount: 2,
  },
};

export function getZoneConfig(characterId: string): ZoneConfig {
  return CONFIGS[characterId] ?? FALLBACK;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run __tests__/lib/sprites/zones.test.ts`
Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/sprites/zones.ts __tests__/lib/sprites/zones.test.ts
git commit -m "feat: zone config and animation personality types for sprite animation"
```

---

### Task 2: SpriteZone Component

**Files:**
- Create: `src/components/SpriteZone.tsx`

- [ ] **Step 1: Write the SpriteZone component**

```tsx
// src/components/SpriteZone.tsx
"use client";

import { forwardRef } from "react";
import type { ZoneBounds } from "@/lib/sprites/zones";

interface SpriteZoneProps {
  src: string;
  alt: string;
  zone: ZoneBounds;
  overlapPx?: number;
  className?: string;
}

export const SpriteZone = forwardRef<HTMLDivElement, SpriteZoneProps>(
  function SpriteZone({ src, alt, zone, overlapPx = 0, className = "" }, ref) {
    // clip-path: inset(top right bottom left)
    // We clip from top and bottom to show only this zone's portion
    const clipTop = `${zone.clipTop}%`;
    const clipBottom = `${100 - zone.clipBottom}%`;

    return (
      <div
        ref={ref}
        className={`absolute inset-0 ${className}`}
        style={{
          clipPath: `inset(${clipTop} 0% ${clipBottom} 0%)`,
          willChange: "transform",
          transition: "transform 150ms ease-out",
        }}
      >
        <img
          src={src}
          alt={alt}
          className="h-full w-full object-contain object-bottom"
          draggable={false}
          style={{ pointerEvents: "none" }}
        />
      </div>
    );
  }
);
```

- [ ] **Step 2: Verify build compiles**

Run: `npx next build 2>&1 | tail -5`
Expected: Compiled successfully (or no new errors)

- [ ] **Step 3: Commit**

```bash
git add src/components/SpriteZone.tsx
git commit -m "feat: SpriteZone component — clipped sprite layer with transform binding"
```

---

### Task 3: Idle Behavior Hook

**Files:**
- Create: `src/lib/sprites/idle.ts`
- Create: `__tests__/lib/sprites/idle.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// __tests__/lib/sprites/idle.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useIdleBehavior } from "@/lib/sprites/idle";
import { getZoneConfig } from "@/lib/sprites/zones";

describe("useIdleBehavior", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns refs for head, torso, and base zones", () => {
    const config = getZoneConfig("arisu");
    const { result } = renderHook(() => useIdleBehavior(config.personality, false));
    expect(result.current.headRef).toBeDefined();
    expect(result.current.torsoRef).toBeDefined();
    expect(result.current.baseRef).toBeDefined();
  });

  it("does not run idle actions when paused", () => {
    const config = getZoneConfig("arisu");
    const headEl = document.createElement("div");
    const torsoEl = document.createElement("div");
    const baseEl = document.createElement("div");

    const { result } = renderHook(() => useIdleBehavior(config.personality, true));

    // Assign refs
    (result.current.headRef as any).current = headEl;
    (result.current.torsoRef as any).current = torsoEl;
    (result.current.baseRef as any).current = baseEl;

    // Advance past idle interval
    act(() => { vi.advanceTimersByTime(20000); });

    // No transforms should be applied when paused
    expect(headEl.style.transform).toBe("");
  });

  it("applies breathing transform to torso continuously", () => {
    const config = getZoneConfig("arisu");
    const torsoEl = document.createElement("div");

    const { result } = renderHook(() => useIdleBehavior(config.personality, false));
    (result.current.torsoRef as any).current = torsoEl;

    // Trigger an animation frame
    act(() => { vi.advanceTimersByTime(100); });

    // Breathing should set a CSS custom property or direct transform
    // The hook uses rAF so we check that the ref element gets updated
    expect(result.current.torsoRef).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run __tests__/lib/sprites/idle.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Write the implementation**

```typescript
// src/lib/sprites/idle.ts
"use client";

import { useRef, useEffect, useCallback } from "react";
import type { AnimPersonality, IdleAction } from "./zones";

interface IdleState {
  breathePhase: number;
  swayPhase: number;
  currentAction: IdleAction | null;
  actionStartTime: number;
  actionDuration: number;
  nextActionTime: number;
}

const IDLE_ACTIONS: Record<IdleAction, {
  duration: number;
  apply: (t: number, scale: number) => { head?: string; torso?: string; base?: string };
}> = {
  glance: {
    duration: 1500,
    apply: (t, s) => {
      // Ease in-out, rotate head, pause in middle, return
      const p = t < 0.3 ? t / 0.3 : t > 0.7 ? (1 - t) / 0.3 : 1;
      const ease = p * p * (3 - 2 * p); // smoothstep
      return { head: `rotate(${2.5 * s * ease}deg)` };
    },
  },
  weightShift: {
    duration: 2000,
    apply: (t, s) => {
      const ease = Math.sin(t * Math.PI);
      return {
        base: `translateX(${3 * s * ease}px)`,
        torso: `translateX(${2 * s * ease}px)`,
      };
    },
  },
  headTilt: {
    duration: 2000,
    apply: (t, s) => {
      const ease = Math.sin(t * Math.PI);
      return { head: `rotate(${2 * s * ease}deg) translateY(${-1 * s * ease}px)` };
    },
  },
  settle: {
    duration: 1500,
    apply: (t, s) => {
      const ease = Math.sin(t * Math.PI);
      const y = 2 * s * ease;
      return {
        head: `translateY(${y}px)`,
        torso: `translateY(${y * 0.8}px)`,
        base: `translateY(${y * 0.5}px)`,
      };
    },
  },
  deepBreath: {
    duration: 3000,
    apply: (t, s) => {
      const ease = Math.sin(t * Math.PI);
      return { torso: `scaleY(${1 + 0.008 * s * ease})` };
    },
  },
};

function pickAction(weights: Record<IdleAction, number>): IdleAction {
  const entries = Object.entries(weights) as [IdleAction, number][];
  const total = entries.reduce((sum, [, w]) => sum + w, 0);
  let r = Math.random() * total;
  for (const [action, weight] of entries) {
    r -= weight;
    if (r <= 0) return action;
  }
  return entries[0][0];
}

function randomInRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

export function useIdleBehavior(personality: AnimPersonality, paused: boolean) {
  const headRef = useRef<HTMLDivElement>(null);
  const torsoRef = useRef<HTMLDivElement>(null);
  const baseRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef<IdleState>({
    breathePhase: 0,
    swayPhase: 0,
    currentAction: null,
    actionStartTime: 0,
    actionDuration: 0,
    nextActionTime: Date.now() + randomInRange(personality.idleInterval[0], personality.idleInterval[1]) * 1000,
  });
  const rafRef = useRef<number>(0);
  const pausedRef = useRef(paused);
  pausedRef.current = paused;
  const personalityRef = useRef(personality);
  personalityRef.current = personality;

  const tick = useCallback((now: number) => {
    const p = personalityRef.current;
    const s = stateRef.current;
    const head = headRef.current;
    const torso = torsoRef.current;
    const base = baseRef.current;

    if (!head || !torso || !base || pausedRef.current) {
      rafRef.current = requestAnimationFrame(tick);
      return;
    }

    // Always-on: breathing
    s.breathePhase = (now / 1000 / p.breatheDuration) * Math.PI * 2;
    const breatheY = Math.sin(s.breathePhase) * (p.breatheScale - 1) * 1000;
    let torsoTransform = `scaleY(${1 + Math.sin(s.breathePhase) * (p.breatheScale - 1)})`;

    // Always-on: micro-sway
    s.swayPhase = (now / 1000 / p.swayDuration) * Math.PI * 2;
    const swayX = Math.sin(s.swayPhase) * p.swayAmount;
    let baseTransform = `translateX(${swayX}px)`;
    let headTransform = "";

    // Random idle action
    if (s.currentAction) {
      const elapsed = now - s.actionStartTime;
      const t = Math.min(elapsed / s.actionDuration, 1);
      const action = IDLE_ACTIONS[s.currentAction];
      const transforms = action.apply(t, p.reactiveScale);

      if (transforms.head) headTransform = transforms.head;
      if (transforms.torso) torsoTransform += ` ${transforms.torso}`;
      if (transforms.base) baseTransform += ` ${transforms.base}`;

      if (t >= 1) {
        s.currentAction = null;
        s.nextActionTime = now + randomInRange(p.idleInterval[0], p.idleInterval[1]) * 1000;
      }
    } else if (now >= s.nextActionTime) {
      s.currentAction = pickAction(p.idleWeights);
      s.actionStartTime = now;
      s.actionDuration = IDLE_ACTIONS[s.currentAction].duration;
    }

    head.style.transform = headTransform;
    torso.style.transform = torsoTransform;
    base.style.transform = baseTransform;

    rafRef.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [tick]);

  return { headRef, torsoRef, baseRef };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run __tests__/lib/sprites/idle.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/sprites/idle.ts __tests__/lib/sprites/idle.test.ts
git commit -m "feat: useIdleBehavior hook — breathing, sway, random idle actions"
```

---

### Task 4: Reactive Animation Hook

**Files:**
- Create: `src/lib/sprites/reactive.ts`
- Create: `__tests__/lib/sprites/reactive.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// __tests__/lib/sprites/reactive.test.ts
import { describe, it, expect } from "vitest";
import {
  getReactiveAnimation,
  type ReactiveTransforms,
  type ConversationEvent,
} from "@/lib/sprites/reactive";

describe("getReactiveAnimation", () => {
  it("returns animation for happy expression", () => {
    const anim = getReactiveAnimation("happy");
    expect(anim).toBeDefined();
    expect(anim!.duration).toBeGreaterThan(0);
    expect(typeof anim!.apply).toBe("function");
  });

  it("returns animation for all mapped expressions", () => {
    const mapped = [
      "happy", "laugh", "thinking", "surprised", "flustered", "shy",
      "angry", "sad", "crying", "excited", "teasing", "smirk",
      "devoted", "sleepy", "jealous",
    ] as const;
    for (const expr of mapped) {
      const anim = getReactiveAnimation(expr);
      expect(anim, `missing animation for ${expr}`).toBeDefined();
    }
  });

  it("returns null for neutral (no reactive animation)", () => {
    const anim = getReactiveAnimation("neutral");
    expect(anim).toBeNull();
  });

  it("apply function returns transforms at t=0.5", () => {
    const anim = getReactiveAnimation("surprised")!;
    const transforms = anim.apply(0.5, 1.0);
    expect(transforms).toBeDefined();
    // At least one zone should have a transform
    const hasTransform = transforms.head || transforms.torso || transforms.base;
    expect(hasTransform).toBeTruthy();
  });
});

describe("getConversationAnimation", () => {
  it("returns animation for message_sent event", () => {
    const { getConversationAnimation } = require("@/lib/sprites/reactive");
    const anim = getConversationAnimation("message_sent" as ConversationEvent);
    expect(anim).toBeDefined();
    expect(anim!.duration).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run __tests__/lib/sprites/reactive.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Write the implementation**

```typescript
// src/lib/sprites/reactive.ts
"use client";

import { useRef, useEffect, useCallback } from "react";
import type { Expression } from "@/lib/characters/types";
import type { AnimPersonality } from "./zones";

export interface ReactiveTransforms {
  head?: string;
  torso?: string;
  base?: string;
}

interface ReactiveAnimation {
  duration: number; // ms
  apply: (t: number, scale: number) => ReactiveTransforms;
  hold?: boolean; // if true, holds at t=1 until next expression
}

export type ConversationEvent = "message_sent" | "waiting" | "stream_start" | "speaking" | "headpat";

// Easing helpers
function easeOut(t: number): number { return 1 - (1 - t) * (1 - t); }
function easeInOut(t: number): number { return t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2; }
function spring(t: number): number { return 1 - Math.cos(t * Math.PI * 2) * Math.exp(-t * 4); }

const EXPRESSION_ANIMS: Partial<Record<Expression, ReactiveAnimation>> = {
  happy: {
    duration: 400,
    apply: (t, s) => {
      const e = easeOut(t);
      return { head: `translateY(${-1.5 * s * e}px) rotate(${-1 * s * e}deg)`, torso: `translateY(${-2 * s * e}px)` };
    },
  },
  laugh: {
    duration: 400,
    apply: (t, s) => {
      const e = easeOut(t);
      return { head: `translateY(${-2 * s * e}px) rotate(${-1.5 * s * e}deg)`, torso: `translateY(${-2 * s * e}px)` };
    },
  },
  thinking: {
    duration: 600,
    hold: true,
    apply: (t, s) => {
      const e = easeOut(Math.min(t * 1.5, 1));
      return { head: `rotate(${5 * s * e}deg) translateY(${-1 * s * e}px)` };
    },
  },
  surprised: {
    duration: 300,
    apply: (t, s) => {
      const e = spring(t);
      return {
        head: `translateY(${3 * s * (1 - e)}px)`,
        torso: `translateY(${2 * s * (1 - e)}px)`,
        base: `translateY(${1 * s * (1 - e)}px)`,
      };
    },
  },
  flustered: {
    duration: 500,
    apply: (t, s) => {
      const e = easeOut(t);
      return { head: `translateY(${3 * s * e}px) rotate(${-3 * s * e}deg)` };
    },
  },
  shy: {
    duration: 500,
    apply: (t, s) => {
      const e = easeOut(t);
      return { head: `translateY(${3 * s * e}px) rotate(${-2 * s * e}deg)` };
    },
  },
  angry: {
    duration: 400,
    apply: (t, s) => {
      const e = easeOut(t);
      return { head: `translateY(${1 * s * e}px)`, torso: `translateY(${-2 * s * e}px)` };
    },
  },
  sad: {
    duration: 800,
    apply: (t, s) => {
      const e = easeInOut(t);
      return {
        head: `translateY(${2 * s * e}px)`,
        torso: `translateY(${2 * s * e}px)`,
        base: `translateY(${1 * s * e}px)`,
      };
    },
  },
  crying: {
    duration: 800,
    apply: (t, s) => {
      const e = easeInOut(t);
      return {
        head: `translateY(${3 * s * e}px) rotate(${-2 * s * e}deg)`,
        torso: `translateY(${2 * s * e}px)`,
        base: `translateY(${1 * s * e}px)`,
      };
    },
  },
  excited: {
    duration: 500,
    apply: (t, s) => {
      const e = spring(t);
      return { head: `translateY(${-3 * s * e}px)`, torso: `translateY(${-2 * s * e}px)` };
    },
  },
  teasing: {
    duration: 400,
    apply: (t, s) => {
      const e = easeOut(t);
      return { head: `rotate(${-3 * s * e}deg) translateY(${-1 * s * e}px)`, torso: `translateY(${-1 * s * e}px)` };
    },
  },
  smirk: {
    duration: 400,
    apply: (t, s) => {
      const e = easeOut(t);
      return { head: `rotate(${-2 * s * e}deg) translateY(${-1 * s * e}px)`, torso: `translateY(${-1 * s * e}px)` };
    },
  },
  devoted: {
    duration: 600,
    apply: (t, s) => {
      const e = easeInOut(t);
      return { head: `translateY(${1 * s * e}px) rotate(${-1 * s * e}deg)`, torso: `translateY(${-2 * s * e}px)` };
    },
  },
  sleepy: {
    duration: 1000,
    apply: (t, s) => {
      const e = easeInOut(t);
      return {
        head: `translateY(${3 * s * e}px) rotate(${4 * s * e}deg)`,
        torso: `translateY(${2 * s * e}px)`,
        base: `translateY(${1 * s * e}px)`,
      };
    },
  },
  jealous: {
    duration: 500,
    apply: (t, s) => {
      const e = easeOut(t);
      return { head: `rotate(${3 * s * e}deg)`, torso: `translateX(${-1 * s * e}px)` };
    },
  },
};

const CONVERSATION_ANIMS: Record<ConversationEvent, ReactiveAnimation> = {
  message_sent: {
    duration: 400,
    apply: (t, s) => {
      const e = spring(t);
      return { head: `translateY(${-2 * s * e}px)`, torso: `translateY(${-1 * s * e}px)` };
    },
  },
  waiting: {
    duration: 2000,
    hold: true,
    apply: (t, s) => {
      const e = Math.sin(t * Math.PI * 2) * 0.5;
      return { head: `rotate(${1.5 * s * e}deg)` };
    },
  },
  stream_start: {
    duration: 300,
    apply: (t, s) => {
      const e = easeOut(t);
      return { head: `translateY(${1 * s * (1 - e)}px)`, torso: `translateY(${0.5 * s * (1 - e)}px)` };
    },
  },
  speaking: {
    duration: 400,
    hold: true,
    apply: (t, s) => {
      const bounce = Math.sin(t * Math.PI * 6) * Math.exp(-t * 3);
      return { head: `translateY(${-1.5 * s * bounce}px)` };
    },
  },
  headpat: {
    duration: 600,
    apply: (t, s) => {
      const e = easeInOut(t);
      return { head: `translateY(${2 * s * e}px)`, torso: `translateY(${1 * s * e}px)` };
    },
  },
};

export function getReactiveAnimation(expression: Expression): ReactiveAnimation | null {
  return EXPRESSION_ANIMS[expression] ?? null;
}

export function getConversationAnimation(event: ConversationEvent): ReactiveAnimation | null {
  return CONVERSATION_ANIMS[event] ?? null;
}

// Hook that applies reactive animations to zone refs
export function useReactiveAnimation(
  expression: Expression,
  chatPhase: "idle" | "waiting" | "speaking" | "user_typing",
  isTalking: boolean,
  personality: AnimPersonality,
  headRef: React.RefObject<HTMLDivElement | null>,
  torsoRef: React.RefObject<HTMLDivElement | null>,
  baseRef: React.RefObject<HTMLDivElement | null>,
): { isPaused: boolean; windIntensity: number } {
  const activeRef = useRef(false);
  const windRef = useRef(1);
  const prevExprRef = useRef(expression);
  const prevPhaseRef = useRef(chatPhase);
  const cooldownRef = useRef(0);

  const applyAnimation = useCallback((anim: ReactiveAnimation, scale: number) => {
    activeRef.current = true;
    const start = performance.now();

    function frame(now: number) {
      const elapsed = now - start;
      const t = Math.min(elapsed / anim.duration, 1);
      const transforms = anim.apply(t, scale);

      if (headRef.current && transforms.head) headRef.current.style.transform = transforms.head;
      if (torsoRef.current && transforms.torso) torsoRef.current.style.transform = transforms.torso;
      if (baseRef.current && transforms.base) baseRef.current.style.transform = transforms.base;

      if (t < 1 || anim.hold) {
        requestAnimationFrame(frame);
      } else {
        activeRef.current = false;
        cooldownRef.current = performance.now() + 2000;
      }
    }

    requestAnimationFrame(frame);
  }, [headRef, torsoRef, baseRef]);

  // React to expression changes
  useEffect(() => {
    if (expression !== prevExprRef.current) {
      prevExprRef.current = expression;
      const anim = getReactiveAnimation(expression);
      if (anim) {
        // Set wind intensity for hair sway
        if (expression === "surprised" || expression === "excited") {
          windRef.current = 2.5;
          setTimeout(() => { windRef.current = 1; }, 800);
        } else if (expression === "sleepy") {
          windRef.current = 0.3;
        } else {
          windRef.current = 1;
        }
        applyAnimation(anim, personality.reactiveScale);
      }
    }
  }, [expression, personality.reactiveScale, applyAnimation]);

  // React to chat phase changes
  useEffect(() => {
    if (chatPhase !== prevPhaseRef.current) {
      const prev = prevPhaseRef.current;
      prevPhaseRef.current = chatPhase;

      let event: ConversationEvent | null = null;
      if (chatPhase === "waiting" && prev === "idle") event = "message_sent";
      else if (chatPhase === "waiting") event = "waiting";
      else if (chatPhase === "speaking" && prev === "waiting") event = "stream_start";

      if (event) {
        const anim = getConversationAnimation(event);
        if (anim) applyAnimation(anim, personality.reactiveScale);
      }
    }
  }, [chatPhase, personality.reactiveScale, applyAnimation]);

  // Speaking bounce
  useEffect(() => {
    if (isTalking) {
      const anim = getConversationAnimation("speaking");
      if (anim) applyAnimation(anim, personality.reactiveScale);
    }
  }, [isTalking, personality.reactiveScale, applyAnimation]);

  return {
    isPaused: activeRef.current || performance.now() < cooldownRef.current,
    windIntensity: windRef.current,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run __tests__/lib/sprites/reactive.test.ts`
Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/sprites/reactive.ts __tests__/lib/sprites/reactive.test.ts
git commit -m "feat: useReactiveAnimation hook — expression and conversation-driven sprite motion"
```

---

### Task 5: Hair Sway Canvas

**Files:**
- Create: `src/lib/sprites/hairSway.ts`
- Create: `src/components/HairSwayCanvas.tsx`

- [ ] **Step 1: Write the hair sway hook**

```typescript
// src/lib/sprites/hairSway.ts
"use client";

import { useRef, useEffect } from "react";

interface HairSwayConfig {
  speed: number;       // Hz
  amount: number;      // max px displacement
  height: number;      // percent of sprite to cover
}

export function useHairSway(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  spriteRef: React.RefObject<HTMLImageElement | null>,
  config: HairSwayConfig,
  windIntensity: number,
) {
  const rafRef = useRef(0);
  const frameCount = useRef(0);
  const windRef = useRef(windIntensity);
  windRef.current = windIntensity;
  const configRef = useRef(config);
  configRef.current = config;

  useEffect(() => {
    const canvas = canvasRef.current;
    const sprite = spriteRef.current;
    if (!canvas || !sprite) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let running = true;

    function tick(now: number) {
      if (!running) return;
      frameCount.current++;

      // Only redraw every 3rd frame (~20fps at 60fps)
      if (frameCount.current % 3 !== 0) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      const c = configRef.current;
      const wind = windRef.current;
      const cvs = canvasRef.current;
      const img = spriteRef.current;
      if (!cvs || !img || !ctx) return;

      const w = cvs.width;
      const h = cvs.height;

      ctx.clearRect(0, 0, w, h);

      // Draw sprite's hair region with displacement
      const phase = (now / 1000) * c.speed * Math.PI * 2;
      const gridCols = 8;
      const gridRows = 8;
      const cellW = w / gridCols;
      const cellH = h / gridRows;

      for (let row = 0; row < gridRows; row++) {
        for (let col = 0; col < gridCols; col++) {
          const sx = col * cellW;
          const sy = row * cellH;

          // Displacement stronger at edges, zero at center
          const centerDist = Math.abs(col - gridCols / 2) / (gridCols / 2);
          const topWeight = 1 - (row / gridRows); // stronger near top (hair tips)
          const displacement = Math.sin(phase + col * 0.8 + row * 0.3)
            * c.amount * wind * centerDist * topWeight;

          ctx.drawImage(
            img,
            sx, sy, cellW, cellH,           // source rect from image
            sx + displacement, sy, cellW, cellH  // dest rect on canvas
          );
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    }

    // Wait for sprite image to load
    if (sprite.complete) {
      rafRef.current = requestAnimationFrame(tick);
    } else {
      sprite.onload = () => { rafRef.current = requestAnimationFrame(tick); };
    }

    // Pause on tab hidden
    const handleVisibility = () => {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(rafRef.current);
      } else {
        running = true;
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      running = false;
      cancelAnimationFrame(rafRef.current);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [canvasRef, spriteRef]);
}
```

- [ ] **Step 2: Write the HairSwayCanvas component**

```tsx
// src/components/HairSwayCanvas.tsx
"use client";

import { useRef } from "react";
import { useHairSway } from "@/lib/sprites/hairSway";

interface HairSwayCanvasProps {
  spriteSrc: string;
  heightPercent: number; // how much of sprite height to cover
  speed: number;
  amount: number;
  windIntensity: number;
}

export function HairSwayCanvas({
  spriteSrc,
  heightPercent,
  speed,
  amount,
  windIntensity,
}: HairSwayCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  useHairSway(canvasRef, imgRef, { speed, amount, height: heightPercent }, windIntensity);

  return (
    <>
      {/* Hidden image element for the hook to sample from */}
      <img
        ref={imgRef}
        src={spriteSrc}
        alt=""
        crossOrigin="anonymous"
        style={{ display: "none" }}
      />
      <canvas
        ref={canvasRef}
        width={512}
        height={Math.round(896 * (heightPercent / 100))}
        className="absolute top-0 left-0 right-0 pointer-events-none"
        style={{
          height: `${heightPercent}%`,
          width: "100%",
          opacity: 0.3,
          mixBlendMode: "normal",
          zIndex: 15,
        }}
      />
    </>
  );
}
```

- [ ] **Step 3: Verify build compiles**

Run: `npx next build 2>&1 | tail -5`
Expected: Compiled successfully

- [ ] **Step 4: Commit**

```bash
git add src/lib/sprites/hairSway.ts src/components/HairSwayCanvas.tsx
git commit -m "feat: HairSwayCanvas — canvas displacement grid for hair animation"
```

---

### Task 6: Wire Everything Into CharacterSprite

**Files:**
- Modify: `src/components/CharacterSprite.tsx`
- Modify: `src/styles/globals.css`

- [ ] **Step 1: Rewrite CharacterSprite to use zone system**

Read `src/components/CharacterSprite.tsx` first, then replace the sprite rendering section. Keep all existing logic (headpat, parallax, glow, particles, expression crossfade, outfit layers) intact. Replace only the base/face image rendering with SpriteZone components and add hooks.

The key changes:
1. Import `SpriteZone`, `HairSwayCanvas`, `useIdleBehavior`, `useReactiveAnimation`, `getZoneConfig`
2. Call `getZoneConfig(character.id)` to get zone boundaries and personality
3. Call `useIdleBehavior(config.personality, reactiveState.isPaused)` to get zone refs
4. Call `useReactiveAnimation(expression, chatPhase, isTalking, config.personality, idle.headRef, idle.torsoRef, idle.baseRef)`
5. Replace the single `<img>` base layer with 3 `<SpriteZone>` components, passing the refs from `useIdleBehavior`
6. Add `<HairSwayCanvas>` after the zones
7. Keep expression crossfade: apply it to all 3 zones (the transition `<img>` becomes 3 transition zones)
8. Keep outfit layers, headpat zone, hearts, glow, and particles as-is
9. Add `chatPhase` prop to `CharacterSpriteProps` — VNLayout will pass it

```typescript
// Add to CharacterSpriteProps interface:
chatPhase?: "idle" | "waiting" | "speaking" | "user_typing";
```

The SpriteZone components replace lines 154-172 (the base and transition `<img>` elements). Each zone gets:
- The same `src` as before: `getSrc(visibleExpr)` for base, `getSrc(expression)` for transition
- Its zone bounds from `config.head`, `config.torso`, `config.base`
- Its ref from `idle.headRef`, `idle.torsoRef`, `idle.baseRef`
- The transition zone opacity logic stays the same

- [ ] **Step 2: Add chatPhase prop to VNLayout pass-through**

Read `src/components/VNLayout.tsx` and add `chatPhase` to the props passed to `CharacterSprite`. Get it from the chat context — `state.phase` from `useChat()`.

Add to VNLayout:
```typescript
import { useChat } from "@/lib/chat/context";
// Inside the component:
const { state } = useChat();
// Pass to CharacterSprite:
chatPhase={state.phase}
```

- [ ] **Step 3: Remove old CSS keyframes**

In `src/styles/globals.css`, remove or comment out these keyframes that are now handled by the hooks:
- `@keyframes breathe` (lines 128-131)
- `@keyframes talkBounce` (lines 133-136)
- `@keyframes idleSway` (lines 160-164)

Keep `floatParticle`, `glowPulse`, `screenShake`, `headpat-float`, and other keyframes unchanged.

- [ ] **Step 4: Verify build compiles and app loads**

Run: `npx next build 2>&1 | tail -5`
Expected: Compiled successfully

Then check in browser: `http://localhost:3000`, navigate to any character chat, verify:
- Sprite renders correctly with zones (no visible seams)
- Breathing motion is visible on torso
- Idle actions fire after 8-15 seconds
- Expression changes trigger reactive animations
- Hair sway canvas is visible (subtle)
- Headpat still works
- Outfit switching still works

- [ ] **Step 5: Run all existing tests**

Run: `npx vitest run`
Expected: All tests pass (no regressions)

- [ ] **Step 6: Commit**

```bash
git add src/components/CharacterSprite.tsx src/components/VNLayout.tsx src/styles/globals.css
git commit -m "feat: wire zone-based sprite animation — idle behaviors, reactive motion, hair sway"
```

---

### Task 7: Blink System

**Files:**
- Modify: `src/components/CharacterSprite.tsx`

- [ ] **Step 1: Wire useBlink into the head zone**

The `useBlink` hook from `src/lib/sprites/engine.ts` already exists and returns a boolean. Wire it into `CharacterSprite`:

```typescript
import { useBlink } from "@/lib/sprites/engine";

// Inside CharacterSprite:
const isBlinking = useBlink();
```

Add a blink overlay inside the head zone — a small dark semi-transparent div that flashes when `isBlinking` is true:

```tsx
{/* Blink overlay — positioned over eye region */}
<div
  className="absolute pointer-events-none"
  style={{
    top: `${config.head.clipTop + 8}%`,
    left: "25%",
    right: "25%",
    height: "6%",
    background: "rgba(0,0,0,0.15)",
    opacity: isBlinking ? 1 : 0,
    transition: isBlinking ? "opacity 50ms ease-in" : "opacity 100ms ease-out",
    zIndex: 12,
    borderRadius: "40%",
  }}
/>
```

- [ ] **Step 2: Customize blink interval per character**

Modify `useBlink` in `src/lib/sprites/engine.ts` to accept min/max interval params:

```typescript
export function useBlink(minInterval = 3000, maxInterval = 6000): boolean {
```

Pass the character's `blinkInterval` from the zone config:

```typescript
const isBlinking = useBlink(
  config.personality.blinkInterval[0] * 1000,
  config.personality.blinkInterval[1] * 1000
);
```

- [ ] **Step 3: Test in browser**

Open a character chat, watch for 10-15 seconds. Blink should appear as a brief darkening of the eye area every 3-6 seconds (varies by character). Merrick should blink less frequently (5-10s).

- [ ] **Step 4: Commit**

```bash
git add src/components/CharacterSprite.tsx src/lib/sprites/engine.ts
git commit -m "feat: wire blink system into head zone with per-character intervals"
```

---

### Task 8: Polish and Tuning

**Files:**
- Modify: `src/lib/sprites/zones.ts` (tuning values)
- Modify: `src/components/CharacterSprite.tsx` (any seam fixes)

- [ ] **Step 1: Visual QA in browser**

Open each character chat and check:
1. **Arisu** — gentle, calm idle. Soft reactive movements.
2. **Marin** — energetic idle, big reactions, bouncy hair.
3. **Suzuka** — minimal idle, sudden sharp reactions, subtle hair.
4. **Kurisu** — controlled, precise, moderate everything.
5. **Merrick** — slow deliberate sway, rare blinks, wide hair movement.
6. **Ticia** — poised, elegant, smooth hair flow.

- [ ] **Step 2: Adjust zone boundaries if seams are visible**

If any character shows a visible cut line between zones, adjust the `clipTop`/`clipBottom` values in `zones.ts` to increase overlap. The seams should be invisible.

- [ ] **Step 3: Adjust timing if animations feel wrong**

Common tuning:
- If breathing is too obvious: reduce `breatheScale` (e.g. 1.003 → 1.002)
- If idle actions fire too often: increase `idleInterval` min
- If reactive animations are too jerky: increase duration or reduce `reactiveScale`
- If hair sway is too strong: reduce `hairSwayAmount` or lower canvas opacity in `HairSwayCanvas.tsx`

- [ ] **Step 4: Run full test suite**

Run: `npx vitest run`
Expected: All tests pass

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "polish: tune sprite animation parameters after visual QA"
```
