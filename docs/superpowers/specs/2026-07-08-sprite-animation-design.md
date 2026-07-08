# Sprite Animation System — Design Spec

## Goal

Make character sprites feel alive — idle breathing, random micro-behaviors, expression-reactive body language, and subtle hair sway. Zero new art assets required.

## Approach

CSS clip-path zone animation (Approach A) with a canvas hair sway overlay borrowed from Approach B. The existing PNG sprite is split into 3 independently animatable zones via `clip-path: inset(...)`. A small canvas on top handles hair displacement.

---

## Section 1: Sprite Zone System

Replace the current single `<img>` with 3 clipped layers of the same image, each independently animatable.

| Zone | Clip Region | What It Animates |
|------|------------|-----------------|
| **Head** | Top ~30% | Tilts, nods, small turns, blink flash |
| **Torso** | Middle ~35% | Breathing (scale Y), lean forward/back, shoulder shifts |
| **Base** | Bottom ~35% | Weight shifts, subtle sway |

Each zone is the full sprite image with `clip-path: inset(...)` so only its portion shows. They stack absolutely on top of each other. Seams between zones use 2-3% overlap with feathered opacity so cuts aren't visible.

The existing expression crossfade system stays exactly as-is — it still swaps the full face PNG. Zone animations layer on top as CSS transforms.

---

## Section 2: Idle Animation System

A state machine running continuously when the character isn't actively responding. Instead of one looping animation, it picks from a pool of micro-behaviors at random intervals.

### Always-on (simultaneous)

- **Breathing** — torso zone scales Y by ~1.005 on a 3.5s cycle
- **Micro-sway** — base zone drifts 1-2px horizontally on a 6s cycle
- **Blink** — quick opacity flash (150ms) on a dark overlay clipped to the eye region, every 3-6 seconds randomly (existing `useBlink` hook, finally wired up)

### Random idle actions (one at a time, 8-15s apart)

| Action | Zones | Duration | What happens |
|--------|-------|----------|-------------|
| Glance away | Head | 1.5s | Head rotates 2-3deg, pauses, returns |
| Weight shift | Base + Torso | 2s | Base translates X 3px, torso follows slightly delayed |
| Head tilt | Head | 2s | Small rotation + slight Y translate, curious look |
| Settle | All | 1.5s | Tiny downward shift then back up, like adjusting posture |
| Deep breath | Torso | 3s | Slightly larger scale Y than normal breathing cycle |

Driven by a `useIdleBehavior` hook that picks randomly, checks no reactive animation is playing, and applies transforms via refs (no re-renders per frame — just updating CSS custom properties).

---

## Section 3: Reactive Animations

Triggered by conversation events — expression changes, sending messages, receiving responses. These interrupt idle actions and take priority.

### Expression-driven reactions

| Expression | Animation | Duration |
|-----------|-----------|----------|
| `happy` / `laugh` | Head tilts up slightly, torso lifts 2px (perking up) | 400ms |
| `thinking` | Head tilts 5deg to one side, holds | 600ms ease-out, holds until next expression |
| `surprised` | Quick pull back (all zones translate Y +3px), then settle | 300ms snap |
| `flustered` / `shy` | Head dips down 3px + rotates away slightly | 500ms |
| `angry` | Torso leans forward 2px, head drops slightly (confrontational) | 400ms |
| `sad` / `crying` | All zones sink 2px, head drops, slow | 800ms |
| `excited` | Bouncy — head and torso pop up, quick settle with overshoot | 500ms spring |
| `teasing` / `smirk` | Head tilts with slight lean forward (getting in your face) | 400ms |
| `devoted` | Slow lean forward, head tilts down slightly (warm closeness) | 600ms |
| `sleepy` | Everything sinks, head tilts to side, slow | 1000ms |
| `jealous` | Head turns slightly away, torso crosses (stiff) | 500ms |

### Conversation-driven reactions

| Event | Animation |
|-------|-----------|
| User sends message | Character perks up — small lift on head + torso (attention) |
| Waiting for AI response | Subtle thinking sway — slow head oscillation |
| Stream starts (first text) | Quick settle into speaking posture |
| Speaking / typing out | `talkBounce` applied only to head zone (not whole body) |
| Headpat | Existing hearts + head dips into the touch, slight torso lean |

All reactive animations use a priority queue — new reactions cancel in-progress ones with a quick blend (150ms transition). Once a reactive animation finishes, idle resumes after a 2s cooldown.

---

## Section 4: Hair Sway Canvas Overlay

A `<canvas>` layered on top of the head zone for subtle hair movement.

### How it works

- Canvas sits absolutely positioned over the top ~35% of the sprite (hair region)
- On mount, samples sprite image pixels in that region and builds a displacement grid (8x8 cells)
- A sine-wave displacement ripples through the grid continuously — slow, organic, like a breeze
- Only pixels with alpha > 0 get displaced (empty space stays empty)
- Original head zone renders underneath; canvas adds motion delta with low-opacity blend

### Parameters

- **Wave speed:** ~0.3 Hz (one full cycle every 3 seconds)
- **Max displacement:** 2-3px horizontally
- **Direction:** left to right (consistent light breeze)
- **Intensity:** stronger at edges (hair tips), near-zero at center (face stays stable)

### Performance

- Runs on `requestAnimationFrame` but only redraws every 3rd frame (~20fps)
- Canvas is small (just the hair region, not full sprite)
- Pauses when tab is hidden (`visibilitychange`)

### Reactive tie-in

- Wind intensity increases briefly on `surprised` or `excited` (dramatic anime gust)
- Slows to near-still on `sleepy`
- Normal otherwise

---

## Section 5: Architecture

### New files

| File | Purpose |
|------|---------|
| `src/lib/sprites/zones.ts` | Zone definitions — clip-path boundaries per character, seam overlap config, animation personality configs |
| `src/lib/sprites/idle.ts` | `useIdleBehavior` hook — random action picker, timer management, CSS variable updates |
| `src/lib/sprites/reactive.ts` | `useReactiveAnimation` hook — expression/event to animation mapping, priority queue, blend logic |
| `src/lib/sprites/hairSway.ts` | `useHairSway` hook — canvas setup, displacement grid, rAF loop |
| `src/components/SpriteZone.tsx` | Renders one clipped zone of the sprite image with transform bindings |
| `src/components/HairSwayCanvas.tsx` | Canvas overlay component |

### Modified files

| File | Change |
|------|--------|
| `CharacterSprite.tsx` | Replace single `<img>` with 3 `<SpriteZone>` + `<HairSwayCanvas>`. Wire up idle/reactive hooks. Remove old `breathe`/`idleSway`/`talkBounce` CSS animations. |
| `sprites/engine.ts` | `useBlink` stays, gets wired into head zone. `useTalkAnimation` stays for future mouth SVG cycling. |

### Data flow

```
Expression change / chat event
        |
        v
useReactiveAnimation (priority queue)
        | (CSS custom properties on container ref)
        v
SpriteZone x 3 (each reads its own transform vars)
        |
        v
useIdleBehavior (resumes after 2s cooldown when reactive finishes)
        |
        v
HairSwayCanvas (reads wind intensity from reactive state)
```

No re-renders during animations — everything flows through CSS custom properties set via `ref.current.style.setProperty()`. React only re-renders for expression image swaps (same as today).

---

## Section 6: Per-Character Tuning

Each character gets a tuning config that adjusts animation personality. Same system, different feel.

### Zone boundaries

Clip-path percentages shift per character since hair length, body proportions, and pose vary.

| Character | Head Zone | Torso Zone | Base Zone | Hair Canvas Height |
|-----------|-----------|------------|-----------|-------------------|
| Arisu | 0-32% | 30-65% | 63-100% | 35% |
| Marin | 0-30% | 28-62% | 60-100% | 32% |
| Suzuka | 0-28% | 26-60% | 58-100% | 30% (short hair) |
| Kurisu | 0-30% | 28-63% | 61-100% | 33% |
| Merrick | 0-32% | 30-65% | 63-100% | 35% (long hair) |
| Ticia | 0-31% | 29-64% | 62-100% | 34% |

### Animation personality

Idle behavior weights and reactive intensity per character.

| Character | Idle Style | Reactive Intensity | Hair Sway |
|-----------|-----------|-------------------|-----------|
| Arisu | Gentle, slow. More deep breaths, fewer glances. Calm presence. | Soft — movements smaller, slower | Slow, flowing (long hair) |
| Marin | Energetic. Frequent weight shifts, head tilts. Can't sit still. | Big — exaggerated reactions, faster springs | Bouncy, faster wave |
| Suzuka | Sharp, minimal. Long still periods then sudden movements. | Snappy — quick sharp motions, short durations | Subtle (short hair, less displacement) |
| Kurisu | Controlled, precise. Occasional crossed-arm adjusts. | Medium — restrained but visible, holds poses longer | Moderate, even flow |
| Merrick | Slow, deliberate. Almost hypnotic sway. Rare blinks. | Dramatic — slow sweeping motions, longer durations | Slow, wide (long dramatic hair) |
| Ticia | Poised, elegant. Minimal fidgeting, graceful weight shifts. | Theatrical — deliberate, never rushed | Smooth, flowing |

Configs live in `zones.ts` as a `Record<string, SpriteAnimConfig>`. Hooks read from it — no per-character code branches, just data.
