"use client";

import { useRef, useEffect } from "react";

interface HairSwayConfig {
  speed: number;
  amount: number;
  height: number;
}

export function useHairSway(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  spriteRef: React.RefObject<HTMLImageElement | null>,
  config: HairSwayConfig,
  windIntensity: number,
) {
  const rafRef = useRef(0);
  const frameCount = useRef(0);
  const windRef = useRef(windIntensity);
  windRef.current = windIntensity;
  const configRef = useRef(config);
  configRef.current = config;

  useEffect(() => {
    const canvas = canvasRef.current;
    const sprite = spriteRef.current;
    if (!canvas || !sprite) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let running = true;

    function tick(now: number) {
      if (!running) return;
      frameCount.current++;
      if (frameCount.current % 3 !== 0) { rafRef.current = requestAnimationFrame(tick); return; }

      const c = configRef.current;
      const wind = windRef.current;
      const cvs = canvasRef.current;
      const img = spriteRef.current;
      if (!cvs || !img || !ctx) return;

      const w = cvs.width;
      const h = cvs.height;
      ctx.clearRect(0, 0, w, h);

      const phase = (now / 1000) * c.speed * Math.PI * 2;
      const cols = 8, rows = 8;
      const cellW = w / cols, cellH = h / rows;

      for (let r = 0; r < rows; r++) {
        for (let col = 0; col < cols; col++) {
          const sx = col * cellW, sy = r * cellH;
          const centerDist = Math.abs(col - cols / 2) / (cols / 2);
          const topWeight = 1 - (r / rows);
          const disp = Math.sin(phase + col * 0.8 + r * 0.3) * c.amount * wind * centerDist * topWeight;
          ctx.drawImage(img, sx, sy, cellW, cellH, sx + disp, sy, cellW, cellH);
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    }

    if (sprite.complete) { rafRef.current = requestAnimationFrame(tick); }
    else { sprite.onload = () => { rafRef.current = requestAnimationFrame(tick); }; }

    const handleVis = () => {
      if (document.hidden) { running = false; cancelAnimationFrame(rafRef.current); }
      else { running = true; rafRef.current = requestAnimationFrame(tick); }
    };
    document.addEventListener("visibilitychange", handleVis);

    return () => { running = false; cancelAnimationFrame(rafRef.current); document.removeEventListener("visibilitychange", handleVis); };
  }, [canvasRef, spriteRef]);
}
