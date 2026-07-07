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

const DROP_COLOR = "#8b0000";
const DROP_HIGHLIGHT = "#cc2222";

export function drawDrop(ctx: CanvasRenderingContext2D, drop: Drop) {
  // Draw trail
  for (const t of drop.trail) {
    if (t.opacity < 0.05) continue;
    ctx.globalAlpha = t.opacity;
    ctx.fillStyle = DROP_COLOR;
    ctx.beginPath();
    ctx.arc(t.x, t.y, drop.radius * 0.6, 0, Math.PI * 2);
    ctx.fill();
  }

  // Draw teardrop
  ctx.globalAlpha = 1;
  const r = drop.radius;
  ctx.beginPath();
  ctx.moveTo(drop.x, drop.y - r * 1.6);
  ctx.bezierCurveTo(drop.x - r, drop.y - r * 0.5, drop.x - r, drop.y + r * 0.5, drop.x, drop.y + r);
  ctx.bezierCurveTo(drop.x + r, drop.y + r * 0.5, drop.x + r, drop.y - r * 0.5, drop.x, drop.y - r * 1.6);
  ctx.closePath();

  const grad = ctx.createRadialGradient(drop.x - r * 0.3, drop.y - r * 0.3, 0, drop.x, drop.y, r * 1.4);
  grad.addColorStop(0, DROP_HIGHLIGHT);
  grad.addColorStop(1, DROP_COLOR);
  ctx.fillStyle = grad;
  ctx.fill();
}

export function drawSplat(ctx: CanvasRenderingContext2D, splat: Splat) {
  ctx.globalAlpha = splat.opacity;
  ctx.fillStyle = DROP_COLOR;
  for (const blob of splat.blobs) {
    ctx.save();
    ctx.translate(splat.x + blob.offsetX, splat.y + blob.offsetY);
    ctx.rotate(blob.angle);
    ctx.beginPath();
    ctx.ellipse(0, 0, blob.rx, blob.ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

export function renderScene(ctx: CanvasRenderingContext2D, scene: DripScene, width: number, height: number) {
  ctx.clearRect(0, 0, width, height);
  for (const drop of scene.drops) {
    drawDrop(ctx, drop);
  }
  for (const splat of scene.splats) {
    drawSplat(ctx, splat);
  }
  ctx.globalAlpha = 1;
}
