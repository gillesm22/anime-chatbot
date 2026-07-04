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
