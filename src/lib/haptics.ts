import type { Expression } from "@/lib/characters/types";

type VibrationPattern = number | number[];

function vibrate(pattern: VibrationPattern): void {
  if (typeof navigator === "undefined") return;
  if (typeof navigator.vibrate !== "function") return;
  if (typeof localStorage !== "undefined") {
    if (localStorage.getItem("anime-chatbot-haptics-enabled") === "false") return;
  }
  try { navigator.vibrate(pattern); } catch {}
}

const EXPRESSION_PATTERNS: Partial<Record<Expression, VibrationPattern>> = {
  angry: [15, 30, 15, 30, 15],
  surprised: [10, 50, 10],
  flustered: [10, 50, 10],
  excited: [10, 50, 10],
  happy: 8,
  laugh: 8,
  devoted: 8,
  sad: 12,
  crying: [12, 40, 12],
};

export const haptic = {
  tick: () => vibrate(5),
  pulse: () => vibrate(10),
  doubleTap: () => vibrate([10, 50, 10]),
  rumble: () => vibrate([15, 30, 15, 30, 15]),
  soft: () => vibrate(8),
  pet: () => vibrate([8, 40, 8, 40, 8]),
  success: () => vibrate([10, 30, 20, 30, 30]),
  expression: (expr: Expression) => {
    const pattern = EXPRESSION_PATTERNS[expr];
    if (pattern) vibrate(pattern);
  },
};
