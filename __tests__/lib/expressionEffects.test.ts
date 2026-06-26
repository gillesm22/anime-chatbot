import { describe, it, expect } from "vitest";
import {
  getEmotionDistance,
  getExpressionEffect,
} from "@/lib/expressionEffects";

describe("getEmotionDistance", () => {
  it("returns 0 for the same expression", () => {
    expect(getEmotionDistance("happy", "happy")).toBe(0);
    expect(getEmotionDistance("angry", "angry")).toBe(0);
    expect(getEmotionDistance("neutral", "neutral")).toBe(0);
  });

  it("returns low distance for similar expressions (happy→laugh ≤ 1)", () => {
    expect(getEmotionDistance("happy", "laugh")).toBeLessThanOrEqual(1);
  });

  it("returns high distance for opposite expressions (angry→happy ≥ 3)", () => {
    expect(getEmotionDistance("angry", "happy")).toBeGreaterThanOrEqual(3);
  });
});

describe("getExpressionEffect", () => {
  it("returns null for minor changes (neutral→happy)", () => {
    expect(getExpressionEffect("neutral", "happy")).toBeNull();
  });

  it("returns sparkle for big shift to laugh (sad→laugh)", () => {
    const effect = getExpressionEffect("sad", "laugh");
    expect(effect).not.toBeNull();
    expect(effect?.type).toBe("sparkle");
  });

  it("returns shake for big shift to angry (happy→angry)", () => {
    const effect = getExpressionEffect("happy", "angry");
    expect(effect).not.toBeNull();
    expect(effect?.type).toBe("shake");
  });

  it("returns blush for shift to flustered (neutral→flustered)", () => {
    const effect = getExpressionEffect("neutral", "flustered");
    expect(effect).not.toBeNull();
    expect(effect?.type).toBe("blush");
  });
});
