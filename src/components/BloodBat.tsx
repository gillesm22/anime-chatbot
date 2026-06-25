"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { Expression } from "@/lib/characters/types";

interface BloodBatProps {
  /** Current character expression to react to */
  expression?: Expression;
  /** Accent color from the current character */
  accentColor?: string;
  /** Whether the user is currently idle (triggers sleep) */
  isIdle?: boolean;
  /** Whether TTS/audio is playing */
  isAudioPlaying?: boolean;
}

type BatMood = "chill" | "excited" | "scared" | "sleepy" | "smug" | "love" | "angry";

const BAT_PHRASES: Record<BatMood, string[]> = {
  chill: ["*yawn*", "sup", "...", "zzz", "*wing stretch*", "bored", "yo"],
  excited: ["!!!", "LET'S GO", "hehe", "yooo", "*flap flap*", "sick", "no way"],
  scared: ["!!!", "nope", "bruh", "*hides*", "scary", "uh oh"],
  sleepy: ["zzz", "...zzz", "*snore*", "5 more min", "tired", "meh"],
  smug: ["heh", "called it", "told ya", "*smirk*", "ez", "smooth"],
  love: ["aww", "<3", "cute", "*blush*", "ship it", "goals"],
  angry: ["tch", "rude", "fight me", "*hiss*", "grr", "wow ok"],
};

function getBatMood(expression?: Expression, isIdle?: boolean): BatMood {
  if (isIdle) return "sleepy";
  if (!expression) return "chill";
  switch (expression) {
    case "happy": case "laugh": case "excited": return "excited";
    case "sad": case "crying": return "love";
    case "angry": return "scared";
    case "flustered": case "shy": case "devoted": return "smug";
    case "smirk": case "teasing": return "smug";
    case "jealous": return "angry";
    case "sleepy": return "sleepy";
    case "surprised": return "excited";
    default: return "chill";
  }
}

export function BloodBat({ expression, accentColor = "#b71c1c", isIdle, isAudioPlaying }: BloodBatProps) {
  const [mood, setMood] = useState<BatMood>("chill");
  const [phrase, setPhrase] = useState<string | null>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isClicked, setIsClicked] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const phraseTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const driftTimer = useRef<ReturnType<typeof setInterval>>(undefined);

  // Update mood based on expression
  useEffect(() => {
    const newMood = getBatMood(expression, isIdle);
    if (newMood !== mood) {
      setMood(newMood);
      // Show a reaction phrase on mood change
      if (newMood !== "chill" && newMood !== "sleepy") {
        const phrases = BAT_PHRASES[newMood];
        setPhrase(phrases[Math.floor(Math.random() * phrases.length)]);
        if (phraseTimer.current) clearTimeout(phraseTimer.current);
        phraseTimer.current = setTimeout(() => setPhrase(null), 2500);
      }
    }
  }, [expression, isIdle, mood]);

  // Idle drift animation
  useEffect(() => {
    driftTimer.current = setInterval(() => {
      setPosition({
        x: (Math.random() - 0.5) * 12,
        y: (Math.random() - 0.5) * 8,
      });
    }, 3000);
    return () => { if (driftTimer.current) clearInterval(driftTimer.current); };
  }, []);

  // Click interaction
  const handleClick = useCallback(() => {
    setIsClicked(true);
    setClickCount((c) => c + 1);
    setTimeout(() => setIsClicked(false), 400);

    const clickPhrases = clickCount < 3
      ? ["hey!", "what", "*squeak*", "yo?!", "watch it"]
      : clickCount < 6
        ? ["again?", "dude", "stop", "chill", "I bite"]
        : ["...", "fine", "*nuzzle*", "ok ok", "we cool"];
    setPhrase(clickPhrases[Math.floor(Math.random() * clickPhrases.length)]);
    if (phraseTimer.current) clearTimeout(phraseTimer.current);
    phraseTimer.current = setTimeout(() => setPhrase(null), 2000);
  }, [clickCount]);

  const wingSpeed = mood === "excited" ? "0.3s" : mood === "sleepy" ? "2s" : "0.8s";
  const eyeSize = mood === "scared" ? 4 : mood === "sleepy" ? 1.5 : 3;
  const bodyRotate = mood === "sleepy" ? "rotate(180deg)" : isClicked ? "rotate(15deg)" : "rotate(0deg)";

  return (
    <div
      style={{
        position: "fixed",
        bottom: "80px",
        right: "16px",
        zIndex: 45,
        cursor: "pointer",
        transition: "transform 0.6s ease",
        transform: `translate(${position.x}px, ${position.y}px)`,
      }}
      onClick={handleClick}
      title="Blood Bat"
    >
      {/* Speech bubble */}
      {phrase && (
        <div
          style={{
            position: "absolute",
            bottom: "100%",
            right: "0",
            marginBottom: "4px",
            padding: "3px 8px",
            borderRadius: "8px 8px 2px 8px",
            background: "rgba(13,13,18,0.85)",
            border: `1px solid ${accentColor}40`,
            color: accentColor,
            fontSize: "10px",
            fontWeight: 600,
            whiteSpace: "nowrap",
            animation: "batBubbleIn 0.2s ease-out",
            letterSpacing: "0.03em",
          }}
        >
          {phrase}
        </div>
      )}

      {/* Bat SVG */}
      <svg
        width="40"
        height="32"
        viewBox="0 0 40 32"
        fill="none"
        style={{
          transition: "transform 0.3s ease",
          transform: bodyRotate,
          filter: `drop-shadow(0 0 6px ${accentColor}40)`,
        }}
      >
        {/* Left wing */}
        <path
          d="M18 14 C14 8, 6 4, 1 6 C3 8, 4 10, 6 12 C4 10, 2 10, 0 12 C3 14, 8 16, 14 16 Z"
          fill={accentColor}
          opacity="0.85"
          style={{
            transformOrigin: "18px 14px",
            animation: `batWingFlap ${wingSpeed} ease-in-out infinite`,
          }}
        />
        {/* Right wing */}
        <path
          d="M22 14 C26 8, 34 4, 39 6 C37 8, 36 10, 34 12 C36 10, 38 10, 40 12 C37 14, 32 16, 26 16 Z"
          fill={accentColor}
          opacity="0.85"
          style={{
            transformOrigin: "22px 14px",
            animation: `batWingFlap ${wingSpeed} ease-in-out infinite reverse`,
          }}
        />
        {/* Body */}
        <ellipse cx="20" cy="16" rx="6" ry="7" fill="#1a1a2e" />
        <ellipse cx="20" cy="16" rx="5" ry="6" fill="#2a2a3e" />
        {/* Ears */}
        <path d="M15 10 L17 6 L18 11" fill="#1a1a2e" />
        <path d="M25 10 L23 6 L22 11" fill="#1a1a2e" />
        {/* Eyes */}
        <circle cx="17.5" cy="14" r={eyeSize * 0.45} fill={accentColor} />
        <circle cx="22.5" cy="14" r={eyeSize * 0.45} fill={accentColor} />
        {/* Eye glint */}
        <circle cx="18" cy="13.5" r="0.6" fill="white" opacity="0.8" />
        <circle cx="23" cy="13.5" r="0.6" fill="white" opacity="0.8" />
        {/* Mouth / fangs */}
        {mood === "excited" || mood === "smug" || isClicked ? (
          <>
            <path d="M18 18 Q20 20, 22 18" stroke={accentColor} strokeWidth="0.6" fill="none" />
            <line x1="18.5" y1="18" x2="18.5" y2="19.5" stroke="white" strokeWidth="0.6" />
            <line x1="21.5" y1="18" x2="21.5" y2="19.5" stroke="white" strokeWidth="0.6" />
          </>
        ) : mood === "scared" ? (
          <circle cx="20" cy="18.5" rx="1.5" ry="1" fill="#1a1a2e" stroke={accentColor} strokeWidth="0.4" />
        ) : (
          <path d="M18.5 17.5 Q20 18.5, 21.5 17.5" stroke={accentColor} strokeWidth="0.5" fill="none" />
        )}
        {/* Blush when smug/love */}
        {(mood === "smug" || mood === "love") && (
          <>
            <circle cx="16" cy="16" r="1.5" fill="#ff6b6b" opacity="0.25" />
            <circle cx="24" cy="16" r="1.5" fill="#ff6b6b" opacity="0.25" />
          </>
        )}
        {/* Zzz for sleepy */}
        {mood === "sleepy" && (
          <text x="26" y="10" fill={accentColor} fontSize="6" opacity="0.6" fontWeight="bold">z</text>
        )}
      </svg>

      <style>{`
        @keyframes batWingFlap {
          0%, 100% { transform: scaleX(1) rotate(0deg); }
          50% { transform: scaleX(0.7) rotate(-8deg); }
        }
        @keyframes batBubbleIn {
          from { opacity: 0; transform: translateY(4px) scale(0.8); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
