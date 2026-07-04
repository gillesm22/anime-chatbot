"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useChat } from "@/lib/chat/context";
import { setExpression } from "@/lib/chat/actions";
import { moodToExpression } from "@/lib/mood";
import type { ExpressionEffect } from "@/lib/expressionEffects";

interface UseExpressionEffectsArgs {
  currentMood: string;
}

export function useExpressionEffects({ currentMood }: UseExpressionEffectsArgs) {
  const { state, dispatch } = useChat();
  const [activeEffect, setActiveEffect] = useState<ExpressionEffect | null>(null);
  const prevPhaseRef = useRef<string>(state.phase);

  // Track phase transitions: reset expression to mood-appropriate on entering idle
  useEffect(() => {
    const prevPhase = prevPhaseRef.current;
    const currentPhase = state.phase;

    if (prevPhase !== "idle" && currentPhase === "idle") {
      dispatch(setExpression(moodToExpression(currentMood)));
    }

    prevPhaseRef.current = currentPhase;
  }, [state.phase, currentMood, dispatch]);

  // Set an expression effect and auto-clear it after its duration
  const handleExpressionChange = useCallback((effect: ExpressionEffect) => {
    setActiveEffect(effect);
    const timer = setTimeout(() => {
      setActiveEffect(null);
    }, effect.durationMs);
    return () => clearTimeout(timer);
  }, []);

  // Tap the sprite to trigger a flustered reaction (only when idle)
  const handleSpriteTap = useCallback(() => {
    if (state.phase !== "idle") return;
    dispatch(setExpression("flustered"));
    const timer = setTimeout(() => {
      dispatch(setExpression(moodToExpression(currentMood)));
    }, 2000);
    return () => clearTimeout(timer);
  }, [state.phase, currentMood, dispatch]);

  return { activeEffect, handleExpressionChange, handleSpriteTap };
}
