"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export type TransitionType = "fade" | "flash" | "dissolve";

interface VNTransitionProps {
  active: boolean;
  type?: TransitionType;
  duration?: number;  // ms, default 600
  onComplete?: () => void;
}

const OVERLAY_COLOR: Record<TransitionType, string> = {
  fade: "#000000",
  flash: "#ffffff",
  dissolve: "#000000",
};

export function VNTransition({
  active,
  type = "fade",
  duration = 600,
  onComplete,
}: VNTransitionProps) {
  const [phase, setPhase] = useState<"idle" | "in" | "hold" | "out">("idle");

  useEffect(() => {
    if (!active) return;

    setPhase("in");

    // After fade-in completes, hold briefly then fire onComplete and start fade-out
    const holdTimer = setTimeout(() => {
      setPhase("hold");
      onComplete?.();

      const outTimer = setTimeout(() => {
        setPhase("out");

        const idleTimer = setTimeout(() => {
          setPhase("idle");
        }, duration);

        return () => clearTimeout(idleTimer);
      }, 50);

      return () => clearTimeout(outTimer);
    }, duration);

    return () => clearTimeout(holdTimer);
  }, [active]); // eslint-disable-line react-hooks/exhaustive-deps

  const isVisible = phase === "in" || phase === "hold" || phase === "out";
  const opacity = phase === "in" || phase === "hold" ? 1 : 0;
  const halfDuration = duration / 1000;

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="vn-transition-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity }}
        transition={{ duration: halfDuration, ease: "easeInOut" }}
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: OVERLAY_COLOR[type],
          zIndex: 200,
          pointerEvents: "none",
        }}
      />
    </AnimatePresence>
  );
}
