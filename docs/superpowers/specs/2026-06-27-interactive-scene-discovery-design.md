# Interactive Scene Discovery System

**Date:** 2026-06-27  
**Status:** Approved

## Overview

Each scene has interactive elements — some visible (existing hotspots) and some hidden. Tapping elements earns affinity, triggers character reactions, and tracks discoveries. Hidden elements are progressively revealed as affinity level increases. First-time discoveries reward outfits, diary entries, or scene unlocks. AI-generated reactions fire only for first discovery of hidden elements; all other reactions use pre-written per-character line pools.

## Discovery Data Model

Each interactable has:

- **`id`** — unique key (e.g., `"beach-shell"`, `"cafe-cat"`)
- **`sceneId`** — which scene it belongs to
- **`type`** — `"visible"` (existing hotspots, always shown) or `"hidden"` (revealed at affinity thresholds)
- **`revealAt`** — affinity level required for hint to appear (0 for visible, 1-4 for hidden)
- **`position`** — `{ x, y, width, height }` as percentages
- **`emoji`** — display emoji (shown once revealed)
- **`label`** — tooltip text
- **`reward`** — first-time discovery reward: `{ type: "affinity" | "outfit" | "diary" | "scene", value: string | number }`
- **`affinityPerTap`** — small repeatable bonus (1-2 points)
- **`cooldown`** — minimum seconds between earning affinity from repeated taps (e.g., 30s)
- **`reactions`** — per-character pre-written line pools (3-4 lines each), with associated expression
- **`aiOnFirstDiscovery`** — boolean, whether first discovery triggers an AI response

### Player State

Stored in localStorage per character:

Key: `anime-chatbot-discoveries-{charId}`

```typescript
Record<string, {
  discovered: boolean;
  tapCount: number;
  lastTapTime: number;
}>
```

## Scene Interactables

### Existing Hotspots (upgraded with rewards)

| Scene | Element | affinityPerTap | Cooldown | First-Time Reward |
|-------|---------|---------------|----------|-------------------|
| Sakura | 🌸 Shake tree | 2 | 30s | 5 affinity |
| Beach | 🌊 Splash water | 2 | 30s | 5 affinity |
| Cafe | ☕ Coffee cup | 2 | 30s | 5 affinity |
| Cyberpunk | NEON BAR sign | 2 | 30s | 5 affinity |
| Rain | 🌩️ Thunder window | 2 | 30s | 5 affinity |
| Night Sky | ✨ Shooting star | 2 | 30s | 5 affinity |
| Cozy Room | 🔥 Fireplace | 2 | 30s | 5 affinity |
| Moonlight | 🌕 Moon phases | 2 | 30s | 5 affinity |

### Hidden Elements (new)

| Scene | Element | revealAt | First-Time Reward | aiOnFirstDiscovery |
|-------|---------|----------|-------------------|--------------------|
| Sakura | 🦋 Butterfly in branches | 2 | Diary entry | yes |
| Sakura | 🎐 Wind chime behind tree | 3 | 10 affinity | no |
| Beach | 🐚 Shell in sand | 2 | Diary entry | no |
| Beach | 🦀 Crab under rock | 4 | Bikini outfit unlock | yes |
| Cafe | 🐱 Cat under table | 2 | Diary entry | yes |
| Cafe | 📖 Old book on shelf | 3 | 10 affinity | no |
| Cyberpunk | 🕹️ Arcade machine | 2 | 10 affinity | no |
| Cyberpunk | 🤖 Hidden robot in alley | 4 | Demon outfit unlock | yes |
| Rain | 🐸 Frog on windowsill | 2 | Diary entry | yes |
| Rain | ☂️ Forgotten umbrella | 3 | 10 affinity | no |
| Night Sky | 🔭 Telescope | 2 | 10 affinity | no |
| Night Sky | 🛸 UFO | 4 | Secret starfield scene variant | yes |
| Cozy Room | 🧸 Teddy bear on shelf | 2 | Diary entry | no |
| Cozy Room | 📷 Photo album | 3 | Diary entry | yes |
| Moonlight | 🦉 Owl on railing | 2 | 10 affinity | no |
| Moonlight | 🌹 Rose garden | 3 | Formal outfit unlock | yes |
| Lab | 🧪 Bubbling flask | 1 | 5 affinity | no |
| Lab | 📺 Hidden monitor | 3 | Diary entry | yes |
| Lab | ⚡ Tesla coil | 4 | 15 affinity | no |
| Morning | 🐦 Bird on wire | 1 | 5 affinity | no |
| Morning | 🌻 Sunflower | 3 | 10 affinity | no |
| Sunset | 🎵 Street musician | 2 | 10 affinity | no |
| Sunset | 🎆 Firework launcher | 4 | Festival scene variant | yes |

## Character Reactions

### Pre-written Pools

Each character has 3-4 lines per interactable, with an associated expression. A random line is picked on each tap. Reactions are displayed as ephemeral DialogueBox lines (same delivery as gift reactions — not stored in chat history).

Example reactions per character archetype:

| Interaction | Arisu (supportive) | Marin (hype) | Suzuka (chaotic genius) | Kurisu (tsundere scientist) | Merrick (mystical vampire) |
|-------------|-------------------|--------------|------------------------|---------------------------|---------------------------|
| Beach shell | "Oh, it's so pretty! Keep it safe~" | "Yooo that's a sick shell!" | "Interesting calcium carbonate formation..." | "It's just a shell. ...Fine, it's somewhat unique." | "The sea offers its treasures to those who listen." |
| Cafe cat | "Aww, a kitty! Come here~" | "OMG A CAT. best day ever" | "...it's staring at me. I respect that." | "A stray? Don't expect me to pet it. ...okay, once." | "A creature of shadows. We understand each other." |
| Rain frog | "A little frog! Don't scare him..." | "FROG! haha he's so round" | "Amphibian surveillance unit detected." | "Rana temporaria. Nothing special. ...It IS sort of cute." | "Even the smallest beings hold ancient wisdom." |

### AI-Generated Reactions

Fire only on first discovery of hidden elements where `aiOnFirstDiscovery` is true. Implementation:

- A `discoveryContext` string is added to the API request (same pattern as `hexxMentioned`)
- Example context: `"The user just discovered a hidden cat under the cafe table for the first time. React with genuine surprise and delight in character."`
- The character gives a full AI response about the discovery
- Subsequent taps use the pre-written pool

## Progressive Reveal

Hidden elements become visible based on affinity level:

- **Level 0-1 (Stranger/Acquaintance):** Only existing visible hotspots shown. No hints for hidden elements.
- **Level 2 (Friend):** Level-2 hidden elements get a faint shimmer animation — a subtle radial glow pulse every 5 seconds. No emoji, no border.
- **Level 3 (Close Friend):** Level-3 elements get the shimmer. Previously revealed level-2 elements upgrade to a dim emoji hint (low opacity).
- **Level 4 (Soulmate):** Level-4 elements get the shimmer. All lower elements fully visible with emoji.

### Shimmer Animation

A soft radial glow that fades in and out — visually distinct from the existing hotspot pulse border. CSS keyframe: opacity cycles between 0 and 0.3 over 5 seconds with a radial gradient in the scene's accent color.

### Discovery Moment

When a hidden element is tapped for the first time:

1. Sparkle burst particle effect (reuse existing `spawnParticles`)
2. Discovery sound (new synth chime — ascending arpeggio)
3. Element becomes permanently visible with full emoji
4. Reward is applied (affinity, outfit, diary, or scene)
5. If `aiOnFirstDiscovery` is true, discovery context is queued for next chat message

## Quest Integration

Add one new quest type to the existing pool in `src/lib/quests.ts`:

- `"interact-3"` — "Explore 3 scene elements" — same reward structure as other quests

Interaction taps increment the quest counter via existing quest tracking infrastructure.

## Files Changed

| File | Change |
|------|--------|
| **Create:** `src/lib/discoveries.ts` | Discovery data model, all interactable definitions, per-character reaction pools, state management (localStorage), reward application, cooldown logic, progressive reveal logic |
| **Modify:** `src/components/InteractiveElements.tsx` | Render hidden elements based on affinity, shimmer hints, discovery effects, tap handlers go through discovery system |
| **Modify:** `src/lib/quests.ts` | Add `"interact-3"` quest type |
| **Modify:** `src/app/api/chat/route.ts` | Accept `discoveryContext`, inject into system prompt |
| **Modify:** `src/lib/api.ts` | Add `discoveryContext` to `SendMessageParams` |
| **Modify:** `src/app/chat/[characterId]/page.tsx` | Track pending discovery context, pass to API, handle discovery reactions in DialogueBox |

## What Doesn't Change

- SceneBackground component — untouched
- Existing hotspot sounds and particle effects — preserved
- BloodBat / Hexx system — untouched
- Chat history storage — discovery reactions are ephemeral
- Affinity calculation core — uses existing `addAffinityPoints`
