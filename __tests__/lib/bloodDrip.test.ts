import { describe, it, expect } from "vitest";
import { createDrop, updateDrop, createSplat, updateSplat } from "@/lib/bloodDrip";

describe("createDrop", () => {
  it("creates a drop at the given coordinates", () => {
    const drop = createDrop(100, 200);
    expect(drop.x).toBe(100);
    expect(drop.y).toBe(200);
    expect(drop.vy).toBe(0);
    expect(drop.radius).toBeGreaterThanOrEqual(4);
    expect(drop.radius).toBeLessThanOrEqual(6);
    expect(drop.active).toBe(true);
  });
});

describe("updateDrop", () => {
  it("applies gravity to velocity each frame", () => {
    const drop = createDrop(100, 200);
    const updated = updateDrop(drop, 1 / 60);
    expect(updated.vy).toBeGreaterThan(0);
    expect(updated.y).toBeGreaterThan(200);
  });

  it("accelerates over multiple frames", () => {
    let drop = createDrop(100, 200);
    drop = updateDrop(drop, 1 / 60);
    const vy1 = drop.vy;
    drop = updateDrop(drop, 1 / 60);
    expect(drop.vy).toBeGreaterThan(vy1);
  });

  it("stores trail positions", () => {
    let drop = createDrop(100, 200);
    drop = updateDrop(drop, 1 / 60);
    drop = updateDrop(drop, 1 / 60);
    expect(drop.trail.length).toBeGreaterThanOrEqual(1);
    expect(drop.trail.length).toBeLessThanOrEqual(3);
  });
});

describe("createSplat", () => {
  it("creates a splat at the given position with 3-5 blobs", () => {
    const splat = createSplat(150, 700);
    expect(splat.x).toBe(150);
    expect(splat.y).toBe(700);
    expect(splat.opacity).toBe(1);
    expect(splat.age).toBe(0);
    expect(splat.blobs.length).toBeGreaterThanOrEqual(3);
    expect(splat.blobs.length).toBeLessThanOrEqual(5);
  });
});

describe("updateSplat", () => {
  it("ages the splat over time", () => {
    let splat = createSplat(150, 700);
    splat = updateSplat(splat, 1);
    expect(splat.age).toBe(1);
    expect(splat.opacity).toBe(1);
  });

  it("fades opacity after linger period", () => {
    let splat = createSplat(150, 700);
    splat = updateSplat(splat, 2.6);
    expect(splat.opacity).toBeLessThan(1);
  });

  it("reaches zero opacity after full duration", () => {
    let splat = createSplat(150, 700);
    splat = updateSplat(splat, 3.1);
    expect(splat.opacity).toBe(0);
  });
});
