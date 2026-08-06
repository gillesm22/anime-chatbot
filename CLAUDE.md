# HEXXII · Anime VN Chatbot

## How to Run

```bash
cd "C:/Users/G$/Kikaku 企画/anime-chatbot"
rm -rf .next
npx next dev --webpack -p 3000
```

- **MUST use `--webpack`** flag. Turbopack crashes because the `G$` path 
  contains `$` which breaks its persistence DB.
- Opens at http://localhost:3000
- `reactStrictMode: false` in next.config.ts is deliberate (avoids 
  double-mount on audio context and animation state).

## Stack

Next.js 16 (App Router), React 19, Tailwind CSS v4, framer-motion v10 
(pinned), OpenAI API (GPT-4o), @andresaya/edge-tts for voice, 
Web Audio API for sounds/music. PWA via manifest.json + sw.js.

## Env

Only one required var: `OPENAI_API_KEY` in `.env.local`

`@anthropic-ai/sdk` is in package.json but unused. Chat API uses OpenAI only.

## Known Issues

- **framer-motion v10 pinned**: v11+ breaks with React 19 JSX types. 
  Type augmentation at `src/types/framer-motion.d.ts` bridges the gap. 
  Do not upgrade or remove.
- **Turbopack**: Cannot use (`$` in path breaks persistence DB). 
  Always pass `--webpack`.
- **i18n incomplete**: `t()` function has en/ja translations. 
  LanguageToggle switches en/ja. Chat API accepts `language` param 
  including fr-CA but no FR toggle in UI.
- **Light mode partial**: Most pages support it via CSS variables. 
  Some inline styles still hardcode dark colors.

## Architecture

### Pages

| Route | Purpose |
|-------|---------|
| `/` (page.tsx) | Landing: character cards, HEXXII title, daily rewards, onboarding, BloodBat mascot |
| `/chat/[characterId]` | VN chat: sprite, dialogue box, expression system, outfits, scenes, quests, confession |
| `/gallery` | Sprite gallery: all expressions + outfits, filtered per character |
| `/profile` | Player profile: hero class, per-character affinity, total stats |
| `/settings` | Text speed, sound, response length, AI provider, hero config, export |
| `/api/chat` | SSE streaming chat (OpenAI). Expression tags parsed mid-stream. 50-msg history cap |
| `/api/tts` | Edge TTS. Per-character voices. 500-char cap. Returns audio/mpeg |
| `/api/save` | POST `{ data }` → writes `saves/latest.json` (atomic) + timestamped copy, prunes to 10. Local FS only |
| `/api/load` | GET → reads `saves/latest.json`; `{ data: null }` if none |

### Key Components (37 total in `src/components/`)

- `CharacterSprite.tsx` · Layered PNG sprite: body + face expression, 350ms crossfade transitions
- `DialogueBox.tsx` · VN typewriter with per-character TTS, configurable speed
- `BloodBat.tsx` · Hexx SVG bat mascot, reacts to expressions, clickable with escalating personality
- `SceneBackground.tsx` · Parallax bg with particles (stars, sakura, rain, sparkles, fireflies)
- `OutfitCarousel.tsx` · Horizontal outfit picker
- `ConfessionScene.tsx` · Branching VN confession at Soulmate level
- `QuestPanel.tsx` · Daily quests with rewards
- `BottomNav.tsx` · Fixed bottom nav (Chat, Outfits, Gifts, Diary, More)
- `ChatHistory.tsx` · Scrollable chat history
- `VNLayout.tsx` · Full-screen VN layout wrapper with header controls
- `VNMenu.tsx` · Radial fan menu replacing bottom nav (new VN architecture)
- `VNTransition.tsx` · Scene transition effects
- `GiftShop.tsx` · Gift giving UI
- `DiaryView.tsx` · Character diary entries viewer
- `SplashScreen.tsx` · Initial app loading screen
- `OnboardingOverlay.tsx` · First-run onboarding flow

### Lib Modules (`src/lib/`)

**Characters & Sprites:**
- `characters/` · Config for all 6 characters (see table below)
- `characters/types.ts` · Expression (16 values), BodyPose, Character, ThemeColors, SpriteConfig
- `sprites/engine.ts` · `useBlink()` hook (3-6s), `useTalkAnimation()` (120ms mouth cycle)
- `sprites/expressions.ts` · `getSpritePaths()`, `parseExpressionTag()`, `stripExpressionTags()`

**Chat Engine:**
- `chat/reducer.ts` · Actions: SEND_MESSAGE, RECEIVE_RESPONSE, LINE_TYPED, ADVANCE_LINE, TOGGLE_AUTO_ADVANCE, LOAD_HISTORY, SET_EXPRESSION. Splits response into 2-sentence lines.
- `chat/context.tsx` · `ChatProvider`, `useChat()`. localStorage persistence. 200-msg cap.
- `chat/actions.ts` · Action creators
- `api.ts` · `streamChat()` SSE client, `parseSSEChunk()`

**State & Memory:**
- `affinity.ts` · 5 levels (Stranger/Acquaintance/Friend/Close Friend/Soulmate at 0/50/150/350/600 pts). Outfit unlocks, milestones, streaks.
- `memory.ts` · 100 entries max, 6 categories (fact/preference/emotion/moment/topic/joke). Fuzzy dedup (60% overlap). 7-day decay.
- `mood.ts` · 4 moods derived from recent expression history
- `heroAvatar.ts` · 6 hero classes (knight/mage/rogue/demon/angel/beast) with per-character reactions
- `stats.ts` · Cross-character aggregate stats, play time estimation

**Engagement & Narrative:**
- `engagement.ts` · Time-of-day greetings, streak messages
- `crosschar.ts` · Cross-character jealousy system
- `confession.ts` · Branching dialogue at high affinity, per-character scripts
- `diary.ts` · Character diary entries (max 30)
- `dailyRewards.ts` · 7-day repeating reward cycle
- `quests.ts` · Daily quest pool (laugh-3, flustered-2, messages-10, gifts-2, headpat-5)
- `gifts.ts` · Gift catalog (4 common, 3 rare, 2 legendary). Per-character reactions.
- `conversationStarters.ts` · 8 suggested starters per character
- `minigames.ts` · 6 game types, casual vs intimate tiers (affinity level 3+)

**Audio & FX:**
- `sounds.ts` · Web Audio synth: typing click, send swoosh, expression change, message received
- `ambient.ts` · Procedural ambient music in Cmaj9, two melody voices
- `sceneSounds.ts` · Per-scene ambient audio + per-character melody themes
- `humming.ts` · Character hums unique melodies after 30s idle
- `speech.ts` · TTS client: `speakLine()`, `stopSpeaking()` with AbortController
- `screenShake.ts` · Light/medium/heavy shake on `#chat-container`

**UI Utilities:**
- `parallax.ts` · Mouse/device tilt tracking
- `useTimeTheme.ts` · Auto day/night by clock
- `themeMode.ts` · Light/dark toggle via `data-theme` attribute
- `i18n.ts` · en/ja translations
- `backgrounds.ts` · 11 scenes with gradients, bg images, particle types
- `exportChat.ts` · Text and JSON export
- `typingReactions.ts` · Typing speed/pause tracking

## Characters

| ID | Display Name | Archetype | Accent | TTS Voice | Default Scene |
|----|-------------|-----------|--------|-----------|---------------|
| arisu | Arisu | Supportive senpai | #f472b6 pink | en-AU-NatashaNeural +6Hz -10% | sakura |
| marin | Marin | Tanned gyaru hype queen | #fb923c orange | en-US-SaraNeural +8Hz +5% | beach |
| suzuka | Suzuka | Edgy-cute chaotic genius | #a78bfa purple | en-US-AriaNeural -2Hz +0% | cyberpunk |
| kurisu | Kurisu | Genius tsundere scientist | #e53935 red | en-US-JennyNeural +2Hz +3% | lab |
| merrick | Merrick | Mystical vampire witch | #7b1fa2 violet | en-US-AmberNeural -4Hz -5% | moonlight |
| ticia | Ticia | Gothic matriarch (Morticia-inspired) | #1a1a1a black | en-GB-SoniaNeural -3Hz +0% | graveyard |

16 expressions (all characters): neutral, happy, thinking, surprised, sad, 
smirk, laugh, angry, flustered, devoted, teasing, sleepy, excited, shy, 
jealous, crying

3 body poses: neutral, arms-crossed, leaning

## Expression System

AI responses must start with `[expression]` tag on line 1. The API route 
parses this tag mid-stream and emits it as an SSE `expression` event before 
the text content. The sprite updates immediately on expression events.

## Conversation Flow

1. User types message, `playSendSwoosh`, dispatch `SEND_MESSAGE`
2. SSE stream starts. `[happy]` tag parsed on `]` or `\n`
3. Expression event fires: sprite updates, sound effects, screen shake
4. Text accumulates via SSE text events
5. Stream completes: `dispatch(receiveResponse)` splits into 2-sentence lines
6. DialogueBox types each line, calls `speakLine` per line
7. Click-to-continue on all lines. Auto-advance with 1.5s delay.

## Art Assets

- **Sprites**: `public/sprites/{character}/` · `body-neutral.png` + 
  `face-{expression}.png` x15 + outfit variants (bikini, casual, formal, 
  school, cheerleader, maid, nurse, cow, cowgirl, demon, vampire, 
  clown, flamenco)
- **Hexx mascot**: `public/sprites/hexx/` · 70+ mood/emotion PNGs
- **Hero avatars**: `public/sprites/hero/` · 6 class PNGs (manhwa style)
- **Backgrounds**: `public/backgrounds/bg-{scene}.png` · beach, bedroom, 
  cafe, cyberpunk, lab, rain, rooftop, sakura, starfield
- **SVG layers**: arisu/marin/suzuka have eyes/eyebrows/mouth SVGs but the 
  compositing system (`useBlink`) is not fully wired

## Art Generation (ComfyUI)

**Use the `gen-sprites` skill** (`.claude/skills/gen-sprites/`) for all new
sprite generation. It encodes the locked V3 standard and drives one
parameterized runner (`comfy-gen.mjs` + JSON config) — do not add new
one-off scripts to `scripts/`.

- **ComfyUI Desktop**: `C:/Users/G$/AppData/Local/Programs/Comfy Desktop/`
- **Model (V3, current)**: `illustriousxlMmmix_v80.safetensors`
- **Input dir**: `C:/Users/G$/AppData/Local/Comfy-Desktop/ComfyUI-Shared/input`
- **Canvas**: 832x1216, dpmpp_2m_sde / karras, 40 steps, CFG 6.5. Denoise: 
  1.0 base, 0.58 expressions (img2img), 0.72 outfit fallback (img2img)
- **Prompting**: danbooru tag order, ONE weight only — `(solo:1.5)`. 
  Full rules + per-character tags/seeds: `docs/sprite-prompts.md`

Legacy one-off generation scripts live in `scripts/archive/` — reference 
only, do not imitate (many carry V1/V2 mistakes; the V1 system with 
anything-v5 at 800x1400 is deprecated).

Active helpers in `scripts/`: `build-pick-gallery.mjs` / 
`apply-picks-add.mjs` (additive selection flow), `build-regen-gallery.mjs` 
/ `apply-regen-selection.mjs` (full re-curation — WIPES `regen-3/`), 
`remove_backgrounds.py` (root, rembg). Sprite finalization (rembg + 
face compositing + canvas verify + promote) is the **`pick-and-apply` 
skill** (`.claude/skills/pick-and-apply/`).

## localStorage Keys

```
anime-chatbot-history-{charId}       Chat messages (max 200)
anime-chatbot-username-{charId}      User's name per character
anime-chatbot-memories-{charId}      Memory entries (max 100)
anime-chatbot-summaries-{charId}     Conversation summaries (max 30)
anime-chatbot-mood-{charId}          Current mood
anime-chatbot-diary-{charId}         Diary entries (max 30)
anime-chatbot-affinity-{charId}      Affinity data
anime-chatbot-theme-mode             light | dark
anime-chatbot-text-speed             ms per char
anime-chatbot-sound-enabled          boolean string
anime-chatbot-response-length        short | medium | long
anime-chatbot-ai-provider            gpt-4o | gpt-4o-mini | gpt-3.5-turbo
anime-chatbot-language               en | ja
anime-chatbot-hero-config            HeroConfig JSON
anime-chatbot-daily-reward           RewardState JSON
anime-chatbot-daily-quests-{charId}  DailyQuestState JSON
anime-chatbot-gifts-{charId}         GiftRecord[] JSON
anime-chatbot-confession-{charId}    boolean (has confessed)
```

## Save System (`src/lib/saveSystem.ts`, `src/lib/serverSaves.ts`)

Three durable layers. `initSaveSystem()` (called on chat mount in
`useCharacterSession`) runs a **layered restore that stops at the first source
with data**, so a live session is never rolled back:

1. `localStorage` already has character data → trust it, touch nothing.
2. else IndexedDB snapshot restore (instant, same-browser).
3. else `GET /api/load` → hydrate `localStorage` from disk. ← survives a
   browser-data wipe / different browser / changed port.

Whichever restore fires shows the "Progress restored" toast.

**Saving** (auto every 5 min while visible, on tab-hide, on `pagehide` via
`sendBeacon`): `localStorage` → IndexedDB snapshot **and** `POST /api/save` →
`saves/latest.json` (atomic tmp+rename) + a pruned timestamped history copy.
Also calls `navigator.storage.persist()` once to resist eviction.

- `saves/` is at project root, **gitignored** (personal progress, never
  committed). Timestamped filenames are Windows-safe (ISO `:`/`.` → `-`).
- **Local-only**: relies on the Next.js server having FS access — does NOT work
  on serverless/Vercel (ephemeral FS). Design + rationale:
  `docs/superpowers/specs/2026-08-06-durable-save-system-design.md`.

## Tests

Vitest with jsdom. Tests in `__tests__/lib/`:
- `api.test.ts` · `parseSSEChunk()`
- `characters.test.ts` · Character definitions and `getCharacter()`
- `chat-reducer.test.ts` · All reducer actions
- `expressions.test.ts` · Expression tag parsing

Run: `npm test` or `npm run test:watch`

## GitHub

- **Repo**: `gillesm22/anime-chatbot` (private)
- **Collaborator**: gillesm22
