"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { Expression } from "@/lib/characters/types";

interface BloodBatProps {
  expression?: Expression;
  accentColor?: string;
  isIdle?: boolean;
  isAudioPlaying?: boolean;
  landingMode?: boolean;
}

type BatMood = "chill" | "excited" | "scared" | "sleepy" | "smug" | "love" | "angry";

const BAT_PHRASES: Record<BatMood, string[]> = {
  chill: ["*yawn*", "sup", "...", "*wing stretch*", "bored", "yo", "meh", "hmm"],
  excited: ["!!!", "LET'S GO", "hehe", "yooo", "*flap flap*", "no way", "oh?!", "kyaa~!"],
  scared: ["!!!", "nope", "bruh", "*hides behind you*", "uh oh", "not cool", "eep"],
  sleepy: ["zzz", "...zzz", "*snore*", "5 more min", "wake me never", "meh", "*curls up*"],
  smug: ["heh", "called it", "told ya", "*smirk*", "ez", "smooth", "classic", "too easy~"],
  love: ["...", "hmph", "not cute", "*looks away*", "whatever", "...fine", "b-baka"],
  angry: ["tch", "rude", "fight me", "*hiss*", "grr", "wow ok", "try that again"],
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

export function BloodBat({ expression, accentColor = "#b71c1c", isIdle, isAudioPlaying, landingMode }: BloodBatProps) {
  const [mood, setMood] = useState<BatMood>("chill");
  const [phrase, setPhrase] = useState<string | null>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isClicked, setIsClicked] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [headTilt, setHeadTilt] = useState(0);
  const phraseTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const driftTimer = useRef<ReturnType<typeof setInterval>>(undefined);

  useEffect(() => {
    const newMood = getBatMood(expression, isIdle);
    if (newMood !== mood) {
      setMood(newMood);
      if (newMood !== "chill" && newMood !== "sleepy") {
        const phrases = BAT_PHRASES[newMood];
        setPhrase(phrases[Math.floor(Math.random() * phrases.length)]);
        if (phraseTimer.current) clearTimeout(phraseTimer.current);
        phraseTimer.current = setTimeout(() => setPhrase(null), 2500);
      }
    }
  }, [expression, isIdle, mood]);

  useEffect(() => {
    driftTimer.current = setInterval(() => {
      setPosition({ x: (Math.random() - 0.5) * 16, y: (Math.random() - 0.5) * 10 });
      setHeadTilt((Math.random() - 0.5) * 12);
    }, 2500);
    return () => { if (driftTimer.current) clearInterval(driftTimer.current); };
  }, []);

  useEffect(() => {
    if (!landingMode) return;
    const phrases = [
      "pick someone already",
      "they're all waiting y'know",
      "I don't have all night",
      "just pick. trust me.",
      "the one on the left. no wait.",
      "*taps wing impatiently*",
      "you're overthinking this",
      "any day now, chief",
      "I could be napping rn",
      "...fine. take your time. whatever.",
    ];
    let idx = 0;
    setPhrase(phrases[0]);
    const interval = setInterval(() => {
      idx = (idx + 1) % phrases.length;
      setPhrase(phrases[idx]);
    }, 12000);
    return () => clearInterval(interval);
  }, [landingMode]);

  const handleClick = useCallback(() => {
    setIsClicked(true);
    setClickCount((c) => c + 1);
    setTimeout(() => setIsClicked(false), 500);

    const clickPhrases = clickCount < 3
      ? ["hey!", "what", "*squeak*", "yo?!", "watch it"]
      : clickCount < 7
        ? ["again?", "dude", "stop", "I bite", "personal space??"]
        : clickCount < 12
          ? ["...", "fine", "*nuzzle*", "ok ok", "we cool", "you're weird"]
          : ["...you're kinda sweet", "*purrs*", "don't tell anyone", "this stays between us", "...whatever"];
    setPhrase(clickPhrases[Math.floor(Math.random() * clickPhrases.length)]);
    if (phraseTimer.current) clearTimeout(phraseTimer.current);
    phraseTimer.current = setTimeout(() => setPhrase(null), 2500);
  }, [clickCount]);

  const wingSpeed = mood === "excited" ? "0.25s" : mood === "sleepy" ? "2.5s" : "0.7s";
  const isSleep = mood === "sleepy";
  const isScared = mood === "scared";
  const showFangs = mood === "excited" || mood === "smug" || mood === "angry" || isClicked;
  const showBlush = mood === "smug" || mood === "love" || (clickCount >= 8 && isClicked);
  const pupilSize = isScared ? 2.2 : isSleep ? 0 : isHovered ? 1.8 : 1.4;
  const bodySquish = isClicked ? "scaleY(0.85) scaleX(1.1)" : isHovered ? "scaleY(1.05)" : "scaleY(1)";

  return (
    <div
      style={{
        position: "fixed",
        bottom: "80px",
        right: "16px",
        zIndex: 45,
        cursor: "pointer",
        transition: "transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)",
        transform: `translate(${position.x}px, ${position.y}px) rotate(${headTilt}deg)`,
      }}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      title="Hexx"
    >
      {/* Speech bubble */}
      {phrase && (
        <div
          style={{
            position: "absolute",
            bottom: "100%",
            right: "-4px",
            marginBottom: "6px",
            padding: "6px 14px",
            borderRadius: "12px 12px 4px 12px",
            background: "rgba(13,13,18,0.92)",
            border: `1.5px solid ${accentColor}50`,
            color: accentColor,
            fontSize: "13px",
            fontWeight: 700,
            whiteSpace: "nowrap",
            animation: "hexxBubbleIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)",
            letterSpacing: "0.02em",
            boxShadow: `0 2px 12px ${accentColor}20`,
            fontFamily: "var(--font-dialogue, 'Zen Maru Gothic', sans-serif)",
          }}
        >
          {phrase}
          {/* Bubble tail */}
          <div style={{
            position: "absolute",
            bottom: "-5px",
            right: "12px",
            width: 0,
            height: 0,
            borderLeft: "5px solid transparent",
            borderRight: "2px solid transparent",
            borderTop: `5px solid rgba(13,13,18,0.92)`,
          }} />
        </div>
      )}

      {/* Main SVG */}
      <svg
        width="80"
        height="68"
        viewBox="0 0 56 48"
        fill="none"
        style={{
          transition: "transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), filter 0.3s ease",
          transform: `${isSleep ? "rotate(180deg)" : ""} ${bodySquish}`,
          filter: `drop-shadow(0 2px 8px ${accentColor}50) ${isHovered ? `drop-shadow(0 0 12px ${accentColor}40)` : ""}`,
        }}
      >
        {/* Left wing - more detailed with finger bones */}
        <g style={{ transformOrigin: "24px 20px", animation: `hexxWingL ${wingSpeed} ease-in-out infinite` }}>
          <path d="M24 20 C20 12, 10 6, 2 8 C4 10, 5 12, 7 14 C5 12, 3 11, 1 13 C3 15, 5 16, 8 17 C6 16, 3 15, 1 18 C5 19, 10 20, 18 21 Z" fill={accentColor} opacity="0.8" />
          <path d="M24 20 C20 12, 10 6, 2 8" stroke={accentColor} strokeWidth="0.5" opacity="0.4" fill="none" />
          <path d="M22 16 C18 11, 8 8, 4 10" stroke={accentColor} strokeWidth="0.3" opacity="0.3" fill="none" />
        </g>
        {/* Right wing */}
        <g style={{ transformOrigin: "32px 20px", animation: `hexxWingR ${wingSpeed} ease-in-out infinite` }}>
          <path d="M32 20 C36 12, 46 6, 54 8 C52 10, 51 12, 49 14 C51 12, 53 11, 55 13 C53 15, 51 16, 48 17 C50 16, 53 15, 55 18 C51 19, 46 20, 38 21 Z" fill={accentColor} opacity="0.8" />
          <path d="M32 20 C36 12, 46 6, 54 8" stroke={accentColor} strokeWidth="0.5" opacity="0.4" fill="none" />
          <path d="M34 16 C38 11, 48 8, 52 10" stroke={accentColor} strokeWidth="0.3" opacity="0.3" fill="none" />
        </g>

        {/* Body - rounder, cuter */}
        <ellipse cx="28" cy="24" rx="9" ry="10" fill="#1a1a2e" />
        <ellipse cx="28" cy="24" rx="8" ry="9" fill="#252538" />
        {/* Belly highlight */}
        <ellipse cx="28" cy="26" rx="5" ry="5" fill="#2d2d45" opacity="0.6" />

        {/* Ears - bigger, more expressive */}
        <path d="M20 15 L21 7 L24 14" fill="#1a1a2e" stroke={accentColor} strokeWidth="0.4" opacity="0.6" />
        <path d="M36 15 L35 7 L32 14" fill="#1a1a2e" stroke={accentColor} strokeWidth="0.4" opacity="0.6" />
        {/* Inner ear */}
        <path d="M21.5 14 L22 9 L23.5 13.5" fill={accentColor} opacity="0.15" />
        <path d="M34.5 14 L34 9 L32.5 13.5" fill={accentColor} opacity="0.15" />

        {/* Eyes - big anime style */}
        {isSleep ? (
          <>
            {/* Sleeping eyes - cute curved lines */}
            <path d="M23 21 Q25 23, 27 21" stroke={accentColor} strokeWidth="1" fill="none" strokeLinecap="round" />
            <path d="M29 21 Q31 23, 33 21" stroke={accentColor} strokeWidth="1" fill="none" strokeLinecap="round" />
          </>
        ) : (
          <>
            {/* Eye whites */}
            <ellipse cx="24" cy="20" rx="3.5" ry={isScared ? "4" : "3.2"} fill="#1a1a2e" />
            <ellipse cx="32" cy="20" rx="3.5" ry={isScared ? "4" : "3.2"} fill="#1a1a2e" />
            {/* Iris */}
            <ellipse cx="24" cy="20.3" rx="2.5" ry={isScared ? "3" : "2.5"} fill={accentColor} />
            <ellipse cx="32" cy="20.3" rx="2.5" ry={isScared ? "3" : "2.5"} fill={accentColor} />
            {/* Pupils */}
            <ellipse cx="24.3" cy="20.2" rx={pupilSize * 0.5} ry={pupilSize * 0.6} fill="#0a0a12" />
            <ellipse cx="32.3" cy="20.2" rx={pupilSize * 0.5} ry={pupilSize * 0.6} fill="#0a0a12" />
            {/* Star glints - anime style */}
            <circle cx="22.8" cy="19" r="1" fill="white" opacity="0.9" />
            <circle cx="30.8" cy="19" r="1" fill="white" opacity="0.9" />
            <circle cx="25" cy="20.8" r="0.5" fill="white" opacity="0.5" />
            <circle cx="33" cy="20.8" r="0.5" fill="white" opacity="0.5" />
            {/* Eye shine line */}
            <ellipse cx="24" cy="18.5" rx="2" ry="0.6" fill="white" opacity="0.08" />
            <ellipse cx="32" cy="18.5" rx="2" ry="0.6" fill="white" opacity="0.08" />
          </>
        )}

        {/* Blush marks */}
        {showBlush && (
          <>
            <g opacity="0.35">
              <line x1="19" y1="22.5" x2="20" y2="23" stroke="#ff6b6b" strokeWidth="0.8" strokeLinecap="round" />
              <line x1="19.3" y1="23.5" x2="20.3" y2="23" stroke="#ff6b6b" strokeWidth="0.8" strokeLinecap="round" />
              <line x1="36" y1="22.5" x2="37" y2="23" stroke="#ff6b6b" strokeWidth="0.8" strokeLinecap="round" />
              <line x1="36.3" y1="23.5" x2="37.3" y2="23" stroke="#ff6b6b" strokeWidth="0.8" strokeLinecap="round" />
            </g>
          </>
        )}

        {/* Mouth */}
        {showFangs ? (
          <g>
            {/* Open grin with fangs */}
            <path d="M24 26 Q28 29, 32 26" stroke={accentColor} strokeWidth="0.8" fill="none" />
            <path d="M24 26 Q28 28.5, 32 26" fill="#1a0a10" />
            {/* Fangs */}
            <path d="M25.5 26 L25.5 28.5 L26.5 26.5" fill="white" />
            <path d="M30.5 26 L30.5 28.5 L29.5 26.5" fill="white" />
          </g>
        ) : isScared ? (
          <ellipse cx="28" cy="27" rx="2" ry="1.5" fill="#1a0a10" stroke={accentColor} strokeWidth="0.5" />
        ) : mood === "love" ? (
          <path d="M25 26 Q28 24, 31 26" stroke={accentColor} strokeWidth="0.8" fill="none" strokeLinecap="round" />
        ) : (
          <>
            <path d="M25.5 25.5 Q28 27, 30.5 25.5" stroke={accentColor} strokeWidth="0.7" fill="none" strokeLinecap="round" />
            {/* Tiny resting fang */}
            <path d="M26 25.8 L26 27 L26.6 26" fill="white" opacity="0.7" />
          </>
        )}

        {/* Tail - cute curly */}
        <path
          d="M28 34 Q32 36, 34 34 Q36 32, 38 34 Q39 35, 38 36"
          stroke={accentColor}
          strokeWidth="1.2"
          fill="none"
          strokeLinecap="round"
          opacity="0.7"
          style={{ animation: `hexxTail 2s ease-in-out infinite` }}
        />

        {/* Zzz for sleepy */}
        {isSleep && (
          <g style={{ animation: "hexxZzz 2s ease-in-out infinite" }}>
            <text x="36" y="16" fill={accentColor} fontSize="7" fontWeight="bold" opacity="0.7">z</text>
            <text x="40" y="12" fill={accentColor} fontSize="5" fontWeight="bold" opacity="0.4">z</text>
          </g>
        )}

        {/* Angry vein mark */}
        {mood === "angry" && (
          <g opacity="0.6">
            <path d="M34 13 L36 14 L35 12 L37 13" stroke={accentColor} strokeWidth="0.8" fill="none" />
          </g>
        )}

        {/* Sparkle when excited */}
        {mood === "excited" && (
          <g style={{ animation: "hexxSparkle 0.6s ease-in-out infinite" }}>
            <path d="M12 12 L13 10 L14 12 L16 11 L14 13 L13 15 L12 13 L10 14 Z" fill={accentColor} opacity="0.5" />
            <path d="M42 10 L43 8 L44 10 L46 9 L44 11 L43 13 L42 11 L40 12 Z" fill={accentColor} opacity="0.4" />
          </g>
        )}

        {/* Heart when love/high click */}
        {(mood === "love" || clickCount >= 12) && !isClicked && (
          <g style={{ animation: "hexxHeart 1.5s ease-in-out infinite" }}>
            <path d="M26 10 Q26 8, 28 9 Q30 8, 30 10 Q30 12, 28 14 Q26 12, 26 10 Z" fill="#ff6b6b" opacity="0.4" />
          </g>
        )}
      </svg>

      <style>{`
        @keyframes hexxWingL {
          0%, 100% { transform: rotate(0deg) scaleY(1); }
          50% { transform: rotate(-12deg) scaleY(0.85); }
        }
        @keyframes hexxWingR {
          0%, 100% { transform: rotate(0deg) scaleY(1); }
          50% { transform: rotate(12deg) scaleY(0.85); }
        }
        @keyframes hexxBubbleIn {
          from { opacity: 0; transform: translateY(6px) scale(0.7); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes hexxTail {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(2px); }
        }
        @keyframes hexxZzz {
          0%, 100% { transform: translateY(0); opacity: 0.7; }
          50% { transform: translateY(-4px); opacity: 0.3; }
        }
        @keyframes hexxSparkle {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.3); opacity: 0.8; }
        }
        @keyframes hexxHeart {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.4; }
          50% { transform: translateY(-3px) scale(1.15); opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}
