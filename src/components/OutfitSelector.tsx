"use client";

import { motion } from "framer-motion";
import { getAffinity } from "@/lib/affinity";

export type Outfit = "default" | "back" | "bikini-front" | "bikini-back" | "casual" | "formal" | "school" | "school-skimpy" | "cheerleader" | "cheer-extreme" | "cheer-extreme-back" | "maid" | "vampire" | "nurse" | "cow" | "cowgirl" | "demon";

interface OutfitSelectorProps {
  accentColor: string;
  characterId: string;
  currentOutfit: Outfit;
  onSelectOutfit: (outfit: Outfit) => void;
}

const outfits: { id: Outfit; label: string; icon: React.ReactNode }[] = [
  {
    id: "default",
    label: "Default",
    icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M3 4.5C3 3.5 4.5 1.5 7 1.5C9.5 1.5 11 3.5 11 4.5V9C11 10 10.5 12.5 7 12.5C3.5 12.5 3 10 3 9V4.5Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M5 6.5H9" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
        <path d="M5.5 8.5H8.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: "back",
    label: "Back view",
    icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M4 10L2 6L5 3L7 2L9 3L12 6L10 10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M7 2V12" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.5" />
      </svg>
    ),
  },
  {
    id: "bikini-front",
    label: "Bikini front",
    icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <circle cx="7" cy="4" r="2.5" stroke="currentColor" strokeWidth="1.2" />
        <path d="M3 4L7 4" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
        <path d="M7 4L11 4" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
        <line x1="4" y1="2" x2="5.5" y2="1" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
        <line x1="10" y1="2" x2="8.5" y2="1" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: "bikini-back",
    label: "Bikini back",
    icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <circle cx="7" cy="4" r="2.5" stroke="currentColor" strokeWidth="1.2" />
        <path d="M4 10L2 6L5 3L7 2L9 3L12 6L10 10" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" opacity="0.4" />
      </svg>
    ),
  },
];

const OUTFIT_UNLOCK_LEVELS: Record<Outfit, number> = {
  "default": 0,
  "back": 2,
  "bikini-front": 3,
  "bikini-back": 3,
  "casual": 1,
  "formal": 2,
  "school": 1,
  "school-skimpy": 4,
  "cheerleader": 2,
  "cheer-extreme": 4,
  "cheer-extreme-back": 4,
  "maid": 3,
  "vampire": 3,
  "nurse": 3,
  "cow": 4,
  "cowgirl": 3,
  "demon": 5,
};

const OUTFIT_UNLOCK_LABELS: Record<Outfit, string | null> = {
  "default": null,
  "back": "Unlock at Lv.2",
  "bikini-front": "Unlock at Lv.3",
  "bikini-back": "Unlock at Lv.3",
  "casual": "Unlock at Lv.1",
  "formal": "Unlock at Lv.2",
  "school": "Unlock at Lv.1",
  "school-skimpy": "Unlock at Lv.4",
  "cheerleader": "Unlock at Lv.2",
  "cheer-extreme": "Unlock at Lv.4",
  "cheer-extreme-back": "Unlock at Lv.4",
  "maid": "Unlock at Lv.3",
  "vampire": "Unlock at Lv.3",
  "nurse": "Unlock at Lv.3",
  "cow": "Unlock at Lv.4",
  "cowgirl": "Unlock at Lv.3",
  "demon": "Unlock at Lv.5",
};

export function OutfitSelector({ accentColor, characterId, currentOutfit, onSelectOutfit }: OutfitSelectorProps) {
  const affinity = getAffinity(characterId);

  return (
    <div
      className="absolute bottom-3 right-3 z-20 flex gap-1.5 rounded-full px-2 py-1.5"
      style={{ backgroundColor: "rgba(13, 13, 18, 0.65)", backdropFilter: "blur(8px)" }}
    >
      {outfits.map(({ id, label, icon }) => {
        const isActive = currentOutfit === id;
        const isUnlocked = affinity.unlockedOutfits.includes(id);
        const unlockLabel = OUTFIT_UNLOCK_LABELS[id];

        if (!isUnlocked) {
          return (
            <motion.button
              key={id}
              title={unlockLabel ?? label}
              disabled
              className="w-7 h-7 flex items-center justify-center rounded-full transition-colors opacity-30 cursor-not-allowed"
              style={{
                backgroundColor: "transparent",
                color: "rgba(255,255,255,0.45)",
                border: "1.5px solid transparent",
              }}
            >
              {icon}
            </motion.button>
          );
        }

        return (
          <motion.button
            key={id}
            title={label}
            onClick={(e) => {
              e.stopPropagation();
              onSelectOutfit(id);
            }}
            className="w-7 h-7 flex items-center justify-center rounded-full transition-colors"
            style={{
              backgroundColor: isActive ? `${accentColor}35` : "transparent",
              color: isActive ? accentColor : "rgba(255,255,255,0.45)",
              border: isActive ? `1.5px solid ${accentColor}80` : "1.5px solid transparent",
            }}
            whileHover={{ scale: 1.15, backgroundColor: isActive ? `${accentColor}35` : "rgba(255,255,255,0.08)" }}
            whileTap={{ scale: 0.92 }}
          >
            {icon}
          </motion.button>
        );
      })}
    </div>
  );
}
