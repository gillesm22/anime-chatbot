"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Character } from "@/lib/characters/types";
import { getAffinity, type AffinityData } from "@/lib/affinity";
import { AffinityBadge } from "./AffinityBadge";
import { StreakBadge } from "./StreakBadge";

interface CharacterCardProps {
  character: Character;
  index: number;
}

export function CharacterCard({ character, index }: CharacterCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [affinity, setAffinity] = useState<AffinityData | null>(null);
  const router = useRouter();

  useEffect(() => {
    setAffinity(getAffinity(character.id));
  }, [character.id]);

  return (
    <div
      onClick={() => router.push(`/chat/${character.id}`)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative flex flex-col items-center rounded-2xl overflow-hidden cursor-pointer group min-h-[320px] sm:min-h-[420px] transition-transform duration-300"
      style={{
        background: `linear-gradient(180deg, ${character.theme.tint} 0%, #0d0d12 100%)`,
        border: `1px solid ${character.theme.accent}30`,
        transform: isHovered ? "translateY(-12px) scale(1.03)" : "translateY(0) scale(1)",
      }}
    >
      {/* Glow effect on hover */}
      <div
        className="absolute inset-0 transition-opacity duration-500 pointer-events-none"
        style={{
          boxShadow: `inset 0 0 80px ${character.theme.glow}, 0 0 40px ${character.theme.glow}`,
          opacity: isHovered ? 1 : 0,
        }}
      />

      {/* Accent line at top */}
      <div
        className="absolute top-0 left-0 right-0 h-0.5"
        style={{
          background: `linear-gradient(90deg, transparent, ${character.theme.accent}, transparent)`,
          opacity: isHovered ? 1 : 0.3,
          transition: "opacity 300ms ease",
        }}
      />

      {/* Character image */}
      <div className="relative w-full flex-1 flex items-end justify-center overflow-hidden pt-6">
        <img
          src={`${character.sprite.basePath}/body-neutral.png`}
          alt={character.name}
          className="h-56 sm:h-80 object-contain object-bottom relative z-10 transition-transform duration-300"
          draggable={false}
          style={{
            transform: isHovered ? "translateY(-8px) scale(1.05)" : "translateY(0) scale(1)",
            pointerEvents: "none",
          }}
        />

        {/* Reflection/glow under character */}
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-48 h-24 rounded-full blur-2xl transition-opacity duration-300"
          style={{
            background: character.theme.accent,
            opacity: isHovered ? 0.2 : 0.05,
          }}
        />
      </div>

      {/* Info */}
      <div className="relative z-10 w-full px-5 py-5 text-center">
        <h2
          className="text-2xl font-medium mb-2 transition-all duration-300"
          style={{
            color: character.theme.accent,
            textShadow: isHovered ? `0 0 20px ${character.theme.glow}` : "none",
          }}
        >
          {character.name}
        </h2>
        {affinity && (
          <div className="flex items-center justify-center gap-2 mb-2">
            <AffinityBadge data={affinity} accentColor={character.theme.accent} />
            <StreakBadge streak={affinity.streak} accentColor={character.theme.accent} />
          </div>
        )}
        <p className="text-text-secondary text-sm leading-relaxed">
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
