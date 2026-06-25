"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { PageTransition } from "@/components/PageTransition";
import { getHeroConfig, HERO_CLASS_MAP } from "@/lib/heroAvatar";
import { computePlayerStats, computePlayerLevel, type PlayerStats } from "@/lib/stats";
import { LEVELS, MILESTONES } from "@/lib/affinity";

export default function ProfilePage() {
  const router = useRouter();
  const [stats, setStats] = useState<PlayerStats | null>(null);

  useEffect(() => {
    setStats(computePlayerStats());
  }, []);

  if (!stats) {
    return (
      <PageTransition>
        <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--color-bg)" }}>
          <p className="text-text-secondary text-sm">Loading...</p>
        </div>
      </PageTransition>
    );
  }

  const hero = getHeroConfig();
  const classDef = HERO_CLASS_MAP[hero.classId];
  const playerLevel = computePlayerLevel(stats.totalAffinityPoints);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.07 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
  };

  return (
    <PageTransition>
      <div
        className="min-h-screen flex flex-col"
        style={{ background: "linear-gradient(180deg, var(--color-surface, #16161e) 0%, var(--color-bg, #0d0d12) 100%)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-text-secondary hover:text-text transition-colors text-sm"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back
          </button>
          <div className="flex items-center gap-4">
            <Link href="/gallery" className="text-text-secondary hover:text-text transition-colors text-xs tracking-wide uppercase">
              Gallery
            </Link>
            <Link href="/settings" className="text-text-secondary hover:text-text transition-colors text-xs tracking-wide uppercase">
              Settings
            </Link>
          </div>
        </div>

        {/* Content */}
        <motion.div
          className="flex-1 px-6 pb-12 max-w-lg mx-auto w-full"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Hero Card */}
          <motion.div
            variants={itemVariants}
            className="rounded-2xl p-6 mb-8 relative overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${classDef.theme.accent}18, ${classDef.theme.accent}08)`,
              border: `1px solid ${classDef.theme.accent}30`,
            }}
          >
            <div className="flex items-center gap-4 mb-4">
              <div
                className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0"
                style={{
                  border: `2px solid ${classDef.theme.accent}60`,
                  boxShadow: `0 0 16px ${classDef.theme.glow}`,
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={classDef.avatarPath}
                  alt={classDef.label}
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
              </div>
              <div>
                <h1 className="text-xl font-light tracking-wide text-text">
                  {hero.name || "Hero"}
                </h1>
                <p className="text-xs tracking-wide" style={{ color: classDef.theme.accent }}>
                  {classDef.title}
                </p>
              </div>
            </div>

            {/* Player Level Bar */}
            <div className="mt-2">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-text-secondary">Player Level {playerLevel.level}</span>
                <span className="text-text-secondary">
                  {playerLevel.pointsInLevel} / {playerLevel.pointsForNext}
                </span>
              </div>
              <div
                className="h-2 rounded-full overflow-hidden"
                style={{ background: "rgba(255,255,255,0.06)" }}
              >
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: classDef.theme.accent }}
                  initial={{ width: 0 }}
                  animate={{ width: `${playerLevel.percent}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              </div>
            </div>
          </motion.div>

          {/* Overview Stats */}
          <motion.section variants={itemVariants} className="mb-8">
            <h2 className="text-sm font-medium tracking-wide uppercase text-text-secondary mb-3">
              Overview
            </h2>
            <div
              className="rounded-2xl p-5 grid grid-cols-2 gap-4"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <StatBox label="Total Messages" value={stats.totalMessages} />
              <StatBox label="Affinity Points" value={stats.totalAffinityPoints} />
              <StatBox label="Characters Met" value={`${stats.charactersUnlocked}/${stats.totalCharacters}`} />
              <StatBox label="Average Level" value={stats.averageLevel} />
              <StatBox label="Current Streak" value={`${stats.currentStreak}d`} />
              <StatBox label="Longest Streak" value={`${stats.longestStreak}d`} />
              <StatBox label="Milestones" value={stats.totalMilestones} />
              <StatBox label="Outfits Unlocked" value={stats.totalOutfits} />
            </div>
          </motion.section>

          {/* Favorite Character */}
          {stats.favoriteCharacter && (
            <motion.section variants={itemVariants} className="mb-8">
              <h2 className="text-sm font-medium tracking-wide uppercase text-text-secondary mb-3">
                Favorite Companion
              </h2>
              <div
                className="rounded-2xl p-5 flex items-center gap-4"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
                  style={{ background: `${stats.characterBreakdown.find((c) => c.id === stats.favoriteCharacter!.id)?.color ?? "#888"}25` }}
                >
                  &#9829;
                </div>
                <div>
                  <p className="text-sm text-text font-medium">{stats.favoriteCharacter.name}</p>
                  <p className="text-xs text-text-secondary">{stats.favoriteCharacter.messages} messages exchanged</p>
                </div>
              </div>
            </motion.section>
          )}

          {/* Per-Character Breakdown */}
          <motion.section variants={itemVariants} className="mb-8">
            <h2 className="text-sm font-medium tracking-wide uppercase text-text-secondary mb-3">
              Character Bonds
            </h2>
            <div
              className="rounded-2xl p-5 space-y-4"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              {stats.characterBreakdown.map((char) => {
                const progress = char.nextThreshold > 0
                  ? Math.min(100, Math.round((char.points / char.nextThreshold) * 100))
                  : 100;

                return (
                  <div key={char.id}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: char.color }}
                        />
                        <span className="text-sm text-text">{char.name}</span>
                      </div>
                      <span className="text-xs text-text-secondary">
                        Lv.{char.level} {char.levelName}
                      </span>
                    </div>
                    <div
                      className="h-1.5 rounded-full overflow-hidden"
                      style={{ background: "rgba(255,255,255,0.06)" }}
                    >
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: char.color }}
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                      />
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-[10px] text-text-secondary">
                      <span>{char.messages} msgs</span>
                      <span>{char.milestones} milestones</span>
                      <span>{char.outfits} outfits</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.section>

          {/* Milestones List */}
          <motion.section variants={itemVariants}>
            <h2 className="text-sm font-medium tracking-wide uppercase text-text-secondary mb-3">
              Milestones
            </h2>
            <div
              className="rounded-2xl p-5 space-y-2"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              {MILESTONES.map((m) => {
                const earned = stats.characterBreakdown.some((c) => {
                  // Check if any character has this milestone
                  try {
                    const raw = typeof window !== "undefined"
                      ? localStorage.getItem(`anime-chatbot-affinity-${c.id}`)
                      : null;
                    if (!raw) return false;
                    const data = JSON.parse(raw);
                    return data.milestones?.includes(m.id);
                  } catch { return false; }
                });

                return (
                  <div
                    key={m.id}
                    className="flex items-center gap-3 py-1"
                    style={{ opacity: earned ? 1 : 0.35 }}
                  >
                    <span className="text-sm">{earned ? "\u2605" : "\u2606"}</span>
                    <span className="text-xs text-text">{m.label}</span>
                  </div>
                );
              })}
            </div>
          </motion.section>
        </motion.div>
      </div>
    </PageTransition>
  );
}

function StatBox({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="text-center">
      <p className="text-lg font-light text-text">{value}</p>
      <p className="text-[10px] text-text-secondary tracking-wide uppercase mt-0.5">{label}</p>
    </div>
  );
}
