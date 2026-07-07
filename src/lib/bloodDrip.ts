const GRAVITY = 500; // px/s^2 — tuned for visual appeal
const MAX_TRAIL = 3;

export interface Drop {
  x: number;
  y: number;
  vy: number;
  radius: number;
  active: boolean;
  trail: Array<{ x: number; y: number; opacity: number }>;
}

export interface Splat {
  x: number;
  y: number;
  blobs: Array<{ rx: number; ry: number; offsetX: number; offsetY: number; angle: number }>;
  opacity: number;
  age: number;
}

export function createDrop(x: number, y: number): Drop {
  return {
    x,
    y,
    vy: 0,
    radius: 4 + Math.random() * 2,
    active: true,
    trail: [],
  };
}

export function updateDrop(drop: Drop, dt: number): Drop {
  const trail = [
    { x: drop.x, y: drop.y, opacity: 0.4 },
    ...drop.trail,
  ].slice(0, MAX_TRAIL);

  // Decay trail opacity
  for (let i = 0; i < trail.length; i++) {
    trail[i] = { ...trail[i], opacity: trail[i].opacity * 0.6 };
  }

  const vy = drop.vy + GRAVITY * dt;
  const y = drop.y + vy * dt;

  return { ...drop, vy, y, trail };
}
