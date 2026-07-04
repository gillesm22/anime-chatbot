# Homepage Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the HEXXII homepage from a flat card grid into an atmospheric shared scene where all characters stand together, alive and interactive.

**Architecture:** Three new components — `HomepageScene` (background + parallax + particles + lighting), `CharacterLineup` (row of standing sprites with hover/click), `CharacterTransition` (radial color wipe on character select). The existing `page.tsx` gets rewritten to compose these, keeping daily rewards, onboarding, BloodBat, and nav.

**Tech Stack:** Next.js 16, React 19, framer-motion v10, existing `useParallax` hook, existing character/affinity data

---

## File Structure

### New files
| File | Responsibility |
|------|---------------|
| `src/components/HomepageScene.tsx` | Background image/gradient, 3-layer parallax, ambient particles (motes, fireflies, sakura), animated lighting overlay |
| `src/components/CharacterLineup.tsx` | 6 character sprites positioned across viewport, hover states (glow + name badge), click handler |
| `src/components/CharacterTransition.tsx` | Radial accent-color wipe from click position, triggers navigation |

### Modified files
| File | Changes |
|------|---------|
| `src/app/page.tsx` | Rewrite to compose new components, keep rewards/onboarding/nav/bat |

---

## Task 1: Create `HomepageScene` — background + particles + lighting

**Files:**
- Create: `src/components/HomepageScene.tsx`

- [ ] **Step 1: Write the component**

```tsx
// src/components/HomepageScene.tsx
"use client";

import { useEffect, useState } from "react";
import { useParallax } from "@/lib/parallax";

// --- Particle types ---
interface Particle {
  id: number;
  x: number;  // %
  y: number;  // %
  size: number; // px
  delay: number; // s
  duration: number; // s
  opacity: number;
  type: "mote" | "firefly" | "sakura";
}

function randomBetween(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function generateParticles(): Particle[] {
  const particles: Particle[] = [];
  let id = 0;

  // Light motes — 20 soft white/warm dots floating up
  for (let i = 0; i < 20; i++) {
    particles.push({
      id: id++, type: "mote",
      x: randomBetween(2, 98), y: randomBetween(10, 95),
      size: randomBetween(2, 4), delay: randomBetween(0, 10),
      duration: randomBetween(8, 14), opacity: randomBetween(0.08, 0.25),
    });
  }

  // Fireflies — 4 pulsing yellow-green
  for (let i = 0; i < 4; i++) {
    particles.push({
      id: id++, type: "firefly",
      x: randomBetween(10, 90), y: randomBetween(20, 70),
      size: randomBetween(3, 5), delay: randomBetween(0, 6),
      duration: randomBetween(4, 7), opacity: 0.6,
    });
  }

  // Sakura petals — 6 drifting diagonally
  for (let i = 0; i < 6; i++) {
    particles.push({
      id: id++, type: "sakura",
      x: randomBetween(0, 100), y: randomBetween(-10, 40),
      size: randomBetween(6, 10), delay: randomBetween(0, 12),
      duration: randomBetween(10, 18), opacity: randomBetween(0.15, 0.35),
    });
  }

  return particles;
}

export function HomepageScene() {
  const parallax = useParallax();
  const [particles] = useState(generateParticles);

  // Set --vh for viewport height (same as VNLayout)
  useEffect(() => {
    function setVH() {
      document.documentElement.style.setProperty("--vh", `${window.innerHeight * 0.01}px`);
    }
    setVH();
    window.addEventListener("resize", setVH);
    return () => window.removeEventListener("resize", setVH);
  }, []);

  return (
    <>
      <style>{`
        @keyframes hp-mote {
          0%, 100% { transform: translateY(0) translateX(0); opacity: var(--p-opacity); }
          50% { transform: translateY(-40px) translateX(10px); opacity: calc(var(--p-opacity) * 1.8); }
        }
        @keyframes hp-firefly {
          0%, 100% { opacity: 0.1; transform: scale(0.8); }
          50% { opacity: 0.7; transform: scale(1.3); }
        }
        @keyframes hp-sakura {
          0% { transform: translate(0, 0) rotate(0deg); opacity: var(--p-opacity); }
          100% { transform: translate(60px, 100vh) rotate(360deg); opacity: 0; }
        }
        @keyframes hp-light-shift {
          0% { transform: translate(-20%, -10%); background: radial-gradient(ellipse, rgba(244,114,182,0.05) 0%, transparent 70%); }
          25% { transform: translate(10%, -20%); background: radial-gradient(ellipse, rgba(167,139,250,0.04) 0%, transparent 70%); }
          50% { transform: translate(20%, 10%); background: radial-gradient(ellipse, rgba(251,146,60,0.04) 0%, transparent 70%); }
          75% { transform: translate(-10%, 20%); background: radial-gradient(ellipse, rgba(123,31,162,0.05) 0%, transparent 70%); }
          100% { transform: translate(-20%, -10%); background: radial-gradient(ellipse, rgba(244,114,182,0.05) 0%, transparent 70%); }
        }
      `}</style>

      {/* Layer 1: Background — parallax shifts slightly */}
      <div
        style={{
          position: "absolute", inset: 0, zIndex: 0,
          background: "linear-gradient(180deg, #0a0612 0%, #1a0a2e 30%, #12061a 60%, #0a0612 100%)",
          backgroundSize: "cover",
          transform: `translate(${parallax.x * 4}px, ${parallax.y * 3}px) scale(1.05)`,
          transition: "transform 0.1s ease-out",
        }}
      >
        {/* Background image — loads if available, gradient is fallback */}
        <img
          src="/backgrounds/bg-plaza.png"
          alt=""
          style={{
            position: "absolute", inset: 0, width: "100%", height: "100%",
            objectFit: "cover", objectPosition: "center bottom",
          }}
          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
        />
      </div>

      {/* Layer 2: Ambient vignette */}
      <div style={{
        position: "absolute", inset: 0, zIndex: 1,
        background: "radial-gradient(ellipse at center 40%, transparent 30%, rgba(10,6,18,0.7) 100%)",
        pointerEvents: "none",
      }} />

      {/* Layer 3: Animated lighting overlay */}
      <div style={{
        position: "absolute", inset: "-20%", zIndex: 2,
        animation: "hp-light-shift 30s ease-in-out infinite",
        pointerEvents: "none",
        width: "140%", height: "140%",
      }} />

      {/* Layer 4: Particles — strongest parallax */}
      <div
        style={{
          position: "absolute", inset: 0, zIndex: 3,
          transform: `translate(${parallax.x * 7}px, ${parallax.y * 5}px)`,
          transition: "transform 0.1s ease-out",
          pointerEvents: "none",
        }}
      >
        {particles.map((p) => {
          const color =
            p.type === "mote" ? "rgba(255,240,220,0.9)" :
            p.type === "firefly" ? "rgba(200,255,100,0.9)" :
            "rgba(255,180,200,0.7)";

          const animation =
            p.type === "mote" ? `hp-mote ${p.duration}s ease-in-out ${p.delay}s infinite` :
            p.type === "firefly" ? `hp-firefly ${p.duration}s ease-in-out ${p.delay}s infinite` :
            `hp-sakura ${p.duration}s linear ${p.delay}s infinite`;

          return (
            <div
              key={p.id}
              style={{
                position: "absolute",
                left: `${p.x}%`,
                top: `${p.y}%`,
                width: p.size,
                height: p.size,
                borderRadius: p.type === "sakura" ? "40% 60% 50% 50%" : "50%",
                background: color,
                boxShadow: p.type === "firefly" ? `0 0 8px ${color}` : "none",
                opacity: p.opacity,
                animation,
                "--p-opacity": p.opacity,
              } as React.CSSProperties}
            />
          );
        })}
      </div>
    </>
  );
}
```

- [ ] **Step 2: Verify it compiles**

Run: `cd "C:/Users/G$/anime-chatbot" && npx vitest run`
Expected: All tests pass (no test for this component — it's purely visual)

- [ ] **Step 3: Commit**

```bash
git add src/components/HomepageScene.tsx
git commit -m "feat: add HomepageScene with parallax, particles, animated lighting"
```

---

## Task 2: Create `CharacterLineup` — interactive character row

**Files:**
- Create: `src/components/CharacterLineup.tsx`

- [ ] **Step 1: Write the component**

```tsx
// src/components/CharacterLineup.tsx
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useParallax } from "@/lib/parallax";
import { characters } from "@/lib/characters";
import { getAffinity } from "@/lib/affinity";
import { CharacterGlow } from "./CharacterGlow";

interface CharacterLineupProps {
  onSelect: (characterId: string, rect: DOMRect) => void;
}

const CHARACTER_ORDER = ["merrick", "marin", "arisu", "kurisu", "nao", "ticia"];

export function CharacterLineup({ onSelect }: CharacterLineupProps) {
  const parallax = useParallax();
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const charList = CHARACTER_ORDER.map((id) => characters[id]).filter(Boolean);

  return (
    <div
      style={{
        position: "absolute",
        bottom: "5%",
        left: "50%",
        transform: `translateX(-50%) translateX(${parallax.x * 2}px) translateY(${parallax.y * 1}px)`,
        transition: "transform 0.15s ease-out",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        gap: "clamp(8px, 2vw, 32px)",
        zIndex: 5,
        width: "90%",
        maxWidth: 1200,
      }}
    >
      {charList.map((character, i) => {
        const isHovered = hoveredId === character.id;
        const affinity = getAffinity(character.id);
        const basePath = character.sprite.basePath;

        return (
          <motion.div
            key={character.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.1, duration: 0.5, ease: "easeOut" }}
            onMouseEnter={() => setHoveredId(character.id)}
            onMouseLeave={() => setHoveredId(null)}
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              onSelect(character.id, rect);
            }}
            style={{
              position: "relative",
              cursor: "pointer",
              flex: "0 1 auto",
              maxWidth: "clamp(100px, 15vw, 180px)",
              transition: "transform 0.3s ease, filter 0.3s ease",
              transform: isHovered ? "scale(1.05) translateY(-8px)" : "scale(1)",
              filter: hoveredId && !isHovered ? "brightness(0.6)" : "brightness(1)",
              zIndex: isHovered ? 10 : 5 - Math.abs(i - 2),
            }}
          >
            {/* Glow aura */}
            <div
              style={{
                position: "absolute",
                bottom: 0,
                left: "50%",
                transform: "translateX(-50%)",
                width: isHovered ? 200 : 120,
                height: isHovered ? 120 : 70,
                borderRadius: "50%",
                background: `radial-gradient(ellipse, ${character.theme.accent}50, ${character.theme.accent}20, transparent)`,
                filter: "blur(20px)",
                opacity: isHovered ? 0.8 : 0.3,
                transition: "all 0.3s ease",
                pointerEvents: "none",
              }}
            />

            {/* Sprite image */}
            <img
              src={`${basePath}/body-neutral.png`}
              alt={character.name}
              draggable={false}
              style={{
                width: "100%",
                height: "auto",
                objectFit: "contain",
                objectPosition: "bottom",
                animation: `breathe 4s ease-in-out ${i * 0.5}s infinite, idleSway 6s ease-in-out ${i * 0.8}s infinite`,
                position: "relative",
                zIndex: 2,
              }}
            />

            {/* Hover badge: name + level */}
            <AnimatePresence>
              {isHovered && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.2 }}
                  style={{
                    position: "absolute",
                    top: -8,
                    left: "50%",
                    transform: "translateX(-50%)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 4,
                    zIndex: 20,
                    pointerEvents: "none",
                  }}
                >
                  <span style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: character.theme.accent,
                    textShadow: "0 2px 8px rgba(0,0,0,0.8)",
                    whiteSpace: "nowrap",
                  }}>
                    {character.name}
                  </span>
                  <span style={{
                    fontSize: 10,
                    color: "rgba(255,255,255,0.6)",
                    textShadow: "0 1px 4px rgba(0,0,0,0.8)",
                    whiteSpace: "nowrap",
                  }}>
                    Lv.{affinity.level} {affinity.levelName}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Verify it compiles**

Run: `cd "C:/Users/G$/anime-chatbot" && npx vitest run`
Expected: All tests pass

- [ ] **Step 3: Commit**

```bash
git add src/components/CharacterLineup.tsx
git commit -m "feat: add CharacterLineup with hover glow and name badges"
```

---

## Task 3: Create `CharacterTransition` — radial color wipe

**Files:**
- Create: `src/components/CharacterTransition.tsx`

- [ ] **Step 1: Write the component**

```tsx
// src/components/CharacterTransition.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface CharacterTransitionProps {
  characterId: string;
  accentColor: string;
  /** Center point of the radial wipe (from click position) */
  originX: number;
  originY: number;
  onComplete?: () => void;
}

export function CharacterTransition({
  characterId,
  accentColor,
  originX,
  originY,
  onComplete,
}: CharacterTransitionProps) {
  const router = useRouter();
  const [phase, setPhase] = useState<"expanding" | "navigating" | "done">("expanding");

  useEffect(() => {
    // Navigate slightly before the wipe finishes for seamless transition
    const navTimer = setTimeout(() => {
      setPhase("navigating");
      router.push(`/chat/${characterId}`);
    }, 350);

    const doneTimer = setTimeout(() => {
      setPhase("done");
      onComplete?.();
    }, 600);

    return () => {
      clearTimeout(navTimer);
      clearTimeout(doneTimer);
    };
  }, [characterId, router, onComplete]);

  if (phase === "done") return null;

  // Calculate the maximum radius needed to cover the entire screen from the click point
  const maxDist = Math.max(
    Math.hypot(originX, originY),
    Math.hypot(window.innerWidth - originX, originY),
    Math.hypot(originX, window.innerHeight - originY),
    Math.hypot(window.innerWidth - originX, window.innerHeight - originY),
  );

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        pointerEvents: "all",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: originX,
          top: originY,
          width: maxDist * 2,
          height: maxDist * 2,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${accentColor} 0%, ${accentColor}ee 60%, ${accentColor}88 100%)`,
          transform: "translate(-50%, -50%) scale(0)",
          animation: "hp-radial-wipe 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards",
        }}
      />
      <style>{`
        @keyframes hp-radial-wipe {
          0% { transform: translate(-50%, -50%) scale(0); opacity: 1; }
          70% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
          100% { transform: translate(-50%, -50%) scale(1); opacity: 0.8; }
        }
      `}</style>
    </div>
  );
}
```

- [ ] **Step 2: Verify it compiles**

Run: `cd "C:/Users/G$/anime-chatbot" && npx vitest run`
Expected: All tests pass

- [ ] **Step 3: Commit**

```bash
git add src/components/CharacterTransition.tsx
git commit -m "feat: add CharacterTransition radial color wipe"
```

---

## Task 4: Rewrite `page.tsx` — compose the new homepage

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Rewrite the homepage**

```tsx
// src/app/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { characters } from "@/lib/characters";
import { startAmbientMusic } from "@/lib/ambient";
import { canClaimReward, claimReward, type DailyReward } from "@/lib/dailyRewards";
import { addAffinityPoints } from "@/lib/affinity";
import { DailyRewardModal } from "@/components/DailyRewardModal";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageToggle } from "@/components/LanguageToggle";
import { getHeroConfig, HERO_CLASS_MAP, isFirstRun } from "@/lib/heroAvatar";
import { BloodBat } from "@/components/BloodBat";
import { OnboardingOverlay } from "@/components/OnboardingOverlay";
import { AwayNotificationStack } from "@/components/AwayNotificationStack";
import { HomepageScene } from "@/components/HomepageScene";
import { CharacterLineup } from "@/components/CharacterLineup";
import { CharacterTransition } from "@/components/CharacterTransition";

function ClientOnly({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="min-h-screen bg-bg" />;
  return <>{children}</>;
}

export default function Home() {
  return (
    <ClientOnly>
      <HomeContent />
    </ClientOnly>
  );
}

function HomeContent() {
  const characterList = Object.values(characters);
  const [showOnboarding, setShowOnboarding] = useState(() => isFirstRun());
  const [showReward, setShowReward] = useState(false);
  const [pendingReward, setPendingReward] = useState<{ reward: DailyReward; streak: number } | null>(null);
  const [totalMessages, setTotalMessages] = useState(0);
  const [daysActive, setDaysActive] = useState(0);
  const [transition, setTransition] = useState<{
    characterId: string;
    accentColor: string;
    originX: number;
    originY: number;
  } | null>(null);

  // Daily reward check
  useEffect(() => {
    if (canClaimReward()) {
      const { reward, newStreak } = claimReward();
      setPendingReward({ reward, streak: newStreak });
      setShowReward(true);
      for (const char of characterList) {
        addAffinityPoints(char.id, { type: "daily_visit" });
      }
    }
  }, []);

  // Stats
  useEffect(() => {
    let totalMsgs = 0;
    const uniqueDays = new Set<string>();
    for (const char of characterList) {
      try {
        const raw = localStorage.getItem(`anime-chatbot-history-${char.id}`);
        if (raw) {
          const msgs = JSON.parse(raw);
          totalMsgs += msgs.length;
          for (const msg of msgs) {
            if (msg.timestamp) uniqueDays.add(new Date(msg.timestamp).toDateString());
          }
        }
      } catch {}
    }
    setTotalMessages(totalMsgs);
    setDaysActive(uniqueDays.size);
  }, []);

  // Ambient music
  useEffect(() => {
    const startMusic = () => {
      startAmbientMusic();
      document.removeEventListener("click", startMusic);
      document.removeEventListener("keydown", startMusic);
    };
    document.addEventListener("click", startMusic);
    document.addEventListener("keydown", startMusic);
    return () => {
      document.removeEventListener("click", startMusic);
      document.removeEventListener("keydown", startMusic);
    };
  }, []);

  const handleCharacterSelect = useCallback((characterId: string, rect: DOMRect) => {
    const character = characters[characterId];
    if (!character || transition) return;
    setTransition({
      characterId,
      accentColor: character.theme.accent,
      originX: rect.left + rect.width / 2,
      originY: rect.top + rect.height / 3,
    });
  }, [transition]);

  return (
    <div style={{ position: "fixed", inset: 0, overflow: "hidden", background: "#0a0612" }}>
      {/* Scene: background + parallax + particles + lighting */}
      <HomepageScene />

      {/* Navigation pill — top right */}
      <div
        className="absolute top-4 right-4 z-30 flex items-center gap-1.5 px-2 py-1.5 rounded-full"
        style={{
          background: "rgba(10,6,18,0.6)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <ThemeToggle />
        <LanguageToggle />
        <Link href="/profile" className="text-text hover:opacity-70 transition-all p-1.5 rounded-lg hover:bg-white/5" title="Profile">
          <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="5" r="3" stroke="currentColor" strokeWidth="1.2" />
            <path d="M2 14c0-2.5 2.5-4.5 6-4.5s6 2 6 4.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
        </Link>
        <Link href="/gallery" className="text-text hover:opacity-70 transition-all p-1.5 rounded-lg hover:bg-white/5" title="Gallery">
          <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
            <rect x="1.5" y="2.5" width="5" height="5" rx="0.8" stroke="currentColor" strokeWidth="1.2" />
            <rect x="9.5" y="2.5" width="5" height="5" rx="0.8" stroke="currentColor" strokeWidth="1.2" />
            <rect x="1.5" y="9.5" width="5" height="5" rx="0.8" stroke="currentColor" strokeWidth="1.2" />
            <rect x="9.5" y="9.5" width="5" height="5" rx="0.8" stroke="currentColor" strokeWidth="1.2" />
          </svg>
        </Link>
        <Link href="/settings" className="text-text hover:opacity-70 transition-all p-1.5 rounded-lg hover:bg-white/5" title="Settings">
          <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
            <path d="M6.86 1.45a1.2 1.2 0 0 1 2.28 0l.27.82a1.2 1.2 0 0 0 1.52.74l.82-.27a1.2 1.2 0 0 1 1.61 1.61l-.27.82a1.2 1.2 0 0 0 .74 1.52l.82.27a1.2 1.2 0 0 1 0 2.28l-.82.27a1.2 1.2 0 0 0-.74 1.52l.27.82a1.2 1.2 0 0 1-1.61 1.61l-.82-.27a1.2 1.2 0 0 0-1.52.74l-.27.82a1.2 1.2 0 0 1-2.28 0l-.27-.82a1.2 1.2 0 0 0-1.52-.74l-.82.27a1.2 1.2 0 0 1-1.61-1.61l.27-.82a1.2 1.2 0 0 0-.74-1.52l-.82-.27a1.2 1.2 0 0 1 0-2.28l.82-.27a1.2 1.2 0 0 0 .74-1.52l-.27-.82A1.2 1.2 0 0 1 4.25 1.9l.82.27a1.2 1.2 0 0 0 1.52-.74l.27-.82Z" stroke="currentColor" strokeWidth="1.2" />
            <circle cx="8" cy="8" r="2.2" stroke="currentColor" strokeWidth="1.2" />
          </svg>
        </Link>
      </div>

      {/* Title area — top center */}
      <div className="absolute top-6 left-0 right-0 z-20 text-center pointer-events-none" style={{ animation: "fadeIn 0.8s ease-out" }}>
        <h1
          className="text-3xl sm:text-4xl md:text-5xl font-light tracking-[0.3em] uppercase bg-clip-text text-transparent mb-1"
          style={{ backgroundImage: "linear-gradient(to right, #f472b6, #e53935, #fb923c, #a78bfa, #7b1fa2)" }}
        >
          HEXXII
        </h1>
        <p className="text-sm tracking-wide inline-flex items-center justify-center gap-2" style={{ color: "rgba(255,255,255,0.4)" }}>
          <img
            src="/sprites/hexx/neutral.png"
            alt="Hexx"
            className="inline-block rounded-full"
            style={{ width: 28, height: 28, objectFit: "cover", filter: "drop-shadow(0 0 4px rgba(229,57,53,0.4))" }}
            draggable={false}
          />
          <span>Choose Your Companion</span>
        </p>

        {/* Hero badge */}
        {!isFirstRun() && (() => {
          const hero = getHeroConfig();
          const classDef = HERO_CLASS_MAP[hero.classId];
          return (
            <div className="inline-flex items-center gap-2 mt-2 px-3 py-1 rounded-full pointer-events-auto" style={{
              background: "rgba(10,6,18,0.5)",
              border: `1px solid ${classDef.theme.accent}33`,
              fontSize: 11,
              color: classDef.theme.accent,
            }}>
              <img
                src={classDef.avatarPath}
                alt={classDef.label}
                className="rounded-full"
                style={{ width: 20, height: 20, border: `1px solid ${classDef.theme.accent}44` }}
                draggable={false}
              />
              <span>{hero.name} · {classDef.title}</span>
            </div>
          );
        })()}

        {/* Stats */}
        {totalMessages > 0 && (
          <div className="flex items-center justify-center gap-3 mt-2" style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>
            <span><span style={{ color: "#f472b6" }}>{totalMessages.toLocaleString()}</span> messages</span>
            <span style={{ opacity: 0.3 }}>·</span>
            <span><span style={{ color: "#a78bfa" }}>{daysActive}</span> {daysActive === 1 ? "day" : "days"} active</span>
          </div>
        )}
      </div>

      {/* Characters standing in the scene */}
      <CharacterLineup onSelect={handleCharacterSelect} />

      {/* BloodBat */}
      <div className="relative z-10">
        <BloodBat accentColor="#b71c1c" landingMode />
      </div>

      {/* Away notifications */}
      <AwayNotificationStack />

      {/* Onboarding overlay */}
      {showOnboarding && (
        <OnboardingOverlay onComplete={() => setShowOnboarding(false)} />
      )}

      {/* Daily reward modal */}
      {showReward && pendingReward && (
        <DailyRewardModal
          reward={pendingReward.reward}
          streak={pendingReward.streak}
          onClaim={() => setShowReward(false)}
        />
      )}

      {/* Character transition wipe */}
      {transition && (
        <CharacterTransition
          characterId={transition.characterId}
          accentColor={transition.accentColor}
          originX={transition.originX}
          originY={transition.originY}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Run tests**

Run: `cd "C:/Users/G$/anime-chatbot" && npx vitest run`
Expected: All tests pass

- [ ] **Step 3: Verify build compiles**

Run: `cd "C:/Users/G$/anime-chatbot" && npx next build 2>&1 | grep -E "error|Error|✓" | head -5`
Expected: "Compiled successfully" (ignore pre-existing TTS Buffer error)

- [ ] **Step 4: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: rewrite homepage with atmospheric scene and character lineup"
```

---

## Task 5: Visual QA and polish

**Files:**
- Possibly modify: `src/components/HomepageScene.tsx`, `src/components/CharacterLineup.tsx`, `src/app/page.tsx`

- [ ] **Step 1: Start dev server and test**

Run: `cd "C:/Users/G$/anime-chatbot" && rm -rf .next && npx next dev --webpack -p 3000`

Open http://localhost:3000 and verify:
1. Dark atmospheric background fills viewport
2. Particles (motes, fireflies, sakura) animate smoothly
3. All 6 characters are visible, standing across the screen
4. Mouse movement shifts parallax layers (background more, particles most)
5. Hovering a character: glow intensifies, name + level badge appears, others dim
6. Clicking a character: accent color radial wipe, navigates to chat
7. HEXXII title visible at top, smaller than before
8. Nav pill (profile, gallery, settings) works
9. BloodBat visible and interactive
10. Daily reward modal triggers on first visit
11. Mobile: characters are accessible (scroll or smaller sizes)

- [ ] **Step 2: Fix any issues found**

Common adjustments:
- Character sprite sizing (adjust `maxWidth` in CharacterLineup)
- Particle density or speed
- Parallax multipliers
- Transition timing

- [ ] **Step 3: Commit fixes**

```bash
git add -A
git commit -m "fix: visual polish for homepage scene and character lineup"
```

---

## Summary

| Task | What it builds | Files |
|------|---------------|-------|
| 1 | Background + parallax + particles + lighting | `HomepageScene.tsx` |
| 2 | Interactive character row with hover/glow | `CharacterLineup.tsx` |
| 3 | Radial accent-color wipe transition | `CharacterTransition.tsx` |
| 4 | Rewrite page.tsx to compose everything | `page.tsx` |
| 5 | Visual QA in browser | Various |
