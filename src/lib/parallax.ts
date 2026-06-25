"use client";

import { useState, useEffect, useRef } from "react";

export function useParallax(): { x: number; y: number } {
  const [offset, setOffset] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });

  // Raw target values updated by event listeners
  const targetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  // Current smoothed values used for lerp
  const currentRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const LERP_FACTOR = 0.08; // lower = smoother/slower

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

    const animate = () => {
      const cx = lerp(currentRef.current.x, targetRef.current.x, LERP_FACTOR);
      const cy = lerp(currentRef.current.y, targetRef.current.y, LERP_FACTOR);

      // Only update state if values changed meaningfully (avoids excess re-renders)
      if (
        Math.abs(cx - currentRef.current.x) > 0.0001 ||
        Math.abs(cy - currentRef.current.y) > 0.0001
      ) {
        currentRef.current = { x: cx, y: cy };
        setOffset({ x: cx, y: cy });
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    // Mouse tracking (desktop)
    const handleMouseMove = (e: MouseEvent) => {
      const halfW = window.innerWidth / 2;
      const halfH = window.innerHeight / 2;
      // Normalize to -1..1 relative to window center
      targetRef.current = {
        x: (e.clientX - halfW) / halfW,
        y: (e.clientY - halfH) / halfH,
      };
    };

    // Device orientation (mobile tilt)
    const handleOrientation = (e: DeviceOrientationEvent) => {
      // gamma = left/right tilt (-90..90), beta = front/back tilt (-180..180)
      const maxGamma = 30;
      const maxBeta = 30;
      const rawX = e.gamma !== null ? e.gamma / maxGamma : 0;
      const rawY = e.beta !== null ? (e.beta - 45) / maxBeta : 0; // 45° = neutral hold angle

      targetRef.current = {
        x: Math.max(-1, Math.min(1, rawX)),
        y: Math.max(-1, Math.min(1, rawY)),
      };
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("deviceorientation", handleOrientation);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("deviceorientation", handleOrientation);
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  return offset;
}
