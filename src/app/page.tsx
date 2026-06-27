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
import { AwayNotificationStack } from "@/components/AwayNotificationStack";

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
  const [totalMessages, setTotalMessages] = useState(0);
  const [daysActive, setDaysActive] = useState(0);

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
    let totalMsgs = 0;
    const uniqueDays = new Set<string>();
    for (const char of characterList) {
      try {
        const raw = localStorage.getItem(`anime-chatbot-history-${char.id}`);
        if (raw) {
          const msgs = JSON.parse(raw);
          const count = msgs.length;
          totalMsgs += count;
          if (count > maxMsgs) { maxMsgs = count; favId = char.id; }
          for (const msg of msgs) {
            if (msg.timestamp) uniqueDays.add(new Date(msg.timestamp).toDateString());
          }
        }
      } catch {}
    }
    setTotalMessages(totalMsgs);
    setDaysActive(uniqueDays.size);
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
      <AwayNotificationStack />
      {/* Full-screen animated background gradient */}
      <div className="fixed inset-0 pointer-events-none z-0" style={{
        background: "linear-gradient(135deg, rgba(244,114,182,0.12), rgba(229,57,53,0.12), rgba(167,139,250,0.12), rgba(251,146,60,0.12), rgba(123,31,162,0.12))",
        backgroundSize: "400% 400%",
        animation: "bgGradientShift 30s ease infinite",
      }} />

      {/* Vignette overlay */}
      <div className="fixed inset-0 pointer-events-none z-[1]" style={{
        background: "radial-gradient(ellipse at center, transparent 40%, var(--color-vignette-outer) 100%)",
      }} />
      {/* Nav bar */}
      <div className="absolute top-4 right-4 z-30 flex items-center gap-1.5 px-2 py-1.5 rounded-full" style={{ background: "var(--color-overlay)", backdropFilter: "blur(12px)", border: "1px solid var(--color-card-border)" }}>
        <ThemeToggle />
        <LanguageToggle />
        <Link
          href="/profile"
          className="text-text hover:opacity-70 transition-all p-1.5 rounded-lg hover:bg-white/5"
          title="Profile"
        >
          <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="5" r="3" stroke="currentColor" strokeWidth="1.2" />
            <path d="M2 14c0-2.5 2.5-4.5 6-4.5s6 2 6 4.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
        </Link>
        <Link
          href="/gallery"
          className="text-text hover:opacity-70 transition-all p-1.5 rounded-lg hover:bg-white/5"
          title="Gallery"
        >
          <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
            <rect x="1.5" y="2.5" width="5" height="5" rx="0.8" stroke="currentColor" strokeWidth="1.2" />
            <rect x="9.5" y="2.5" width="5" height="5" rx="0.8" stroke="currentColor" strokeWidth="1.2" />
            <rect x="1.5" y="9.5" width="5" height="5" rx="0.8" stroke="currentColor" strokeWidth="1.2" />
            <rect x="9.5" y="9.5" width="5" height="5" rx="0.8" stroke="currentColor" strokeWidth="1.2" />
          </svg>
        </Link>
        <Link
          href="/settings"
          className="text-text hover:opacity-70 transition-all p-1.5 rounded-lg hover:bg-white/5"
          title="Settings"
        >
          <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
            <path d="M6.86 1.45a1.2 1.2 0 0 1 2.28 0l.27.82a1.2 1.2 0 0 0 1.52.74l.82-.27a1.2 1.2 0 0 1 1.61 1.61l-.27.82a1.2 1.2 0 0 0 .74 1.52l.82.27a1.2 1.2 0 0 1 0 2.28l-.82.27a1.2 1.2 0 0 0-.74 1.52l.27.82a1.2 1.2 0 0 1-1.61 1.61l-.82-.27a1.2 1.2 0 0 0-1.52.74l-.27.82a1.2 1.2 0 0 1-2.28 0l-.27-.82a1.2 1.2 0 0 0-1.52-.74l-.82.27a1.2 1.2 0 0 1-1.61-1.61l.27-.82a1.2 1.2 0 0 0-.74-1.52l-.82-.27a1.2 1.2 0 0 1 0-2.28l.82-.27a1.2 1.2 0 0 0 .74-1.52l-.27-.82A1.2 1.2 0 0 1 4.25 1.9l.82.27a1.2 1.2 0 0 0 1.52-.74l.27-.82Z" stroke="currentColor" strokeWidth="1.2" />
            <circle cx="8" cy="8" r="2.2" stroke="currentColor" strokeWidth="1.2" />
          </svg>
        </Link>
      </div>

      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl" style={{ background: "#f472b6", opacity: 0.08 }} />
        <div className="absolute top-1/3 right-1/4 w-96 h-96 rounded-full blur-3xl" style={{ background: "#fb923c", opacity: 0.08 }} />
        <div className="absolute bottom-1/4 left-1/2 w-96 h-96 rounded-full blur-3xl" style={{ background: "#a78bfa", opacity: 0.08 }} />
        <div className="absolute top-1/2 right-1/3 w-96 h-96 rounded-full blur-3xl" style={{ background: "#e53935", opacity: 0.08 }} />
        <div className="absolute bottom-1/3 left-1/4 w-96 h-96 rounded-full blur-3xl" style={{ background: "#7b1fa2", opacity: 0.08 }} />
      </div>

      {/* Title */}
      <div className="text-center relative z-10 animate-[fadeIn_0.6s_ease-out]">
        <h1
          className="text-4xl sm:text-6xl md:text-7xl font-light tracking-[0.3em] uppercase bg-clip-text text-transparent mb-2"
          style={{ backgroundImage: "linear-gradient(to right, #f472b6, #e53935, #fb923c, #a78bfa, #7b1fa2)" }}
        >
          HEXXII
        </h1>
        <p className="text-text-secondary text-sm tracking-wide inline-flex items-center justify-center gap-2 mb-1">
          <img
            src="/sprites/hexx/neutral.png"
            alt="Hexx"
            className="inline-block rounded-full"
            style={{ width: 40, height: 40, objectFit: "cover", filter: "drop-shadow(0 0 6px rgba(229,57,53,0.4))" }}
            draggable={false}
          />
          <span className="typewriter-text" style={{
            overflow: "hidden",
            borderRight: "2px solid rgba(244,114,182,0.6)",
            whiteSpace: "nowrap",
            width: 0,
            animation: "typewriter 2s steps(22) 0.8s forwards, blinkCaret 0.7s step-end 0.8s 4",
          }}>Choose Your Companion</span>
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

        {/* Quick stats */}
        {totalMessages > 0 && (
          <div className="flex items-center justify-center gap-4 mt-4">
            <span className="text-[11px] tracking-wide text-text-secondary" style={{ opacity: 0.6 }}>
              <span style={{ color: "#f472b6" }}>{totalMessages.toLocaleString()}</span> messages
            </span>
            <span className="text-text-secondary" style={{ opacity: 0.2 }}>|</span>
            <span className="text-[11px] tracking-wide text-text-secondary" style={{ opacity: 0.6 }}>
              <span style={{ color: "#a78bfa" }}>{daysActive}</span> {daysActive === 1 ? "day" : "days"} active
            </span>
          </div>
        )}
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {[
          { left: "10%", top: "15%", size: 3, delay: "0s", dur: "8s", color: "#f472b6", star: false },
          { left: "85%", top: "20%", size: 2, delay: "1.5s", dur: "10s", color: "#e53935", star: true },
          { left: "25%", top: "70%", size: 5, delay: "3s", dur: "9s", color: "#fb923c", star: false },
          { left: "70%", top: "80%", size: 2, delay: "0.5s", dur: "11s", color: "#a78bfa", star: false },
          { left: "50%", top: "40%", size: 4, delay: "2s", dur: "7s", color: "#7b1fa2", star: true },
          { left: "90%", top: "55%", size: 3, delay: "4s", dur: "12s", color: "#f472b6", star: false },
          { left: "15%", top: "45%", size: 6, delay: "1s", dur: "9s", color: "#e53935", star: false },
          { left: "40%", top: "10%", size: 2, delay: "2.5s", dur: "10s", color: "#fb923c", star: true },
          { left: "60%", top: "60%", size: 4, delay: "3.5s", dur: "8s", color: "#a78bfa", star: false },
          { left: "5%", top: "85%", size: 3, delay: "1s", dur: "11s", color: "#7b1fa2", star: false },
          { left: "75%", top: "35%", size: 5, delay: "0.5s", dur: "9s", color: "#f472b6", star: true },
          { left: "35%", top: "90%", size: 2, delay: "4.5s", dur: "10s", color: "#e53935", star: false },
          { left: "20%", top: "30%", size: 3, delay: "2s", dur: "11s", color: "#a78bfa", star: true },
          { left: "80%", top: "45%", size: 6, delay: "0.8s", dur: "8s", color: "#7b1fa2", star: false },
          { left: "55%", top: "15%", size: 2, delay: "3.2s", dur: "10s", color: "#f472b6", star: false },
          { left: "30%", top: "55%", size: 4, delay: "1.8s", dur: "9s", color: "#fb923c", star: true },
          { left: "95%", top: "75%", size: 3, delay: "4.2s", dur: "12s", color: "#e53935", star: false },
          { left: "45%", top: "85%", size: 5, delay: "0.3s", dur: "7s", color: "#a78bfa", star: true },
          { left: "65%", top: "25%", size: 2, delay: "2.8s", dur: "11s", color: "#7b1fa2", star: false },
          { left: "12%", top: "65%", size: 4, delay: "1.5s", dur: "8s", color: "#fb923c", star: true },
        ].map((p, i) => (
          <div
            key={i}
            className={p.star ? "absolute" : "absolute rounded-full"}
            style={{
              left: p.left,
              top: p.top,
              width: p.star ? 0 : p.size,
              height: p.star ? 0 : p.size,
              background: p.star ? "transparent" : p.color,
              ...(p.star ? {
                boxShadow: `0 -${p.size}px 0 0 ${p.color}, ${p.size}px 0 0 0 ${p.color}, 0 ${p.size}px 0 0 ${p.color}, -${p.size}px 0 0 0 ${p.color}`,
              } : {}),
              animation: `floatParticle ${p.dur} ease-in-out ${p.delay} infinite`,
            }}
          />
        ))}
        <style>{`
          @keyframes floatParticle {
            0%, 100% { transform: translateY(0px) translateX(0px); opacity: 0.15; }
            25% { transform: translateY(-20px) translateX(8px); opacity: 0.4; }
            50% { transform: translateY(-35px) translateX(-5px); opacity: 0.25; }
            75% { transform: translateY(-15px) translateX(12px); opacity: 0.4; }
          }
        `}</style>
      </div>

      {/* Glowing divider */}
      <div className="relative z-10 w-full max-w-md mx-auto" style={{
        height: 2,
        background: "linear-gradient(90deg, transparent, #f472b6, #e53935, #a78bfa, #fb923c, #7b1fa2, transparent)",
        backgroundSize: "200% 100%",
        animation: "dividerPulse 4s ease-in-out infinite",
        borderRadius: 1,
        boxShadow: "0 0 12px rgba(244,114,182,0.4), 0 0 24px rgba(167,139,250,0.2)",
      }} />

      {/* Character cards */}
      <div className="flex flex-wrap justify-center gap-5 md:gap-8 max-w-5xl w-full relative z-10" style={{
        perspective: "1200px",
        perspectiveOrigin: "center 40%",
        transform: "translateZ(0)",
      }}>
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

      {/* Scroll hint arrow - hidden on short viewports via CSS */}
      <div className="scroll-hint-arrow fixed bottom-6 left-1/2 z-20" style={{
        transform: "translateX(-50%)",
        animation: "scrollBounce 2s ease-in-out infinite",
        opacity: 0.5,
      }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(244,114,182,0.7)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>

      {/* Global cinematic keyframes */}
      <style>{`
        @keyframes bgGradientShift {
          0% { background-position: 0% 50%; }
          25% { background-position: 100% 0%; }
          50% { background-position: 100% 100%; }
          75% { background-position: 0% 100%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes typewriter {
          from { width: 0; }
          to { width: 100%; }
        }
        @keyframes blinkCaret {
          0%, 100% { border-color: rgba(244,114,182,0.6); }
          50% { border-color: transparent; }
        }
        @keyframes dividerPulse {
          0%, 100% { background-position: 0% 50%; opacity: 0.6; }
          50% { background-position: 100% 50%; opacity: 1; }
        }
        @keyframes scrollBounce {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50% { transform: translateX(-50%) translateY(8px); }
        }
        @media (max-height: 700px) {
          .scroll-hint-arrow { display: none !important; }
        }
      `}</style>
    </main>
  );
}
