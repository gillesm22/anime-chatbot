"use client";

import { useRef } from "react";
import { useHairSway } from "@/lib/sprites/hairSway";

interface HairSwayCanvasProps {
  spriteSrc: string;
  heightPercent: number;
  speed: number;
  amount: number;
  windIntensity: number;
}

export function HairSwayCanvas({ spriteSrc, heightPercent, speed, amount, windIntensity }: HairSwayCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  useHairSway(canvasRef, imgRef, { speed, amount, height: heightPercent }, windIntensity);

  return (
    <>
      <img ref={imgRef} src={spriteSrc} alt="" crossOrigin="anonymous" style={{ display: "none" }} />
      <canvas
        ref={canvasRef}
        width={512}
        height={Math.round(896 * (heightPercent / 100))}
        className="absolute top-0 left-0 right-0 pointer-events-none"
        style={{ height: `${heightPercent}%`, width: "100%", opacity: 0.3, mixBlendMode: "normal", zIndex: 15 }}
      />
    </>
  );
}
