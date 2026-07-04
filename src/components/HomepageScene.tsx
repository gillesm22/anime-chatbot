// src/components/HomepageScene.tsx
"use client";

import { useEffect, useState } from "react";
import { useParallax } from "@/lib/parallax";

// --- Particle types ---
interface Particle {
  id: number;
  x: number;  // %
  y: number;  // %
  size: number; // px
  delay: number; // s
  duration: number; // s
  opacity: number;
  type: "mote" | "firefly" | "sakura";
}

function randomBetween(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function generateParticles(): Particle[] {
  const particles: Particle[] = [];
  let id = 0;

  // Light motes — 20 soft white/warm dots floating up
  for (let i = 0; i < 20; i++) {
    particles.push({
      id: id++, type: "mote",
      x: randomBetween(2, 98), y: randomBetween(10, 95),
      size: randomBetween(2, 4), delay: randomBetween(0, 10),
      duration: randomBetween(8, 14), opacity: randomBetween(0.08, 0.25),
    });
  }

  // Fireflies — 4 pulsing yellow-green
  for (let i = 0; i < 4; i++) {
    particles.push({
      id: id++, type: "firefly",
      x: randomBetween(10, 90), y: randomBetween(20, 70),
      size: randomBetween(3, 5), delay: randomBetween(0, 6),
      duration: randomBetween(4, 7), opacity: 0.6,
    });
  }

  // Sakura petals — 6 drifting diagonally
  for (let i = 0; i < 6; i++) {
    particles.push({
      id: id++, type: "sakura",
      x: randomBetween(0, 100), y: randomBetween(-10, 40),
      size: randomBetween(6, 10), delay: randomBetween(0, 12),
      duration: randomBetween(10, 18), opacity: randomBetween(0.15, 0.35),
    });
  }

  return particles;
}

export function HomepageScene() {
  const parallax = useParallax();
  const [particles] = useState(generateParticles);

  // Set --vh for viewport height (same as VNLayout)
  useEffect(() => {
    function setVH() {
      document.documentElement.style.setProperty("--vh", `${window.innerHeight * 0.01}px`);
    }
    setVH();
    window.addEventListener("resize", setVH);
    return () => window.removeEventListener("resize", setVH);
  }, []);

  return (
    <>
      <style>{`
        @keyframes hp-mote {
          0%, 100% { transform: translateY(0) translateX(0); opacity: var(--p-opacity); }
          50% { transform: translateY(-40px) translateX(10px); opacity: calc(var(--p-opacity) * 1.8); }
        }
        @keyframes hp-firefly {
          0%, 100% { opacity: 0.1; transform: scale(0.8); }
          50% { opacity: 0.7; transform: scale(1.3); }
        }
        @keyframes hp-sakura {
          0% { transform: translate(0, 0) rotate(0deg); opacity: var(--p-opacity); }
          100% { transform: translate(60px, 100vh) rotate(360deg); opacity: 0; }
        }
        @keyframes hp-light-shift {
          0% { transform: translate(-20%, -10%); background: radial-gradient(ellipse, rgba(244,114,182,0.05) 0%, transparent 70%); }
          25% { transform: translate(10%, -20%); background: radial-gradient(ellipse, rgba(167,139,250,0.04) 0%, transparent 70%); }
          50% { transform: translate(20%, 10%); background: radial-gradient(ellipse, rgba(251,146,60,0.04) 0%, transparent 70%); }
          75% { transform: translate(-10%, 20%); background: radial-gradient(ellipse, rgba(123,31,162,0.05) 0%, transparent 70%); }
          100% { transform: translate(-20%, -10%); background: radial-gradient(ellipse, rgba(244,114,182,0.05) 0%, transparent 70%); }
        }
      `}</style>

      {/* Layer 1: Background — parallax shifts slightly */}
      <div
        style={{
          position: "absolute", inset: 0, zIndex: 0,
          background: "linear-gradient(180deg, #0a0612 0%, #1a0a2e 30%, #12061a 60%, #0a0612 100%)",
          backgroundSize: "cover",
          transform: `translate(${parallax.x * 4}px, ${parallax.y * 3}px) scale(1.05)`,
          transition: "transform 0.1s ease-out",
        }}
      >
        {/* Background image — loads if available, gradient is fallback */}
        <img
          src="/backgrounds/bg-plaza.png"
          alt=""
          style={{
            position: "absolute", inset: 0, width: "100%", height: "100%",
            objectFit: "cover", objectPosition: "center bottom",
          }}
          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
        />
      </div>

      {/* Layer 2: Ambient vignette */}
      <div style={{
        position: "absolute", inset: 0, zIndex: 1,
        background: "radial-gradient(ellipse at center 40%, transparent 30%, rgba(10,6,18,0.7) 100%)",
        pointerEvents: "none",
      }} />

      {/* Layer 3: Animated lighting overlay */}
      <div style={{
        position: "absolute", inset: "-20%", zIndex: 2,
        animation: "hp-light-shift 30s ease-in-out infinite",
        pointerEvents: "none",
        width: "140%", height: "140%",
      }} />

      {/* Layer 4: Particles — strongest parallax */}
      <div
        style={{
          position: "absolute", inset: 0, zIndex: 3,
          transform: `translate(${parallax.x * 7}px, ${parallax.y * 5}px)`,
          transition: "transform 0.1s ease-out",
          pointerEvents: "none",
        }}
      >
        {particles.map((p) => {
          const color =
            p.type === "mote" ? "rgba(255,240,220,0.9)" :
            p.type === "firefly" ? "rgba(200,255,100,0.9)" :
            "rgba(255,180,200,0.7)";

          const animation =
            p.type === "mote" ? `hp-mote ${p.duration}s ease-in-out ${p.delay}s infinite` :
            p.type === "firefly" ? `hp-firefly ${p.duration}s ease-in-out ${p.delay}s infinite` :
            `hp-sakura ${p.duration}s linear ${p.delay}s infinite`;

          return (
            <div
              key={p.id}
              style={{
                position: "absolute",
                left: `${p.x}%`,
                top: `${p.y}%`,
                width: p.size,
                height: p.size,
                borderRadius: p.type === "sakura" ? "40% 60% 50% 50%" : "50%",
                background: color,
                boxShadow: p.type === "firefly" ? `0 0 8px ${color}` : "none",
                opacity: p.opacity,
                animation,
                "--p-opacity": p.opacity,
              } as React.CSSProperties}
            />
          );
        })}
      </div>
    </>
  );
}
