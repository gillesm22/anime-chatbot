"use client";

interface CharacterGlowProps {
  accentColor: string;
  intensity?: "low" | "medium" | "high";
}

export function CharacterGlow({ accentColor, intensity = "medium" }: CharacterGlowProps) {
  const sizes = { low: 200, medium: 300, high: 400 };
  const opacities = { low: 0.08, medium: 0.15, high: 0.25 };
  const size = sizes[intensity];

  return (
    <div
      className="absolute left-1/2 bottom-[15%] -translate-x-1/2 rounded-full pointer-events-none"
      style={{
        width: size,
        height: size * 0.6,
        background: `radial-gradient(ellipse, ${accentColor}40, ${accentColor}15, transparent)`,
        opacity: opacities[intensity],
        animation: "glowPulse 4s ease-in-out infinite",
        filter: "blur(30px)",
        zIndex: 0,
      }}
    />
  );
}
