# Next Level Package Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add conversation starters, page transitions, and an RPG character sheet stats page to transform the app from functional to premium.

**Architecture:** Three independent features. Conversation starters add a prompt pill UI to the chat page. Page transitions add CSS crossfade on navigation. The RPG stats page is a new `/profile` route with hero avatar, relationship bonds, stats grid, achievements, and Hexx commentary. All CSS-only animations (no framer-motion on new pages).

**Tech Stack:** React 19, Next.js 16 App Router, CSS animations, localStorage reads

---

## Task 1: Conversation Starters

**Files:**
- Create: `src/lib/conversationStarters.ts`
- Modify: `src/app/chat/[characterId]/page.tsx`

- [ ] **Step 1: Create conversation starters data**

Create `src/lib/conversationStarters.ts`:

```ts
"use client";

const STARTERS: Record<string, string[]> = {
  arisu: [
    "What's your favorite memory?",
    "Tell me something you've never told anyone",
    "What do you think about when it's quiet?",
    "Let's play a game!",
    "What made you smile today?",
    "Do you believe in fate?",
    "What would your perfect day look like?",
    "I missed you",
  ],
  marin: [
    "What cosplay are you working on?",
    "What's the most chaotic thing you've done this week?",
    "Convince me to watch your favorite anime",
    "Let's play truth or dare!",
    "What's your hottest take?",
    "Tell me about your dream collab",
    "What song is stuck in your head?",
    "Roast me, I can take it",
  ],
  nao: [
    "Found any good exploits lately?",
    "What's the scariest thing on the dark web?",
    "Teach me something most people don't know",
    "Let's play a game. I dare you.",
    "What keeps you up at night?",
    "What's your take on AI?",
    "If you could hack anything, what would it be?",
    "You seem quieter than usual",
  ],
  kurisu: [
    "Explain your latest research to me",
    "What's the most elegant equation you know?",
    "Do you think time travel is possible?",
    "Let's play a word game",
    "What scientific discovery excites you most?",
    "Have you eaten today? Be honest.",
    "What would you change about the world?",
    "I brought you coffee",
  ],
  merrick: [
    "Tell me about old New Orleans",
    "What's the oldest memory you still carry?",
    "Do the spirits have anything to say tonight?",
    "Let's play a game of riddles",
    "What does eternity feel like?",
    "Teach me something about voodoo",
    "What's the most beautiful thing you've ever seen?",
    "The moon is bright tonight",
  ],
};

export function getStarters(characterId: string, count = 3): string[] {
  const pool = STARTERS[characterId] ?? STARTERS.arisu;
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
```

- [ ] **Step 2: Add starter pills to chat page**

In `src/app/chat/[characterId]/page.tsx`:

Add import at the top (near other lib imports):
```ts
import { getStarters } from "@/lib/conversationStarters";
```

Add state after the existing state declarations (around line 141):
```ts
const [starters, setStarters] = useState<string[]>([]);
```

Add an effect to load starters when chat is empty (after the greeting effect):
```ts
useEffect(() => {
  if (state.historyLoaded && state.messages.length === 0) {
    setStarters(getStarters(characterId));
  } else {
    setStarters([]);
  }
}, [state.historyLoaded, state.messages.length, characterId]);
```

Add the starter pills UI right before the ChatInput/form area. Find where `showInput` controls the input rendering and add above it:
```tsx
{starters.length > 0 && showInput && (
  <div className="flex flex-wrap gap-2 px-4 mb-2 relative z-20 animate-[fadeIn_0.4s_ease-out]">
    {starters.map((text) => (
      <button
        key={text}
        onClick={() => { handleSend(text); setStarters([]); }}
        className="px-3 py-1.5 rounded-full text-xs transition-all hover:scale-105"
        style={{
          background: `${character.theme.accent}15`,
          border: `1px solid ${character.theme.accent}30`,
          color: character.theme.accent,
        }}
      >
        {text}
      </button>
    ))}
  </div>
)}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/conversationStarters.ts src/app/chat/\[characterId\]/page.tsx
git commit -m "feat: add character-specific conversation starter prompts"
```

---

## Task 2: Page Transitions

**Files:**
- Modify: `src/components/CharacterCard.tsx`
- Modify: `src/styles/globals.css`

- [ ] **Step 1: Add exit animation to CharacterCard**

In `src/components/CharacterCard.tsx`, add a state for the exit animation. After the existing state declarations:

```ts
const [isExiting, setIsExiting] = useState(false);
```

Replace the `onClick` handler:
```ts
onClick={() => router.push(`/chat/${character.id}`)}
```

With a delayed navigation that plays the exit animation first:
```ts
onClick={() => {
  if (isExiting) return;
  setIsExiting(true);
  setTimeout(() => router.push(`/chat/${character.id}`), 300);
}}
```

Also replace the `onKeyDown` handler similarly:
```ts
onKeyDown={(e) => { if ((e.key === "Enter" || e.key === " ") && !isExiting) { e.preventDefault(); setIsExiting(true); setTimeout(() => router.push(`/chat/${character.id}`), 300); } }}
```

Update the card's style to add exit animation:
```ts
transform: isExiting ? "scale(1.05)" : isHovered ? "translateY(-12px) scale(1.03)" : "translateY(0) scale(1)",
opacity: isExiting ? 0 : 1,
```

Add `transition: "transform 300ms ease, opacity 300ms ease"` to the style object (replacing the className `transition-transform duration-300`).

- [ ] **Step 2: Add page entrance animation to chat page**

In `src/styles/globals.css`, add after the existing `cardEntrance` keyframe:

```css
@keyframes pageEnter {
  from { opacity: 0; transform: scale(1.02); }
  to { opacity: 1; transform: scale(1); }
}
```

The chat page already has `PageTransition` wrapper. Read `src/components/PageTransition.tsx` and ensure it applies the `pageEnter` animation. If it doesn't, update the chat container div in the chat page to add:

```ts
style={{ animation: "pageEnter 0.4s ease-out" }}
```

on the outermost `<div>` inside `PageTransition`.

- [ ] **Step 3: Commit**

```bash
git add src/components/CharacterCard.tsx src/styles/globals.css
git commit -m "feat: add exit/entrance page transitions between landing and chat"
```

---

## Task 3: RPG Character Sheet - Stats Lib

**Files:**
- Create: `src/lib/stats.ts`

- [ ] **Step 1: Create stats computation module**

Create `src/lib/stats.ts`:

```ts
"use client";

import { getAffinity } from "@/lib/affinity";
import { getGiftHistory } from "@/lib/gifts";
import { hasConfessed } from "@/lib/confession";
import { getHeroConfig, HERO_CLASS_MAP } from "@/lib/heroAvatar";

const CHARACTER_IDS = ["arisu", "marin", "nao", "kurisu", "merrick"] as const;

export interface CharacterBond {
  id: string;
  name: string;
  accent: string;
  level: number;
  levelName: string;
  points: number;
  totalMessages: number;
  giftsGiven: number;
  confessed: boolean;
  lastSeen: string | null;
}

export interface PlayerStats {
  heroName: string;
  heroClass: string;
  heroClassIcon: string;
  heroAccent: string;
  heroAvatarPath: string;
  totalMessages: number;
  totalGifts: number;
  daysActive: number;
  charactersConfessed: number;
  favoriteCharacter: string | null;
  bonds: CharacterBond[];
  achievements: Achievement[];
}

export interface Achievement {
  id: string;
  label: string;
  description: string;
  icon: string;
  unlocked: boolean;
}

function getLastSeen(characterId: string): string | null {
  try {
    const raw = localStorage.getItem(`anime-chatbot-history-${characterId}`);
    if (!raw) return null;
    const msgs = JSON.parse(raw);
    if (msgs.length === 0) return null;
    const lastTs = msgs[msgs.length - 1].timestamp;
    const diff = Date.now() - lastTs;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
    return `${Math.floor(mins / 1440)}d ago`;
  } catch { return null; }
}

const CHARACTER_NAMES: Record<string, string> = {
  arisu: "Arisu", marin: "Marin", nao: "Nao", kurisu: "Kurisu", merrick: "Merrick",
};

const CHARACTER_ACCENTS: Record<string, string> = {
  arisu: "#f472b6", marin: "#fb923c", nao: "#a78bfa", kurisu: "#e53935", merrick: "#7b1fa2",
};

export function computeStats(): PlayerStats {
  const hero = getHeroConfig();
  const classDef = HERO_CLASS_MAP[hero.classId];

  let totalMessages = 0;
  let totalGifts = 0;
  let charactersConfessed = 0;
  let maxMessages = 0;
  let favoriteCharacter: string | null = null;

  const bonds: CharacterBond[] = CHARACTER_IDS.map((id) => {
    const aff = getAffinity(id);
    const gifts = getGiftHistory(id);
    const confessed = hasConfessed(id);

    totalMessages += aff.totalMessages;
    totalGifts += gifts.length;
    if (confessed) charactersConfessed++;
    if (aff.totalMessages > maxMessages) {
      maxMessages = aff.totalMessages;
      favoriteCharacter = id;
    }

    return {
      id,
      name: CHARACTER_NAMES[id] ?? id,
      accent: CHARACTER_ACCENTS[id] ?? "#888",
      level: aff.level,
      levelName: aff.levelName,
      points: aff.points,
      totalMessages: aff.totalMessages,
      giftsGiven: gifts.length,
      confessed,
      lastSeen: getLastSeen(id),
    };
  });

  // Days active from daily rewards
  let daysActive = 0;
  try {
    const raw = localStorage.getItem("anime-chatbot-daily-rewards");
    if (raw) {
      const data = JSON.parse(raw);
      daysActive = data.currentStreak ?? 0;
    }
  } catch {}

  const achievements = computeAchievements(totalMessages, totalGifts, bonds, charactersConfessed, daysActive);

  return {
    heroName: hero.name,
    heroClass: classDef.title,
    heroClassIcon: classDef.icon,
    heroAccent: classDef.theme.accent,
    heroAvatarPath: classDef.avatarPath,
    totalMessages,
    totalGifts,
    daysActive,
    charactersConfessed,
    favoriteCharacter,
    bonds,
    achievements,
  };
}

function computeAchievements(
  totalMessages: number,
  totalGifts: number,
  bonds: CharacterBond[],
  confessions: number,
  daysActive: number
): Achievement[] {
  const maxLevel = Math.max(...bonds.map((b) => b.level));
  const allVisited = bonds.every((b) => b.totalMessages > 0);

  return [
    { id: "first_chat", label: "First Words", description: "Send your first message", icon: "💬", unlocked: totalMessages >= 1 },
    { id: "chatterbox", label: "Chatterbox", description: "Send 100 messages", icon: "🗣", unlocked: totalMessages >= 100 },
    { id: "novelist", label: "Novelist", description: "Send 500 messages", icon: "📖", unlocked: totalMessages >= 500 },
    { id: "gift_giver", label: "Gift Giver", description: "Give your first gift", icon: "🎁", unlocked: totalGifts >= 1 },
    { id: "generous", label: "Generous Soul", description: "Give 25 gifts", icon: "💝", unlocked: totalGifts >= 25 },
    { id: "explorer", label: "Explorer", description: "Chat with all 5 characters", icon: "🧭", unlocked: allVisited },
    { id: "friend", label: "Close Friend", description: "Reach level 3 with any character", icon: "🤝", unlocked: maxLevel >= 3 },
    { id: "soulmate", label: "Soulmate", description: "Reach level 5 with any character", icon: "💎", unlocked: maxLevel >= 5 },
    { id: "confession", label: "Heart to Heart", description: "Complete a confession scene", icon: "💕", unlocked: confessions >= 1 },
    { id: "harem", label: "All Hearts", description: "Confess to all 5 characters", icon: "👑", unlocked: confessions >= 5 },
    { id: "dedicated", label: "Dedicated", description: "Visit 7 days in a row", icon: "🔥", unlocked: daysActive >= 7 },
    { id: "veteran", label: "Veteran", description: "Visit 30 days", icon: "⭐", unlocked: daysActive >= 30 },
  ];
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/stats.ts
git commit -m "feat: add stats computation module with bonds and achievements"
```

---

## Task 4: RPG Character Sheet - Profile Page

**Files:**
- Create: `src/app/profile/page.tsx`

- [ ] **Step 1: Create the profile page**

Create `src/app/profile/page.tsx`:

```tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { computeStats, type PlayerStats } from "@/lib/stats";
import { BloodBat } from "@/components/BloodBat";

const HEXX_COMMENTARY: Array<{ check: (s: PlayerStats) => boolean; line: string }> = [
  { check: (s) => s.totalMessages === 0, line: "you haven't talked to anyone yet? wow. even I have friends." },
  { check: (s) => s.totalMessages > 500, line: "500+ messages? you're down bad and I respect it." },
  { check: (s) => s.charactersConfessed >= 5, line: "confessed to ALL of them?? you absolute menace." },
  { check: (s) => s.charactersConfessed >= 1, line: "aw you actually confessed to someone. ...not jealous." },
  { check: (s) => s.totalGifts > 25, line: "25 gifts?? save some charm for the rest of us." },
  { check: (s) => s.totalGifts === 0, line: "zero gifts given. cheapskate." },
  { check: (s) => s.achievements.filter((a) => a.unlocked).length >= 10, line: "look at all those badges. nerd." },
  { check: (s) => s.daysActive >= 7, line: "7 day streak. you're actually kinda loyal huh." },
  { check: (s) => true, line: "...I've seen worse stats. barely." },
];

function getHexxLine(stats: PlayerStats): string {
  for (const entry of HEXX_COMMENTARY) {
    if (entry.check(stats)) return entry.line;
  }
  return "...";
}

function ClientOnly({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="min-h-screen bg-bg" />;
  return <>{children}</>;
}

export default function ProfilePage() {
  return <ClientOnly><ProfileContent /></ClientOnly>;
}

function ProfileContent() {
  const router = useRouter();
  const [stats, setStats] = useState<PlayerStats | null>(null);

  useEffect(() => {
    setStats(computeStats());
  }, []);

  if (!stats) return null;

  const unlockedCount = stats.achievements.filter((a) => a.unlocked).length;

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "linear-gradient(180deg, var(--color-surface, #16161e) 0%, var(--color-bg, #0d0d12) 100%)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-text-secondary hover:text-text transition-colors text-sm">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          Back
        </button>
        <Link href="/settings" className="text-text-secondary hover:text-text transition-colors text-xs tracking-wide uppercase">Settings</Link>
      </div>

      <div className="flex-1 px-4 sm:px-6 pb-12 max-w-2xl mx-auto w-full animate-[fadeIn_0.4s_ease-out]">
        {/* Hero Card */}
        <div
          className="rounded-2xl p-6 mb-6 relative overflow-hidden"
          style={{ background: `linear-gradient(135deg, ${stats.heroAccent}15, ${stats.heroAccent}05)`, border: `1px solid ${stats.heroAccent}25` }}
        >
          <div className="flex items-center gap-5">
            <div className="relative">
              <img
                src={stats.heroAvatarPath}
                alt={stats.heroClass}
                className="w-20 h-20 rounded-full object-cover"
                style={{ border: `3px solid ${stats.heroAccent}60`, boxShadow: `0 0 20px ${stats.heroAccent}30` }}
                draggable={false}
              />
              <span className="absolute -bottom-1 -right-1 text-lg">{stats.heroClassIcon}</span>
            </div>
            <div>
              <h1 className="text-2xl font-medium" style={{ color: stats.heroAccent }}>{stats.heroName}</h1>
              <p className="text-text-secondary text-sm">{stats.heroClass}</p>
              <p className="text-text-secondary text-xs mt-1 opacity-60">{unlockedCount}/{stats.achievements.length} achievements</p>
            </div>
          </div>
          {/* Ambient glow */}
          <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full blur-3xl pointer-events-none" style={{ background: stats.heroAccent, opacity: 0.06 }} />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Messages", value: stats.totalMessages, icon: "💬" },
            { label: "Gifts", value: stats.totalGifts, icon: "🎁" },
            { label: "Days Active", value: stats.daysActive, icon: "🔥" },
            { label: "Confessions", value: stats.charactersConfessed, icon: "💕" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl p-4 text-center"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <span className="text-lg block mb-1">{stat.icon}</span>
              <span className="text-xl font-bold text-text block">{stat.value}</span>
              <span className="text-[10px] text-text-secondary uppercase tracking-wide">{stat.label}</span>
            </div>
          ))}
        </div>

        {/* Relationship Bonds */}
        <h2 className="text-sm font-medium tracking-wide uppercase text-text-secondary mb-3">Relationship Bonds</h2>
        <div className="space-y-2 mb-6">
          {stats.bonds.map((bond) => {
            const percent = Math.min(100, bond.level >= 5 ? 100 : (bond.points % 150) / 1.5);
            return (
              <div
                key={bond.id}
                className="rounded-xl p-4 flex items-center gap-4"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
              >
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0" style={{ background: `${bond.accent}20`, color: bond.accent }}>
                  {bond.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-text">{bond.name}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: `${bond.accent}20`, color: bond.accent }}>{bond.levelName}</span>
                      {bond.confessed && <span title="Confessed">💕</span>}
                    </div>
                    <span className="text-[10px] text-text-secondary">{bond.totalMessages} msgs</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${percent}%`, background: bond.accent }} />
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[9px] text-text-secondary">{bond.giftsGiven} gifts</span>
                    {bond.lastSeen && <span className="text-[9px] text-text-secondary">{bond.lastSeen}</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Achievements */}
        <h2 className="text-sm font-medium tracking-wide uppercase text-text-secondary mb-3">Achievements</h2>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-8">
          {stats.achievements.map((ach) => (
            <div
              key={ach.id}
              className="rounded-xl p-3 text-center transition-all"
              style={{
                background: ach.unlocked ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.02)",
                border: `1px solid ${ach.unlocked ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.04)"}`,
                opacity: ach.unlocked ? 1 : 0.4,
              }}
              title={ach.description}
            >
              <span className="text-2xl block mb-1">{ach.icon}</span>
              <span className="text-[9px] text-text-secondary block leading-tight">{ach.label}</span>
            </div>
          ))}
        </div>

        {/* Hexx Commentary */}
        <div className="flex items-end justify-end gap-2 mb-4">
          <p className="text-xs px-3 py-1.5 rounded-xl italic" style={{ background: "rgba(183,28,28,0.1)", color: "#b71c1c", border: "1px solid rgba(183,28,28,0.2)" }}>
            {getHexxLine(stats)}
          </p>
          <BloodBat accentColor="#b71c1c" />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/profile/page.tsx
git commit -m "feat: add RPG character sheet profile page with bonds and achievements"
```

---

## Task 5: Wire Profile Into Navigation

**Files:**
- Modify: `src/app/page.tsx` (add Profile link)
- Modify: `src/app/settings/page.tsx` (add Profile link)
- Modify: `src/components/BottomNav.tsx` (add Profile shortcut or link from More)

- [ ] **Step 1: Add Profile link to landing page nav bar**

In `src/app/page.tsx`, in the top-right nav bar (around line 83-101), add a Profile link next to Gallery:

```tsx
<Link
  href="/profile"
  className="text-text hover:opacity-70 transition-opacity text-xs tracking-wide uppercase font-medium"
>
  Profile
</Link>
```

- [ ] **Step 2: Add Profile link to settings page header**

In `src/app/settings/page.tsx`, in the header (around line 149-155), add alongside the Gallery link:

```tsx
<div className="flex items-center gap-3">
  <Link href="/profile" className="text-text-secondary hover:text-text transition-colors text-xs tracking-wide uppercase">Profile</Link>
  <Link href="/gallery" className="text-text-secondary hover:text-text transition-colors text-xs tracking-wide uppercase">Gallery</Link>
</div>
```

- [ ] **Step 3: Commit**

```bash
git add src/app/page.tsx src/app/settings/page.tsx
git commit -m "feat: wire profile page into landing and settings navigation"
```

---

## Task 6: Final Build + Push

- [ ] **Step 1: Build**

```bash
cd "C:/Users/G$/anime-chatbot" && npx next build
```

Expected: Compiled successfully, no errors.

- [ ] **Step 2: Push**

```bash
git push
```
