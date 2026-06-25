export type Expression = "neutral" | "happy" | "thinking" | "surprised" | "sad" | "smirk" | "laugh" | "angry" | "flustered" | "devoted" | "teasing" | "sleepy" | "excited" | "shy" | "jealous" | "crying";

export type EyeVariant = "neutral" | "happy" | "surprised" | "sad" | "angry" | "closed";
export type EyebrowVariant = "neutral" | "raised" | "furrowed" | "sad";
export type MouthVariant = "closed" | "smile" | "talk-1" | "talk-2" | "surprised" | "pout";
export type BodyPose = "neutral" | "arms-crossed" | "leaning";

export interface ExpressionMapping {
  eyes: EyeVariant;
  eyebrows: EyebrowVariant;
  mouth: MouthVariant;
}

export interface ThemeColors {
  accent: string;
  light: string;
  glow: string;
  tint: string;
  bubble: string;
}

export interface SpriteConfig {
  basePath: string;
  poses: BodyPose[];
  defaultPose: BodyPose;
  expressionMap: Record<Expression, ExpressionMapping>;
}

export interface Character {
  id: string;
  name: string;
  tagline: string;
  archetype: string;
  systemPrompt: string;
  greetings: string[];
  theme: ThemeColors;
  sprite: SpriteConfig;
}
