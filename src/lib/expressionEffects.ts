import type { Expression } from "@/lib/characters/types";

export interface ExpressionEffect {
  type: "sparkle" | "shake" | "blush" | "dim" | "flash";
  intensity: "light" | "medium" | "heavy";
  durationMs: number;
}

const VALENCE: Record<Expression, number> = {
  happy: 4,
  laugh: 5,
  excited: 5,
  smirk: 3,
  teasing: 3,
  devoted: 4,
  neutral: 2,
  thinking: 1,
  sleepy: 1,
  shy: 2,
  flustered: 2,
  surprised: 3,
  sad: 0,
  crying: 0,
  angry: 0,
  jealous: 1,
};

const AROUSAL: Record<Expression, number> = {
  excited: 5,
  laugh: 4,
  angry: 5,
  surprised: 4,
  happy: 3,
  flustered: 4,
  jealous: 4,
  teasing: 3,
  smirk: 2,
  devoted: 2,
  neutral: 1,
  thinking: 1,
  shy: 2,
  sad: 1,
  crying: 3,
  sleepy: 0,
};

export function getEmotionDistance(from: Expression, to: Expression): number {
  const dv = VALENCE[from] - VALENCE[to];
  const da = AROUSAL[from] - AROUSAL[to];
  return Math.floor(Math.sqrt(dv * dv + da * da));
}

export function getExpressionEffect(
  from: Expression,
  to: Expression
): ExpressionEffect | null {
  const distance = getEmotionDistance(from, to);

  if (distance < 3) return null;

  const intensity: ExpressionEffect["intensity"] =
    distance >= 5 ? "heavy" : distance >= 4 ? "medium" : "light";

  if (to === "happy" || to === "laugh" || to === "excited") {
    return { type: "sparkle", intensity, durationMs: 400 };
  }
  if (to === "angry") {
    return { type: "shake", intensity, durationMs: 300 };
  }
  if (to === "flustered" || to === "shy") {
    return { type: "blush", intensity, durationMs: 350 };
  }
  if (to === "sad" || to === "crying") {
    return { type: "dim", intensity, durationMs: 400 };
  }
  if (to === "surprised") {
    return { type: "flash", intensity, durationMs: 200 };
  }

  return null;
}
