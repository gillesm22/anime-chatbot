"use client";

import { forwardRef } from "react";
import type { ZoneBounds } from "@/lib/sprites/zones";

interface SpriteZoneProps {
  src: string;
  alt: string;
  zone: ZoneBounds;
  className?: string;
  style?: React.CSSProperties;
}

export const SpriteZone = forwardRef<HTMLDivElement, SpriteZoneProps>(
  function SpriteZone({ src, alt, zone, className = "", style }, ref) {
    const clipTop = `${zone.clipTop}%`;
    const clipBottom = `${100 - zone.clipBottom}%`;

    return (
      <div
        ref={ref}
        className={`absolute inset-0 ${className}`}
        style={{
          clipPath: `inset(${clipTop} 0% ${clipBottom} 0%)`,
          willChange: "transform",
          transition: "transform 150ms ease-out",
          ...style,
        }}
      >
        <img
          src={src}
          alt={alt}
          className="h-full w-full object-contain object-bottom"
          draggable={false}
          style={{ pointerEvents: "none" }}
        />
      </div>
    );
  }
);
