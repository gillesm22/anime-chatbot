# Blood Drip Cursor Effect

**Date:** 2026-07-06
**Status:** Draft

## Overview

A cosmetic click effect that spawns blood droplets falling with gravity physics, splatting at the bottom of the viewport. When droplets land near Hexx (BloodBat), he reacts with a feeding animation and chomp sound. The effect is toggled via a hidden Easter egg: long-pressing Hexx.

## Click Behavior

1. On click anywhere in the app, a small blood droplet (canvas-drawn teardrop, ~8-12px, dark crimson `#8b0000` with slight highlight) spawns at the click coordinates
2. The droplet accelerates downward with gravity (acceleration ~980px/s^2, scaled for feel — tune to ~400-600px/s^2 for visual appeal)
3. A subtle trailing effect (2-3 fading afterimages) gives a sense of motion
4. When the droplet reaches the bottom of the viewport, it produces a small irregular splat shape (randomized blob, ~15-25px wide)
5. Splats linger for 2.5 seconds, then fade out over 0.5 seconds (opacity 1 -> 0)
6. Rapid clicks produce multiple independent droplets and splats — no limit, but naturally capped by click speed
7. Max concurrent splats: 20 (oldest removed when exceeded, to prevent canvas clutter)

## Rendering

- **Full-viewport canvas overlay** (`<canvas>`) with `pointer-events: none`, `position: fixed`, `inset: 0`, `z-index: 9999`
- Canvas resizes on window resize
- `requestAnimationFrame` loop drives the animation
- Loop is only active when there are pending drops or visible splats — no idle CPU cost
- All rendering via Canvas 2D API:
  - Droplets: filled teardrop path with radial gradient (lighter center, dark crimson edge)
  - Splats: 3-5 overlapping ellipses at random angles for an organic blob shape
  - Trail: 2-3 smaller circles at previous positions with decreasing opacity

## Hexx Feeding Interaction

**Trigger:** A falling droplet's position overlaps with Hexx's bounding rect (read from `BloodBat`'s container ref via a shared callback or DOM query).

**When triggered:**
1. The droplet is "consumed" — removed from canvas instead of splatting
2. Hexx plays a feeding reaction:
   - **Visual:** Sprite briefly swaps to `excited` or `happy` mood, then a squish animation (scaleY 0.85 -> 1.1 -> 1.0 over 400ms) — a "gulp" effect
   - **Sound:** A short chomp/squeak via Web Audio synth — low-frequency thud (150Hz, 60ms) layered with a high chirp (1200Hz, 30ms, quiet). New function `playHexxChomp()` in `src/lib/sounds.ts`
3. If Hexx is on a different page than the homepage, the feeding interaction doesn't apply — droplets just splat normally everywhere

**Integration with BloodBat component:**
- BloodBat exposes its position via a ref or a global getter (e.g., `getHexxBounds(): DOMRect | null`) so the canvas system can check overlap
- Alternatively, BloodBat registers its container ref with a lightweight context/callback that the drip system reads

## Toggle Mechanism

**Long-press on Hexx (~800ms hold without drag movement):**
1. Distinguished from drag by checking `hasMoved.current` — if the pointer is held for 800ms and hasn't moved more than 5px, it's a long-press
2. On toggle:
   - Hexx does a brief nod animation (translateY -5px -> 0 over 300ms)
   - A subtle pulse glow (box-shadow expands and fades)
   - Phrase bubble shows "Blood mode ON" or "Blood mode OFF" for 2 seconds
3. State persisted to `localStorage` key `anime-chatbot-blood-drip` (`"true"` / `"false"`)
4. Default: `false` (off) — users discover it by accident or word of mouth

## New Files

| File | Purpose |
|------|---------|
| `src/lib/bloodDrip.ts` | Core drip engine: drop physics, splat generation, canvas rendering, rAF loop, Hexx overlap detection |
| `src/components/BloodDripCanvas.tsx` | React wrapper: mounts canvas, initializes engine, listens for clicks, reads toggle state from localStorage |

## Modified Files

| File | Change |
|------|--------|
| `src/lib/sounds.ts` | Add `playHexxChomp()` function |
| `src/components/BloodBat.tsx` | Add long-press detection (800ms timer on pointerdown, cancel on move/up). Expose container bounds for overlap detection. Show toggle phrase. |
| `src/app/layout.tsx` | Mount `<BloodDripCanvas />` at root level so it's available on all pages |

## localStorage

| Key | Value | Default |
|-----|-------|---------|
| `anime-chatbot-blood-drip` | `"true"` \| `"false"` | `"false"` |

## Edge Cases

- **Mobile/touch:** Click events work the same. Long-press toggle must not conflict with drag — use the existing `hasMoved` ref and a 800ms timer that cancels if pointer moves > 5px
- **Performance:** Canvas is idle (no rAF) when no drops/splats are active. Max 20 splats prevents accumulation
- **Hexx not mounted:** If BloodBat isn't on the current page, `getHexxBounds()` returns null — all drops just splat normally
- **Window resize:** Canvas dimensions update on resize. Active splats that are now off-screen are removed
- **Sound disabled:** `playHexxChomp()` respects the existing `anime-chatbot-sound-enabled` check via `getAudioContext()`
