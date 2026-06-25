"use client";

export type ThemeMode = "light" | "dark";

const STORAGE_KEY = "anime-chatbot-theme-mode";

export function getThemeMode(): ThemeMode {
  if (typeof window === "undefined") return "dark";
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark") return stored;
  // Default based on time: dark after 6pm
  const hour = new Date().getHours();
  return hour >= 18 || hour < 6 ? "dark" : "light";
}

export function setThemeMode(mode: ThemeMode): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, mode);
  applyThemeMode(mode);
}

export function applyThemeMode(mode: ThemeMode): void {
  if (typeof window === "undefined") return;
  document.documentElement.setAttribute("data-theme", mode);
}
