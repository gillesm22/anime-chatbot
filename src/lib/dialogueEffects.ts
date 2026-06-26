import type { Expression } from "@/lib/characters/types";

export interface DialogueEffect {
  cssClass: string;
  pitchMultiplier: number; // 1.0 = normal, >1 = higher, <1 = lower
  tempoMultiplier: number; // 1.0 = normal, >1 = faster, <1 = slower
}

const DEFAULT_EFFECT: DialogueEffect = {
  cssClass: "",
  pitchMultiplier: 1,
  tempoMultiplier: 1,
};

const EFFECT_MAP: Partial<Record<Expression, DialogueEffect>> = {
  angry: { cssClass: "dialogue-text-shake", pitchMultiplier: 0.85, tempoMultiplier: 1.3 },
  flustered: { cssClass: "dialogue-text-wave", pitchMultiplier: 1.15, tempoMultiplier: 0.9 },
  shy: { cssClass: "dialogue-text-wave", pitchMultiplier: 1.1, tempoMultiplier: 0.85 },
  excited: { cssClass: "dialogue-text-bounce", pitchMultiplier: 1.2, tempoMultiplier: 1.2 },
  laugh: { cssClass: "dialogue-text-bounce", pitchMultiplier: 1.15, tempoMultiplier: 1.1 },
  sad: { cssClass: "dialogue-text-fade", pitchMultiplier: 0.8, tempoMultiplier: 0.7 },
  crying: { cssClass: "dialogue-text-fade", pitchMultiplier: 0.75, tempoMultiplier: 0.6 },
  devoted: { cssClass: "dialogue-text-whisper", pitchMultiplier: 0.9, tempoMultiplier: 0.8 },
  sleepy: { cssClass: "dialogue-text-whisper", pitchMultiplier: 0.85, tempoMultiplier: 0.7 },
};

export function getDialogueEffect(expression: Expression): DialogueEffect {
  return EFFECT_MAP[expression] ?? DEFAULT_EFFECT;
}

export const DIALOGUE_EFFECT_STYLES = `
@keyframes textShake { 0%,100% { transform: translateX(0); } 25% { transform: translateX(-1px); } 75% { transform: translateX(1px); } }
@keyframes textWave { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-2px); } }
@keyframes textBounce { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-1.5px); } }
@keyframes textFadeIn { from { opacity: 0.4; } to { opacity: 0.75; } }
.dialogue-text-shake { animation: textShake 0.15s ease-in-out infinite; display: inline-block; }
.dialogue-text-wave { animation: textWave 1.5s ease-in-out infinite; display: inline-block; font-size: 0.95em; }
.dialogue-text-bounce { animation: textBounce 0.6s ease-in-out infinite; display: inline-block; }
.dialogue-text-fade { animation: textFadeIn 0.8s ease-out both; opacity: 0.75; }
.dialogue-text-whisper { font-style: italic; opacity: 0.8; }
`.trim();
