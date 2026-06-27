"use client";

import React, { useState, useCallback, useRef } from "react";
import {
  getInteractablesForScene,
  getVisibleInteractables,
  recordTap,
  getReactionLine,
  buildDiscoveryContext,
  type VisibleInteractable,
} from "@/lib/discoveries";
import { getAffinity, addAffinityPoints } from "@/lib/affinity";
import { updateQuestProgress } from "@/lib/quests";
import { addDiaryEntry } from "@/lib/diary";
import { playDiscoveryChime } from "@/lib/sounds";
import { haptic } from "@/lib/haptics";

// ─── Web Audio helpers ────────────────────────────────────────────────────────

let _audioCtx: AudioContext | null = null;

function getAudioCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    if (!_audioCtx || _audioCtx.state === "closed") {
      _audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (_audioCtx.state === "suspended") _audioCtx.resume();
    return _audioCtx;
  } catch {
    return null;
  }
}

function playWhoosh() {
  const ctx = getAudioCtx();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(600, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.4);
  gain.gain.setValueAtTime(0.3, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.4);
}

function playSplash() {
  const ctx = getAudioCtx();
  if (!ctx) return;
  const bufSize = ctx.sampleRate * 0.4;
  const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufSize);
  const src = ctx.createBufferSource();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = 800;
  src.buffer = buf;
  src.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  gain.gain.setValueAtTime(0.4, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
  src.start();
}

function playBuzz() {
  const ctx = getAudioCtx();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = "square";
  osc.frequency.value = 120;
  gain.gain.setValueAtTime(0.2, ctx.currentTime);
  gain.gain.setValueAtTime(0, ctx.currentTime + 0.05);
  gain.gain.setValueAtTime(0.15, ctx.currentTime + 0.08);
  gain.gain.setValueAtTime(0, ctx.currentTime + 0.12);
  gain.gain.setValueAtTime(0.1, ctx.currentTime + 0.15);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.3);
}

function playClink() {
  const ctx = getAudioCtx();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = "sine";
  osc.frequency.setValueAtTime(2200, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(1800, ctx.currentTime + 0.3);
  gain.gain.setValueAtTime(0.4, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.5);
}

function playThunder() {
  const ctx = getAudioCtx();
  if (!ctx) return;
  const bufSize = ctx.sampleRate * 1.5;
  const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.5));
  const src = ctx.createBufferSource();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 300;
  src.buffer = buf;
  src.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  gain.gain.setValueAtTime(0.8, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);
  src.start();
}

function playTwinkle() {
  const ctx = getAudioCtx();
  if (!ctx) return;
  const freqs = [1047, 1319, 1568, 2093];
  freqs.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.value = freq;
    const t = ctx.currentTime + i * 0.08;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.2, t + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    osc.start(t);
    osc.stop(t + 0.3);
  });
}

function playCrackle() {
  const ctx = getAudioCtx();
  if (!ctx) return;
  const bufSize = ctx.sampleRate * 0.6;
  const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufSize; i++) {
    data[i] = Math.random() < 0.05 ? (Math.random() * 2 - 1) * 0.8 : 0;
  }
  const src = ctx.createBufferSource();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  filter.type = "highshelf";
  filter.frequency.value = 3000;
  filter.gain.value = 6;
  src.buffer = buf;
  src.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  gain.gain.setValueAtTime(0.5, ctx.currentTime);
  src.start();
}

function playHowl() {
  const ctx = getAudioCtx();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = "sine";
  osc.frequency.setValueAtTime(300, ctx.currentTime);
  osc.frequency.linearRampToValueAtTime(700, ctx.currentTime + 0.5);
  osc.frequency.linearRampToValueAtTime(500, ctx.currentTime + 1.0);
  osc.frequency.linearRampToValueAtTime(600, ctx.currentTime + 1.2);
  gain.gain.setValueAtTime(0, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + 0.2);
  gain.gain.setValueAtTime(0.25, ctx.currentTime + 1.0);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.3);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 1.3);
}

// ─── Particle spawner ─────────────────────────────────────────────────────────

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  animation: string;
  size: number;
  duration: number;
}

let particleId = 0;

function useParticles() {
  const [particles, setParticles] = useState<Particle[]>([]);

  const spawnParticles = useCallback(
    (
      count: number,
      origin: { x: number; y: number },
      color: string,
      animation: string,
      size = 8,
      duration = 1000
    ) => {
      const next: Particle[] = Array.from({ length: count }, () => ({
        id: particleId++,
        x: origin.x + (Math.random() - 0.5) * 60,
        y: origin.y + (Math.random() - 0.5) * 30,
        color,
        animation,
        size,
        duration,
      }));
      setParticles((prev) => [...prev, ...next]);
      setTimeout(() => {
        const ids = new Set(next.map((p) => p.id));
        setParticles((prev) => prev.filter((p) => !ids.has(p.id)));
      }, duration + 100);
    },
    []
  );

  return { particles, spawnParticles };
}

// ─── CSS keyframes injected once ─────────────────────────────────────────────

const STYLES = `
@keyframes ie-petal-fall {
  0%   { transform: translateY(0) rotate(0deg) scale(1); opacity: 1; }
  100% { transform: translateY(120px) rotate(360deg) scale(0.4); opacity: 0; }
}
@keyframes ie-spray-up {
  0%   { transform: translateY(0) scale(1); opacity: 1; }
  100% { transform: translateY(-90px) scale(0.3); opacity: 0; }
}
@keyframes ie-steam-up {
  0%   { transform: translateY(0) scale(1); opacity: 0.7; }
  100% { transform: translateY(-80px) scale(1.6); opacity: 0; }
}
@keyframes ie-star-streak {
  0%   { transform: translate(0, 0) scale(1); opacity: 1; }
  100% { transform: translate(160px, 90px) scale(0.1); opacity: 0; }
}
@keyframes ie-fire-glow {
  0%, 100% { opacity: 0.18; }
  50%       { opacity: 0.32; }
}
@keyframes ie-neon-flicker {
  0%, 19%, 21%, 23%, 25%, 54%, 56%, 100% { opacity: 1; }
  20%, 22%, 24%, 55%                     { opacity: 0.1; }
}
@keyframes ie-hotspot-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(255,255,255,0.0); }
  50%       { box-shadow: 0 0 12px 4px rgba(255,255,255,0.25); }
}
@keyframes ie-lightning-flash {
  0%   { opacity: 0.8; }
  100% { opacity: 0; }
}
@keyframes ie-shimmer {
  0%, 100% { opacity: 0.15; transform: scale(0.95); }
  50% { opacity: 0.6; transform: scale(1.05); }
}
@keyframes ie-crab-scuttle {
  0%   { transform: translateX(0) scaleX(1); }
  15%  { transform: translateX(12px) scaleX(1) rotate(-3deg); }
  30%  { transform: translateX(8px) scaleX(1) rotate(2deg); }
  45%  { transform: translateX(16px) scaleX(1) rotate(-2deg); }
  50%  { transform: translateX(16px) scaleX(-1); }
  65%  { transform: translateX(4px) scaleX(-1) rotate(3deg); }
  80%  { transform: translateX(-4px) scaleX(-1) rotate(-2deg); }
  95%  { transform: translateX(0) scaleX(-1) rotate(1deg); }
  100% { transform: translateX(0) scaleX(1); }
}
@keyframes ie-crab-blink {
  0%, 90%, 100% { transform: scaleY(1); }
  95% { transform: scaleY(0.1); }
}
@keyframes ie-crab-bubble {
  0% { transform: translateY(0) scale(1); opacity: 0.8; }
  100% { transform: translateY(-14px) scale(0.3); opacity: 0; }
}
`;

function injectStyles() {
  if (typeof document === "undefined") return;
  if (document.getElementById("ie-keyframes")) return;
  const el = document.createElement("style");
  el.id = "ie-keyframes";
  el.textContent = STYLES;
  document.head.appendChild(el);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function KawaiiCrab({ size = 48 }: { size?: number }) {
  const s = size;
  const bodyW = s * 0.7;
  const bodyH = s * 0.45;
  const eyeR = s * 0.07;
  const clawS = s * 0.22;

  return (
    <div style={{
      width: s, height: s, position: "relative",
      animation: "ie-crab-scuttle 4s ease-in-out infinite",
    }}>
      {/* Body */}
      <div style={{
        position: "absolute",
        left: "50%", top: "45%",
        transform: "translate(-50%, -50%)",
        width: bodyW, height: bodyH,
        borderRadius: "50% 50% 45% 45%",
        background: "linear-gradient(180deg, #ff6b4a 0%, #e54525 60%, #cc3b1d 100%)",
        boxShadow: "0 2px 6px rgba(0,0,0,0.3), inset 0 -2px 4px rgba(0,0,0,0.15), inset 0 3px 6px rgba(255,180,150,0.3)",
      }}>
        {/* Eyes */}
        <div style={{
          position: "absolute", top: "30%", left: "28%",
          width: eyeR * 2.4, height: eyeR * 2.4,
          borderRadius: "50%", background: "white",
          boxShadow: "0 1px 2px rgba(0,0,0,0.2)",
        }}>
          <div style={{
            position: "absolute", top: "25%", left: "30%",
            width: eyeR * 1.4, height: eyeR * 1.4,
            borderRadius: "50%", background: "#1a1a2e",
            animation: "ie-crab-blink 4s ease-in-out infinite",
          }}>
            <div style={{
              position: "absolute", top: "15%", left: "20%",
              width: eyeR * 0.5, height: eyeR * 0.5,
              borderRadius: "50%", background: "white",
            }} />
          </div>
        </div>
        <div style={{
          position: "absolute", top: "30%", right: "28%",
          width: eyeR * 2.4, height: eyeR * 2.4,
          borderRadius: "50%", background: "white",
          boxShadow: "0 1px 2px rgba(0,0,0,0.2)",
        }}>
          <div style={{
            position: "absolute", top: "25%", left: "30%",
            width: eyeR * 1.4, height: eyeR * 1.4,
            borderRadius: "50%", background: "#1a1a2e",
            animation: "ie-crab-blink 4s ease-in-out infinite 0.1s",
          }}>
            <div style={{
              position: "absolute", top: "15%", left: "20%",
              width: eyeR * 0.5, height: eyeR * 0.5,
              borderRadius: "50%", background: "white",
            }} />
          </div>
        </div>
        {/* Mouth - kawaii smile */}
        <div style={{
          position: "absolute", bottom: "22%", left: "50%",
          transform: "translateX(-50%)",
          width: s * 0.12, height: s * 0.05,
          borderRadius: "0 0 50% 50%",
          border: "1.5px solid #a02010",
          borderTop: "none",
        }} />
        {/* Cheek blush */}
        <div style={{
          position: "absolute", top: "52%", left: "12%",
          width: s * 0.1, height: s * 0.06,
          borderRadius: "50%", background: "rgba(255,150,150,0.5)",
        }} />
        <div style={{
          position: "absolute", top: "52%", right: "12%",
          width: s * 0.1, height: s * 0.06,
          borderRadius: "50%", background: "rgba(255,150,150,0.5)",
        }} />
      </div>
      {/* Left claw */}
      <div style={{
        position: "absolute", left: "2%", top: "30%",
        width: clawS, height: clawS * 0.8,
        borderRadius: "60% 20% 50% 30%",
        background: "linear-gradient(135deg, #ff7b5a 0%, #e54525 100%)",
        transform: "rotate(-20deg)",
        boxShadow: "0 1px 3px rgba(0,0,0,0.25)",
      }} />
      {/* Right claw */}
      <div style={{
        position: "absolute", right: "2%", top: "30%",
        width: clawS, height: clawS * 0.8,
        borderRadius: "20% 60% 30% 50%",
        background: "linear-gradient(225deg, #ff7b5a 0%, #e54525 100%)",
        transform: "rotate(20deg)",
        boxShadow: "0 1px 3px rgba(0,0,0,0.25)",
      }} />
      {/* Legs - 3 per side */}
      {[-1, 1].map((side) =>
        [0, 1, 2].map((i) => (
          <div
            key={`leg-${side}-${i}`}
            style={{
              position: "absolute",
              [side === -1 ? "left" : "right"]: "18%",
              top: `${48 + i * 12}%`,
              width: s * 0.14, height: 2,
              background: "#cc3b1d",
              borderRadius: 1,
              transform: `rotate(${side * (15 + i * 12)}deg)`,
            }}
          />
        ))
      )}
      {/* Tiny bubbles */}
      <div style={{
        position: "absolute", top: "10%", right: "25%",
        width: 4, height: 4, borderRadius: "50%",
        border: "1px solid rgba(255,255,255,0.5)",
        animation: "ie-crab-bubble 3s ease-out infinite",
      }} />
      <div style={{
        position: "absolute", top: "15%", right: "20%",
        width: 3, height: 3, borderRadius: "50%",
        border: "1px solid rgba(255,255,255,0.4)",
        animation: "ie-crab-bubble 3s ease-out 1.2s infinite",
      }} />
    </div>
  );
}

const MOON_PHASES = ["🌑", "🌒", "🌓", "🌔", "🌕"];

// ─── Main component ───────────────────────────────────────────────────────────

export interface InteractiveElementsProps {
  sceneId: string;
  accentColor: string;
  characterId?: string;
  onReaction?: (line: string, expression: string) => void;
  onDiscoveryContext?: (context: string) => void;
}

export function InteractiveElements({ sceneId, accentColor, characterId, onReaction, onDiscoveryContext }: InteractiveElementsProps) {
  injectStyles();

  const { particles, spawnParticles } = useParticles();

  // Toggle states
  const [neonOn, setNeonOn] = useState(true);
  const [fireOn, setFireOn] = useState(true);
  const [moonPhase, setMoonPhase] = useState(0); // index into MOON_PHASES
  const [showLightning, setShowLightning] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // ── helpers ──

  function relativeOrigin(xPct: number, yPct: number): { x: number; y: number } {
    const el = containerRef.current;
    if (!el) return { x: xPct * window.innerWidth, y: yPct * window.innerHeight };
    const rect = el.getBoundingClientRect();
    return { x: rect.width * xPct, y: rect.height * yPct };
  }

  // ── handlers ──

  const handleSakura = useCallback(() => {
    playWhoosh();
    const origin = relativeOrigin(0.12, 0.18);
    const colors = ["#ffb7c5", "#ff8fab", "#ffc8d3", "#e8a0b0", "#ffcdd8"];
    for (let i = 0; i < 10; i++) {
      setTimeout(() => {
        spawnParticles(1, origin, colors[i % colors.length], "ie-petal-fall", 10, 1200);
      }, i * 60);
    }
  }, [spawnParticles]);

  const handleBeach = useCallback(() => {
    playSplash();
    const origin = relativeOrigin(0.5, 0.88);
    const colors = ["#60b8e0", "#93d4f0", "#4aa8d4", "#b0e0f8", "#2196c8"];
    spawnParticles(12, origin, colors[0], "ie-spray-up", 9, 900);
    colors.slice(1).forEach((c, i) => {
      setTimeout(() => spawnParticles(2, origin, c, "ie-spray-up", 7, 700), (i + 1) * 50);
    });
  }, [spawnParticles]);

  const handleCyberpunk = useCallback(() => {
    playBuzz();
    setNeonOn((prev) => !prev);
  }, []);

  const handleCafe = useCallback(() => {
    playClink();
    const origin = relativeOrigin(0.82, 0.8);
    for (let i = 0; i < 6; i++) {
      setTimeout(() => {
        spawnParticles(1, origin, "rgba(255,255,255,0.75)", "ie-steam-up", 12, 1400);
      }, i * 120);
    }
  }, [spawnParticles]);

  const handleRain = useCallback(() => {
    playThunder();
    setShowLightning(true);
    setTimeout(() => setShowLightning(false), 150);
  }, []);

  const handleNightSky = useCallback(() => {
    playTwinkle();
    const origin = relativeOrigin(0.3 + Math.random() * 0.4, 0.05 + Math.random() * 0.2);
    spawnParticles(1, origin, "#fffbe0", "ie-star-streak", 6, 800);
    setTimeout(() => spawnParticles(3, origin, "#fff8c0", "ie-star-streak", 4, 600), 100);
  }, [spawnParticles]);

  const handleCozyRoom = useCallback(() => {
    playCrackle();
    setFireOn((prev) => !prev);
  }, []);

  const handleMoonlight = useCallback(() => {
    const nextPhase = (moonPhase + 1) % MOON_PHASES.length;
    setMoonPhase(nextPhase);
    if (nextPhase === 4) {
      // full moon
      playHowl();
    } else {
      playTwinkle();
    }
  }, [moonPhase]);

  // ── hotspot style ──

  const hotspot: React.CSSProperties = {
    position: "absolute",
    cursor: "pointer",
    borderRadius: "50%",
    animation: "ie-hotspot-pulse 2.5s ease-in-out infinite",
    transition: "filter 0.15s ease",
    userSelect: "none",
    WebkitUserSelect: "none",
    border: `1.5px solid ${accentColor}44`,
  };

  const hotspotHoverStyle = `
    .ie-hotspot:hover { filter: brightness(1.4) drop-shadow(0 0 8px ${accentColor}99) !important; }
  `;

  // ── render helpers ──

  function renderParticles() {
    return particles.map((p) => (
      <div
        key={p.id}
        style={{
          position: "absolute",
          left: p.x,
          top: p.y,
          width: p.size,
          height: p.size,
          borderRadius: "50%",
          backgroundColor: p.color,
          animation: `${p.animation} ${p.duration}ms ease-out forwards`,
          pointerEvents: "none",
        }}
      />
    ));
  }

  // ── discovery tap handler ──

  const handleDiscoveryTap = useCallback((item: VisibleInteractable) => {
    if (!characterId) return;
    const result = recordTap(characterId, item.id, item.cooldown);

    // Play discovery chime + sparkle for first-time hidden discoveries
    if (result.isFirstDiscovery && item.type === "hidden") {
      playDiscoveryChime();
      haptic.success();
      const origin = relativeOrigin(
        (item.position.x + item.position.width / 2) / 100,
        (item.position.y + item.position.height / 2) / 100
      );
      spawnParticles(8, origin, accentColor, "ie-star-streak", 6, 800);
    }

    // Affinity
    if (result.affinityEarned) {
      addAffinityPoints(characterId, { type: "message_sent" }, item.affinityPerTap);
    }

    // Quest progress
    updateQuestProgress(characterId, "interact");

    // First-time rewards
    if (result.isFirstDiscovery) {
      const reward = item.reward;
      if (reward.type === "affinity") {
        addAffinityPoints(characterId, { type: "message_sent" }, Number(reward.value));
      } else if (reward.type === "diary" && typeof reward.value === "string") {
        addDiaryEntry(characterId, reward.value, "happy", ["discovery", item.label]);
      }
      if (reward.type === "outfit" || reward.type === "scene") {
        addAffinityPoints(characterId, { type: "message_sent" }, 10);
      }

      // AI-generated reaction for first discovery of hidden elements
      if (item.aiOnFirstDiscovery && item.type === "hidden") {
        onDiscoveryContext?.(buildDiscoveryContext(item));
      }
    }

    // Character reaction (pre-written) — skip if AI will handle it
    if (!result.isFirstDiscovery || !item.aiOnFirstDiscovery) {
      const reaction = getReactionLine(item, characterId);
      if (reaction) {
        onReaction?.(reaction.line, reaction.expression);
      }
    }
  }, [characterId, accentColor, spawnParticles, onReaction, onDiscoveryContext]);

  // ── legacy sound handlers mapped by interactable ID ──

  const legacySoundHandlers: Record<string, () => void> = {
    "sakura-tree": handleSakura,
    "beach-splash": handleBeach,
    "cyberpunk-neon": handleCyberpunk,
    "cafe-coffee": handleCafe,
    "rain-thunder": handleRain,
    "nightsky-star": handleNightSky,
    "cozy-fire": handleCozyRoom,
    "moonlight-moon": handleMoonlight,
  };

  // ── data-driven rendering ──

  const affinityLevel = (typeof window !== "undefined" && characterId) ? getAffinity(characterId).level : 1;
  const sceneInteractables = getInteractablesForScene(sceneId);
  const visibleItems = characterId
    ? getVisibleInteractables(sceneInteractables, affinityLevel, characterId)
    : sceneInteractables.filter(i => i.type === "visible").map(i => ({ ...i, displayMode: "full" as const }));

  return (
    <>
      <style>{hotspotHoverStyle}</style>
      <div
        ref={containerRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 80, // above BottomNav
          pointerEvents: "none",
          zIndex: 15, // above sprite (z-10), below control bar (z-20)
        }}
      >
        <div style={{ position: "absolute", inset: 0, pointerEvents: "auto" }}>
          {/* Fire glow overlay */}
          {sceneId === "cozy_room" && fireOn && (
            <div
              style={{
                position: "absolute", inset: 0, pointerEvents: "none",
                background: "radial-gradient(ellipse 50% 40% at 50% 100%, rgba(255,120,20,0.28) 0%, transparent 70%)",
                animation: "ie-fire-glow 2s ease-in-out infinite",
                borderRadius: "inherit",
              }}
            />
          )}
          {/* Lightning flash */}
          {showLightning && (
            <div
              style={{
                position: "fixed", inset: 0, background: "white", opacity: 0,
                animation: "ie-lightning-flash 150ms ease-out forwards",
                pointerEvents: "none", zIndex: 999,
              }}
            />
          )}

          {/* Render all visible interactables */}
          {visibleItems.map((item) => {
            const legacyHandler = legacySoundHandlers[item.id];
            const onClick = () => { legacyHandler?.(); handleDiscoveryTap(item); };

            // Special: neon sign (text instead of emoji)
            if (item.id === "cyberpunk-neon") {
              return (
                <div
                  key={item.id}
                  className="ie-hotspot"
                  style={{
                    ...hotspot,
                    right: "6%", top: "5%", width: 120, height: 56, borderRadius: 8,
                    background: neonOn ? "#ff00ff22" : "#33003322",
                    animation: neonOn
                      ? "ie-neon-flicker 6s infinite, ie-hotspot-pulse 2.5s ease-in-out infinite"
                      : "ie-hotspot-pulse 2.5s ease-in-out infinite",
                    boxShadow: neonOn ? "0 0 18px 4px #ff00ffaa" : "none",
                    transition: "all 0.3s ease",
                  }}
                  onClick={onClick}
                  title={item.label}
                >
                  <span style={{
                    fontSize: 14, fontWeight: 700, letterSpacing: 2,
                    color: neonOn ? "#ff88ff" : "#663366",
                    lineHeight: "56px", display: "block", textAlign: "center",
                    textShadow: neonOn ? "0 0 8px #ff00ff" : "none",
                  }}>NEON BAR</span>
                </div>
              );
            }

            // Special: fireplace toggle
            if (item.id === "cozy-fire") {
              return (
                <div
                  key={item.id}
                  className="ie-hotspot"
                  style={{
                    ...hotspot,
                    left: `${item.position.x}%`, top: `${item.position.y}%`,
                    width: `${item.position.width}%`, height: 70,
                    borderRadius: 10,
                    background: fireOn ? "#ff8c0028" : "#33220018",
                    boxShadow: fireOn ? "0 0 20px 6px #ff6600aa" : "none",
                    transition: "all 0.4s ease",
                  }}
                  onClick={onClick}
                  title={fireOn ? "Extinguish the fire" : "Light the fire"}
                >
                  <span style={{ fontSize: 34, lineHeight: "70px", display: "block", textAlign: "center" }}>
                    {fireOn ? "🔥" : "🪵"}
                  </span>
                </div>
              );
            }

            // Special: moonlight moon (cycles phases)
            if (item.id === "moonlight-moon") {
              return (
                <div
                  key={item.id}
                  className="ie-hotspot"
                  style={{
                    ...hotspot,
                    left: `${item.position.x}%`, top: `${item.position.y}%`,
                    width: 90, height: 90,
                    background: "#fffbe018",
                    boxShadow: moonPhase === 4 ? "0 0 30px 10px #fffbe088" : "none",
                    transition: "box-shadow 0.5s ease",
                  }}
                  onClick={onClick}
                  title={item.label}
                >
                  <span style={{ fontSize: 50, lineHeight: "90px", display: "block", textAlign: "center" }}>
                    {MOON_PHASES[moonPhase]}
                  </span>
                </div>
              );
            }

            // Special: kawaii crab with scuttle animation
            if (item.id === "beach-crab") {
              return (
                <div
                  key={item.id}
                  className="ie-hotspot"
                  style={{
                    ...hotspot,
                    left: `${item.position.x}%`, top: `${item.position.y}%`,
                    width: 64, height: 64,
                    background: "transparent",
                    border: "none",
                    animation: "none",
                    opacity: item.displayMode === "shimmer" ? 0.4 : item.displayMode === "dim" ? 0.7 : 1,
                    filter: item.displayMode === "shimmer" ? "blur(1.5px)" : "none",
                  }}
                  onClick={onClick}
                  title={item.label}
                >
                  <KawaiiCrab size={52} />
                </div>
              );
            }

            // For small elements (<=15% wide), use fixed pixel sizes for consistent
            // tap targets across screen sizes. Large areas (like night sky) stay percentage.
            const isLargeArea = item.position.width > 15;
            const elWidth = isLargeArea ? `${item.position.width}%` : `${Math.max(60, item.position.width * 8)}px`;
            const elHeight = isLargeArea ? `${item.position.height}%` : `${Math.max(60, item.position.height * 8)}px`;
            const emojiSize = isLargeArea ? Math.min(36, item.position.height * 1.2) : Math.max(28, Math.min(42, item.position.height * 5));

            const posY = { top: `${item.position.y}%` };
            const posX = { left: `${item.position.x}%` };

            // Shimmer mode — glowing hint, tappable but no emoji visible
            if (item.displayMode === "shimmer") {
              return (
                <div
                  key={item.id}
                  className="ie-hotspot"
                  style={{
                    ...hotspot,
                    ...posX, ...posY,
                    width: elWidth, height: elHeight,
                    borderRadius: isLargeArea ? 12 : "50%",
                    background: `radial-gradient(circle, ${accentColor}30 0%, ${accentColor}08 60%, transparent 100%)`,
                    animation: "ie-shimmer 3s ease-in-out infinite",
                    border: `1px dashed ${accentColor}30`,
                  }}
                  onClick={onClick}
                  title="???"
                >
                  <span style={{
                    fontSize: emojiSize * 0.7,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    width: "100%", height: "100%",
                    opacity: 0.3,
                    filter: "blur(2px)",
                  }}>
                    {item.emoji}
                  </span>
                </div>
              );
            }

            // Dim mode — visible emoji hint, slightly transparent, inviting tap
            const isDim = item.displayMode === "dim";

            // Default rendering for all interactables
            return (
              <div
                key={item.id}
                className="ie-hotspot"
                style={{
                  ...hotspot,
                  ...posX, ...posY,
                  width: elWidth, height: elHeight,
                  borderRadius: isLargeArea ? 12 : "50%",
                  background: `${accentColor}${isDim ? "15" : "18"}`,
                  opacity: isDim ? 0.7 : 1,
                }}
                onClick={onClick}
                title={item.label}
              >
                {item.emoji && (
                  <span style={{
                    fontSize: emojiSize,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    width: "100%", height: "100%",
                    opacity: isDim ? 0.7 : 1,
                  }}>
                    {item.emoji}
                  </span>
                )}
              </div>
            );
          })}
        </div>
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>{renderParticles()}</div>
      </div>
    </>
  );
}
