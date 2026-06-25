"use client";

import { useState, useEffect } from "react";

export type TimeTheme = "day" | "night";

export function useTimeTheme(): TimeTheme {
  const [theme, setTheme] = useState<TimeTheme>("night");

  useEffect(() => {
    const update = () => {
      const hour = new Date().getHours();
      setTheme(hour >= 6 && hour < 18 ? "day" : "night");
    };
    update();
    const interval = setInterval(update, 60_000);
    return () => clearInterval(interval);
  }, []);

  return theme;
}
