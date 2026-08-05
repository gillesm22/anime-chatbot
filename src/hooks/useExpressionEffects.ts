"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useChat } from "@/lib/chat/context";
import { setExpression } from "@/lib/chat/actions";
import { moodToExpression, type Mood } from "@/lib/mood";
import type { ExpressionEffect } from "@/lib/expressionEffects";

interface UseExpressionEffectsArgs {
  currentMood: Mood;
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

  return { activeEffect, handleExpressionChange };
}
