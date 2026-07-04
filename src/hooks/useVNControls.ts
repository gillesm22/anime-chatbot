"use client";

import { useCallback, useEffect, useRef } from "react";
import { useChat } from "@/lib/chat/context";
import { advanceLine, lineTyped, toggleAutoAdvance } from "@/lib/chat/actions";
import { haptic } from "@/lib/haptics";
import { prefetchSpeech } from "@/lib/speech";
import { useSwipeGesture } from "@/lib/useSwipeGesture";
import type { PanelId } from "./usePanels";

interface UseVNControlsArgs {
  characterId: string;
  containerRef: React.RefObject<HTMLDivElement | null>;
  activePanel: PanelId;
  openPanel: (panel: PanelId) => void;
  closePanel: () => void;
}

export function useVNControls({
  characterId,
  containerRef,
  activePanel,
  openPanel,
  closePanel,
}: UseVNControlsArgs) {
  const { state, dispatch } = useChat();
  const autoAdvanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Derived UI state
  const currentLine =
    state.currentLines.length > 0
      ? state.currentLines[state.currentLineIndex] ?? null
      : null;
  const showInput = state.phase === "idle" || state.phase === "user_typing";
  const showDialogue = state.phase === "speaking" && currentLine !== null;
  const isTalking = state.phase === "speaking" && state.isTyping;
  const isWaiting = state.phase === "waiting";
  const showAdvanceIndicator =
    state.phase === "speaking" &&
    !state.isTyping;

  // Auto-advance: start timer when typing completes during speaking phase
  useEffect(() => {
    if (
      state.phase === "speaking" &&
      !state.isTyping &&
      state.autoAdvance
    ) {
      autoAdvanceTimer.current = setTimeout(() => {
        dispatch(advanceLine());
      }, 1500);
    }

    return () => {
      if (autoAdvanceTimer.current) {
        clearTimeout(autoAdvanceTimer.current);
        autoAdvanceTimer.current = null;
      }
    };
  }, [state.phase, state.isTyping, state.autoAdvance, state.currentLineIndex, state.currentLines.length, dispatch]);

  // Swipe gestures
  useSwipeGesture(containerRef, useCallback((result) => {
    if (result.direction === "right" && result.fromEdge) {
      openPanel("history");
    } else if (result.direction === "left" && activePanel !== null) {
      closePanel();
    }
  }, [activePanel, openPanel, closePanel]));

  const handleAdvance = useCallback(() => {
    haptic.tick();
    dispatch(advanceLine());
  }, [dispatch]);

  const handleTypeComplete = useCallback(() => {
    // Prefetch audio for the next line if available
    const nextIndex = state.currentLineIndex + 1;
    if (nextIndex < state.currentLines.length) {
      prefetchSpeech(state.currentLines[nextIndex], characterId);
    }
    dispatch(lineTyped());
  }, [state.currentLineIndex, state.currentLines, characterId, dispatch]);

  const handleToggleAutoAdvance = useCallback(() => {
    dispatch(toggleAutoAdvance());
  }, [dispatch]);

  return {
    handleAdvance,
    handleTypeComplete,
    handleToggleAutoAdvance,
    currentLine,
    showInput,
    showDialogue,
    isTalking,
    showAdvanceIndicator,
    isWaiting,
  };
}
