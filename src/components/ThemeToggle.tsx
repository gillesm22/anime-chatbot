"use client";

import { useState, useEffect } from "react";
import { getThemeMode, setThemeMode, applyThemeMode, type ThemeMode } from "@/lib/themeMode";

export function ThemeToggle() {
  const [mode, setMode] = useState<ThemeMode>("dark");

  useEffect(() => {
    const saved = getThemeMode();
    setMode(saved);
    applyThemeMode(saved);
  }, []);

  const toggle = () => {
    const next = mode === "dark" ? "light" : "dark";
    setMode(next);
    setThemeMode(next);
  };

  return (
    <button
      onClick={toggle}
      className="relative w-12 h-6 rounded-full transition-colors duration-300 flex items-center"
      style={{
        backgroundColor: mode === "dark" ? "rgba(255,255,255,0.1)" : "rgba(251,191,36,0.25)",
        border: `1px solid ${mode === "dark" ? "rgba(255,255,255,0.15)" : "rgba(251,191,36,0.4)"}`,
      }}
      title={mode === "dark" ? "Switch to light mode" : "Switch to dark mode"}
    >
      {/* Track icons */}
      <span className="absolute left-1 text-[10px]" style={{ opacity: mode === "light" ? 0.3 : 1, transition: "opacity 300ms" }}>
        🌙
      </span>
      <span className="absolute right-1 text-[10px]" style={{ opacity: mode === "light" ? 1 : 0.3, transition: "opacity 300ms" }}>
        ☀️
      </span>
      {/* Thumb */}
      <div
        className="absolute w-4 h-4 rounded-full transition-all duration-300 shadow-sm"
        style={{
          backgroundColor: mode === "dark" ? "#a78bfa" : "#fbbf24",
          left: mode === "dark" ? "3px" : "calc(100% - 19px)",
        }}
      />
    </button>
  );
}
