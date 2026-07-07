"use client";

import { useEffect, useRef, useCallback } from "react";
import { DripScene, renderScene } from "@/lib/bloodDrip";
import { getHexxBounds, triggerHexxFeed } from "@/components/BloodBat";
import { playHexxChomp } from "@/lib/sounds";

const LS_KEY = "anime-chatbot-blood-drip";

export function BloodDripCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<DripScene | null>(null);
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const enabledRef = useRef(false);

  // Read initial state and listen for toggle events
  useEffect(() => {
    try {
      enabledRef.current = localStorage.getItem(LS_KEY) === "true";
    } catch {}

    const handleToggle = (e: Event) => {
      enabledRef.current = (e as CustomEvent).detail;
    };
    window.addEventListener("blood-drip-toggle", handleToggle);
    return () => window.removeEventListener("blood-drip-toggle", handleToggle);
  }, []);

  // Resize canvas
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    if (sceneRef.current) {
      sceneRef.current.floorY = window.innerHeight;
    }
  }, []);

  useEffect(() => {
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
  }, [resizeCanvas]);

  // Animation loop
  const animate = useCallback((time: number) => {
    const scene = sceneRef.current;
    const canvas = canvasRef.current;
    if (!scene || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dt = lastTimeRef.current ? Math.min((time - lastTimeRef.current) / 1000, 0.1) : 0.016;
    lastTimeRef.current = time;

    // Update hexx bounds each frame
    const rect = getHexxBounds();
    scene.hexxBounds = rect ? { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom } : null;

    scene.tick(dt);

    // Handle hexx feeding
    if (scene.lastHexxFed) {
      triggerHexxFeed();
      playHexxChomp();
    }

    renderScene(ctx, scene, canvas.width, canvas.height);

    if (!scene.isIdle()) {
      rafRef.current = requestAnimationFrame(animate);
    } else {
      rafRef.current = 0;
      lastTimeRef.current = 0;
    }
  }, []);

  // Start loop if not running
  const ensureLoop = useCallback(() => {
    if (rafRef.current === 0) {
      lastTimeRef.current = 0;
      rafRef.current = requestAnimationFrame(animate);
    }
  }, [animate]);

  // Click handler
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (!enabledRef.current) return;
      if (!sceneRef.current) {
        sceneRef.current = new DripScene(window.innerHeight);
      }
      sceneRef.current.addDrop(e.clientX, e.clientY);
      ensureLoop();
    };

    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, [ensureLoop]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        pointerEvents: "none",
      }}
    />
  );
}
