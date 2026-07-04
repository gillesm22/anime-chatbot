import { describe, it, expect } from "vitest";
import { getObjectsForScene, SCENE_OBJECTS } from "@/lib/sceneObjects";

describe("getObjectsForScene", () => {
  it("returns objects for cozy_room (should have several)", () => {
    const result = getObjectsForScene("cozy_room");
    expect(result.length).toBeGreaterThan(1);
    result.forEach(obj => expect(obj.scenes).toContain("cozy_room"));
  });

  it("returns empty array for unknown scene", () => {
    const result = getObjectsForScene("unknown_scene_xyz");
    expect(result).toEqual([]);
  });

  it("all objects have valid positions (0-100)", () => {
    SCENE_OBJECTS.forEach(obj => {
      expect(obj.x).toBeGreaterThanOrEqual(0);
      expect(obj.x).toBeLessThanOrEqual(100);
      expect(obj.y).toBeGreaterThanOrEqual(0);
      expect(obj.y).toBeLessThanOrEqual(100);
    });
  });
});
