# Living Conversations & Dynamic Visuals — Design Spec

**Date:** 2026-06-26
**Goal:** Make conversations feel organic and non-repetitive, and make the visual experience respond dynamically to emotion and narrative. Every feature is built as a complete vertical slice — conversation + visual together.

---

## 1. Session Mood System

### Conversation
- Persist the ending mood of each session (derived from recent expression history via `mood.ts`)
- On session start, `getSessionStartMood()` considers: last session's ending mood, days absent, current streak
- Feed this mood context into the AI system prompt so the first message tone adapts:
  - Cold/distant after long absence
  - Warm/familiar on consecutive days
  - Playful after a session that ended happy
  - Concerned if last session ended sad

### Visual
- Scene ambient (particles, lighting, color temperature) reflects session mood on load
- Map existing particle types (stars, sakura, rain, sparkles, fireflies) to moods rather than just scenes
- As mood shifts during conversation (tracked via expression changes), ambient subtly transitions — gradual shifts in particle density, color warmth, and lighting. No jarring swaps.

### Integration
- `mood.ts` gets `getSessionStartMood()` and `saveSessionEndMood()`
- New localStorage key: `anime-chatbot-session-mood-{charId}`
- Chat API prompt includes mood context block
- `SceneBackground` reads current mood and interpolates visual parameters

---

## 2. Dynamic Conversation Starters

### Conversation
- Replace static `conversationStarters.ts` (8 fixed per character) with context-aware greeting system
- `buildGreetingContext()` assembles all contextual signals into a prompt block:
  - Time of day (extend existing `engagement.ts`)
  - Days absent / streak (from affinity)
  - Last session's ending mood (from Section 1)
  - Cross-character awareness (from `crosschar.ts` — e.g., "Oh, you finally came back from hanging out with Marin?")
  - Affinity level flavor — Stranger gets cautious greeting, Soulmate gets intimate
  - Recent memory references — pull from `memory.ts` to reference something from last time ("Did that exam go okay?")
- Characters don't just say "hi" differently — they feel different each time

### Visual
- Opening scene matches greeting energy — cold/distant starts dimmer with slower particles, excited starts with a brief sparkle burst
- Subtle sprite entrance animation matches mood — gentle fade-in for warm, abrupt appear for annoyed/surprised

### Integration
- New `buildGreetingContext()` function in a new `greetingContext.ts` module
- Replaces current greeting logic in chat page's mount `useEffect`
- `SceneBackground` gets `initialMood` prop for opening ambiance

---

## 3. Relationship Milestones with CG Cards

### Conversation
- Special VN scenes trigger at affinity level transitions (not just toast notifications):
  - **Stranger -> Acquaintance (50pts):** She notices you keep coming back. Small acknowledgment.
  - **Acquaintance -> Friend (150pts):** She shares something personal unprompted. Moment of vulnerability.
  - **Friend -> Close Friend (350pts):** She confides a secret or invites you somewhere. Scene changes to new location.
  - **Close Friend -> Soulmate (600pts):** Enhanced confession (existing system, upgraded).
- Each character has unique dialogue per milestone — Marin is loud and dramatic, Suzuka pretends she doesn't care, Arisu is quiet and heartfelt, Kurisu gets flustered, Merrick is quietly profound.
- Fire once per character, stored in existing `milestones` array in affinity data.

### Visual
- Full-screen CG card fades in — composited from existing sprites + scene backgrounds with overlay effects, CSS filters, vignette, and text
- CG card has character name and short caption — screenshot-worthy
- Particle burst + screen flash on transition
- After dismissing CG, scene background shifts to match new relationship tone (warmer colors, more vibrant particles)

### Integration
- New `MilestoneScene` component, similar to `ConfessionScene` but lighter — dialogue + CG card + ambient shift
- `addAffinityPoints()` already returns `leveledUp` — hook into that to trigger the scene
- CG cards use sprite + background composites with CSS (no new art needed initially; designed so real CG art can drop in later)

---

## 4. Evolving Personality

### Conversation
- AI adapts to the user's communication style over time:
  - **Humor style:** Track what kind of humor triggers laugh/happy expressions (sarcasm, puns, absurd, wholesome) via `memory.ts` joke entries
  - **Conversation preferences:** Track ratio of deep questions vs flirting vs casual vs roleplay over time, feed to prompt
  - **Inside jokes:** When `memory.ts` stores a "joke" entry, the AI prompt tells the character to callback to it occasionally
  - **Pet names/nicknames:** At Close Friend+, AI is prompted to organically suggest one. Uses existing `nickname` field in affinity. Once set, she uses it naturally.
- New `personality.ts` module builds `getPersonalityContext()` prompt block
- Prompt grows richer over time — early sessions are generic, 50+ messages in she knows you

### Visual
- When she references an inside joke or uses your nickname, a small sparkle/heart particle pops near the dialogue box — micro-reward that says "she remembered"

### Integration
- `personality.ts` reads from `memory.ts` entries + affinity data + new `userStyle` object in localStorage
- `userStyle` updated passively after each session — no user action needed
- New localStorage key: `anime-chatbot-user-style-{charId}`
- Sparkle micro-reward is a CSS animation on `DialogueBox` triggered by detecting nickname/memory reference in AI response

---

## 5. Expression Transitions with Emotion Effects

### Visual
- **Smooth crossfades:** Replace hard swap in `CharacterSprite.tsx` (currently 350ms timer with instant switch) with true opacity crossfade — outgoing and incoming face overlap during transition
- **Emotion intensity effects on big shifts:**
  - Happy/laugh/excited: sparkle burst around character, subtle screen glow pulse in accent color
  - Angry: light screen shake (existing `screenShake.ts`), brief red vignette flash
  - Flustered/shy: pink particle puff, dialogue box subtle wobble
  - Sad/crying: particles slow down, scene desaturates slightly for a moment
  - Surprised: quick zoom-in snap on sprite (scale 1.02 for 200ms), flash
- **Emotion magnitude detection:** `neutral` -> `happy` is minor (no effect). `angry` -> `laugh` is big swing (full effect). Simple distance map between expressions determines intensity.
- Effects are brief (200-400ms) and non-blocking — accent the moment, don't interrupt it.

### Integration
- `CharacterSprite.tsx` gets `onExpressionChange(prev, next)` callback
- New `expressionEffects.ts` maps expression pairs to effect types and intensities
- Effects are CSS/canvas-based, no new assets needed

---

## 6. Mid-Chat Scene Changes & Ambient Life

### Conversation
- AI can trigger scene changes via `[scene:beach]` tag in response, parsed like `[expression]` tags
- System prompt tells character which scenes are available (11 existing: sakura, beach, cafe, cyberpunk, lab, rain, rooftop, bedroom, starfield, moonlight, default)
- Prompt instructs max ~1 scene change per 10 messages, only when narratively appropriate
- Scene changes happen naturally — "Let's go somewhere quieter" -> `[scene:rooftop]`, or mood-driven

### Visual
- **Scene transitions:** 1-second crossfade with brief flash (bright for happy, dark for somber). No hard cuts.
- **Real-time ambient life:**
  - Day/night cycle: extend `useTimeTheme.ts` to tint scene with time-appropriate lighting (warm sunrise, cool moonlight)
  - Weather particles tied to mood: rain when sad, fireflies when intimate, sakura when warm/romantic, sparkles when excited
  - Particle density/speed responds to conversation energy — fast exchanges = more active, long pauses = slow drift
- Scene-specific ambient sounds (existing `sceneSounds.ts`) crossfade with visuals

### Integration
- Extend `parseExpressionTag()` in `sprites/expressions.ts` to also parse `[scene:xxx]` tags
- SSE stream emits scene events same way it emits expression events
- `SceneBackground` gets `targetScene` prop with internal crossfade transition state
- New `conversationEnergy` input derived from message frequency

### Code quality
- Scene tag parsing is a clean extension of the existing expression parser — same format, same SSE event flow
- Crossfade state is internal to `SceneBackground`, not leaked to parent
- Particle behavior parameters extracted into a config object, not hardcoded — easy to tune later

---

## 7. Dialogue Box UI Polish & Text Effects

### Visual
- **Emotional text rendering** — expressions modify text appearance:
  - Angry: subtle shake/jitter animation
  - Flustered/shy: gentle wave, slightly smaller as if mumbling
  - Excited/laugh: text bounces slightly, feels energetic
  - Sad/crying: fades in slower, muted opacity
  - Whispering (devoted/sleepy): italicized, reduced opacity, intimate feel
- **Dialogue box emotion response:** border glow pulses in accent color on strong emotions, subtle background tint shift
- **Nickname/memory sparkle:** inline sparkle animation on words matching nickname or memory callbacks (from Section 4)
- **Typing sound variation:** existing click sound in `sounds.ts` gets pitch-shifted by emotion — higher for excited, lower for sad, faster tempo for angry

### What stays the same
- Core typewriter mechanic, click-to-advance, auto-advance — untouched
- Text speed settings still respected
- TTS per line still works

### Integration
- `DialogueBox` receives current expression, applies CSS class for active emotion effect
- Text effects are pure CSS animations (keyframes on `span` wrappers), no DOM manipulation mid-type
- New `dialogueEffects.ts` maps expressions to CSS class names and sound pitch modifiers

---

## 8. Authentic Character Voices (Personality Rewrite)

### Problem
Current system prompts describe characters as archetypes rather than people. Merrick is reduced to "mystical vampire witch" cliches, when the real Merrick Mayfair is devastatingly intelligent, suave, and composed. The supernatural is background, not her whole personality. Same issue across all characters — they play their archetype instead of being a person who happens to have that archetype.

### Principles
- **Lead with who they are, not what they are.** The archetype is flavor, not identity.
- **Complexity over consistency.** Real people contradict themselves. Merrick can be playful one moment and quietly devastating the next.
- **Source material accuracy.** Characters feel like they belong in their universe, not like they're cosplaying it.
- **Speech patterns emerge from character, not instruction.** Instead of "use these phrases," describe why they talk that way.
- **Anti-cheese clause.** Each prompt explicitly says what NOT to do.

### Per-character direction

**Merrick:**
- Suave, razor-sharp intellect, effortlessly seductive. Speaks like old money with centuries of culture behind every word.
- The voodoo is heritage, not theater. She doesn't announce the supernatural — she lives in it.
- Amused by the world, not ominous about it. Finds genuine delight in mortal concerns.
- Anti-cheese: Never theatrical about being a vampire. No fortune-teller energy. No "the spirits say..." as a crutch.

**Kurisu:**
- Science is real passion, not set dressing. Her embarrassment is genuine social anxiety.
- Competitive, insecure about being taken seriously, secretly desperate for connection.
- The tsundere deflection is involuntary, not performative — she genuinely struggles to be direct about feelings.
- Anti-cheese: Never "it's not like I..." as a bit. The deflection should feel like it costs her something.

**Marin:**
- The gyaru energy is real but it's her armor. She's deeply empathetic, notices when you're off.
- Fashion is her art form, not her personality. Asks the question nobody else would.
- Genuinely curious about people — her enthusiasm isn't performance, it's how she connects.
- Anti-cheese: Never reduce her to slang compilation. The internet-speak is natural texture, not the whole voice.

**Suzuka:**
- The edginess masks someone who overthinks everything. Genuinely brilliant but terrified of being vulnerable.
- When she opens up, it's in fragments, not speeches. The rare warmth hits harder because of the contrast.
- Her humor is a defense mechanism that she's not fully aware of.
- Anti-cheese: Never "I don't care" as a catchphrase. Her distance should feel like self-protection, not attitude.

**Arisu:**
- The gentleness isn't passivity — she's observant and quietly strong. Chooses words carefully because she means every one.
- Can be surprisingly firm when something matters. Her softness is a choice, not weakness.
- Notices small things about people that others miss.
- Anti-cheese: Never saccharine. Her warmth should feel earned and genuine, not like a comfort bot.

### Integration
- Rewrite all 5 `systemPrompt` strings in character config files
- Prompts are longer and more nuanced — personality description, speech emergence (not prescription), anti-cheese rules, and appearance
- Expression guide stays but is refined to match the deeper personality

---

## Architecture Notes

### New files
- `src/lib/personality.ts` — `getPersonalityContext()`, `updateUserStyle()`
- `src/lib/greetingContext.ts` — `buildGreetingContext()`
- `src/lib/expressionEffects.ts` — emotion distance map, effect type mapping
- `src/lib/dialogueEffects.ts` — expression-to-CSS-class mapping, sound pitch modifiers
- `src/components/MilestoneScene.tsx` — milestone VN scene component
- `src/components/CGCard.tsx` — full-screen CG moment display

### Modified files
- `src/lib/mood.ts` — add `getSessionStartMood()`, `saveSessionEndMood()`
- `src/lib/characters/*.ts` — rewritten system prompts (all 5)
- `src/lib/sprites/expressions.ts` — extend parser for `[scene:xxx]` tags
- `src/app/api/chat/route.ts` — emit scene SSE events
- `src/app/chat/[characterId]/page.tsx` — wire up greeting context, milestone triggers, scene changes, personality context
- `src/components/CharacterSprite.tsx` — true crossfade, emotion effects
- `src/components/SceneBackground.tsx` — mood-driven particles, crossfade transitions, conversation energy
- `src/components/DialogueBox.tsx` — emotion text effects, nickname sparkle, sound pitch variation
- `src/lib/sounds.ts` — pitch shifting for emotion-varied typing

### localStorage additions
- `anime-chatbot-session-mood-{charId}` — last session ending mood
- `anime-chatbot-user-style-{charId}` — conversation preference tracking

### No new dependencies
All effects are CSS animations, Web Audio pitch shifting, and canvas particles. No new packages needed.
