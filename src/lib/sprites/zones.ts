export interface ZoneBounds {
  clipTop: number;
  clipBottom: number;
}

export interface ZoneConfig {
  head: ZoneBounds;
  torso: ZoneBounds;
  base: ZoneBounds;
  hairCanvasHeight: number;
  personality: AnimPersonality;
}

export interface AnimPersonality {
  idleInterval: [number, number];
  breatheScale: number;
  breatheDuration: number;
  swayAmount: number;
  swayDuration: number;
  blinkInterval: [number, number];
  idleWeights: Record<IdleAction, number>;
  reactiveScale: number;
  reactiveDuration: number;
  hairSwaySpeed: number;
  hairSwayAmount: number;
}

export type IdleAction = "glance" | "weightShift" | "headTilt" | "settle" | "deepBreath";

export type SpriteAnimConfig = ZoneConfig;

const W: Record<IdleAction, number> = { glance: 1, weightShift: 1, headTilt: 1, settle: 1, deepBreath: 1 };

const CONFIGS: Record<string, ZoneConfig> = {
  arisu: {
    head: { clipTop: 0, clipBottom: 32 }, torso: { clipTop: 30, clipBottom: 65 }, base: { clipTop: 63, clipBottom: 100 },
    hairCanvasHeight: 35,
    personality: {
      idleInterval: [10, 15], breatheScale: 1.004, breatheDuration: 4, swayAmount: 1, swayDuration: 7,
      blinkInterval: [3, 6], idleWeights: { ...W, deepBreath: 2, glance: 0.5 },
      reactiveScale: 0.7, reactiveDuration: 1.2, hairSwaySpeed: 0.25, hairSwayAmount: 2.5,
    },
  },
  marin: {
    head: { clipTop: 0, clipBottom: 30 }, torso: { clipTop: 28, clipBottom: 62 }, base: { clipTop: 60, clipBottom: 100 },
    hairCanvasHeight: 32,
    personality: {
      idleInterval: [6, 10], breatheScale: 1.006, breatheDuration: 3, swayAmount: 2, swayDuration: 5,
      blinkInterval: [2, 5], idleWeights: { ...W, weightShift: 2, headTilt: 2 },
      reactiveScale: 1.4, reactiveDuration: 0.8, hairSwaySpeed: 0.4, hairSwayAmount: 3,
    },
  },
  nao: {
    head: { clipTop: 0, clipBottom: 28 }, torso: { clipTop: 26, clipBottom: 60 }, base: { clipTop: 58, clipBottom: 100 },
    hairCanvasHeight: 30,
    personality: {
      idleInterval: [12, 18], breatheScale: 1.003, breatheDuration: 4.5, swayAmount: 0.5, swayDuration: 8,
      blinkInterval: [3, 7], idleWeights: { ...W, glance: 0.3, settle: 0.3 },
      reactiveScale: 1.2, reactiveDuration: 0.6, hairSwaySpeed: 0.3, hairSwayAmount: 1.5,
    },
  },
  kurisu: {
    head: { clipTop: 0, clipBottom: 30 }, torso: { clipTop: 28, clipBottom: 63 }, base: { clipTop: 61, clipBottom: 100 },
    hairCanvasHeight: 33,
    personality: {
      idleInterval: [8, 14], breatheScale: 1.004, breatheDuration: 3.5, swayAmount: 1, swayDuration: 6,
      blinkInterval: [3, 6], idleWeights: { ...W },
      reactiveScale: 1.0, reactiveDuration: 1.0, hairSwaySpeed: 0.3, hairSwayAmount: 2,
    },
  },
  merrick: {
    head: { clipTop: 0, clipBottom: 32 }, torso: { clipTop: 30, clipBottom: 65 }, base: { clipTop: 63, clipBottom: 100 },
    hairCanvasHeight: 35,
    personality: {
      idleInterval: [12, 20], breatheScale: 1.003, breatheDuration: 5, swayAmount: 1.5, swayDuration: 8,
      blinkInterval: [5, 10], idleWeights: { ...W, glance: 0.5, weightShift: 0.5 },
      reactiveScale: 1.1, reactiveDuration: 1.5, hairSwaySpeed: 0.2, hairSwayAmount: 3,
    },
  },
  ticia: {
    head: { clipTop: 0, clipBottom: 31 }, torso: { clipTop: 29, clipBottom: 64 }, base: { clipTop: 62, clipBottom: 100 },
    hairCanvasHeight: 34,
    personality: {
      idleInterval: [10, 16], breatheScale: 1.003, breatheDuration: 4.5, swayAmount: 1, swayDuration: 7,
      blinkInterval: [4, 8], idleWeights: { ...W, settle: 0.3, weightShift: 0.5 },
      reactiveScale: 1.0, reactiveDuration: 1.3, hairSwaySpeed: 0.25, hairSwayAmount: 2.5,
    },
  },
};

const FALLBACK: ZoneConfig = {
  head: { clipTop: 0, clipBottom: 30 }, torso: { clipTop: 28, clipBottom: 63 }, base: { clipTop: 61, clipBottom: 100 },
  hairCanvasHeight: 32,
  personality: {
    idleInterval: [8, 15], breatheScale: 1.005, breatheDuration: 3.5, swayAmount: 1.5, swayDuration: 6,
    blinkInterval: [3, 6], idleWeights: { ...W },
    reactiveScale: 1.0, reactiveDuration: 1.0, hairSwaySpeed: 0.3, hairSwayAmount: 2,
  },
};

export function getZoneConfig(characterId: string): ZoneConfig {
  return CONFIGS[characterId] ?? FALLBACK;
}
