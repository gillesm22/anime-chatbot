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

const SPLAT_LINGER = 2.5;
const SPLAT_FADE = 0.5;

export function createSplat(x: number, y: number): Splat {
  const blobCount = 3 + Math.floor(Math.random() * 3); // 3-5
  const blobs: Splat["blobs"] = [];
  for (let i = 0; i < blobCount; i++) {
    blobs.push({
      rx: 4 + Math.random() * 6,
      ry: 2 + Math.random() * 4,
      offsetX: (Math.random() - 0.5) * 12,
      offsetY: (Math.random() - 0.5) * 6,
      angle: Math.random() * Math.PI,
    });
  }
  return { x, y, blobs, opacity: 1, age: 0 };
}

export function updateSplat(splat: Splat, dt: number): Splat {
  const age = splat.age + dt;
  let opacity = 1;
  if (age > SPLAT_LINGER) {
    opacity = Math.max(0, 1 - (age - SPLAT_LINGER) / SPLAT_FADE);
  }
  return { ...splat, age, opacity };
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
