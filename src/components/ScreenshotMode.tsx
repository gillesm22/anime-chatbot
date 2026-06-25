"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { Character, Expression } from "@/lib/characters/types";
import { CharacterSprite } from "./CharacterSprite";

interface ScreenshotModeProps {
  character: Character;
  expression: Expression;
  lastLine: string;
  visible: boolean;
  onClose: () => void;
}

export function ScreenshotMode({
  character,
  expression,
  lastLine,
  visible,
  onClose,
}: ScreenshotModeProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="fixed inset-0 z-50 flex flex-col"
          style={{
            background: `linear-gradient(180deg, ${character.theme.tint} 0%, #0a0a10 60%, #000 100%)`,
          }}
        >
          {/* Close button - semi-transparent top-right */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-60 w-8 h-8 flex items-center justify-center rounded-full text-white/30 hover:text-white/70 transition-colors"
            style={{ background: "rgba(0,0,0,0.3)" }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M2 2L12 12M12 2L2 12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>

          {/* Character sprite - centered, fills most of the screen */}
          <div className="flex-1 min-h-0 relative overflow-hidden">
            <CharacterSprite
              character={character}
              expression={expression}
              isTalking={false}
            />
          </div>

          {/* VN-style dialogue box at the bottom */}
          <div className="flex-shrink-0 relative">
            {/* Cinematic gradient fade above the box */}
            <div
              className="absolute -top-16 left-0 right-0 h-16 pointer-events-none"
              style={{
                background: "linear-gradient(to bottom, transparent, rgba(0,0,0,0.85))",
              }}
            />

            <div
              className="relative px-6 py-5 md:px-10 md:py-6"
              style={{
                background: "rgba(0,0,0,0.85)",
                borderTop: `2px solid ${character.theme.accent}30`,
              }}
            >
              {/* Character name plate */}
              <div
                className="inline-block px-4 py-1 rounded-sm text-xs md:text-sm font-semibold tracking-wide uppercase mb-2"
                style={{
                  background: `${character.theme.accent}20`,
                  color: character.theme.accent,
                  border: `1px solid ${character.theme.accent}40`,
                }}
              >
                {character.name}
              </div>

              {/* Dialogue text */}
              <p className="text-white/90 text-sm md:text-base leading-relaxed max-w-3xl">
                {lastLine || "..."}
              </p>
            </div>

            {/* Hint bar */}
            <div className="px-6 py-2 md:px-10 text-center" style={{ background: "rgba(0,0,0,0.9)" }}>
              <span className="text-white/20 text-[10px] md:text-xs tracking-wider uppercase">
                Use Win+Shift+S or PrtSc to capture
              </span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
