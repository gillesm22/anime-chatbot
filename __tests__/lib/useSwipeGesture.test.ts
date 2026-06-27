import { describe, it, expect } from "vitest";
import { detectSwipe } from "@/lib/useSwipeGesture";

describe("detectSwipe", () => {
  it("detects right swipe", () => {
    const result = detectSwipe({ x: 10, y: 200, time: 0 }, { x: 120, y: 205, time: 200 });
    expect(result).not.toBeNull();
    expect(result!.direction).toBe("right");
  });
  it("detects left swipe", () => {
    const result = detectSwipe({ x: 200, y: 200, time: 0 }, { x: 80, y: 195, time: 200 });
    expect(result).not.toBeNull();
    expect(result!.direction).toBe("left");
  });
  it("returns null for short swipe", () => {
    expect(detectSwipe({ x: 100, y: 200, time: 0 }, { x: 120, y: 200, time: 500 })).toBeNull();
  });
  it("returns null for vertical swipe", () => {
    expect(detectSwipe({ x: 100, y: 100, time: 0 }, { x: 105, y: 250, time: 200 })).toBeNull();
  });
  it("detects fast flick even with short distance", () => {
    const result = detectSwipe({ x: 10, y: 200, time: 0 }, { x: 55, y: 202, time: 80 });
    expect(result).not.toBeNull();
    expect(result!.direction).toBe("right");
  });
  it("detects edge swipe", () => {
    const result = detectSwipe({ x: 15, y: 200, time: 0 }, { x: 120, y: 205, time: 200 });
    expect(result!.fromEdge).toBe(true);
  });
  it("non-edge swipe flagged correctly", () => {
    const result = detectSwipe({ x: 100, y: 200, time: 0 }, { x: 250, y: 205, time: 200 });
    expect(result!.fromEdge).toBe(false);
  });
});
