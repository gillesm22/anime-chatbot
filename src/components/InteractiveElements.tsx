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
@keyframes ie-splash-drop {
  0%   { transform: translate(var(--dx), 0) scale(1); opacity: 0.9; }
  50%  { transform: translate(calc(var(--dx) * 1.5), var(--dy)) scale(0.8); opacity: 0.7; }
  100% { transform: translate(calc(var(--dx) * 1.8), calc(var(--dy) + 30px)) scale(0.2); opacity: 0; }
}
@keyframes ie-ripple {
  0%   { transform: scale(0); opacity: 0.6; border-width: 3px; }
  100% { transform: scale(1); opacity: 0; border-width: 1px; }
}
@keyframes ie-wave-swell {
  0%   { transform: scaleY(1) translateY(0); }
  30%  { transform: scaleY(1.15) translateY(-4px); }
  60%  { transform: scaleY(0.92) translateY(2px); }
  100% { transform: scaleY(1) translateY(0); }
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
  0%   { transform: translateX(0) translateY(0) rotate(0deg); }
  5%   { transform: translateX(8px) translateY(-3px) rotate(-4deg); }
  10%  { transform: translateX(18px) translateY(0) rotate(3deg); }
  15%  { transform: translateX(28px) translateY(-2px) rotate(-3deg); }
  20%  { transform: translateX(40px) translateY(0) rotate(4deg); }
  25%  { transform: translateX(50px) translateY(-3px) rotate(-2deg); }
  30%  { transform: translateX(55px) translateY(0) rotate(0deg); }
  35%  { transform: translateX(50px) translateY(-2px) rotate(3deg); }
  40%  { transform: translateX(38px) translateY(0) rotate(-4deg); }
  45%  { transform: translateX(25px) translateY(-3px) rotate(3deg); }
  50%  { transform: translateX(10px) translateY(0) rotate(-2deg); }
  55%  { transform: translateX(0) translateY(-2px) rotate(0deg); }
  60%  { transform: translateX(-12px) translateY(0) rotate(3deg); }
  65%  { transform: translateX(-25px) translateY(-3px) rotate(-4deg); }
  70%  { transform: translateX(-35px) translateY(0) rotate(3deg); }
  75%  { transform: translateX(-40px) translateY(-2px) rotate(-2deg); }
  80%  { transform: translateX(-35px) translateY(0) rotate(4deg); }
  85%  { transform: translateX(-22px) translateY(-3px) rotate(-3deg); }
  90%  { transform: translateX(-10px) translateY(0) rotate(2deg); }
  95%  { transform: translateX(-3px) translateY(-2px) rotate(-1deg); }
  100% { transform: translateX(0) translateY(0) rotate(0deg); }
}
@keyframes ie-crab-blink {
  0%, 85%, 100% { transform: scaleY(1); }
  90% { transform: scaleY(0.1); }
  92% { transform: scaleY(1); }
  96% { transform: scaleY(0.1); }
}
@keyframes ie-crab-claw-snip-l {
  0%, 80%, 100% { transform: rotate(-20deg); }
  85% { transform: rotate(-35deg); }
  90% { transform: rotate(-10deg); }
  95% { transform: rotate(-30deg); }
}
@keyframes ie-crab-claw-snip-r {
  0%, 80%, 100% { transform: rotate(20deg); }
  85% { transform: rotate(35deg); }
  90% { transform: rotate(10deg); }
  95% { transform: rotate(30deg); }
}
@keyframes ie-crab-bubble {
  0% { transform: translateY(0) scale(1); opacity: 0.7; }
  50% { transform: translateY(-18px) scale(0.8); opacity: 0.5; }
  100% { transform: translateY(-30px) scale(0.2); opacity: 0; }
}
@keyframes ie-gentle-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}
@keyframes ie-gentle-sway {
  0%, 100% { transform: rotate(-3deg); }
  50% { transform: rotate(3deg); }
}
@keyframes ie-gentle-bob {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  25% { transform: translateY(-3px) rotate(1deg); }
  75% { transform: translateY(1px) rotate(-1deg); }
}
`;

function injectStyles() {
  if (typeof document === "undefined") return;
  // Always update styles so new animations are available
  let el = document.getElementById("ie-keyframes") as HTMLStyleElement | null;
  if (!el) {
    el = document.createElement("style");
    el.id = "ie-keyframes";
    document.head.appendChild(el);
  }
  el.textContent = STYLES;
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
      animation: "ie-crab-scuttle 6s linear infinite",
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
        animation: "ie-crab-claw-snip-l 3s ease-in-out infinite",
        transformOrigin: "right center",
        boxShadow: "0 1px 3px rgba(0,0,0,0.25)",
      }} />
      {/* Right claw */}
      <div style={{
        position: "absolute", right: "2%", top: "30%",
        width: clawS, height: clawS * 0.8,
        borderRadius: "20% 60% 30% 50%",
        background: "linear-gradient(225deg, #ff7b5a 0%, #e54525 100%)",
        animation: "ie-crab-claw-snip-r 3s ease-in-out infinite 0.15s",
        transformOrigin: "left center",
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
      {/* Bubbles */}
      <div style={{
        position: "absolute", top: "5%", right: "22%",
        width: 6, height: 6, borderRadius: "50%",
        background: "rgba(255,255,255,0.15)",
        border: "1.5px solid rgba(255,255,255,0.5)",
        animation: "ie-crab-bubble 2.5s ease-out infinite",
      }} />
      <div style={{
        position: "absolute", top: "12%", right: "15%",
        width: 4, height: 4, borderRadius: "50%",
        background: "rgba(255,255,255,0.1)",
        border: "1px solid rgba(255,255,255,0.4)",
        animation: "ie-crab-bubble 2.5s ease-out 0.8s infinite",
      }} />
      <div style={{
        position: "absolute", top: "8%", right: "32%",
        width: 5, height: 5, borderRadius: "50%",
        background: "rgba(255,255,255,0.12)",
        border: "1px solid rgba(255,255,255,0.45)",
        animation: "ie-crab-bubble 3s ease-out 1.5s infinite",
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

  // Splash ripples
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const [waveActive, setWaveActive] = useState(false);
  const rippleIdRef = useRef(0);

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

  const handleBeachAt = useCallback((e: React.MouseEvent) => {
    playSplash();
    const rect = containerRef.current?.getBoundingClientRect();
    const x = rect ? e.clientX - rect.left : e.clientX;
    const y = rect ? e.clientY - rect.top : e.clientY;
    const origin = { x, y };

    // Spray droplets in all directions from tap point
    const dropColors = ["#60b8e0", "#93d4f0", "#4aa8d4", "#b0e0f8", "#2196c8", "#ffffff"];
    for (let i = 0; i < 18; i++) {
      setTimeout(() => {
        const angle = (Math.PI * 2 * i) / 18 + (Math.random() - 0.5) * 0.4;
        const dist = 20 + Math.random() * 50;
        const ox = { x: origin.x + Math.cos(angle) * dist * 0.3, y: origin.y + Math.sin(angle) * dist * 0.3 };
        spawnParticles(1, ox, dropColors[i % dropColors.length], "ie-spray-up", 4 + Math.random() * 6, 600 + Math.random() * 500);
      }, i * 20);
    }

    // Big central spray upward
    spawnParticles(8, origin, "#b0e0f8", "ie-spray-up", 10, 900);

    // Ripple ring at tap point
    const id = rippleIdRef.current++;
    setRipples(prev => [...prev, { id, x, y }]);
    setTimeout(() => setRipples(prev => prev.filter(r => r.id !== id)), 800);

    // Wave swell
    setWaveActive(true);
    setTimeout(() => setWaveActive(false), 600);
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

  // Base style: invisible tap target — no borders, no pulse, no glow
  // Elements feel like part of the scene, not UI buttons
  const hotspot: React.CSSProperties = {
    position: "absolute",
    cursor: "pointer",
    borderRadius: "50%",
    transition: "transform 0.2s ease, filter 0.2s ease",
    userSelect: "none",
    WebkitUserSelect: "none",
    border: "none",
  };

  const hotspotHoverStyle = `
    .ie-hotspot:hover { transform: scale(1.08); filter: brightness(1.15); }
    .ie-hotspot:active { transform: scale(0.95); }
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

          {/* Ripple rings from water taps */}
          {ripples.map((r) => (
            <div
              key={r.id}
              style={{
                position: "absolute", left: r.x - 40, top: r.y - 40,
                width: 80, height: 80, borderRadius: "50%",
                border: "2px solid rgba(150, 220, 255, 0.6)",
                animation: "ie-ripple 0.8s ease-out forwards",
                pointerEvents: "none",
              }}
            />
          ))}

          {/* Render all visible interactables */}
          {visibleItems.map((item) => {
            const legacyHandler = legacySoundHandlers[item.id];
            const onClick = () => { legacyHandler?.(); handleDiscoveryTap(item); };

            // Special: beach water — interactive splash at tap point
            if (item.id === "beach-splash") {
              return (
                <div
                  key={item.id}
                  className="ie-hotspot"
                  style={{
                    ...hotspot,
                    left: `${item.position.x}%`, top: `${item.position.y}%`,
                    width: `${item.position.width}%`, height: `${item.position.height}%`,
                    borderRadius: 12,
                    background: "transparent",
                    cursor: "pointer",
                    animation: waveActive ? "ie-wave-swell 0.6s ease-out" : "none",
                  }}
                  onClick={(e) => { handleBeachAt(e); handleDiscoveryTap(item); }}
                  title={item.label}
                >
                  <span style={{
                    fontSize: 28, display: "flex", alignItems: "center", justifyContent: "center",
                    width: "100%", height: "100%",
                    filter: "drop-shadow(0 2px 4px rgba(0,80,120,0.3))",
                  }}>🌊</span>
                </div>
              );
            }

            // Special: neon sign — looks like an actual neon sign in the scene
            if (item.id === "cyberpunk-neon") {
              return (
                <div
                  key={item.id}
                  className="ie-hotspot"
                  style={{
                    ...hotspot,
                    right: "6%", top: "5%", width: 120, height: 56, borderRadius: 8,
                    background: "transparent",
                    animation: neonOn ? "ie-neon-flicker 6s infinite" : "none",
                    transition: "all 0.3s ease",
                  }}
                  onClick={onClick}
                  title={item.label}
                >
                  <span style={{
                    fontSize: 14, fontWeight: 700, letterSpacing: 2,
                    color: neonOn ? "#ff88ff" : "#44224488",
                    lineHeight: "56px", display: "block", textAlign: "center",
                    textShadow: neonOn ? "0 0 12px #ff00ff, 0 0 24px #ff00ff66" : "none",
                    transition: "all 0.3s ease",
                  }}>NEON BAR</span>
                </div>
              );
            }

            // Special: fireplace — warm glow when on
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
                    background: "transparent",
                    filter: fireOn ? "brightness(1.1)" : "brightness(0.8)",
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

            // Special: moon — natural glow on full moon
            if (item.id === "moonlight-moon") {
              return (
                <div
                  key={item.id}
                  className="ie-hotspot"
                  style={{
                    ...hotspot,
                    left: `${item.position.x}%`, top: `${item.position.y}%`,
                    width: 90, height: 90,
                    background: "transparent",
                    filter: moonPhase === 4 ? `drop-shadow(0 0 20px rgba(255,252,220,0.6))` : "none",
                    transition: "filter 0.5s ease",
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

            // Ambient idle animations per element — makes the world feel alive
            const idleAnimations: Record<string, string> = {
              "sakura-butterfly": "ie-gentle-float 3s ease-in-out infinite",
              "sakura-windchime": "ie-gentle-sway 4s ease-in-out infinite",
              "beach-shell": "ie-gentle-bob 5s ease-in-out infinite",
              "cafe-cat": "ie-gentle-float 4s ease-in-out infinite 1s",
              "rain-frog": "ie-gentle-bob 3s ease-in-out infinite",
              "rain-umbrella": "ie-gentle-sway 5s ease-in-out infinite",
              "nightsky-ufo": "ie-gentle-float 3s ease-in-out infinite",
              "moonlight-owl": "ie-gentle-bob 4s ease-in-out infinite",
              "moonlight-rose": "ie-gentle-sway 6s ease-in-out infinite",
              "morning-bird": "ie-gentle-float 2.5s ease-in-out infinite",
              "sunset-musician": "ie-gentle-sway 4s ease-in-out infinite",
              "lab-flask": "ie-gentle-bob 3s ease-in-out infinite",
              "cozy-teddy": "ie-gentle-float 5s ease-in-out infinite",
            };
            const idleAnim = idleAnimations[item.id];

            // Shimmer mode — mysterious environmental hint
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
                    background: "transparent",
                    animation: idleAnim || "ie-shimmer 3s ease-in-out infinite",
                  }}
                  onClick={onClick}
                  title=""
                >
                  <span style={{
                    fontSize: emojiSize,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    width: "100%", height: "100%",
                    opacity: 0.25,
                    filter: "blur(2px) saturate(0.5)",
                  }}>
                    {item.emoji}
                  </span>
                </div>
              );
            }

            // Dim mode — visible but blends into scene
            const isDim = item.displayMode === "dim";

            // Default: no background, just the emoji sitting in the scene
            return (
              <div
                key={item.id}
                className="ie-hotspot"
                style={{
                  ...hotspot,
                  ...posX, ...posY,
                  width: elWidth, height: elHeight,
                  borderRadius: isLargeArea ? 12 : "50%",
                  background: "transparent",
                  opacity: isDim ? 0.65 : 1,
                  animation: idleAnim || "none",
                }}
                onClick={onClick}
                title={item.label}
              >
                {item.emoji && (
                  <span style={{
                    fontSize: emojiSize,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    width: "100%", height: "100%",
                    filter: isDim ? "saturate(0.7)" : "none",
                    transition: "filter 0.3s ease",
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
