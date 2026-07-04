"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { haptic } from "@/lib/haptics";
import type { PanelId } from "@/hooks/usePanels";

// ─── Props ───────────────────────────────────────────────────────────────────

export interface VNMenuProps {
  accentColor: string;
  onSelect: (panel: PanelId) => void;
  onSave: () => void;
}

// ─── SVG Icons ───────────────────────────────────────────────────────────────

function HangerIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.38 18H3.62a1 1 0 0 1-.65-1.76L12 9" />
      <path d="M12 9V6" />
      <path d="M12 6a2 2 0 1 0-2-2" />
    </svg>
  );
}

function GiftIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 12 20 22 4 22 4 12" />
      <rect x="2" y="7" width="20" height="5" />
      <line x1="12" y1="22" x2="12" y2="7" />
      <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
      <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
    </svg>
  );
}

function BookIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function LandscapeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  );
}

function LinesIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="15" y2="18" />
    </svg>
  );
}

function SaveIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

// ─── Menu item definitions ────────────────────────────────────────────────────

interface MenuItem {
  label: string;
  icon: React.ReactNode;
  panelId: PanelId | "save";
}

const MENU_ITEMS: MenuItem[] = [
  { label: "Outfits", icon: <HangerIcon />, panelId: "outfits" },
  { label: "Gifts",   icon: <GiftIcon />,   panelId: "gifts" },
  { label: "Diary",   icon: <BookIcon />,   panelId: "diary" },
  { label: "Quests",  icon: <ClockIcon />,  panelId: "quests" },
  { label: "Scenes",  icon: <LandscapeIcon />, panelId: "scenes" },
  { label: "Log",     icon: <LinesIcon />,  panelId: "history" },
  { label: "Save",    icon: <SaveIcon />,   panelId: "save" },
];

// Arc: from left (-180) to straight up (-90), all items above trigger
const ARC_START_DEG = -180;
const ARC_END_DEG = -90;
const RADIUS = 200; // px — large radius compensates for tighter arc

function getArcPosition(index: number, total: number) {
  const t = total === 1 ? 0.5 : index / (total - 1);
  const deg = ARC_START_DEG + t * (ARC_END_DEG - ARC_START_DEG);
  const rad = (deg * Math.PI) / 180;
  return {
    x: Math.cos(rad) * RADIUS,
    y: Math.sin(rad) * RADIUS,
  };
}

// ─── VNMenu ──────────────────────────────────────────────────────────────────

export function VNMenu({ accentColor, onSelect, onSave }: VNMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  function open() {
    haptic.tick();
    setIsOpen(true);
  }

  function close() {
    haptic.tick();
    setIsOpen(false);
  }

  function handleSelect(item: MenuItem) {
    haptic.tick();
    setIsOpen(false);
    if (item.panelId === "save") {
      onSave();
    } else {
      onSelect(item.panelId as PanelId);
    }
  }

  // Trigger sits above the chat bar (bottom: 80px, right: 16px via CSS).
  // Arc items are positioned absolute within the vn-viewport.
  const triggerRight = 16 + 24; // right offset + half trigger width
  const triggerBottom = 120 + 24; // bottom offset + half trigger height

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="vn-menu-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={close}
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 24,
              background: "rgba(0,0,0,0.35)",
              pointerEvents: "auto",
            }}
          />
        )}
      </AnimatePresence>

      {/* Arc menu items */}
      <AnimatePresence>
        {isOpen && MENU_ITEMS.map((item, i) => {
          const pos = getArcPosition(i, MENU_ITEMS.length);
          const right = triggerRight + (-pos.x);
          const bottom = triggerBottom + (-pos.y);

          return (
            <motion.div
              key={item.label}
              initial={{ scale: 0.3, opacity: 0, right: triggerRight, bottom: triggerBottom }}
              animate={{ scale: 1, opacity: 1, right, bottom }}
              exit={{ scale: 0.3, opacity: 0, right: triggerRight, bottom: triggerBottom }}
              transition={{
                duration: 0.22,
                delay: i * 0.03,
                ease: [0.34, 1.56, 0.64, 1],
              }}
              style={{
                position: "absolute",
                zIndex: 26,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "4px",
                pointerEvents: "auto",
                marginRight: "-22px",
                marginBottom: "-22px",
              }}
            >
              {/* Item circle */}
              <button
                onClick={() => handleSelect(item)}
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "50%",
                  border: `1.5px solid ${accentColor}66`,
                  background: "rgba(10,10,16,0.85)",
                  backdropFilter: "blur(10px)",
                  WebkitBackdropFilter: "blur(10px)",
                  color: accentColor,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: `0 0 10px ${accentColor}33`,
                  transition: "border-color 0.15s, box-shadow 0.15s",
                  padding: 0,
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = accentColor;
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 0 16px ${accentColor}66`;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = `${accentColor}66`;
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 0 10px ${accentColor}33`;
                }}
              >
                {item.icon}
              </button>

              {/* Label */}
              <span
                style={{
                  fontSize: "9px",
                  color: "rgba(255,255,255,0.9)",
                  textShadow: "0 1px 4px rgba(0,0,0,0.8)",
                  lineHeight: 1,
                  letterSpacing: "0.03em",
                  whiteSpace: "nowrap",
                  pointerEvents: "none",
                  userSelect: "none",
                }}
              >
                {item.label}
              </span>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Trigger button */}
      <motion.button
        className="vn-menu-trigger"
        onClick={isOpen ? close : open}
        style={{ zIndex: 27, pointerEvents: "auto", position: "absolute" }}
        whileTap={{ scale: 0.9 }}
        aria-label={isOpen ? "Close menu" : "Open menu"}
      >
        <motion.span
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <PlusIcon />
        </motion.span>
      </motion.button>
    </>
  );
}
