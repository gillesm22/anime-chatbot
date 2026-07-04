// src/components/CharacterTransition.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface CharacterTransitionProps {
  characterId: string;
  accentColor: string;
  /** Center point of the radial wipe (from click position) */
  originX: number;
  originY: number;
  onComplete?: () => void;
}

export function CharacterTransition({
  characterId,
  accentColor,
  originX,
  originY,
  onComplete,
}: CharacterTransitionProps) {
  const router = useRouter();
  const [phase, setPhase] = useState<"expanding" | "navigating" | "done">("expanding");

  useEffect(() => {
    // Navigate slightly before the wipe finishes for seamless transition
    const navTimer = setTimeout(() => {
      setPhase("navigating");
      router.push(`/chat/${characterId}`);
    }, 350);

    const doneTimer = setTimeout(() => {
      setPhase("done");
      onComplete?.();
    }, 600);

    return () => {
      clearTimeout(navTimer);
      clearTimeout(doneTimer);
    };
  }, [characterId, router, onComplete]);

  if (phase === "done") return null;

  // Calculate the maximum radius needed to cover the entire screen from the click point
  const maxDist = Math.max(
    Math.hypot(originX, originY),
    Math.hypot(window.innerWidth - originX, originY),
    Math.hypot(originX, window.innerHeight - originY),
    Math.hypot(window.innerWidth - originX, window.innerHeight - originY),
  );

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        pointerEvents: "all",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: originX,
          top: originY,
          width: maxDist * 2,
          height: maxDist * 2,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${accentColor} 0%, ${accentColor}ee 60%, ${accentColor}88 100%)`,
          transform: "translate(-50%, -50%) scale(0)",
          animation: "hp-radial-wipe 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards",
        }}
      />
      <style>{`
        @keyframes hp-radial-wipe {
          0% { transform: translate(-50%, -50%) scale(0); opacity: 1; }
          70% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
          100% { transform: translate(-50%, -50%) scale(1); opacity: 0.8; }
        }
      `}</style>
    </div>
  );
}
