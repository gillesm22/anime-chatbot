import { describe, it, expect } from "vitest";
import { getHotspotsForScene, SCENE_HOTSPOTS } from "@/lib/sceneObjects";

describe("getHotspotsForScene", () => {
  it("returns hotspots for lab", () => {
    const hotspots = getHotspotsForScene("lab");
    expect(hotspots.length).toBeGreaterThan(0);
    expect(hotspots.every(h => h.scenes.includes("lab"))).toBe(true);
  });

  it("returns hotspots for cafe", () => {
    const hotspots = getHotspotsForScene("cafe");
    expect(hotspots.length).toBeGreaterThan(0);
  });

  it("returns hotspots for cyberpunk", () => {
    const hotspots = getHotspotsForScene("cyberpunk");
    expect(hotspots.length).toBeGreaterThan(0);
  });

  it("returns empty for outdoor scenes", () => {
    expect(getHotspotsForScene("sakura")).toHaveLength(0);
    expect(getHotspotsForScene("beach")).toHaveLength(0);
    expect(getHotspotsForScene("rain")).toHaveLength(0);
  });

  it("all hotspots have valid positions", () => {
    for (const h of SCENE_HOTSPOTS) {
      expect(h.x).toBeGreaterThanOrEqual(0);
      expect(h.x + h.width).toBeLessThanOrEqual(100);
      expect(h.y).toBeGreaterThanOrEqual(0);
      expect(h.y + h.height).toBeLessThanOrEqual(100);
    }
  });
});
