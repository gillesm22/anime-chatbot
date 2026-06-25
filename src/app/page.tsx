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
import { getHeroConfig, HERO_CLASS_MAP, isFirstRun } from "@/lib/heroAvatar";
import { BloodBat } from "@/components/BloodBat";
import { OnboardingOverlay } from "@/components/OnboardingOverlay";

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
  const [favoriteId, setFavoriteId] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(() => isFirstRun());

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
      <div className="absolute top-4 right-4 z-30 flex items-center gap-3 px-3 py-2 rounded-xl" style={{ background: "var(--color-surface, rgba(13,13,18,0.5))", backdropFilter: "blur(8px)" }}>
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
          style={{ backgroundImage: "linear-gradient(to right, #f472b6, #e53935, #fb923c, #a78bfa, #7b1fa2)" }}
        >
          Choose Your Companion
        </h1>
        <p className="text-text-secondary text-sm tracking-wide">
          Five voices. Five worlds. One conversation away.
        </p>
        {(() => {
          if (isFirstRun()) {
            return (
              <Link
                href="/settings"
                className="inline-block mt-3 px-4 py-1.5 rounded-full text-xs tracking-wide border border-white/10 text-text-secondary hover:text-text hover:border-white/20 transition-all"
              >
                Choose your identity
              </Link>
            );
          }
          const hero = getHeroConfig();
          const classDef = HERO_CLASS_MAP[hero.classId];
          return (
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
                style={{ width: 24, height: 24, border: `1.5px solid ${classDef.theme.accent}60`, boxShadow: `0 0 8px ${classDef.theme.glow}` }}
                draggable={false}
              />
              <span>{hero.name} · {classDef.title}</span>
            </Link>
          );
        })()}
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {[
          { left: "10%", top: "15%", size: 3, delay: "0s", dur: "8s" },
          { left: "85%", top: "20%", size: 2, delay: "1.5s", dur: "10s" },
          { left: "25%", top: "70%", size: 4, delay: "3s", dur: "9s" },
          { left: "70%", top: "80%", size: 2, delay: "0.5s", dur: "11s" },
          { left: "50%", top: "40%", size: 3, delay: "2s", dur: "7s" },
          { left: "90%", top: "55%", size: 2, delay: "4s", dur: "12s" },
          { left: "15%", top: "45%", size: 3, delay: "1s", dur: "9s" },
        ].map((p, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              left: p.left,
              top: p.top,
              width: p.size,
              height: p.size,
              background: "rgba(255,255,255,0.25)",
              animation: `floatParticle ${p.dur} ease-in-out ${p.delay} infinite`,
            }}
          />
        ))}
        <style>{`
          @keyframes floatParticle {
            0%, 100% { transform: translateY(0px) translateX(0px); opacity: 0.2; }
            25% { transform: translateY(-20px) translateX(8px); opacity: 0.5; }
            50% { transform: translateY(-35px) translateX(-5px); opacity: 0.3; }
            75% { transform: translateY(-15px) translateX(12px); opacity: 0.5; }
          }
        `}</style>
      </div>

      {/* Character cards */}
      <div className="flex flex-wrap justify-center gap-5 md:gap-8 max-w-5xl w-full relative z-10">
        {characterList.map((character, i) => (
          <div
            key={character.id}
            className="w-full sm:w-[calc(50%-10px)] lg:w-[calc(33.333%-22px)]"
            style={{ opacity: 0, animation: `cardEntrance 0.5s ease-out ${i * 0.12}s forwards` }}
          >
            <CharacterCard character={character} index={i} isFavorite={character.id === favoriteId} />
          </div>
        ))}
      </div>

      <div className="relative z-10">
        <BloodBat accentColor="#b71c1c" landingMode />
      </div>

      {showOnboarding && (
        <OnboardingOverlay onComplete={() => setShowOnboarding(false)} />
      )}

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
