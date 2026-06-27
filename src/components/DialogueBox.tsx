"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { speakLine, stopSpeaking } from "@/lib/speech";
import { playTypingClick } from "@/lib/sounds";
import { ClickToContinue } from "./ClickToContinue";
import { getDialogueEffect, DIALOGUE_EFFECT_STYLES } from "@/lib/dialogueEffects";
import type { Expression } from "@/lib/characters/types";
import { haptic } from "@/lib/haptics";

interface DialogueBoxProps {
  characterName: string;
  characterId?: string;
  accentColor: string;
  line: string;
  isTyping: boolean;
  onAdvance: () => void;
  onTypeComplete?: () => void;
  showAdvance: boolean;
  typeSpeed?: number;
  expression?: Expression;
}

function ThinkingIndicator({ name, color }: { name: string; color: string }) {
  return (
    <span
      className="inline-flex items-center gap-1 py-1"
      style={{ animation: "thinking-fade-in 0.3s ease-out" }}
    >
      <span
        className="text-sm md:text-base italic"
        style={{ color: `${color}cc` }}
      >
        {name} is thinking
      </span>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="inline-block w-1.5 h-1.5 rounded-full"
          style={{
            backgroundColor: color,
            animation: `thinking-dot 1.4s ease-in-out ${i * 0.2}s infinite`,
          }}
        />
      ))}
      <style>{`
        @keyframes thinking-dot {
          0%, 20% { opacity: 0.2; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
          80%, 100% { opacity: 0.2; transform: scale(0.8); }
        }
        @keyframes thinking-fade-in {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </span>
  );
}

export function DialogueBox({
  characterName,
  characterId,
  accentColor,
  line,
  isTyping,
  onAdvance,
  onTypeComplete,
  showAdvance,
  typeSpeed = 12,
  expression = "neutral",
}: DialogueBoxProps) {
  const [displayedText, setDisplayedText] = useState("");
  const [isTypewriting, setIsTypewriting] = useState(false);
  const charIndexRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);

  // Stop speech on unmount
  useEffect(() => {
    return () => stopSpeaking();
  }, []);

  useEffect(() => {
    if (isTyping && line) {
      setDisplayedText("");
      charIndexRef.current = 0;
      setIsTypewriting(true);

      // Speak the line (skip typing indicator)
      if (line !== "..." && characterId) {
        stopSpeaking();
        speakLine(line, characterId);
      }

      intervalRef.current = setInterval(() => {
        charIndexRef.current++;
        if (charIndexRef.current >= line.length) {
          setDisplayedText(line);
          setIsTypewriting(false);
          if (intervalRef.current) clearInterval(intervalRef.current);
          onTypeComplete?.();
        } else {
          setDisplayedText(line.slice(0, charIndexRef.current));
          if (charIndexRef.current % 3 === 0) playTypingClick(dialogueEffect.pitchMultiplier);
        }
      }, typeSpeed);

      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    } else if (!isTyping && line) {
      setDisplayedText(line);
      setIsTypewriting(false);
    }
  }, [line, isTyping, typeSpeed, onTypeComplete]);

  const handleClick = useCallback(() => {
    if (isTypewriting) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setDisplayedText(line);
      setIsTypewriting(false);
      onTypeComplete?.();
    } else if (showAdvance) {
      haptic.tick();
      onAdvance();
    }
  }, [isTypewriting, showAdvance, onAdvance, line, onTypeComplete]);

  const lineKeyRef = useRef(0);
  const prevLineRef = useRef(line);
  if (line !== prevLineRef.current) {
    lineKeyRef.current++;
    prevLineRef.current = line;
  }

  const dialogueEffect = getDialogueEffect(expression);

  return (
    <>
      <style>{`
        @keyframes dialogue-pop-in {
          0% { transform: scale(0.98); opacity: 0.8; }
          60% { transform: scale(1.005); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes dialogue-glow-pulse {
          0%, 100% { box-shadow: 0 -4px 30px rgba(0,0,0,0.4), inset 0 1px 0 var(--db-accent10), 0 0 8px var(--db-accent15); }
          50% { box-shadow: 0 -4px 30px rgba(0,0,0,0.4), inset 0 1px 0 var(--db-accent10), 0 0 18px var(--db-accent30); }
        }
        .dialogue-box-enter {
          animation: dialogue-pop-in 0.2s ease-out both;
        }
        .dialogue-box-typing-glow {
          animation: dialogue-glow-pulse 1.5s ease-in-out infinite;
        }
        ${DIALOGUE_EFFECT_STYLES}
      `}</style>
      <div
        data-testid="dialogue-box"
        role="button"
        tabIndex={0}
        aria-label="Advance dialogue"
        onClick={handleClick}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleClick(); } }}
        key={lineKeyRef.current}
        className={`relative w-full cursor-pointer select-none mx-2 md:mx-4 outline-none dialogue-box-enter${isTypewriting ? " dialogue-box-typing-glow" : ""}`}
        style={{
          background: "var(--color-surface-alpha)",
          backdropFilter: "blur(12px)",
          borderRadius: 16,
          border: `1px solid ${
            expression === "angry" || expression === "excited" || expression === "flustered"
              ? `${accentColor}50`
              : `${accentColor}20`
          }`,
          marginBottom: 4,
          boxShadow: `0 -4px 30px rgba(0,0,0,0.4), inset 0 1px 0 ${accentColor}10`,
          "--db-accent10": `${accentColor}10`,
          "--db-accent15": `${accentColor}15`,
          "--db-accent30": `${accentColor}30`,
        } as React.CSSProperties}
      >
      {/* Name plate */}
      <div
        className="absolute -top-3 left-6 px-4 py-1 rounded-full text-xs font-semibold tracking-wide uppercase"
        style={{
          background: `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)`,
          color: "var(--color-nameplate-text)",
          boxShadow: `0 2px 10px ${accentColor}40`,
        }}
      >
        {characterName}
      </div>

      {/* Decorative accent corners */}
      <div
        className="absolute top-0 left-0 w-8 h-8 pointer-events-none"
        style={{
          borderTop: `2px solid ${accentColor}40`,
          borderLeft: `2px solid ${accentColor}40`,
          borderTopLeftRadius: 16,
        }}
      />
      <div
        className="absolute top-0 right-0 w-8 h-8 pointer-events-none"
        style={{
          borderTop: `2px solid ${accentColor}40`,
          borderRight: `2px solid ${accentColor}40`,
          borderTopRightRadius: 16,
        }}
      />

      {/* Text area */}
      <div
        className="px-4 pt-6 pb-4 md:px-8 md:pt-8 md:pb-5 min-h-[70px] md:min-h-[90px]"
        style={{ fontFamily: "var(--font-dialogue, 'Zen Maru Gothic', sans-serif)" }}
      >
        <p className="text-sm md:text-base leading-relaxed tracking-wide" style={{ color: "var(--color-dialogue-text)" }}>
          {line === "..." ? (
            <ThinkingIndicator name={characterName} color={accentColor} />
          ) : (
            <>
              <span className={dialogueEffect.cssClass}>
                {displayedText}
              </span>
              {isTypewriting && (
                <span
                  className="inline-block w-0.5 h-4 ml-0.5 align-middle animate-pulse"
                  style={{ backgroundColor: accentColor }}
                />
              )}
            </>
          )}
        </p>
      </div>

      {/* Click to continue */}
      {showAdvance && !isTyping && !isTypewriting && (
        <ClickToContinue color={accentColor} />
      )}
    </div>
    </>
  );
}
