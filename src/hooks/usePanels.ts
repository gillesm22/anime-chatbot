"use client";

import { useState, useCallback } from "react";
import { haptic } from "@/lib/haptics";

export type PanelId =
  | "history"
  | "charInfo"
  | "diary"
  | "gifts"
  | "outfits"
  | "quests"
  | "scenes"
  | "screenshot"
  | "more"
  | null;

export function usePanels() {
  const [activePanel, setActivePanel] = useState<PanelId>(null);

  const openPanel = useCallback((panel: PanelId) => {
    haptic.tick();
    setActivePanel(panel);
  }, []);

  const closePanel = useCallback(() => {
    haptic.tick();
    setActivePanel(null);
  }, []);

  const togglePanel = useCallback((panel: PanelId) => {
    haptic.tick();
    setActivePanel((prev) => (prev === panel ? null : panel));
  }, []);

  const isOpen = useCallback(
    (panel: PanelId) => activePanel === panel,
    [activePanel]
  );

  return { activePanel, openPanel, closePanel, togglePanel, isOpen };
}
