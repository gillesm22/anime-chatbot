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
  sleepy: ["zzz", "...zzz", "*snore*", "5 more min", "wake me never", "*curls up*"],
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
  const [isClicked, setIsClicked] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [headTilt, setHeadTilt] = useState(0);
  const phraseTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const tiltTimer = useRef<ReturnType<typeof setInterval>>(undefined);

  // Drag state
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, px: 0, py: 0 });
  const hasMoved = useRef(false);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    setIsDragging(true);
    hasMoved.current = false;
    dragStart.current = { x: e.clientX, y: e.clientY, px: pos.x, py: pos.y };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [pos]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) hasMoved.current = true;
    setPos({ x: dragStart.current.px + dx, y: dragStart.current.py + dy });
  }, [isDragging]);

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
    if (!hasMoved.current) {
      // It was a click, not a drag
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
    }
  }, [clickCount]);

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
    tiltTimer.current = setInterval(() => {
      setHeadTilt((Math.random() - 0.5) * 10);
    }, 3000);
    return () => { if (tiltTimer.current) clearInterval(tiltTimer.current); };
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

  const wingSpeed = mood === "excited" ? "0.25s" : mood === "sleepy" ? "2.5s" : "0.7s";
  const isSleep = mood === "sleepy";
  const isScared = mood === "scared";
  const showFangs = mood === "excited" || mood === "smug" || mood === "angry" || isClicked;
  const showBlush = mood === "smug" || mood === "love" || (clickCount >= 8 && isClicked);
  const bodySquish = isClicked ? "scaleY(0.88) scaleX(1.08)" : isHovered ? "scaleY(1.03)" : "scaleY(1)";

  return (
    <div
      style={{
        position: "fixed",
        bottom: `calc(80px - ${pos.y}px)`,
        right: `calc(16px - ${pos.x}px)`,
        zIndex: 45,
        cursor: isDragging ? "grabbing" : "grab",
        touchAction: "none",
        userSelect: "none",
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      title="Hexx (drag me!)"
    >
      {/* Speech bubble */}
      {phrase && (
        <div
          style={{
            position: "absolute",
            bottom: "100%",
            right: "-8px",
            marginBottom: "8px",
            padding: "7px 14px",
            borderRadius: "14px 14px 4px 14px",
            background: "rgba(10,10,16,0.94)",
            border: `1.5px solid ${accentColor}50`,
            color: "#f0e0e4",
            fontSize: "14px",
            fontWeight: 700,
            whiteSpace: "nowrap",
            animation: "hexxBubbleIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)",
            letterSpacing: "0.01em",
            boxShadow: `0 4px 16px rgba(0,0,0,0.4), 0 0 8px ${accentColor}15`,
            fontFamily: "var(--font-dialogue, 'Zen Maru Gothic', sans-serif)",
          }}
        >
          <span style={{ color: accentColor, marginRight: 4, fontSize: "10px", opacity: 0.6 }}>Hexx:</span>
          {phrase}
          <div style={{
            position: "absolute", bottom: "-6px", right: "16px", width: 0, height: 0,
            borderLeft: "6px solid transparent", borderRight: "3px solid transparent",
            borderTop: "6px solid rgba(10,10,16,0.94)",
          }} />
        </div>
      )}

      {/* Main SVG - Sanrio-inspired: big round head, tiny body, sparkle eyes */}
      <svg
        width="100"
        height="90"
        viewBox="0 0 100 90"
        fill="none"
        style={{
          transition: "transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), filter 0.3s ease",
          transform: `rotate(${isSleep ? 180 : headTilt}deg) ${bodySquish}`,
          filter: `drop-shadow(0 3px 10px ${accentColor}40) ${isHovered ? `drop-shadow(0 0 16px ${accentColor}30)` : ""}`,
        }}
      >
        {/* Left wing */}
        <g style={{ transformOrigin: "42px 38px", animation: `hexxWingL ${wingSpeed} ease-in-out infinite` }}>
          <path d="M42 38 C36 28, 22 18, 8 22 C12 25, 14 28, 16 31 C12 28, 8 27, 4 30 C8 33, 14 35, 22 37 C16 36, 8 34, 4 38 C10 40, 20 40, 34 40 Z" fill={accentColor} opacity="0.75" />
          {/* Wing membrane lines */}
          <path d="M40 35 C34 27, 20 20, 10 24" stroke={accentColor} strokeWidth="0.4" opacity="0.3" fill="none" />
          <path d="M38 32 C32 25, 16 22, 8 26" stroke={accentColor} strokeWidth="0.3" opacity="0.2" fill="none" />
        </g>
        {/* Right wing */}
        <g style={{ transformOrigin: "58px 38px", animation: `hexxWingR ${wingSpeed} ease-in-out infinite` }}>
          <path d="M58 38 C64 28, 78 18, 92 22 C88 25, 86 28, 84 31 C88 28, 92 27, 96 30 C92 33, 86 35, 78 37 C84 36, 92 34, 96 38 C90 40, 80 40, 66 40 Z" fill={accentColor} opacity="0.75" />
          <path d="M60 35 C66 27, 80 20, 90 24" stroke={accentColor} strokeWidth="0.4" opacity="0.3" fill="none" />
          <path d="M62 32 C68 25, 84 22, 92 26" stroke={accentColor} strokeWidth="0.3" opacity="0.2" fill="none" />
        </g>

        {/* Body - very round, Sanrio proportions (big head, smol body) */}
        <ellipse cx="50" cy="44" rx="16" ry="18" fill="#1c1c30" />
        <ellipse cx="50" cy="44" rx="14.5" ry="16.5" fill="#252540" />
        {/* Belly patch - lighter, rounder */}
        <ellipse cx="50" cy="48" rx="9" ry="9" fill="#2e2e4a" opacity="0.5" />

        {/* Ears - big and cute */}
        <path d="M36 28 L38 16 L43 27" fill="#1c1c30" />
        <path d="M64 28 L62 16 L57 27" fill="#1c1c30" />
        {/* Inner ear - pink accent */}
        <path d="M38 27 L39 19 L42 26" fill={accentColor} opacity="0.2" />
        <path d="M62 27 L61 19 L58 26" fill={accentColor} opacity="0.2" />

        {/* Crown/ribbon accessory - Sanrio touch */}
        <path d="M46 20 Q50 16, 54 20" stroke={accentColor} strokeWidth="1.5" fill="none" strokeLinecap="round" />
        <circle cx="50" cy="17" r="2" fill={accentColor} opacity="0.6" />

        {/* Eyes - BIG Sanrio sparkle eyes */}
        {isSleep ? (
          <>
            <path d="M40 38 Q44 42, 48 38" stroke={accentColor} strokeWidth="1.5" fill="none" strokeLinecap="round" />
            <path d="M52 38 Q56 42, 60 38" stroke={accentColor} strokeWidth="1.5" fill="none" strokeLinecap="round" />
          </>
        ) : (
          <>
            {/* Eye sockets */}
            <ellipse cx="43" cy="37" rx="6" ry={isScared ? "7" : "5.5"} fill="#0e0e1a" />
            <ellipse cx="57" cy="37" rx="6" ry={isScared ? "7" : "5.5"} fill="#0e0e1a" />
            {/* Iris */}
            <ellipse cx="43" cy="37.5" rx="4.5" ry={isScared ? "5.5" : "4.5"} fill={accentColor} />
            <ellipse cx="57" cy="37.5" rx="4.5" ry={isScared ? "5.5" : "4.5"} fill={accentColor} />
            {/* Pupil */}
            <ellipse cx="43.5" cy="37.5" rx="2.2" ry="2.8" fill="#0a0a14" />
            <ellipse cx="57.5" cy="37.5" rx="2.2" ry="2.8" fill="#0a0a14" />
            {/* Big sparkle - star shaped */}
            <circle cx="41" cy="35.5" r="1.8" fill="white" opacity="0.95" />
            <circle cx="55" cy="35.5" r="1.8" fill="white" opacity="0.95" />
            {/* Small sparkle */}
            <circle cx="45" cy="39" r="0.9" fill="white" opacity="0.6" />
            <circle cx="59" cy="39" r="0.9" fill="white" opacity="0.6" />
            {/* Tiny star sparkle */}
            <path d="M40 34 L40.5 33 L41 34 L42 33.5 L41 34.5 L40.5 35.5 L40 34.5 L39 35 Z" fill="white" opacity="0.4" />
            <path d="M54 34 L54.5 33 L55 34 L56 33.5 L55 34.5 L54.5 35.5 L54 34.5 L53 35 Z" fill="white" opacity="0.4" />
          </>
        )}

        {/* Blush - two soft ovals */}
        {showBlush && (
          <>
            <ellipse cx="35" cy="42" rx="3.5" ry="2" fill="#ff6b8a" opacity="0.3" />
            <ellipse cx="65" cy="42" rx="3.5" ry="2" fill="#ff6b8a" opacity="0.3" />
          </>
        )}

        {/* Mouth */}
        {showFangs ? (
          <g>
            <path d="M44 48 Q50 53, 56 48" stroke="#0e0e1a" strokeWidth="0.5" fill="#1a0a12" />
            {/* Cute fangs */}
            <path d="M45.5 48 L46 51 L47 48.5" fill="white" />
            <path d="M54.5 48 L54 51 L53 48.5" fill="white" />
          </g>
        ) : isScared ? (
          <ellipse cx="50" cy="49" rx="3" ry="2.5" fill="#1a0a12" stroke={accentColor} strokeWidth="0.5" />
        ) : mood === "love" ? (
          /* Pout */
          <path d="M45 48 Q50 46, 55 48" stroke={accentColor} strokeWidth="1" fill="none" strokeLinecap="round" />
        ) : (
          <>
            {/* Default smile with tiny fang */}
            <path d="M44 47 Q50 50, 56 47" stroke={accentColor} strokeWidth="0.8" fill="none" strokeLinecap="round" />
            <path d="M45.5 47.5 L45.8 49.5 L46.5 47.8" fill="white" opacity="0.8" />
          </>
        )}

        {/* Tail - curly with heart tip */}
        <path
          d="M50 62 Q56 66, 60 63 Q64 60, 66 63 Q68 66, 66 68"
          stroke={accentColor}
          strokeWidth="1.8"
          fill="none"
          strokeLinecap="round"
          opacity="0.65"
          style={{ animation: "hexxTail 2.5s ease-in-out infinite" }}
        />
        {/* Heart on tail tip */}
        <path d="M64.5 67 Q64.5 65.5, 66 66.5 Q67.5 65.5, 67.5 67 Q67.5 68.5, 66 70 Q64.5 68.5, 64.5 67 Z" fill={accentColor} opacity="0.5" />

        {/* Tiny paws */}
        <ellipse cx="43" cy="60" rx="3.5" ry="2" fill="#1c1c30" />
        <ellipse cx="57" cy="60" rx="3.5" ry="2" fill="#1c1c30" />

        {/* Zzz for sleepy */}
        {isSleep && (
          <g style={{ animation: "hexxZzz 2s ease-in-out infinite" }}>
            <text x="64" y="28" fill={accentColor} fontSize="10" fontWeight="bold" opacity="0.7">z</text>
            <text x="70" y="22" fill={accentColor} fontSize="7" fontWeight="bold" opacity="0.4">z</text>
          </g>
        )}

        {/* Angry vein */}
        {mood === "angry" && (
          <path d="M60 24 L63 26 L61 23 L64 25" stroke={accentColor} strokeWidth="1.2" fill="none" opacity="0.6" />
        )}

        {/* Sparkles when excited */}
        {mood === "excited" && (
          <g style={{ animation: "hexxSparkle 0.6s ease-in-out infinite" }}>
            <path d="M20 22 L21.5 18 L23 22 L27 20 L23 24 L21.5 28 L20 24 L16 26 Z" fill={accentColor} opacity="0.45" />
            <path d="M76 18 L77.5 14 L79 18 L83 16 L79 20 L77.5 24 L76 20 L72 22 Z" fill={accentColor} opacity="0.35" />
          </g>
        )}

        {/* Floating heart */}
        {(mood === "love" || clickCount >= 12) && !isClicked && (
          <g style={{ animation: "hexxHeart 1.5s ease-in-out infinite" }}>
            <path d="M47 14 Q47 11, 50 13 Q53 11, 53 14 Q53 17, 50 20 Q47 17, 47 14 Z" fill="#ff6b8a" opacity="0.45" />
          </g>
        )}
      </svg>

      <style>{`
        @keyframes hexxWingL {
          0%, 100% { transform: rotate(0deg) scaleY(1); }
          50% { transform: rotate(-15deg) scaleY(0.82); }
        }
        @keyframes hexxWingR {
          0%, 100% { transform: rotate(0deg) scaleY(1); }
          50% { transform: rotate(15deg) scaleY(0.82); }
        }
        @keyframes hexxBubbleIn {
          from { opacity: 0; transform: translateY(8px) scale(0.6); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes hexxTail {
          0%, 100% { transform: translateX(0) rotate(0deg); }
          50% { transform: translateX(3px) rotate(5deg); }
        }
        @keyframes hexxZzz {
          0%, 100% { transform: translateY(0); opacity: 0.7; }
          50% { transform: translateY(-6px); opacity: 0.3; }
        }
        @keyframes hexxSparkle {
          0%, 100% { transform: scale(1) rotate(0deg); opacity: 0.45; }
          50% { transform: scale(1.3) rotate(15deg); opacity: 0.8; }
        }
        @keyframes hexxHeart {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.45; }
          50% { transform: translateY(-5px) scale(1.2); opacity: 0.65; }
        }
      `}</style>
    </div>
  );
}
