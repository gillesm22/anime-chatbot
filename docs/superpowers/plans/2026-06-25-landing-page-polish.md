# Landing Page Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the landing page from a plain card menu into a polished, personality-driven experience with staggered animations, smart indicators, and interactive elements.

**Architecture:** All changes are CSS animations + lightweight state reads from localStorage. No new API calls, no new data structures. Changes touch `page.tsx`, `CharacterCard.tsx`, `BloodBat.tsx`, and `globals.css` only.

**Tech Stack:** React 19, CSS animations (no framer-motion on landing page), localStorage reads

---

### Task 1: Staggered Card Entrance Animation

**Files:**
- Modify: `src/styles/globals.css` (add keyframe)
- Modify: `src/app/page.tsx:170-177` (add animation delays)

- [ ] **Step 1: Add cardEntrance keyframe to globals.css**

Add after the existing `fadeIn` keyframe (line 74):

```css
@keyframes cardEntrance {
  from { opacity: 0; transform: translateY(30px) scale(0.97); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
```

- [ ] **Step 2: Apply staggered delays to card wrappers in page.tsx**

Replace lines 170-177:
```tsx
{/* Character cards */}
<div className="flex flex-wrap justify-center gap-5 md:gap-8 max-w-5xl w-full relative z-10">
  {characterList.map((character, i) => (
    <div key={character.id} className="w-full sm:w-[calc(50%-10px)] lg:w-[calc(33.333%-22px)]">
      <CharacterCard character={character} index={i} />
    </div>
  ))}
</div>
```

With:
```tsx
{/* Character cards */}
<div className="flex flex-wrap justify-center gap-5 md:gap-8 max-w-5xl w-full relative z-10">
  {characterList.map((character, i) => (
    <div
      key={character.id}
      className="w-full sm:w-[calc(50%-10px)] lg:w-[calc(33.333%-22px)]"
      style={{
        opacity: 0,
        animation: `cardEntrance 0.5s ease-out ${i * 0.12}s forwards`,
      }}
    >
      <CharacterCard character={character} index={i} />
    </div>
  ))}
</div>
```

- [ ] **Step 3: Commit**

```bash
git add src/styles/globals.css src/app/page.tsx
git commit -m "feat: add staggered card entrance animation on landing page"
```

---

### Task 2: Last-Seen Indicator on Cards

**Files:**
- Modify: `src/components/CharacterCard.tsx:78-107` (add last-seen below affinity row)

- [ ] **Step 1: Add last-seen state and time formatting**

In `CharacterCard.tsx`, add a state for lastSeen inside the component (after the `affinity` state on line 17):

```tsx
const [lastSeen, setLastSeen] = useState<string | null>(null);
```

Update the `useEffect` (lines 20-22) to also compute lastSeen:

```tsx
useEffect(() => {
  setAffinity(getAffinity(character.id));
  // Compute last-seen from chat history
  try {
    const raw = localStorage.getItem(`anime-chatbot-history-${character.id}`);
    if (raw) {
      const msgs = JSON.parse(raw);
      if (msgs.length > 0) {
        const lastTs = msgs[msgs.length - 1].timestamp;
        const diff = Date.now() - lastTs;
        const mins = Math.floor(diff / 60000);
        if (mins < 1) setLastSeen("Just now");
        else if (mins < 60) setLastSeen(`${mins}m ago`);
        else if (mins < 1440) setLastSeen(`${Math.floor(mins / 60)}h ago`);
        else setLastSeen(`${Math.floor(mins / 1440)}d ago`);
      }
    }
  } catch {}
}, [character.id]);
```

- [ ] **Step 2: Render last-seen badge in the info section**

After the affinity badges (line 93), before the tagline paragraph, add:

```tsx
{lastSeen && (
  <p className="text-[10px] tracking-wide mb-1" style={{ color: character.theme.accent, opacity: 0.5 }}>
    Last seen {lastSeen}
  </p>
)}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/CharacterCard.tsx
git commit -m "feat: add last-seen time indicator on character cards"
```

---

### Task 3: Favorite Character Highlight

**Files:**
- Modify: `src/components/CharacterCard.tsx` (add isFavorite prop and crown styling)
- Modify: `src/app/page.tsx` (compute favorite and pass prop)

- [ ] **Step 1: Add isFavorite prop to CharacterCard**

Update the interface (line 10-12):

```tsx
interface CharacterCardProps {
  character: Character;
  index: number;
  isFavorite?: boolean;
}
```

Update destructuring (line 15):

```tsx
export function CharacterCard({ character, index, isFavorite }: CharacterCardProps) {
```

- [ ] **Step 2: Add crown icon and enhanced glow for favorite**

In the info section, update the name h2 (lines 80-87):

```tsx
<h2
  className="text-2xl font-medium mb-2 transition-all duration-300"
  style={{
    color: character.theme.accent,
    textShadow: isHovered ? `0 0 20px ${character.theme.glow}` : "none",
  }}
>
  {isFavorite && <span className="text-sm mr-1" title="Most visited">&#9733;</span>}
  {character.name}
</h2>
```

Update the card border (line 32) to glow stronger for favorites:

```tsx
border: `1px solid ${character.theme.accent}${isFavorite ? "60" : "30"}`,
```

And the resting glow overlay (line 42), change opacity from just hover:

```tsx
opacity: isHovered ? 1 : isFavorite ? 0.3 : 0,
```

- [ ] **Step 3: Compute favorite in page.tsx and pass prop**

In `HomeContent` function, after `const characterList = ...` (line 32), add:

```tsx
const [favoriteId, setFavoriteId] = useState<string | null>(null);

useEffect(() => {
  let maxMsgs = 0;
  let favId: string | null = null;
  for (const char of characterList) {
    try {
      const raw = localStorage.getItem(`anime-chatbot-history-${char.id}`);
      if (raw) {
        const count = JSON.parse(raw).length;
        if (count > maxMsgs) { maxMsgs = count; favId = char.id; }
      }
    } catch {}
  }
  if (maxMsgs > 0) setFavoriteId(favId);
}, []);
```

Update the CharacterCard render to pass `isFavorite`:

```tsx
<CharacterCard character={character} index={i} isFavorite={character.id === favoriteId} />
```

- [ ] **Step 4: Commit**

```bash
git add src/components/CharacterCard.tsx src/app/page.tsx
git commit -m "feat: highlight favorite character with star badge and enhanced glow"
```

---

### Task 4: Hero Avatar in Identity Pill

**Files:**
- Modify: `src/app/page.tsx:117-132` (add avatar image to pill)

- [ ] **Step 1: Add avatar image inside the hero pill**

Replace the hero pill Link (lines 120-132):

```tsx
<Link
  href="/settings"
  className="inline-flex items-center gap-2 mt-3 px-4 py-1.5 rounded-full text-xs tracking-wide transition-all hover:scale-105"
  style={{
    background: `${classDef.theme.glow}`,
    border: `1px solid ${classDef.theme.accent}44`,
    color: classDef.theme.accent,
  }}
>
  <span style={{ filter: "brightness(1.3)" }}>{classDef.icon}</span>
  <span>Playing as {hero.name} · {classDef.title}</span>
</Link>
```

With:

```tsx
<Link
  href="/settings"
  className="inline-flex items-center gap-2.5 mt-3 pl-1.5 pr-4 py-1 rounded-full text-xs tracking-wide transition-all hover:scale-105"
  style={{
    background: `${classDef.theme.glow}`,
    border: `1px solid ${classDef.theme.accent}44`,
    color: classDef.theme.accent,
  }}
>
  <img
    src={classDef.avatarPath}
    alt={classDef.label}
    className="rounded-full object-cover"
    style={{
      width: 24,
      height: 24,
      border: `1.5px solid ${classDef.theme.accent}60`,
      boxShadow: `0 0 8px ${classDef.theme.glow}`,
    }}
    draggable={false}
  />
  <span>{hero.name} · {classDef.title}</span>
</Link>
```

- [ ] **Step 2: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: show hero avatar image in identity pill on landing page"
```

---

### Task 5: Blood Bat Replaces Footer Text with Personality

**Files:**
- Modify: `src/components/BloodBat.tsx` (add landingPhrases prop and cycling behavior)
- Modify: `src/app/page.tsx:178-183` (remove footer text, update BloodBat usage)

- [ ] **Step 1: Add landing mode to BloodBat**

In `BloodBat.tsx`, add a `landingMode` prop to the interface:

```tsx
interface BloodBatProps {
  expression?: Expression;
  accentColor?: string;
  isIdle?: boolean;
  isAudioPlaying?: boolean;
  landingMode?: boolean;
}
```

Update the destructuring:

```tsx
export function BloodBat({ expression, accentColor = "#b71c1c", isIdle, isAudioPlaying, landingMode }: BloodBatProps) {
```

Add a landing phrase cycling effect inside the component, after the drift timer effect:

```tsx
// Landing page personality phrases
useEffect(() => {
  if (!landingMode) return;
  const phrases = [
    "pick someone already",
    "they're all waiting y'know",
    "I don't have all night",
    "just pick. trust me.",
    "the one on the left. no wait.",
    "*taps foot impatiently*",
    "you're overthinking this",
    "any day now, chief",
  ];
  let idx = 0;
  setPhrase(phrases[0]);
  const interval = setInterval(() => {
    idx = (idx + 1) % phrases.length;
    setPhrase(phrases[idx]);
  }, 5000);
  return () => clearInterval(interval);
}, [landingMode]);
```

- [ ] **Step 2: Update landing page to use landingMode**

In `page.tsx`, remove lines 178-181 (the "Click to start chatting" paragraph) and update the BloodBat:

Replace:
```tsx
<p className="text-text-secondary text-xs tracking-wider relative z-10 opacity-30">
  Click to start chatting
</p>

<BloodBat accentColor="#b71c1c" isIdle />
```

With:
```tsx
<div className="relative z-10">
  <BloodBat accentColor="#b71c1c" landingMode />
</div>
```

- [ ] **Step 3: Commit**

```bash
git add src/components/BloodBat.tsx src/app/page.tsx
git commit -m "feat: Blood Bat replaces generic footer with cycling personality phrases"
```

---

### Task 6: Card Hover Expression Preview

**Files:**
- Modify: `src/components/CharacterCard.tsx` (crossfade to random expression on hover)

- [ ] **Step 1: Add hover expression state and image crossfade**

Add a constant for preview expressions at the top of the file (before the component, after imports):

```tsx
const PREVIEW_EXPRESSIONS = ["happy", "smirk", "teasing", "excited"] as const;
```

Inside the component, add state for the hover expression (after `isHovered` state):

```tsx
const [hoverExpr, setHoverExpr] = useState<string | null>(null);
```

Update `onMouseEnter` (line 27) to also pick a random expression:

```tsx
onMouseEnter={() => {
  setIsHovered(true);
  setHoverExpr(PREVIEW_EXPRESSIONS[Math.floor(Math.random() * PREVIEW_EXPRESSIONS.length)]);
}}
onMouseLeave={() => {
  setIsHovered(false);
  setHoverExpr(null);
}}
```

- [ ] **Step 2: Add expression preview image layer**

In the character image section (lines 56-76), after the existing `<img>` tag (line 66), add a second image that crossfades in on hover:

```tsx
{/* Expression preview on hover */}
{hoverExpr && (
  <img
    src={`${character.sprite.basePath}/face-${hoverExpr}.png`}
    alt={`${character.name} ${hoverExpr}`}
    className="h-56 sm:h-80 object-contain object-bottom absolute inset-0 w-full transition-opacity duration-300 z-20"
    draggable={false}
    style={{
      opacity: isHovered ? 1 : 0,
      pointerEvents: "none",
      transform: isHovered ? "translateY(-8px) scale(1.05)" : "translateY(0) scale(1)",
      transition: "opacity 300ms ease, transform 300ms ease",
    }}
  />
)}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/CharacterCard.tsx
git commit -m "feat: crossfade to random expression on card hover for personality preview"
```

---

### Task 7: Final Build Verification and Push

- [ ] **Step 1: Build**

```bash
cd "C:/Users/G$/anime-chatbot" && npx next build
```

Expected: Compiled successfully, no errors.

- [ ] **Step 2: Push all commits**

```bash
git push
```
