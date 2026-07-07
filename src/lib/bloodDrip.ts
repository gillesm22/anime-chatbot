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

const MAX_SPLATS = 20;

interface HexxBounds {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export class DripScene {
  drops: Drop[] = [];
  splats: Splat[] = [];
  floorY: number;
  hexxBounds: HexxBounds | null = null;
  lastHexxFed = false;

  constructor(floorY: number) {
    this.floorY = floorY;
  }

  addDrop(x: number, y: number) {
    this.drops.push(createDrop(x, y));
  }

  isIdle(): boolean {
    return this.drops.length === 0 && this.splats.length === 0;
  }

  tick(dt: number) {
    this.lastHexxFed = false;

    const survivingDrops: Drop[] = [];
    for (const drop of this.drops) {
      const prevY = drop.y;
      const updated = updateDrop(drop, dt);

      if (this.hexxBounds && this._overlapsHexx(updated, prevY)) {
        this.lastHexxFed = true;
        continue;
      }

      if (updated.y >= this.floorY) {
        this.splats.push(createSplat(updated.x, this.floorY));
        continue;
      }

      survivingDrops.push(updated);
    }
    this.drops = survivingDrops;

    this.splats = this.splats
      .map((s) => updateSplat(s, dt))
      .filter((s) => s.opacity > 0);

    if (this.splats.length > MAX_SPLATS) {
      this.splats = this.splats.slice(this.splats.length - MAX_SPLATS);
    }
  }

  private _overlapsHexx(drop: Drop, prevY?: number): boolean {
    if (!this.hexxBounds) return false;
    const b = this.hexxBounds;
    if (drop.x < b.left || drop.x > b.right) return false;
    // Check if the drop's current position or its path from prevY crosses the bounds
    const yMin = prevY !== undefined ? Math.min(prevY, drop.y) : drop.y;
    const yMax = prevY !== undefined ? Math.max(prevY, drop.y) : drop.y;
    return yMax >= b.top && yMin <= b.bottom;
  }
}
