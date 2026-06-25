"use client";

import React, { useState, useCallback, useRef } from "react";

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

const MOON_PHASES = ["🌑", "🌒", "🌓", "🌔", "🌕"];

// ─── Main component ───────────────────────────────────────────────────────────

export interface InteractiveElementsProps {
  sceneId: string;
  accentColor: string;
}

export function InteractiveElements({ sceneId, accentColor }: InteractiveElementsProps) {
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

  // ── scene definitions ──

  function renderScene() {
    switch (sceneId) {
      case "sakura":
        return (
          <>
            {/* tree hotspot top-left */}
            <div
              className="ie-hotspot"
              style={{ ...hotspot, left: "6%", top: "6%", width: 100, height: 100, background: "#ff8fab18" }}
              onClick={handleSakura}
              title="Shake the sakura tree"
            >
              <span style={{ fontSize: 42, lineHeight: "100px", display: "block", textAlign: "center" }}>🌸</span>
            </div>
          </>
        );

      case "beach":
        return (
          <>
            {/* water area bottom */}
            <div
              className="ie-hotspot"
              style={{
                ...hotspot,
                left: "20%",
                bottom: "5%",
                width: "60%",
                height: 60,
                borderRadius: 12,
                background: "#4aa8d418",
              }}
              onClick={handleBeach}
              title="Splash the water"
            >
              <span style={{ fontSize: 28, lineHeight: "60px", display: "block", textAlign: "center" }}>🌊</span>
            </div>
          </>
        );

      case "cyberpunk":
        return (
          <>
            {/* neon sign top-right */}
            <div
              className="ie-hotspot"
              style={{
                ...hotspot,
                right: "6%",
                top: "5%",
                width: 120,
                height: 56,
                borderRadius: 8,
                background: neonOn ? "#ff00ff22" : "#33003322",
                animation: neonOn
                  ? "ie-neon-flicker 6s infinite, ie-hotspot-pulse 2.5s ease-in-out infinite"
                  : "ie-hotspot-pulse 2.5s ease-in-out infinite",
                boxShadow: neonOn ? `0 0 18px 4px #ff00ffaa` : "none",
                transition: "all 0.3s ease",
              }}
              onClick={handleCyberpunk}
              title="Toggle neon sign"
            >
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  letterSpacing: 2,
                  color: neonOn ? "#ff88ff" : "#663366",
                  lineHeight: "56px",
                  display: "block",
                  textAlign: "center",
                  textShadow: neonOn ? "0 0 8px #ff00ff" : "none",
                }}
              >
                NEON BAR
              </span>
            </div>
          </>
        );

      case "cafe":
        return (
          <>
            {/* cup bottom-right */}
            <div
              className="ie-hotspot"
              style={{
                ...hotspot,
                right: "8%",
                bottom: "12%",
                width: 80,
                height: 80,
                background: "#c8a06018",
              }}
              onClick={handleCafe}
              title="Tap the coffee cup"
            >
              <span style={{ fontSize: 40, lineHeight: "80px", display: "block", textAlign: "center" }}>☕</span>
            </div>
          </>
        );

      case "rain":
        return (
          <>
            {/* window center */}
            <div
              className="ie-hotspot"
              style={{
                ...hotspot,
                left: "35%",
                top: "20%",
                width: "30%",
                height: "45%",
                borderRadius: 10,
                background: "#a0c8e818",
              }}
              onClick={handleRain}
              title="Tap the window"
            >
              <span
                style={{
                  fontSize: 36,
                  display: "block",
                  textAlign: "center",
                  lineHeight: "calc(45vh * 0.45)",
                  paddingTop: "20%",
                }}
              >
                🌩️
              </span>
            </div>
            {showLightning && (
              <div
                style={{
                  position: "fixed",
                  inset: 0,
                  background: "white",
                  opacity: 0,
                  animation: "ie-lightning-flash 150ms ease-out forwards",
                  pointerEvents: "none",
                  zIndex: 999,
                }}
              />
            )}
          </>
        );

      case "night_sky":
        return (
          <>
            {/* sky area top */}
            <div
              className="ie-hotspot"
              style={{
                ...hotspot,
                left: "10%",
                top: "2%",
                width: "80%",
                height: "35%",
                borderRadius: 16,
                background: "#1a1a4018",
              }}
              onClick={handleNightSky}
              title="Make a shooting star"
            >
              <span style={{ fontSize: 28, display: "block", textAlign: "center", paddingTop: "8%" }}>✨</span>
            </div>
          </>
        );

      case "cozy_room":
        return (
          <>
            {/* fire glow overlay */}
            {fireOn && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "radial-gradient(ellipse 50% 40% at 50% 100%, rgba(255,120,20,0.28) 0%, transparent 70%)",
                  animation: "ie-fire-glow 2s ease-in-out infinite",
                  pointerEvents: "none",
                  borderRadius: "inherit",
                }}
              />
            )}
            {/* fireplace bottom-center */}
            <div
              className="ie-hotspot"
              style={{
                ...hotspot,
                left: "38%",
                bottom: "5%",
                width: "24%",
                height: 70,
                borderRadius: 10,
                background: fireOn ? "#ff8c0028" : "#33220018",
                boxShadow: fireOn ? "0 0 20px 6px #ff6600aa" : "none",
                transition: "all 0.4s ease",
              }}
              onClick={handleCozyRoom}
              title={fireOn ? "Extinguish the fire" : "Light the fire"}
            >
              <span style={{ fontSize: 34, lineHeight: "70px", display: "block", textAlign: "center" }}>
                {fireOn ? "🔥" : "🪵"}
              </span>
            </div>
          </>
        );

      case "moonlight":
        return (
          <>
            {/* moon top-center */}
            <div
              className="ie-hotspot"
              style={{
                ...hotspot,
                left: "42%",
                top: "4%",
                width: 90,
                height: 90,
                background: "#fffbe018",
                boxShadow: moonPhase === 4 ? "0 0 30px 10px #fffbe088" : "none",
                transition: "box-shadow 0.5s ease",
              }}
              onClick={handleMoonlight}
              title="Cycle moon phases"
            >
              <span style={{ fontSize: 50, lineHeight: "90px", display: "block", textAlign: "center" }}>
                {MOON_PHASES[moonPhase]}
              </span>
            </div>
          </>
        );

      default:
        return null;
    }
  }

  return (
    <>
      <style>{hotspotHoverStyle}</style>
      <div
        ref={containerRef}
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          zIndex: 5, // above background, below character sprite
        }}
      >
        {/* hotspots need pointer events */}
        <div style={{ position: "absolute", inset: 0, pointerEvents: "auto" }}>{renderScene()}</div>
        {/* particles always on top of hotspots, no pointer events */}
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>{renderParticles()}</div>
      </div>
    </>
  );
}
