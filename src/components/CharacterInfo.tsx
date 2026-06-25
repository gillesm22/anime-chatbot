"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { Character } from "@/lib/characters/types";

interface CharacterInfoProps {
  character: Character;
  visible: boolean;
  onClose: () => void;
}

function extractSection(prompt: string, heading: string): string[] {
  const regex = new RegExp(`${heading}:\\s*\\n([\\s\\S]*?)(?:\\n\\n|\\n[A-Z]|$)`);
  const match = prompt.match(regex);
  if (!match) return [];
  return match[1]
    .split("\n")
    .map((line) => line.replace(/^-\s*/, "").trim())
    .filter(Boolean);
}

export function CharacterInfo({ character, visible, onClose }: CharacterInfoProps) {
  const personalityTraits = extractSection(character.systemPrompt, "Your personality traits");
  const speechStyle = extractSection(character.systemPrompt, "Speech style");

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50"
            style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="fixed top-0 right-0 h-full w-80 z-50 overflow-y-auto"
            style={{
              backgroundColor: "rgba(13,13,18,0.92)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
            }}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full text-text-secondary hover:text-text transition-colors"
              style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M11 3L3 11M3 3l8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>

            <div className="p-6 pt-14 flex flex-col gap-6">
              {/* Name + archetype */}
              <div>
                <h2 className="text-2xl font-bold text-text">{character.name}</h2>
                <span
                  className="inline-block mt-1.5 text-xs font-medium px-2.5 py-1 rounded-full"
                  style={{
                    color: character.theme.accent,
                    backgroundColor: `${character.theme.accent}18`,
                  }}
                >
                  {character.archetype}
                </span>
              </div>

              {/* Tagline */}
              <p
                className="text-sm italic leading-relaxed"
                style={{ color: `${character.theme.light}cc` }}
              >
                &ldquo;{character.tagline}&rdquo;
              </p>

              {/* Accent color bar */}
              <div
                className="h-0.5 rounded-full"
                style={{
                  background: `linear-gradient(90deg, ${character.theme.accent}, transparent)`,
                }}
              />

              {/* Personality traits */}
              {personalityTraits.length > 0 && (
                <div>
                  <h3
                    className="text-xs font-semibold uppercase tracking-wider mb-3"
                    style={{ color: character.theme.accent }}
                  >
                    Personality
                  </h3>
                  <ul className="flex flex-col gap-2">
                    {personalityTraits.map((trait, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                        <span
                          className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: character.theme.accent }}
                        />
                        {trait}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Speech style */}
              {speechStyle.length > 0 && (
                <div>
                  <h3
                    className="text-xs font-semibold uppercase tracking-wider mb-3"
                    style={{ color: character.theme.accent }}
                  >
                    Speech Style
                  </h3>
                  <ul className="flex flex-col gap-2">
                    {speechStyle.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                        <span
                          className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: `${character.theme.accent}60` }}
                        />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Theme color swatch */}
              <div>
                <h3
                  className="text-xs font-semibold uppercase tracking-wider mb-3"
                  style={{ color: character.theme.accent }}
                >
                  Theme
                </h3>
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-full"
                    style={{
                      backgroundColor: character.theme.accent,
                      boxShadow: `0 0 12px ${character.theme.glow}`,
                    }}
                  />
                  <span className="text-xs text-text-secondary font-mono">
                    {character.theme.accent}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
