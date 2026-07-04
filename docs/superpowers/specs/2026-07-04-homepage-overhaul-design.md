# Homepage Overhaul — "Atmospheric & Alive"

## Goal
Transform the HEXXII homepage from a flat card grid into an immersive, atmospheric scene where all characters stand together in a shared environment. The homepage should feel like you're already inside the world.

## Scene

A unique homepage-only background — **moonlit garden plaza** with subtle purple/pink atmospheric lighting. Not tied to any single character. Dark, rich, ambient.

- New background image at `public/backgrounds/bg-plaza.png`
- CSS gradient fallback until art is generated: deep indigo-to-black with purple/pink ambient tones
- The scene fills the entire viewport using the existing `position: fixed; inset: 0` VN viewport pattern

## Characters

All 6 characters (arisu, marin, nao, kurisu, merrick, ticia) standing together in the scene using their existing sprite art (`body-neutral.png`).

- Positioned across the width of the viewport, spaced naturally (not a rigid grid)
- Each has their **accent-colored glow aura** radiating behind them (reuse CharacterGlow component)
- **Idle animations**: breathing (existing `breathe` keyframe), gentle sway (existing `idleSway` keyframe)
- **Hover state**: character brightens — glow intensifies, scale increases slightly (1.03x), name + level badge appears above them
- **Click**: triggers the transition to their chat page

### Character positioning (approximate, left to right)
- Spacing should be responsive — on desktop, spread across ~80% of viewport width
- On mobile, allow horizontal scroll or show 3-4 characters with arrows to see more
- Characters should be sized to fill about 50-60% of the viewport height
- Positioned with their feet near the bottom 20% of the viewport

## Atmosphere

### Parallax (3 layers)
1. **Background** (scene image): shifts 3-5px on mouse movement
2. **Characters** (mid layer): shifts 1-2px — less than background for depth
3. **Foreground particles**: shift 6-8px — most movement for depth illusion

Uses existing `useParallax()` hook from `src/lib/parallax.ts`.

### Ambient particles
- Soft light motes (white/warm, opacity 0.1-0.3, floating upward slowly)
- Occasional firefly (yellow/green pulse, 3-4 on screen)
- Sakura petals (pink, drifting diagonally, 5-8 on screen)
- Reuse particle rendering patterns from `SceneBackground.tsx`

### Animated lighting
- Subtle radial gradient overlay that slowly shifts position and color
- Cycles through character accent colors at very low opacity (0.03-0.06)
- Period: ~30 seconds for full cycle
- Creates a gentle, living light quality

### Audio
- Existing ambient music starts on first interaction (already wired in current homepage)
- No changes needed

## Layout

### Top area
- **HEXXII title**: same gradient text, reduced to `text-3xl sm:text-4xl md:text-5xl` (smaller than current). Centered at top. The scene is the star, not the logo.
- **Tagline**: "Choose Your Companion" typewriter text stays but smaller
- **Hero badge**: compact class badge, same as current but positioned inline with title area
- **Stats**: total messages + days active, same compact display

### Middle-bottom area
- **Character sprites**: standing across the viewport, feet near bottom 20%
- Each clickable — the entire sprite is a hit target

### UI overlays
- **Nav pill** (profile, gallery, settings): stays top-right, glass morphism style, same as current
- **BloodBat**: stays as mascot, lower corner
- **Daily reward modal**: still triggers on first visit
- **Onboarding overlay**: still triggers on first run
- **Away notification stack**: stays

### Removed elements
- Character card grid (`CharacterCard` component no longer used on homepage)
- Flat gradient background (replaced by scene)
- Large ambient glow blobs (5x 96rem circles)
- Glowing divider line
- Scroll hint arrow
- "Choose your identity" link (move to onboarding or remove)

## Transition to Chat

Click a character → their accent color **glow expands outward** as a radial wipe filling the screen → dissolves/fades into their personal VN scene as the chat page loads.

Implementation:
- On click, set a state with the character's accent color and click position
- Render a `<div>` with radial-gradient expanding from click point in the accent color
- Animate from `scale(0)` to `scale(4)` over ~400ms with ease-out
- At ~300ms, trigger `router.push(/chat/${characterId})`
- The chat page loads behind the expanding color, creating a seamless wipe

## File Structure

### New files
| File | Responsibility |
|------|---------------|
| `src/components/HomepageScene.tsx` | The atmospheric scene: background, parallax, particles, lighting |
| `src/components/CharacterLineup.tsx` | Row of standing character sprites with hover/click states |
| `src/components/CharacterTransition.tsx` | Radial color wipe transition on character select |

### Modified files
| File | Changes |
|------|---------|
| `src/app/page.tsx` | Rewrite to compose HomepageScene + CharacterLineup + transition |

### Assets needed
| Asset | Notes |
|-------|-------|
| `public/backgrounds/bg-plaza.png` | Homepage scene background (generate with ComfyUI later, CSS fallback for now) |

## Mobile considerations

- On narrow viewports (< 640px), characters may be too small if all 6 are side by side
- Solution: show characters at a larger size with horizontal scroll, or wrap to 2 rows of 3
- Touch: tap instead of hover — first tap shows name/level, second tap enters chat
- Parallax: use device tilt (already supported by `useParallax`) instead of mouse

## Technical notes

- Reuse existing components: `CharacterGlow`, `CharacterSprite` (or just raw `<img>` tags for simpler homepage rendering)
- Reuse existing hooks: `useParallax`
- Reuse existing particle patterns from `SceneBackground.tsx`
- The homepage does NOT need `ChatProvider` or any chat state
- Character data comes from `characters` object in `@/lib/characters`
- Affinity data for hover badges: `getAffinity(characterId)` from `@/lib/affinity`
