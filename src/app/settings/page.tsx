"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { PageTransition } from "@/components/PageTransition";
import { exportAsText, exportAsJSON } from "@/lib/exportChat";
import type { ChatMessage } from "@/lib/chat/types";
import { getHeroConfig, saveHeroConfig, selectHeroClass, HERO_CLASSES, type HeroClassId } from "@/lib/heroAvatar";

const CHARACTER_IDS = ["arisu", "marin", "nao", "kurisu", "merrick"] as const;
const CHARACTER_LABELS: Record<string, { name: string; color: string }> = {
  arisu: { name: "Arisu", color: "#f472b6" },
  marin: { name: "Marin", color: "#fb923c" },
  nao: { name: "Nao", color: "#a78bfa" },
  kurisu: { name: "Kurisu", color: "#e53935" },
  merrick: { name: "Merrick", color: "#7b1fa2" },
};

const LS_PREFIX = "anime-chatbot-";

export default function SettingsPage() {
  const router = useRouter();
  const [textSpeed, setTextSpeed] = useState(12);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [responseLength, setResponseLength] = useState<"short" | "medium" | "long">("medium");
  const [aiProvider, setAiProvider] = useState("gpt-4o");
  const [cleared, setCleared] = useState<string | null>(null);
  const [heroName, setHeroName] = useState("");
  const [heroClassId, setHeroClassId] = useState<HeroClassId>("knight");
  const [heroSaved, setHeroSaved] = useState(false);

  // Load hero config on mount
  useEffect(() => {
    const hero = getHeroConfig();
    setHeroName(hero.name);
    setHeroClassId(hero.classId);
  }, []);

  // Load saved settings on mount
  useEffect(() => {
    const savedSpeed = localStorage.getItem(`${LS_PREFIX}text-speed`);
    if (savedSpeed) setTextSpeed(Number(savedSpeed));

    const savedSound = localStorage.getItem(`${LS_PREFIX}sound-enabled`);
    if (savedSound) setSoundEnabled(savedSound === "true");

    const savedLength = localStorage.getItem(`${LS_PREFIX}response-length`);
    if (savedLength) setResponseLength(savedLength as "short" | "medium" | "long");

    const savedProvider = localStorage.getItem(`${LS_PREFIX}ai-provider`);
    if (savedProvider) setAiProvider(savedProvider);
  }, []);

  const handleSpeedChange = (value: number) => {
    setTextSpeed(value);
    localStorage.setItem(`${LS_PREFIX}text-speed`, String(value));
  };

  const handleLengthChange = (value: "short" | "medium" | "long") => {
    setResponseLength(value);
    localStorage.setItem(`${LS_PREFIX}response-length`, value);
  };

  const handleProviderChange = (value: string) => {
    setAiProvider(value);
    localStorage.setItem(`${LS_PREFIX}ai-provider`, value);
  };

  const handleSoundToggle = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    localStorage.setItem(`${LS_PREFIX}sound-enabled`, String(next));
  };

  const handleClassSelect = (classId: HeroClassId) => {
    setHeroClassId(classId);
    selectHeroClass(classId);
    saveHeroConfig({ name: heroName });
    setHeroSaved(true);
    setTimeout(() => setHeroSaved(false), 1500);
  };

  const handleHeroNameChange = (name: string) => {
    setHeroName(name);
    saveHeroConfig({ name });
  };

  const clearCharacterHistory = (charId: string) => {
    localStorage.removeItem(`${LS_PREFIX}history-${charId}`);
    setCleared(charId);
    setTimeout(() => setCleared(null), 1500);
  };

  const clearAllData = () => {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(LS_PREFIX)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));

    // Reset local state
    setTextSpeed(12);
    setSoundEnabled(false);
    setCleared("all");
    setTimeout(() => setCleared(null), 1500);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.07 },
    },
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
              <path
                d="M10 12L6 8L10 4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Back
          </button>
          <div className="flex items-center gap-4">
            <Link
              href="/profile"
              className="text-text-secondary hover:text-text transition-colors text-xs tracking-wide uppercase"
            >
              Profile
            </Link>
            <Link
              href="/gallery"
              className="text-text-secondary hover:text-text transition-colors text-xs tracking-wide uppercase"
            >
              Gallery
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
          {/* Title */}
          <motion.h1
            variants={itemVariants}
            className="text-2xl font-light tracking-widest uppercase text-text mb-8"
          >
            Settings
          </motion.h1>

          {/* Hero Identity */}
          <motion.section variants={itemVariants} className="mb-8">
            <h2 className="text-sm font-medium tracking-wide uppercase text-text-secondary mb-3">
              Hero Identity
            </h2>
            <div
              className="rounded-2xl p-5 space-y-5"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <div>
                <label className="text-xs text-text-secondary block mb-2">Your Name</label>
                <input
                  type="text"
                  value={heroName}
                  onChange={(e) => handleHeroNameChange(e.target.value)}
                  placeholder="Enter your name..."
                  maxLength={24}
                  className="w-full px-4 py-2.5 rounded-xl text-sm text-text placeholder:text-text-secondary/40 outline-none transition-colors"
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                />
              </div>
              <div>
                <label className="text-xs text-text-secondary block mb-2">Choose Your Class</label>
                <div className="grid grid-cols-3 gap-2">
                  {HERO_CLASSES.map((cls) => {
                    const selected = heroClassId === cls.id;
                    return (
                      <button
                        key={cls.id}
                        onClick={() => handleClassSelect(cls.id)}
                        className="relative flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl transition-all duration-200"
                        style={{
                          background: selected ? `${cls.theme.accent}25` : "rgba(255,255,255,0.04)",
                          border: `1.5px solid ${selected ? `${cls.theme.accent}60` : "rgba(255,255,255,0.06)"}`,
                          boxShadow: selected ? `0 0 20px ${cls.theme.glow}` : "none",
                        }}
                      >
                        <span className="text-xl">{cls.icon}</span>
                        <span
                          className="text-xs font-medium"
                          style={{ color: selected ? cls.theme.accent : "rgba(255,255,255,0.5)" }}
                        >
                          {cls.label}
                        </span>
                        <span
                          className="text-[9px] opacity-60"
                          style={{ color: selected ? cls.theme.accent : "rgba(255,255,255,0.35)" }}
                        >
                          {cls.title}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
              {(() => {
                const cls = HERO_CLASSES.find((c) => c.id === heroClassId);
                if (!cls) return null;
                return (
                  <div
                    className="rounded-xl p-4 flex items-start gap-4"
                    style={{
                      background: `linear-gradient(135deg, ${cls.theme.accent}12, ${cls.theme.accent}05)`,
                      border: `1px solid ${cls.theme.accent}20`,
                    }}
                  >
                    <div
                      className="w-12 h-12 rounded-full flex-shrink-0 overflow-hidden"
                      style={{
                        background: `${cls.theme.accent}30`,
                        border: `2px solid ${cls.theme.accent}50`,
                        boxShadow: `0 0 12px ${cls.theme.glow}`,
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={cls.avatarPath}
                        alt={cls.label}
                        width={48}
                        height={48}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium" style={{ color: cls.theme.accent }}>
                        {heroName || "Hero"} · {cls.title}
                      </p>
                      <p className="text-[11px] text-text-secondary mt-1 leading-relaxed line-clamp-3">
                        {cls.appearance.slice(0, 150)}...
                      </p>
                    </div>
                  </div>
                );
              })()}
              {heroSaved && (
                <p className="text-xs text-center" style={{ color: "#4ade80" }}>
                  Identity saved
                </p>
              )}
            </div>
          </motion.section>

          {/* Text Speed */}
          <motion.section variants={itemVariants} className="mb-8">
            <h2 className="text-sm font-medium tracking-wide uppercase text-text-secondary mb-3">
              Text Speed
            </h2>
            <div
              className="rounded-2xl p-5"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-text-secondary">Slow</span>
                <span className="text-sm text-text font-medium">{textSpeed}ms</span>
                <span className="text-xs text-text-secondary">Fast</span>
              </div>
              <input
                type="range"
                min={5}
                max={50}
                value={textSpeed}
                onChange={(e) => handleSpeedChange(Number(e.target.value))}
                className="w-full accent-[#a78bfa] h-1 bg-surface rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #a78bfa ${((textSpeed - 5) / 45) * 100}%, rgba(255,255,255,0.08) ${((textSpeed - 5) / 45) * 100}%)`,
                }}
              />
              <p className="text-xs text-text-secondary mt-2 opacity-60">
                Controls the typing speed in the dialogue box. Lower is faster.
              </p>
            </div>
          </motion.section>

          {/* Response Length */}
          <motion.section variants={itemVariants} className="mb-8">
            <h2 className="text-sm font-medium tracking-wide uppercase text-text-secondary mb-3">
              Response Length
            </h2>
            <div
              className="rounded-2xl p-5"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <div className="flex gap-2">
                {(["short", "medium", "long"] as const).map((option) => (
                  <button
                    key={option}
                    onClick={() => handleLengthChange(option)}
                    className="flex-1 py-2 rounded-full text-sm font-medium capitalize transition-colors"
                    style={{
                      background: responseLength === option ? "rgba(167, 139, 250, 0.25)" : "rgba(255,255,255,0.06)",
                      color: responseLength === option ? "#a78bfa" : "rgba(255,255,255,0.5)",
                      border: `1.5px solid ${responseLength === option ? "rgba(167, 139, 250, 0.4)" : "transparent"}`,
                    }}
                  >
                    {option}
                  </button>
                ))}
              </div>
              <p className="text-xs text-text-secondary mt-2 opacity-60">
                Controls how long character responses will be.
              </p>
            </div>
          </motion.section>

          {/* AI Provider */}
          <motion.section variants={itemVariants} className="mb-8">
            <h2 className="text-sm font-medium tracking-wide uppercase text-text-secondary mb-3">
              AI Provider
            </h2>
            <div
              className="rounded-2xl p-5"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <div className="flex gap-2">
                {([
                  { value: "gpt-4o", label: "GPT-4o" },
                  { value: "gpt-4o-mini", label: "GPT-4o-mini" },
                  { value: "gpt-3.5-turbo", label: "GPT-3.5" },
                ] as const).map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleProviderChange(option.value)}
                    className="flex-1 py-2 rounded-full text-sm font-medium transition-colors"
                    style={{
                      background: aiProvider === option.value ? "rgba(167, 139, 250, 0.25)" : "rgba(255,255,255,0.06)",
                      color: aiProvider === option.value ? "#a78bfa" : "rgba(255,255,255,0.5)",
                      border: `1.5px solid ${aiProvider === option.value ? "rgba(167, 139, 250, 0.4)" : "transparent"}`,
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <p className="text-xs text-text-secondary mt-2 opacity-60">
                Choose which AI model powers character responses.
              </p>
            </div>
          </motion.section>

          {/* Sound */}
          <motion.section variants={itemVariants} className="mb-8">
            <h2 className="text-sm font-medium tracking-wide uppercase text-text-secondary mb-3">
              Sound
            </h2>
            <div
              className="rounded-2xl p-5 flex items-center justify-between"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <div>
                <p className="text-sm text-text">Sound Effects</p>
                <p className="text-xs text-text-secondary mt-0.5 opacity-60">
                  Enable typing and UI sounds
                </p>
              </div>
              <button
                onClick={handleSoundToggle}
                className="relative w-11 h-6 rounded-full transition-colors duration-200"
                style={{
                  backgroundColor: soundEnabled ? "rgba(167, 139, 250, 0.4)" : "rgba(255,255,255,0.1)",
                }}
              >
                <motion.div
                  className="absolute top-1 w-4 h-4 rounded-full"
                  animate={{
                    left: soundEnabled ? "calc(100% - 20px)" : "4px",
                    backgroundColor: soundEnabled ? "#a78bfa" : "rgba(255,255,255,0.3)",
                  }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              </button>
            </div>
          </motion.section>

          {/* Clear Chat History */}
          <motion.section variants={itemVariants} className="mb-8">
            <h2 className="text-sm font-medium tracking-wide uppercase text-text-secondary mb-3">
              Chat History
            </h2>
            <div
              className="rounded-2xl p-5 space-y-3"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              {CHARACTER_IDS.map((charId) => {
                const { name, color } = CHARACTER_LABELS[charId];
                const isCleared = cleared === charId;
                return (
                  <div key={charId} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: color }}
                      />
                      <span className="text-sm text-text">{name}</span>
                    </div>
                    <button
                      onClick={() => clearCharacterHistory(charId)}
                      className="text-xs px-3 py-1.5 rounded-full transition-colors"
                      style={{
                        background: isCleared ? "rgba(74,222,128,0.15)" : "rgba(255,255,255,0.06)",
                        color: isCleared ? "#4ade80" : "rgba(255,255,255,0.5)",
                      }}
                    >
                      {isCleared ? "Cleared" : "Clear"}
                    </button>
                  </div>
                );
              })}
            </div>
          </motion.section>

          {/* Export Data */}
          <motion.section variants={itemVariants} className="mb-8">
            <h2 className="text-sm font-medium tracking-wide uppercase text-text-secondary mb-3">
              Export Data
            </h2>
            <div
              className="rounded-2xl p-5 space-y-3"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <p className="text-xs text-text-secondary opacity-60 mb-3">
                Download your chat history as a text or JSON file.
              </p>
              <button
                onClick={() => {
                  for (const charId of CHARACTER_IDS) {
                    const raw = localStorage.getItem(`${LS_PREFIX}history-${charId}`);
                    if (raw) {
                      const messages: ChatMessage[] = JSON.parse(raw);
                      exportAsText(messages, CHARACTER_LABELS[charId].name);
                    }
                  }
                }}
                className="w-full py-2.5 rounded-xl text-sm font-medium transition-colors"
                style={{
                  background: "rgba(167, 139, 250, 0.1)",
                  color: "#a78bfa",
                  border: "1px solid rgba(167, 139, 250, 0.2)",
                }}
              >
                Export All Chats (Text)
              </button>
              <button
                onClick={() => {
                  for (const charId of CHARACTER_IDS) {
                    const raw = localStorage.getItem(`${LS_PREFIX}history-${charId}`);
                    if (raw) {
                      const messages: ChatMessage[] = JSON.parse(raw);
                      exportAsJSON(messages, CHARACTER_LABELS[charId].name);
                    }
                  }
                }}
                className="w-full py-2.5 rounded-xl text-sm font-medium transition-colors"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  color: "rgba(255,255,255,0.5)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                Export All Chats (JSON)
              </button>
            </div>
          </motion.section>

          {/* Danger Zone */}
          <motion.section variants={itemVariants}>
            <h2 className="text-sm font-medium tracking-wide uppercase text-text-secondary mb-3">
              Danger Zone
            </h2>
            <div
              className="rounded-2xl p-5"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(239,68,68,0.15)" }}
            >
              <p className="text-xs text-text-secondary mb-3 opacity-60">
                This will clear all settings and chat history for every character.
              </p>
              <button
                onClick={clearAllData}
                className="w-full py-2.5 rounded-xl text-sm font-medium transition-colors"
                style={{
                  background: cleared === "all" ? "rgba(74,222,128,0.15)" : "rgba(239,68,68,0.1)",
                  color: cleared === "all" ? "#4ade80" : "#ef4444",
                  border: `1px solid ${cleared === "all" ? "rgba(74,222,128,0.2)" : "rgba(239,68,68,0.2)"}`,
                }}
              >
                {cleared === "all" ? "All Data Cleared" : "Clear All Data"}
              </button>
            </div>
          </motion.section>
        </motion.div>
      </div>
    </PageTransition>
  );
}
