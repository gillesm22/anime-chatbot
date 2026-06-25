"use client";

import Link from "next/link";

interface ControlBarProps {
  characterName: string;
  accentColor: string;
  autoAdvance: boolean;
  onToggleAutoAdvance: () => void;
}

export function ControlBar({
  characterName,
  accentColor,
  autoAdvance,
  onToggleAutoAdvance,
}: ControlBarProps) {
  return (
    <div className="flex items-center justify-between px-6 py-3">
      {/* Back button */}
      <Link
        href="/"
        className="flex items-center gap-2 text-text-secondary hover:text-text transition-colors text-sm"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path
            d="M10 12L6 8L10 4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Back
      </Link>

      {/* Character name */}
      <span
        className="text-sm font-medium"
        style={{ color: accentColor }}
      >
        {characterName}
      </span>

      {/* Auto-advance toggle */}
      <button
        onClick={onToggleAutoAdvance}
        className="flex items-center gap-2 text-sm transition-colors"
        style={{
          color: autoAdvance ? accentColor : "rgba(255,255,255,0.5)",
        }}
      >
        <div
          className="w-8 h-4 rounded-full relative transition-colors"
          style={{
            backgroundColor: autoAdvance ? `${accentColor}40` : "rgba(255,255,255,0.1)",
          }}
        >
          <div
            className="absolute top-0.5 w-3 h-3 rounded-full transition-all"
            style={{
              backgroundColor: autoAdvance ? accentColor : "rgba(255,255,255,0.3)",
              left: autoAdvance ? "calc(100% - 14px)" : "2px",
            }}
          />
        </div>
        Auto
      </button>
    </div>
  );
}
