import { describe, it, expect } from "vitest";
import { getZoneConfig } from "@/lib/sprites/zones";

describe("getZoneConfig", () => {
  it("returns config for known character", () => {
    const config = getZoneConfig("arisu");
    expect(config.head).toBeDefined();
    expect(config.torso).toBeDefined();
    expect(config.base).toBeDefined();
    expect(config.hairCanvasHeight).toBeGreaterThan(0);
  });

  it("returns fallback config for unknown character", () => {
    const config = getZoneConfig("unknown");
    expect(config.head.clipTop).toBe(0);
  });

  it("zone boundaries overlap by 2-3%", () => {
    const config = getZoneConfig("arisu");
    const overlap = config.head.clipBottom - config.torso.clipTop;
    expect(overlap).toBeGreaterThanOrEqual(2);
    expect(overlap).toBeLessThanOrEqual(3);
  });

  it("zones cover the full sprite height", () => {
    const config = getZoneConfig("marin");
    expect(config.head.clipTop).toBe(0);
    expect(config.base.clipBottom).toBe(100);
  });

  it("each character has animation personality config", () => {
    const config = getZoneConfig("marin");
    expect(config.personality.idleInterval).toBeDefined();
    expect(config.personality.reactiveScale).toBeDefined();
    expect(config.personality.hairSwaySpeed).toBeDefined();
  });
});
