"use client";

import { useState, useEffect } from "react";
import { getHotspotsForScene } from "@/lib/sceneObjects";
import { haptic } from "@/lib/haptics";

const DISCOVERED_KEY = "anime-chatbot-todo-discovered";

interface SceneObjectsProps {
  sceneId: string;
  accentColor: string;
  onObjectTap: (action: string) => void;
}

export function SceneObjects({ sceneId, accentColor, onObjectTap }: SceneObjectsProps) {
  const hotspots = getHotspotsForScene(sceneId);
  const [discovered, setDiscovered] = useState(true);

  useEffect(() => {
    const d = localStorage.getItem(DISCOVERED_KEY);
    setDiscovered(d === "true");
  }, []);

  const handleTap = (action: string) => {
    haptic.tick();
    if (!discovered) {
      localStorage.setItem(DISCOVERED_KEY, "true");
      setDiscovered(true);
    }
    onObjectTap(action);
  };

  if (hotspots.length === 0) return null;

  return (
    <>
      {hotspots.map((hotspot) => (
        <button
          key={hotspot.id}
          onClick={() => handleTap(hotspot.action)}
          style={{
            position: "absolute",
            left: `${hotspot.x}%`,
            top: `${hotspot.y}%`,
            width: `${hotspot.width}%`,
            height: `${hotspot.height}%`,
            zIndex: 8,
            background: "transparent",
            border: "none",
            cursor: "pointer",
            padding: 0,
            outline: "none",
            // Subtle glow pulse on undiscovered hotspots
            ...(!discovered ? {
              boxShadow: `inset 0 0 20px ${accentColor}15, 0 0 30px ${accentColor}10`,
              animation: "hotspot-pulse 3s ease-in-out infinite",
              borderRadius: 12,
            } : {}),
          }}
          aria-label="Open task board"
        />
      ))}
      {!discovered && (
        <style>{`
          @keyframes hotspot-pulse {
            0%, 100% { opacity: 0.3; }
            50% { opacity: 0.7; }
          }
        `}</style>
      )}
    </>
  );
}
