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

const CHARACTER_ORDER = ["merrick", "marin", "arisu", "kurisu", "suzuka", "ticia"];

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
