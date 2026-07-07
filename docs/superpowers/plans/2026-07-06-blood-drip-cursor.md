# Blood Drip Cursor Effect Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a cosmetic blood-drip-on-click effect with Hexx feeding interaction and a long-press Easter egg toggle.

**Architecture:** A canvas overlay renders blood droplets with gravity physics. `bloodDrip.ts` is the pure engine (no React), `BloodDripCanvas.tsx` is the React wrapper mounted in `layout.tsx`. BloodBat gains long-press detection to toggle the feature, and exposes its bounds for overlap detection. A new `playHexxChomp()` sound completes the feeding reaction.

**Tech Stack:** Canvas 2D API, requestAnimationFrame, Web Audio API, React refs, localStorage

**Spec:** `docs/superpowers/specs/2026-07-06-blood-drip-cursor-design.md`

---

## File Map

| File | Role |
|------|------|
| `src/lib/bloodDrip.ts` (create) | Pure drip engine: drop/splat types, physics update, canvas draw, Hexx overlap check |
| `src/components/BloodDripCanvas.tsx` (create) | React wrapper: mounts canvas, listens for clicks, reads toggle from localStorage, runs rAF loop |
| `src/lib/sounds.ts` (modify) | Add `playHexxChomp()` |
| `src/components/BloodBat.tsx` (modify) | Long-press toggle, expose bounds via global getter |
| `src/app/layout.tsx` (modify) | Mount `<BloodDripCanvas />` |
| `__tests__/lib/bloodDrip.test.ts` (create) | Unit tests for drip engine physics and logic |

---

### Task 1: Blood Drip Engine — Types and Drop Physics

**Files:**
- Create: `__tests__/lib/bloodDrip.test.ts`
- Create: `src/lib/bloodDrip.ts`

- [ ] **Step 1: Write failing tests for drop creation and physics**

```ts
// __tests__/lib/bloodDrip.test.ts
import { describe, it, expect } from "vitest";
import { createDrop, updateDrop } from "@/lib/bloodDrip";

describe("createDrop", () => {
  it("creates a drop at the given coordinates", () => {
    const drop = createDrop(100, 200);
    expect(drop.x).toBe(100);
    expect(drop.y).toBe(200);
    expect(drop.vy).toBe(0);
    expect(drop.radius).toBeGreaterThanOrEqual(4);
    expect(drop.radius).toBeLessThanOrEqual(6);
    expect(drop.active).toBe(true);
  });
});

describe("updateDrop", () => {
  it("applies gravity to velocity each frame", () => {
    const drop = createDrop(100, 200);
    const updated = updateDrop(drop, 1 / 60);
    expect(updated.vy).toBeGreaterThan(0);
    expect(updated.y).toBeGreaterThan(200);
  });

  it("accelerates over multiple frames", () => {
    let drop = createDrop(100, 200);
    drop = updateDrop(drop, 1 / 60);
    const vy1 = drop.vy;
    drop = updateDrop(drop, 1 / 60);
    expect(drop.vy).toBeGreaterThan(vy1);
  });

  it("stores trail positions", () => {
    let drop = createDrop(100, 200);
    drop = updateDrop(drop, 1 / 60);
    drop = updateDrop(drop, 1 / 60);
    expect(drop.trail.length).toBeGreaterThanOrEqual(1);
    expect(drop.trail.length).toBeLessThanOrEqual(3);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run __tests__/lib/bloodDrip.test.ts`
Expected: FAIL — module `@/lib/bloodDrip` does not exist

- [ ] **Step 3: Implement drop creation and physics**

```ts
// src/lib/bloodDrip.ts

const GRAVITY = 500; // px/s^2 — tuned for visual appeal
const MAX_TRAIL = 3;

export interface Drop {
  x: number;
  y: number;
  vy: number;
  radius: number;
  active: boolean;
  trail: Array<{ x: number; y: number; opacity: number }>;
}

export interface Splat {
  x: number;
  y: number;
  blobs: Array<{ rx: number; ry: number; offsetX: number; offsetY: number; angle: number }>;
  opacity: number;
  age: number;
}

export function createDrop(x: number, y: number): Drop {
  return {
    x,
    y,
    vy: 0,
    radius: 4 + Math.random() * 2,
    active: true,
    trail: [],
  };
}

export function updateDrop(drop: Drop, dt: number): Drop {
  const trail = [
    { x: drop.x, y: drop.y, opacity: 0.4 },
    ...drop.trail,
  ].slice(0, MAX_TRAIL);

  // Decay trail opacity
  for (let i = 0; i < trail.length; i++) {
    trail[i] = { ...trail[i], opacity: trail[i].opacity * 0.6 };
  }

  const vy = drop.vy + GRAVITY * dt;
  const y = drop.y + vy * dt;

  return { ...drop, vy, y, trail };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run __tests__/lib/bloodDrip.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/bloodDrip.ts __tests__/lib/bloodDrip.test.ts
git commit -m "feat: blood drip engine — drop creation and gravity physics"
```

---

### Task 2: Splat Creation and Lifecycle

**Files:**
- Modify: `__tests__/lib/bloodDrip.test.ts`
- Modify: `src/lib/bloodDrip.ts`

- [ ] **Step 1: Write failing tests for splat creation and aging**

Add to `__tests__/lib/bloodDrip.test.ts`:

```ts
import { createDrop, updateDrop, createSplat, updateSplat } from "@/lib/bloodDrip";

describe("createSplat", () => {
  it("creates a splat at the given position with 3-5 blobs", () => {
    const splat = createSplat(150, 700);
    expect(splat.x).toBe(150);
    expect(splat.y).toBe(700);
    expect(splat.opacity).toBe(1);
    expect(splat.age).toBe(0);
    expect(splat.blobs.length).toBeGreaterThanOrEqual(3);
    expect(splat.blobs.length).toBeLessThanOrEqual(5);
  });
});

describe("updateSplat", () => {
  it("ages the splat over time", () => {
    let splat = createSplat(150, 700);
    splat = updateSplat(splat, 1);
    expect(splat.age).toBe(1);
    expect(splat.opacity).toBe(1); // still within linger period
  });

  it("fades opacity after linger period", () => {
    let splat = createSplat(150, 700);
    splat = updateSplat(splat, 2.6); // past 2.5s linger
    expect(splat.opacity).toBeLessThan(1);
  });

  it("reaches zero opacity after full duration", () => {
    let splat = createSplat(150, 700);
    splat = updateSplat(splat, 3.1); // past 2.5s linger + 0.5s fade
    expect(splat.opacity).toBe(0);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run __tests__/lib/bloodDrip.test.ts`
Expected: FAIL — `createSplat` and `updateSplat` not exported

- [ ] **Step 3: Implement splat creation and aging**

Add to `src/lib/bloodDrip.ts`:

```ts
const SPLAT_LINGER = 2.5; // seconds before fade starts
const SPLAT_FADE = 0.5;   // seconds to fade out

export function createSplat(x: number, y: number): Splat {
  const blobCount = 3 + Math.floor(Math.random() * 3); // 3-5
  const blobs: Splat["blobs"] = [];
  for (let i = 0; i < blobCount; i++) {
    blobs.push({
      rx: 4 + Math.random() * 6,
      ry: 2 + Math.random() * 4,
      offsetX: (Math.random() - 0.5) * 12,
      offsetY: (Math.random() - 0.5) * 6,
      angle: Math.random() * Math.PI,
    });
  }
  return { x, y, blobs, opacity: 1, age: 0 };
}

export function updateSplat(splat: Splat, dt: number): Splat {
  const age = splat.age + dt;
  let opacity = 1;
  if (age > SPLAT_LINGER) {
    opacity = Math.max(0, 1 - (age - SPLAT_LINGER) / SPLAT_FADE);
  }
  return { ...splat, age, opacity };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run __tests__/lib/bloodDrip.test.ts`
Expected: PASS (all tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/bloodDrip.ts __tests__/lib/bloodDrip.test.ts
git commit -m "feat: blood drip engine — splat creation and fade lifecycle"
```

---

### Task 3: Drip Scene Manager (tick logic)

**Files:**
- Modify: `__tests__/lib/bloodDrip.test.ts`
- Modify: `src/lib/bloodDrip.ts`

- [ ] **Step 1: Write failing tests for the scene manager**

Add to `__tests__/lib/bloodDrip.test.ts`:

```ts
import { createDrop, updateDrop, createSplat, updateSplat, DripScene } from "@/lib/bloodDrip";

describe("DripScene", () => {
  it("starts with no drops or splats", () => {
    const scene = new DripScene(800);
    expect(scene.drops).toHaveLength(0);
    expect(scene.splats).toHaveLength(0);
    expect(scene.isIdle()).toBe(true);
  });

  it("adds a drop on addDrop()", () => {
    const scene = new DripScene(800);
    scene.addDrop(100, 200);
    expect(scene.drops).toHaveLength(1);
    expect(scene.isIdle()).toBe(false);
  });

  it("converts drops to splats when they reach the floor", () => {
    const scene = new DripScene(400); // floor at y=400
    scene.addDrop(100, 390);
    // Give the drop a big dt to push it past floor
    scene.tick(1);
    expect(scene.drops).toHaveLength(0);
    expect(scene.splats).toHaveLength(1);
    expect(scene.splats[0].y).toBe(400);
  });

  it("removes splats after they fully fade", () => {
    const scene = new DripScene(800);
    scene.addDrop(100, 790); // will splat almost immediately
    scene.tick(0.5); // drop falls, creates splat
    expect(scene.splats).toHaveLength(1);
    scene.tick(3.5); // past linger + fade
    expect(scene.splats).toHaveLength(0);
    expect(scene.isIdle()).toBe(true);
  });

  it("caps splats at 20", () => {
    const scene = new DripScene(10); // very low floor
    for (let i = 0; i < 25; i++) {
      scene.addDrop(i * 10, 5);
    }
    scene.tick(1); // all drops hit floor
    expect(scene.splats.length).toBeLessThanOrEqual(20);
  });

  it("consumes drop when it overlaps hexx bounds", () => {
    const scene = new DripScene(800);
    scene.hexxBounds = { left: 90, right: 110, top: 290, bottom: 310 };
    scene.addDrop(100, 280);
    scene.tick(0.5); // drop falls into hexx zone
    // drop should be consumed, not splatted
    expect(scene.drops).toHaveLength(0);
    expect(scene.splats).toHaveLength(0);
    expect(scene.lastHexxFed).toBe(true);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run __tests__/lib/bloodDrip.test.ts`
Expected: FAIL — `DripScene` not exported

- [ ] **Step 3: Implement DripScene class**

Add to `src/lib/bloodDrip.ts`:

```ts
const MAX_SPLATS = 20;

interface HexxBounds {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export class DripScene {
  drops: Drop[] = [];
  splats: Splat[] = [];
  floorY: number;
  hexxBounds: HexxBounds | null = null;
  lastHexxFed = false;

  constructor(floorY: number) {
    this.floorY = floorY;
  }

  addDrop(x: number, y: number) {
    this.drops.push(createDrop(x, y));
  }

  isIdle(): boolean {
    return this.drops.length === 0 && this.splats.length === 0;
  }

  tick(dt: number) {
    this.lastHexxFed = false;

    // Update drops
    const survivingDrops: Drop[] = [];
    for (const drop of this.drops) {
      const updated = updateDrop(drop, dt);

      // Check Hexx overlap
      if (this.hexxBounds && this._overlapsHexx(updated)) {
        this.lastHexxFed = true;
        continue; // consumed
      }

      // Check floor
      if (updated.y >= this.floorY) {
        this.splats.push(createSplat(updated.x, this.floorY));
        continue; // converted to splat
      }

      survivingDrops.push(updated);
    }
    this.drops = survivingDrops;

    // Update splats
    this.splats = this.splats
      .map((s) => updateSplat(s, dt))
      .filter((s) => s.opacity > 0);

    // Cap splats
    if (this.splats.length > MAX_SPLATS) {
      this.splats = this.splats.slice(this.splats.length - MAX_SPLATS);
    }
  }

  private _overlapsHexx(drop: Drop): boolean {
    if (!this.hexxBounds) return false;
    const b = this.hexxBounds;
    return drop.x >= b.left && drop.x <= b.right && drop.y >= b.top && drop.y <= b.bottom;
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run __tests__/lib/bloodDrip.test.ts`
Expected: PASS (all tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/bloodDrip.ts __tests__/lib/bloodDrip.test.ts
git commit -m "feat: DripScene manager — tick loop, floor splats, hexx overlap"
```

---

### Task 4: Canvas Rendering Functions

**Files:**
- Modify: `src/lib/bloodDrip.ts`

- [ ] **Step 1: Add drawDrop, drawSplat, and renderScene functions**

Add to `src/lib/bloodDrip.ts`:

```ts
const DROP_COLOR = "#8b0000";
const DROP_HIGHLIGHT = "#cc2222";

export function drawDrop(ctx: CanvasRenderingContext2D, drop: Drop) {
  // Draw trail
  for (const t of drop.trail) {
    if (t.opacity < 0.05) continue;
    ctx.globalAlpha = t.opacity;
    ctx.fillStyle = DROP_COLOR;
    ctx.beginPath();
    ctx.arc(t.x, t.y, drop.radius * 0.6, 0, Math.PI * 2);
    ctx.fill();
  }

  // Draw teardrop
  ctx.globalAlpha = 1;
  const r = drop.radius;
  ctx.beginPath();
  ctx.moveTo(drop.x, drop.y - r * 1.6);
  ctx.bezierCurveTo(drop.x - r, drop.y - r * 0.5, drop.x - r, drop.y + r * 0.5, drop.x, drop.y + r);
  ctx.bezierCurveTo(drop.x + r, drop.y + r * 0.5, drop.x + r, drop.y - r * 0.5, drop.x, drop.y - r * 1.6);
  ctx.closePath();

  // Gradient fill
  const grad = ctx.createRadialGradient(drop.x - r * 0.3, drop.y - r * 0.3, 0, drop.x, drop.y, r * 1.4);
  grad.addColorStop(0, DROP_HIGHLIGHT);
  grad.addColorStop(1, DROP_COLOR);
  ctx.fillStyle = grad;
  ctx.fill();
}

export function drawSplat(ctx: CanvasRenderingContext2D, splat: Splat) {
  ctx.globalAlpha = splat.opacity;
  ctx.fillStyle = DROP_COLOR;
  for (const blob of splat.blobs) {
    ctx.save();
    ctx.translate(splat.x + blob.offsetX, splat.y + blob.offsetY);
    ctx.rotate(blob.angle);
    ctx.beginPath();
    ctx.ellipse(0, 0, blob.rx, blob.ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

export function renderScene(ctx: CanvasRenderingContext2D, scene: DripScene, width: number, height: number) {
  ctx.clearRect(0, 0, width, height);
  for (const drop of scene.drops) {
    drawDrop(ctx, drop);
  }
  for (const splat of scene.splats) {
    drawSplat(ctx, splat);
  }
  ctx.globalAlpha = 1;
}
```

- [ ] **Step 2: Verify build**

Run: `npx next build 2>&1 | head -20` (or just check for TS errors: `npx tsc --noEmit`)
Expected: No type errors related to bloodDrip

- [ ] **Step 3: Commit**

```bash
git add src/lib/bloodDrip.ts
git commit -m "feat: blood drip canvas rendering — teardrop, trail, splat blobs"
```

---

### Task 5: Hexx Chomp Sound

**Files:**
- Modify: `src/lib/sounds.ts`

- [ ] **Step 1: Add playHexxChomp function**

Add to the end of `src/lib/sounds.ts`:

```ts
export function playHexxChomp() {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;

  // Low thud
  const osc1 = ctx.createOscillator();
  const gain1 = ctx.createGain();
  osc1.type = "sine";
  osc1.frequency.value = 150;
  gain1.gain.setValueAtTime(0.15, now);
  gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
  osc1.connect(gain1);
  gain1.connect(ctx.destination);
  osc1.start(now);
  osc1.stop(now + 0.06);

  // High chirp
  const osc2 = ctx.createOscillator();
  const gain2 = ctx.createGain();
  osc2.type = "sine";
  osc2.frequency.value = 1200;
  gain2.gain.setValueAtTime(0.06, now + 0.02);
  gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
  osc2.connect(gain2);
  gain2.connect(ctx.destination);
  osc2.start(now + 0.02);
  osc2.stop(now + 0.05);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/sounds.ts
git commit -m "feat: add playHexxChomp sound — low thud + high chirp"
```

---

### Task 6: BloodBat Long-Press Toggle and Bounds Export

**Files:**
- Modify: `src/components/BloodBat.tsx`

- [ ] **Step 1: Add global bounds getter**

Add near the top of `src/components/BloodBat.tsx` (after the imports, before the component):

```ts
// Global ref for blood drip system to read Hexx's position
let hexxContainerRef: HTMLDivElement | null = null;

export function getHexxBounds(): DOMRect | null {
  return hexxContainerRef?.getBoundingClientRect() ?? null;
}
```

- [ ] **Step 2: Wire containerRef to global and add long-press state**

Inside the `BloodBat` component function, add new state and refs after the existing `containerRef`:

```ts
  const longPressTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [feedReaction, setFeedReaction] = useState(false);
```

Add an effect to sync containerRef to the global (after the existing "Load saved size" effect):

```ts
  // Expose container ref globally for blood drip overlap detection
  useEffect(() => {
    hexxContainerRef = containerRef.current;
    return () => { hexxContainerRef = null; };
  }, []);
```

- [ ] **Step 3: Add long-press detection to pointer handlers**

Modify `handlePointerDown` — add long-press timer start:

```ts
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    setIsDragging(true);
    hasMoved.current = false;
    dragStart.current = { x: e.clientX, y: e.clientY, px: pos.x, py: pos.y };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    // Start long-press timer for blood drip toggle
    longPressTimer.current = setTimeout(() => {
      if (!hasMoved.current) {
        try {
          const current = localStorage.getItem("anime-chatbot-blood-drip") === "true";
          localStorage.setItem("anime-chatbot-blood-drip", String(!current));
          window.dispatchEvent(new CustomEvent("blood-drip-toggle", { detail: !current }));
          setPhrase(!current ? "Blood mode ON" : "Blood mode OFF");
          if (phraseTimer.current) clearTimeout(phraseTimer.current);
          phraseTimer.current = setTimeout(() => setPhrase(null), 2000);
        } catch {}
      }
    }, 800);
  }, [pos]);
```

Modify `handlePointerMove` — cancel long-press if moved:

```ts
  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      hasMoved.current = true;
      if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = undefined; }
    }
    setPos({ x: dragStart.current.px + dx, y: dragStart.current.py + dy });
  }, [isDragging]);
```

Modify `handlePointerUp` — cancel long-press timer, skip click if long-press fired:

```ts
  const handlePointerUp = useCallback(() => {
    const wasLongPress = !longPressTimer.current && !hasMoved.current;
    if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = undefined; }
    setIsDragging(false);
    if (!hasMoved.current && !wasLongPress) {
      // ... existing click logic unchanged ...
```

Wait — this is tricky. The long-press timer fires and clears itself. Let's use a simpler approach with a ref flag:

Add a ref: `const longPressFired = useRef(false);`

In `handlePointerDown`:
```ts
    longPressFired.current = false;
    longPressTimer.current = setTimeout(() => {
      if (!hasMoved.current) {
        longPressFired.current = true;
        // ... toggle logic ...
      }
    }, 800);
```

In `handlePointerUp`, wrap the existing click logic:
```ts
  const handlePointerUp = useCallback(() => {
    if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = undefined; }
    setIsDragging(false);
    if (!hasMoved.current && !longPressFired.current) {
      // existing click logic (setIsClicked, mood cycling, phrases, etc.) — unchanged
      setIsClicked(true);
      setTimeout(() => setIsClicked(false), 500);
      setClickCount((c) => c + 1);
      const nextMoodIdx = (ALL_MOODS.indexOf(mood) + 1) % ALL_MOODS.length;
      const nextMood = ALL_MOODS[nextMoodIdx];
      setMood(nextMood);
      const clickPhrases = clickCount < 3
        ? ["hey!", "what", "*squeak*", "yo?!", "watch it"]
        : clickCount < 7
          ? ["again?", "dude", "stop", "I bite", "personal space??"]
          : clickCount < 12
            ? ["...", "fine", "*nuzzle*", "ok ok", "we cool", "you're weird"]
            : ["...you're kinda sweet", "*purrs*", "don't tell anyone", "this stays between us", "...whatever"];
      setPhrase(clickPhrases[Math.floor(Math.random() * clickPhrases.length)]);
      if (phraseTimer.current) clearTimeout(phraseTimer.current);
      phraseTimer.current = setTimeout(() => setPhrase(null), 2500);
    }
  }, [clickCount, mood]);
```

- [ ] **Step 4: Add feed reaction method**

Export a function to trigger the feeding animation from the drip canvas:

```ts
let hexxFeedCallback: (() => void) | null = null;

export function triggerHexxFeed() {
  hexxFeedCallback?.();
}
```

Inside the component, register the callback:

```ts
  useEffect(() => {
    hexxFeedCallback = () => {
      setFeedReaction(true);
      setMood("excited");
      setPhrase(null); // clear any existing phrase during feed
      setTimeout(() => setFeedReaction(false), 400);
    };
    return () => { hexxFeedCallback = null; };
  }, []);
```

Apply `feedReaction` to the sprite's transform style — replace the `bodySquish` line:

```ts
  const bodySquish = feedReaction
    ? "scaleY(0.85) scaleX(1.1)"
    : isClicked ? "scaleY(0.88) scaleX(1.08)" : isHovered ? "scaleY(1.03)" : "scaleY(1)";
```

- [ ] **Step 5: Verify build**

Run: `npx tsc --noEmit`
Expected: No type errors

- [ ] **Step 6: Commit**

```bash
git add src/components/BloodBat.tsx
git commit -m "feat: BloodBat long-press toggle, bounds export, feed reaction"
```

---

### Task 7: BloodDripCanvas React Component

**Files:**
- Create: `src/components/BloodDripCanvas.tsx`

- [ ] **Step 1: Create the canvas wrapper component**

```tsx
// src/components/BloodDripCanvas.tsx
"use client";

import { useEffect, useRef, useCallback } from "react";
import { DripScene, renderScene } from "@/lib/bloodDrip";
import { getHexxBounds, triggerHexxFeed } from "@/components/BloodBat";
import { playHexxChomp } from "@/lib/sounds";

const LS_KEY = "anime-chatbot-blood-drip";

export function BloodDripCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<DripScene | null>(null);
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const enabledRef = useRef(false);

  // Read initial state
  useEffect(() => {
    try {
      enabledRef.current = localStorage.getItem(LS_KEY) === "true";
    } catch {}

    const handleToggle = (e: Event) => {
      enabledRef.current = (e as CustomEvent).detail;
    };
    window.addEventListener("blood-drip-toggle", handleToggle);
    return () => window.removeEventListener("blood-drip-toggle", handleToggle);
  }, []);

  // Resize canvas
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    if (sceneRef.current) {
      sceneRef.current.floorY = window.innerHeight;
    }
  }, []);

  useEffect(() => {
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
  }, [resizeCanvas]);

  // Animation loop
  const animate = useCallback((time: number) => {
    const scene = sceneRef.current;
    const canvas = canvasRef.current;
    if (!scene || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dt = lastTimeRef.current ? Math.min((time - lastTimeRef.current) / 1000, 0.1) : 0.016;
    lastTimeRef.current = time;

    // Update hexx bounds each frame
    const rect = getHexxBounds();
    scene.hexxBounds = rect ? { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom } : null;

    scene.tick(dt);

    // Handle hexx feeding
    if (scene.lastHexxFed) {
      triggerHexxFeed();
      playHexxChomp();
    }

    renderScene(ctx, scene, canvas.width, canvas.height);

    if (!scene.isIdle()) {
      rafRef.current = requestAnimationFrame(animate);
    } else {
      rafRef.current = 0;
      lastTimeRef.current = 0;
    }
  }, []);

  // Start loop if not running
  const ensureLoop = useCallback(() => {
    if (rafRef.current === 0) {
      lastTimeRef.current = 0;
      rafRef.current = requestAnimationFrame(animate);
    }
  }, [animate]);

  // Click handler
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (!enabledRef.current) return;
      if (!sceneRef.current) {
        sceneRef.current = new DripScene(window.innerHeight);
      }
      sceneRef.current.addDrop(e.clientX, e.clientY);
      ensureLoop();
    };

    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, [ensureLoop]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        pointerEvents: "none",
      }}
    />
  );
}
```

- [ ] **Step 2: Verify build**

Run: `npx tsc --noEmit`
Expected: No type errors

- [ ] **Step 3: Commit**

```bash
git add src/components/BloodDripCanvas.tsx
git commit -m "feat: BloodDripCanvas — click listener, rAF loop, hexx feeding"
```

---

### Task 8: Mount in Layout

**Files:**
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Add BloodDripCanvas import and mount**

At the top of `src/app/layout.tsx`, add the import (after the existing component imports):

```ts
import { BloodDripCanvas } from "@/components/BloodDripCanvas";
```

Inside the `<body>` tag, add the component right before `{children}` (line 74):

```tsx
        <BloodDripCanvas />
        {children}
```

Note: `BloodDripCanvas` is a `"use client"` component. `layout.tsx` is a server component. This is fine — Next.js App Router supports client components imported into server components.

- [ ] **Step 2: Verify build**

Run: `npx tsc --noEmit`
Expected: No type errors

- [ ] **Step 3: Commit**

```bash
git add src/app/layout.tsx
git commit -m "feat: mount BloodDripCanvas in root layout"
```

---

### Task 9: Manual Testing and Polish

**Files:** None (testing only)

- [ ] **Step 1: Start dev server**

Run: `cd "C:/Users/G$/anime-chatbot" && rm -rf .next && npx next dev --webpack -p 3000`

- [ ] **Step 2: Test basic drip (off by default)**

Open http://localhost:3000. Click anywhere — nothing should happen (blood drip is off by default).

- [ ] **Step 3: Test long-press toggle**

Long-press Hexx (~1 second, don't move). Should see "Blood mode ON" phrase bubble. Click elsewhere — blood drops should fall and splat.

- [ ] **Step 4: Test rapid clicks**

Click rapidly — multiple drops should fall independently, splats should accumulate and fade.

- [ ] **Step 5: Test Hexx feeding**

Click near Hexx — when a drop overlaps him, he should do the gulp squish animation and play the chomp sound.

- [ ] **Step 6: Test toggle off**

Long-press Hexx again — "Blood mode OFF". Clicks should no longer produce drops.

- [ ] **Step 7: Test persistence**

Refresh the page. The toggle state should persist (if you left it ON, it should still be ON after refresh).

- [ ] **Step 8: Test on chat page**

Navigate to a character chat page. Blood drip should work there too (canvas is in layout). Hexx feeding should still work if Hexx is visible.

- [ ] **Step 9: Fix any visual issues**

Adjust drop size, gravity, splat appearance, or timing if needed. Common tuning:
- `GRAVITY` in `bloodDrip.ts` — higher = faster fall
- `drop.radius` range in `createDrop` — bigger = larger drops
- `SPLAT_LINGER` / `SPLAT_FADE` — timing of splat disappearance
- Blob sizes in `createSplat` — `rx`/`ry` ranges control splat spread

- [ ] **Step 10: Run full test suite**

Run: `npx vitest run`
Expected: All tests pass including new bloodDrip tests

- [ ] **Step 11: Final commit**

```bash
git add -A
git commit -m "feat: blood drip cursor effect — complete with Hexx feeding Easter egg"
```
