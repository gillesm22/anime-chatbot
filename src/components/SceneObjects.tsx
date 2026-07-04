"use client";

import { motion } from "framer-motion";
import { getObjectsForScene } from "@/lib/sceneObjects";
import { haptic } from "@/lib/haptics";

interface SceneObjectsProps {
  sceneId: string;
  accentColor: string;
  onObjectTap: (action: string) => void;
}

export function SceneObjects({ sceneId, accentColor, onObjectTap }: SceneObjectsProps) {
  const objects = getObjectsForScene(sceneId);

  return (
    <>
      {objects.map((obj) => (
        <motion.button
          key={obj.id}
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 0.7, scale: 1 }}
          whileHover={{ opacity: 1, scale: 1.15 }}
          whileTap={{ scale: 0.9 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          onClick={() => {
            haptic.tick();
            onObjectTap(obj.action);
          }}
          style={{
            position: "absolute",
            left: `${obj.x}%`,
            top: `${obj.y}%`,
            transform: "translate(-50%, -50%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 3,
            background: "rgba(255, 255, 255, 0.12)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            border: `1px solid rgba(255, 255, 255, 0.2)`,
            borderRadius: "50%",
            width: obj.size + 16,
            height: obj.size + 16,
            cursor: "pointer",
            padding: 0,
            boxShadow: `0 2px 12px rgba(0,0,0,0.2), 0 0 0 1px ${accentColor}20`,
          }}
          title={obj.label}
        >
          <span style={{ fontSize: obj.size * 0.6, lineHeight: 1 }}>{obj.icon}</span>
          <span
            style={{
              fontSize: 8,
              color: "rgba(255,255,255,0.85)",
              fontWeight: 600,
              letterSpacing: 0.3,
              lineHeight: 1,
              whiteSpace: "nowrap",
            }}
          >
            {obj.label}
          </span>
        </motion.button>
      ))}
    </>
  );
}
