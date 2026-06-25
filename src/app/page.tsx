"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { characters } from "@/lib/characters";
import { CharacterCard } from "@/components/CharacterCard";
import { startAmbientMusic, stopAmbientMusic } from "@/lib/ambient";
import { canClaimReward, claimReward, type DailyReward } from "@/lib/dailyRewards";
import { addAffinityPoints } from "@/lib/affinity";
import { DailyRewardModal } from "@/components/DailyRewardModal";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageToggle } from "@/components/LanguageToggle";

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

  const [showReward, setShowReward] = useState(false);
  const [pendingReward, setPendingReward] = useState<{ reward: DailyReward; streak: number } | null>(null);

  useEffect(() => {
    if (canClaimReward()) {
      const { reward, newStreak } = claimReward();
      setPendingReward({ reward, streak: newStreak });
      setShowReward(true);
      // Apply affinity bonus to all characters
      for (const char of characterList) {
        addAffinityPoints(char.id, { type: "daily_visit" });
      }
    }
  }, []);

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

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-8 md:px-8 md:py-12 gap-6 md:gap-10 relative overflow-hidden">
      {/* Gallery, Settings & Theme */}
      <div className="absolute top-4 right-4 z-30 flex items-center gap-3 px-3 py-2 rounded-xl" style={{ background: "rgba(13,13,18,0.5)", backdropFilter: "blur(8px)" }}>
        <ThemeToggle />
        <LanguageToggle />
        <Link
          href="/gallery"
          className="text-text hover:opacity-70 transition-opacity text-xs tracking-wide uppercase font-medium"
        >
          Gallery
        </Link>
        <Link
          href="/settings"
          className="text-text hover:opacity-70 transition-opacity"
        >
          <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
            <path d="M6.86 1.45a1.2 1.2 0 0 1 2.28 0l.27.82a1.2 1.2 0 0 0 1.52.74l.82-.27a1.2 1.2 0 0 1 1.61 1.61l-.27.82a1.2 1.2 0 0 0 .74 1.52l.82.27a1.2 1.2 0 0 1 0 2.28l-.82.27a1.2 1.2 0 0 0-.74 1.52l.27.82a1.2 1.2 0 0 1-1.61 1.61l-.82-.27a1.2 1.2 0 0 0-1.52.74l-.27.82a1.2 1.2 0 0 1-2.28 0l-.27-.82a1.2 1.2 0 0 0-1.52-.74l-.82.27a1.2 1.2 0 0 1-1.61-1.61l.27-.82a1.2 1.2 0 0 0-.74-1.52l-.82-.27a1.2 1.2 0 0 1 0-2.28l.82-.27a1.2 1.2 0 0 0 .74-1.52l-.27-.82A1.2 1.2 0 0 1 4.25 1.9l.82.27a1.2 1.2 0 0 0 1.52-.74l.27-.82Z" stroke="currentColor" strokeWidth="1.2" />
            <circle cx="8" cy="8" r="2.2" stroke="currentColor" strokeWidth="1.2" />
          </svg>
        </Link>
      </div>

      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-5" style={{ background: "#f472b6" }} />
        <div className="absolute top-1/3 right-1/4 w-96 h-96 rounded-full blur-3xl opacity-5" style={{ background: "#fb923c" }} />
        <div className="absolute bottom-1/4 left-1/2 w-96 h-96 rounded-full blur-3xl opacity-5" style={{ background: "#a78bfa" }} />
        <div className="absolute top-1/2 right-1/3 w-96 h-96 rounded-full blur-3xl opacity-5" style={{ background: "#e53935" }} />
        <div className="absolute bottom-1/3 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-5" style={{ background: "#7b1fa2" }} />
      </div>

      {/* Title */}
      <div className="text-center relative z-10 animate-[fadeIn_0.6s_ease-out]">
        <h1
          className="text-2xl sm:text-4xl md:text-5xl font-light tracking-widest uppercase bg-clip-text text-transparent mb-3"
          style={{ backgroundImage: "linear-gradient(to right, #f472b6, #fb923c, #a78bfa)" }}
        >
          Choose Your Companion
        </h1>
        <p className="text-text-secondary text-sm tracking-wide">
          Each with their own personality, style, and attitude
        </p>
      </div>

      {/* Character cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-8 max-w-5xl w-full relative z-10">
        {characterList.map((character, i) => (
          <CharacterCard key={character.id} character={character} index={i} />
        ))}
      </div>

      <p className="text-text-secondary text-xs tracking-wider relative z-10 opacity-30">
        Click to start chatting
      </p>

      {showReward && pendingReward && (
        <DailyRewardModal
          reward={pendingReward.reward}
          streak={pendingReward.streak}
          onClaim={() => setShowReward(false)}
        />
      )}
    </main>
  );
}
