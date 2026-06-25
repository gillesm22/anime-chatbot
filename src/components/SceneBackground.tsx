"use client";

import { useState, useEffect } from "react";
import { type SceneId, SCENES } from "@/lib/backgrounds";
import { getThemeMode, type ThemeMode } from "@/lib/themeMode";
import { useParallax } from "@/lib/parallax";

interface SceneBackgroundProps {
  sceneId: SceneId;
  characterAccent: string;
}

interface Particle {
  id: number;
  top: string;
  left: string;
  delay: string;
  duration: string;
  size: string;
  sway?: string;
}

function randomBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function useParticles(type: string | undefined, count: number): Particle[] {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (!type) { setParticles([]); return; }
    setParticles(
      Array.from({ length: count }, (_, i) => ({
        id: i,
        top: `${randomBetween(0, 95).toFixed(2)}%`,
        left: `${randomBetween(0, 98).toFixed(2)}%`,
        delay: `${randomBetween(0, 8).toFixed(2)}s`,
        duration: `${randomBetween(3, 10).toFixed(2)}s`,
        size: `${randomBetween(2, 5).toFixed(1)}px`,
        sway: `${randomBetween(-30, 30).toFixed(1)}px`,
      }))
    );
  }, [type, count]);

  return particles;
}

export function SceneBackground({
  sceneId,
  characterAccent,
}: SceneBackgroundProps) {
  const parallax = useParallax();
  const [mode, setMode] = useState<ThemeMode>("dark");

  useEffect(() => {
    // Read current theme
    const stored = localStorage.getItem("anime-chatbot-theme-mode");
    if (stored === "light" || stored === "dark") setMode(stored);

    // Watch for theme toggle changes
    const observer = new MutationObserver(() => {
      const attr = document.documentElement.getAttribute("data-theme");
      if (attr === "light" || attr === "dark") setMode(attr);
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  const scene = SCENES[sceneId];
  const isLight = mode === "light";
  const particleType = scene.particles;

  const starCount = 30;
  const sakuraCount = 15;
  const rainCount = 40;
  const sparkleCount = 20;
  const fireflyCount = 12;

  const totalCount = Math.max(
    starCount,
    sakuraCount,
    rainCount,
    sparkleCount,
    fireflyCount
  );

  const particles = useParticles(particleType, totalCount);

  const color = (isLight ? scene.particleColorLight : scene.particleColor) ?? characterAccent ?? "#ffffff";
  const gradient = isLight ? scene.gradientLight : scene.gradient;
  const glow = scene.ambientGlow ?? "transparent";

  return (
    <div
      className="absolute inset-0 overflow-hidden pointer-events-none"
      aria-hidden="true"
      suppressHydrationWarning
    >
      {scene.bgImage ? (
        <>
          {/* Background image - full visibility */}
          <img
            src={scene.bgImage}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            style={{
              opacity: 1,
              filter: isLight ? "brightness(1.1) saturate(1.15)" : "brightness(0.75) saturate(0.9)",
              transition: "filter 0.6s ease",
              transform: `translate(${parallax.x * -10}px, ${parallax.y * -10}px) scale(1.05)`,
            }}
          />
        </>
      ) : (
        <>
          {/* CSS gradient fallback */}
          <div
            className="absolute inset-0"
            style={{ background: gradient, transition: "background 0.6s ease" }}
          />
          {/* Ambient glow */}
          <div
            className="absolute inset-0"
            style={{ background: `radial-gradient(ellipse at 50% 30%, ${glow} 0%, transparent 70%)` }}
          />
        </>
      )}

      {/* Inline CSS keyframes */}
      <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.3); }
        }
        @keyframes sakura-fall {
          0% { transform: translateY(-20px) translateX(0px) rotate(0deg); opacity: 0; }
          10% { opacity: 0.9; }
          90% { opacity: 0.8; }
          100% { transform: translateY(110vh) translateX(var(--sway)) rotate(360deg); opacity: 0; }
        }
        @keyframes rain-fall {
          0% { transform: translateY(-10px); opacity: 0.7; }
          100% { transform: translateY(110vh); opacity: 0.3; }
        }
        @keyframes sparkle-pulse {
          0%, 100% { opacity: 0.1; transform: scale(0.7) translateY(0px); }
          50% { opacity: 0.9; transform: scale(1.4) translateY(-6px); }
        }
        @keyframes firefly-float {
          0%   { transform: translate(0px, 0px) scale(1);   opacity: 0.2; }
          25%  { transform: translate(12px, -14px) scale(1.2); opacity: 0.85; }
          50%  { transform: translate(-8px, -20px) scale(0.9); opacity: 0.5; }
          75%  { transform: translate(-14px, -8px) scale(1.1); opacity: 0.9; }
          100% { transform: translate(0px, 0px) scale(1);   opacity: 0.2; }
        }
      `}</style>

      {/* STARS */}
      {particleType === "stars" &&
        particles.slice(0, starCount).map((p) => (
          <span
            key={p.id}
            style={{
              position: "absolute",
              top: p.top,
              left: p.left,
              width: p.size,
              height: p.size,
              borderRadius: "50%",
              backgroundColor: color,
              animation: `twinkle ${p.duration} ${p.delay} infinite ease-in-out`,
              boxShadow: `0 0 4px 1px ${color}`,
            }}
          />
        ))}

      {/* SAKURA */}
      {particleType === "sakura" &&
        particles.slice(0, sakuraCount).map((p) => (
          <span
            key={p.id}
            style={
              {
                position: "absolute",
                top: "-20px",
                left: p.left,
                width: `${parseFloat(p.size) * 2}px`,
                height: `${parseFloat(p.size) * 2}px`,
                borderRadius: "50% 0 50% 0",
                backgroundColor: color,
                opacity: 0.85,
                "--sway": p.sway,
                animation: `sakura-fall ${p.duration} ${p.delay} infinite linear`,
              } as React.CSSProperties
            }
          />
        ))}

      {/* RAIN */}
      {particleType === "rain" &&
        particles.slice(0, rainCount).map((p) => (
          <span
            key={p.id}
            style={{
              position: "absolute",
              top: p.top,
              left: p.left,
              width: "1px",
              height: `${parseFloat(p.size) * 5}px`,
              backgroundColor: color,
              opacity: 0.5,
              animation: `rain-fall ${(parseFloat(p.duration) * 0.35).toFixed(2)}s ${p.delay} infinite linear`,
              transform: "rotate(10deg)",
            }}
          />
        ))}

      {/* SPARKLES */}
      {particleType === "sparkles" &&
        particles.slice(0, sparkleCount).map((p) => (
          <span
            key={p.id}
            style={{
              position: "absolute",
              top: p.top,
              left: p.left,
              width: p.size,
              height: p.size,
              borderRadius: "50%",
              backgroundColor: color,
              animation: `sparkle-pulse ${p.duration} ${p.delay} infinite ease-in-out`,
              boxShadow: `0 0 6px 2px ${color}`,
            }}
          />
        ))}

      {/* FIREFLIES */}
      {particleType === "fireflies" &&
        particles.slice(0, fireflyCount).map((p) => (
          <span
            key={p.id}
            style={{
              position: "absolute",
              top: p.top,
              left: p.left,
              width: `${parseFloat(p.size) * 1.2}px`,
              height: `${parseFloat(p.size) * 1.2}px`,
              borderRadius: "50%",
              backgroundColor: color,
              animation: `firefly-float ${p.duration} ${p.delay} infinite ease-in-out`,
              boxShadow: `0 0 8px 3px ${color}`,
            }}
          />
        ))}
    </div>
  );
}
