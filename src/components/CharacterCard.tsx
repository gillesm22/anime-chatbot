"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Character } from "@/lib/characters/types";
import { getAffinity, type AffinityData } from "@/lib/affinity";
import { AffinityBadge } from "./AffinityBadge";
import { StreakBadge } from "./StreakBadge";

const PREVIEW_EXPRESSIONS = ["happy", "smirk", "teasing", "excited"] as const;

interface CharacterCardProps {
  character: Character;
  index: number;
  isFavorite?: boolean;
}

export function CharacterCard({ character, index, isFavorite }: CharacterCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [hoverExpr, setHoverExpr] = useState<string | null>(null);
  const [affinity, setAffinity] = useState<AffinityData | null>(null);
  const [lastSeen, setLastSeen] = useState<string | null>(null);
  const [msgCount, setMsgCount] = useState(0);
  const [isNew, setIsNew] = useState(false);
  const router = useRouter();

  const handleNavigate = () => {
    if (isExiting) return;
    setIsExiting(true);
    setTimeout(() => router.push(`/chat/${character.id}`), 300);
  };

  useEffect(() => {
    setAffinity(getAffinity(character.id));
    try {
      const raw = localStorage.getItem(`anime-chatbot-history-${character.id}`);
      if (raw) {
        const msgs = JSON.parse(raw);
        setMsgCount(msgs.length);
        if (msgs.length > 0) {
          const lastTs = msgs[msgs.length - 1].timestamp;
          const diff = Date.now() - lastTs;
          const mins = Math.floor(diff / 60000);
          if (mins < 1) setLastSeen("Just now");
          else if (mins < 60) setLastSeen(`${mins}m ago`);
          else if (mins < 1440) setLastSeen(`${Math.floor(mins / 60)}h ago`);
          else setLastSeen(`${Math.floor(mins / 1440)}d ago`);
        }
      } else {
        setIsNew(true);
      }
    } catch {}
  }, [character.id]);

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Chat with ${character.name}`}
      onClick={handleNavigate}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleNavigate(); } }}
      onMouseEnter={() => {
        setIsHovered(true);
        setHoverExpr(PREVIEW_EXPRESSIONS[Math.floor(Math.random() * PREVIEW_EXPRESSIONS.length)]);
      }}
      onMouseLeave={() => {
        setIsHovered(false);
        setHoverExpr(null);
      }}
      onFocus={() => setIsHovered(true)}
      onBlur={() => { setIsHovered(false); setHoverExpr(null); }}
      className="relative flex flex-col items-center rounded-2xl overflow-hidden cursor-pointer group min-h-[360px] sm:min-h-[480px] outline-none focus-visible:ring-2 focus-visible:ring-white/30"
      style={{
        background: `linear-gradient(180deg, ${character.theme.tint} 0%, var(--color-bg, #0d0d12) 100%)`,
        border: `1px solid ${character.theme.accent}${isFavorite ? "60" : "30"}`,
        transform: isExiting
          ? "scale(0.95)"
          : isHovered ? "translateY(-12px) scale(1.03)" : "translateY(0) scale(1)",
        opacity: isExiting ? 0 : 1,
        transition: "transform 300ms ease, opacity 300ms ease",
      }}
    >
      {/* Glow effect on hover */}
      <div
        className="absolute inset-0 transition-opacity duration-500 pointer-events-none"
        style={{
          boxShadow: `inset 0 0 80px ${character.theme.glow}, 0 0 40px ${character.theme.glow}`,
          opacity: isHovered ? 1 : isFavorite ? 0.3 : 0,
        }}
      />

      {/* Accent line at top */}
      <div
        className="absolute top-0 left-0 right-0 h-0.5"
        style={{
          background: `linear-gradient(90deg, transparent, ${character.theme.accent}, transparent)`,
          opacity: isHovered ? 1 : isFavorite ? 0.6 : 0.3,
          transition: "opacity 300ms ease",
        }}
      />

      {/* Character image */}
      <div className="relative w-full flex-1 flex items-end justify-center overflow-hidden pt-6">
        {/* NEW badge */}
        {isNew && (
          <span
            className="absolute top-3 right-3 z-30 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase"
            style={{
              background: `linear-gradient(135deg, ${character.theme.accent}, ${character.theme.accent}cc)`,
              color: "#fff",
              boxShadow: `0 0 12px ${character.theme.glow}`,
              animation: "newBadgePulse 2s ease-in-out infinite",
            }}
          >
            NEW
          </span>
        )}
        <img
          src={`${character.sprite.basePath}/body-neutral.png`}
          alt={character.name}
          className="h-64 sm:h-96 object-contain object-bottom relative z-10 transition-all duration-300"
          draggable={false}
          style={{
            transform: isHovered ? "translateY(-8px) scale(1.05)" : "translateY(0) scale(1)",
            opacity: isHovered && hoverExpr ? 0 : 1,
            animation: isHovered ? "none" : "charBreathe 4s ease-in-out infinite",
            pointerEvents: "none",
          }}
        />
        {/* Expression preview on hover */}
        {hoverExpr && (
          <img
            src={`${character.sprite.basePath}/face-${hoverExpr}.png`}
            alt={`${character.name} ${hoverExpr}`}
            className="h-64 sm:h-96 object-contain object-bottom absolute inset-0 w-full z-20 transition-all duration-300"
            draggable={false}
            style={{
              opacity: isHovered ? 1 : 0,
              transform: isHovered ? "translateY(-8px) scale(1.05)" : "translateY(0) scale(1)",
              pointerEvents: "none",
            }}
          />
        )}

        {/* Reflection/glow under character */}
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-48 h-24 rounded-full blur-2xl transition-opacity duration-300"
          style={{
            background: character.theme.accent,
            opacity: isHovered ? 0.2 : isFavorite ? 0.1 : 0.05,
          }}
        />
      </div>

      <style>{`
        @keyframes charBreathe {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-3px) scale(1); }
        }
        @keyframes newBadgePulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.05); }
        }
      `}</style>

      {/* Info */}
      <div className="relative z-10 w-full px-5 py-5 text-center">
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
        {affinity && (
          <div className="flex items-center justify-center gap-2 mb-2">
            <AffinityBadge data={affinity} accentColor={character.theme.accent} />
            <StreakBadge streak={affinity.streak} accentColor={character.theme.accent} />
          </div>
        )}
        {lastSeen && (
          <p className="text-[10px] tracking-wide mb-1" style={{ color: character.theme.accent, opacity: 0.5 }}>
            {msgCount > 0 ? `${msgCount} msgs · ` : ""}Last seen {lastSeen}
          </p>
        )}
        <p className="text-text-secondary text-sm leading-relaxed" style={{ fontFamily: "var(--font-dialogue, 'Zen Maru Gothic', sans-serif)" }}>
          {character.tagline}
        </p>
        <p
          className="text-xs mt-2 transition-opacity duration-300"
          style={{
            color: character.theme.accent,
            opacity: isHovered ? 0.6 : 0,
          }}
        >
          {character.archetype}
        </p>
      </div>
    </div>
  );
}
