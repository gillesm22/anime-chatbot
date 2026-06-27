"use client";
import { useEffect, useRef, useCallback } from "react";

interface TouchPoint { x: number; y: number; time: number; }

export interface SwipeResult {
  direction: "left" | "right";
  distance: number;
  velocity: number;
  fromEdge: boolean;
}

const MIN_DISTANCE = 50;
const MIN_FLICK_VELOCITY = 0.5;
const EDGE_ZONE = 30;

export function detectSwipe(start: TouchPoint, end: TouchPoint): SwipeResult | null {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const distance = Math.abs(dx);
  const elapsed = Math.max(end.time - start.time, 1);
  const velocity = distance / elapsed;
  if (Math.abs(dy) > Math.abs(dx)) return null;
  if (distance < MIN_DISTANCE && velocity < MIN_FLICK_VELOCITY) return null;
  if (distance < 30) return null;
  return {
    direction: dx > 0 ? "right" : "left",
    distance,
    velocity,
    fromEdge: start.x <= EDGE_ZONE,
  };
}

export function useSwipeGesture(
  ref: React.RefObject<HTMLElement | null>,
  onSwipe: (result: SwipeResult) => void
): void {
  const startRef = useRef<TouchPoint | null>(null);
  const handleTouchStart = useCallback((e: TouchEvent) => {
    const touch = e.touches[0];
    startRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
  }, []);
  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (!startRef.current) return;
    const touch = e.changedTouches[0];
    const end = { x: touch.clientX, y: touch.clientY, time: Date.now() };
    const result = detectSwipe(startRef.current, end);
    if (result) onSwipe(result);
    startRef.current = null;
  }, [onSwipe]);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.addEventListener("touchstart", handleTouchStart, { passive: true });
    el.addEventListener("touchend", handleTouchEnd, { passive: true });
    return () => {
      el.removeEventListener("touchstart", handleTouchStart);
      el.removeEventListener("touchend", handleTouchEnd);
    };
  }, [ref, handleTouchStart, handleTouchEnd]);
}
