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

type HexxMood = "neutral" | "happy" | "angry" | "sleepy" | "excited" | "love" | "smug" | "sad" | "surprised" | "shy" | "grumpy" | "curious";

const ALL_MOODS: HexxMood[] = ["neutral", "happy", "angry", "sleepy", "excited", "love", "smug", "sad", "surprised", "shy", "grumpy", "curious"];

const HEXX_SPRITES: Record<HexxMood, string> = {
  neutral: "/sprites/hexx/neutral.png",
  happy: "/sprites/hexx/happy.png",
  angry: "/sprites/hexx/angry.png",
  sleepy: "/sprites/hexx/zzz.png",
  excited: "/sprites/hexx/excited.png",
  love: "/sprites/hexx/love.png",
  smug: "/sprites/hexx/smug.png",
  sad: "/sprites/hexx/sad.png",
  surprised: "/sprites/hexx/surprised.png",
  shy: "/sprites/hexx/shy.png",
  grumpy: "/sprites/hexx/grumpy.png",
  curious: "/sprites/hexx/curious.png",
};

const HEXX_PHRASES: Record<HexxMood, string[]> = {
  neutral: ["*yawn*", "sup", "...", "*wing stretch*", "bored", "yo", "meh", "hmm"],
  happy: ["hehe", "yooo", "*flap flap*", "no way", "oh?!", "kyaa~!", "nice~"],
  angry: ["tch", "rude", "fight me", "*hiss*", "grr", "wow ok", "try that again"],
  sleepy: ["zzz", "...zzz", "*snore*", "5 more min", "wake me never", "*curls up*"],
  excited: ["!!!", "LET'S GO", "yooo", "no way", "oh?!", "LETS GOOOO"],
  love: ["...", "hmph", "not cute", "*looks away*", "whatever", "...fine", "b-baka"],
  smug: ["heh", "called it", "told ya", "*smirk*", "ez", "smooth", "classic", "too easy~"],
  sad: ["...", "oh", "*sniff*", "it's fine", "whatever"],
  surprised: ["!!!", "wait what", "bruh", "no way", "eep"],
  shy: ["...", "um", "*hides*", "don't look", "..."],
  grumpy: ["tch", "leave me alone", "not in the mood", "ugh"],
  curious: ["hmm?", "what's that", "interesting...", "tell me more"],
};

function getHexxMood(expression?: Expression, isIdle?: boolean): HexxMood {
  if (isIdle) return "sleepy";
  if (!expression) return "neutral";
  switch (expression) {
    case "happy": case "laugh": return "happy";
    case "excited": return "excited";
    case "sad": case "crying": return "sad";
    case "angry": return "angry";
    case "flustered": case "devoted": return "love";
    case "shy": return "shy";
    case "smirk": case "teasing": return "smug";
    case "jealous": return "grumpy";
    case "sleepy": return "sleepy";
    case "surprised": return "surprised";
    case "thinking": return "curious";
    default: return "neutral";
  }
}

const MIN_SIZE = 60;
const MAX_SIZE = 200;
const DEFAULT_SIZE = 100;
const SIZE_KEY = "anime-chatbot-hexx-size";

export function BloodBat({ expression, accentColor = "#b71c1c", isIdle, isAudioPlaying, landingMode }: BloodBatProps) {
  const [mood, setMood] = useState<HexxMood>("neutral");
  const [phrase, setPhrase] = useState<string | null>(null);
  const [isClicked, setIsClicked] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [headTilt, setHeadTilt] = useState(0);
  const [size, setSize] = useState(DEFAULT_SIZE);
  const phraseTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const tiltTimer = useRef<ReturnType<typeof setInterval>>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);

  // Drag state
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, px: 0, py: 0 });
  const hasMoved = useRef(false);

  // Load saved size
  useEffect(() => {
    try {
      const saved = localStorage.getItem(SIZE_KEY);
      if (saved) setSize(Math.min(MAX_SIZE, Math.max(MIN_SIZE, Number(saved))));
    } catch {}
  }, []);

  // Scroll wheel to resize
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      setSize((prev) => {
        const next = Math.min(MAX_SIZE, Math.max(MIN_SIZE, prev - e.deltaY * 0.3));
        try { localStorage.setItem(SIZE_KEY, String(Math.round(next))); } catch {}
        return next;
      });
    };
    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, []);

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
      setIsClicked(true);
      setTimeout(() => setIsClicked(false), 500);
      setClickCount((c) => c + 1);

      // Click cycles through expressions
      const nextMoodIdx = (ALL_MOODS.indexOf(mood) + 1) % ALL_MOODS.length;
      const nextMood = ALL_MOODS[nextMoodIdx];
      setMood(nextMood);

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
  }, [clickCount, mood]);

  // Auto mood from character expression (only override if not manually cycling)
  useEffect(() => {
    const newMood = getHexxMood(expression, isIdle);
    if (newMood !== mood) {
      setMood(newMood);
      if (newMood !== "neutral" && newMood !== "sleepy") {
        const phrases = HEXX_PHRASES[newMood];
        setPhrase(phrases[Math.floor(Math.random() * phrases.length)]);
        if (phraseTimer.current) clearTimeout(phraseTimer.current);
        phraseTimer.current = setTimeout(() => setPhrase(null), 2500);
      }
    }
  }, [expression, isIdle]);

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

  const spriteUrl = HEXX_SPRITES[mood] || HEXX_SPRITES.neutral;
  const bodySquish = isClicked ? "scaleY(0.88) scaleX(1.08)" : isHovered ? "scaleY(1.03)" : "scaleY(1)";
  const bubbleSize = Math.max(12, Math.round(size * 0.14));

  return (
    <div
      ref={containerRef}
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
      title="Hexx (click to change expression, scroll to resize, drag to move!)"
    >
      {/* Speech bubble */}
      {phrase && (
        <div
          style={{
            position: "absolute",
            bottom: "100%",
            right: "-8px",
            marginBottom: "8px",
            padding: `${Math.max(5, bubbleSize * 0.5)}px ${Math.max(10, bubbleSize)}px`,
            borderRadius: "14px 14px 4px 14px",
            background: "rgba(10,10,16,0.94)",
            border: "1.5px solid rgba(183,28,28,0.5)",
            color: "#f0e0e4",
            fontSize: `${bubbleSize}px`,
            fontWeight: 700,
            whiteSpace: "nowrap",
            animation: "hexxBubbleIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)",
            letterSpacing: "0.01em",
            boxShadow: "0 4px 16px rgba(0,0,0,0.4), 0 0 8px rgba(183,28,28,0.15)",
            fontFamily: "var(--font-dialogue, 'Zen Maru Gothic', sans-serif)",
          }}
        >
          <span style={{ color: "#b71c1c", marginRight: 4, fontSize: `${Math.max(9, bubbleSize * 0.7)}px`, opacity: 0.6 }}>Hexx:</span>
          {phrase}
          <div style={{
            position: "absolute", bottom: "-6px", right: "16px", width: 0, height: 0,
            borderLeft: "6px solid transparent", borderRight: "3px solid transparent",
            borderTop: "6px solid rgba(10,10,16,0.94)",
          }} />
        </div>
      )}

      {/* Hexx PNG sprite - rendered at 2x for retina crispness */}
      <img
        src={spriteUrl}
        alt={`Hexx - ${mood}`}
        draggable={false}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          objectFit: "contain",
          transition: "transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), filter 0.3s ease, width 0.2s ease, height 0.2s ease",
          transform: `rotate(${mood === "sleepy" ? 180 : headTilt}deg) ${bodySquish}`,
          filter: `drop-shadow(0 3px 10px rgba(183,28,28,0.4)) ${isHovered ? "drop-shadow(0 0 16px rgba(183,28,28,0.3)) brightness(1.05)" : ""}`,
          imageRendering: "auto",
        }}
      />

      {/* Size indicator on hover */}
      {isHovered && (
        <div style={{
          position: "absolute",
          bottom: "-14px",
          left: "50%",
          transform: "translateX(-50%)",
          fontSize: "8px",
          color: "rgba(255,255,255,0.3)",
          whiteSpace: "nowrap",
        }}>
          scroll to resize
        </div>
      )}

      <style>{`
        @keyframes hexxBubbleIn {
          from { opacity: 0; transform: translateY(8px) scale(0.6); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
