import { describe, it, expect } from "vitest";
import { getDialogueEffect } from "@/lib/dialogueEffects";

describe("getDialogueEffect", () => {
  it("angry returns shake class with pitch < 1 and tempo > 1", () => {
    const effect = getDialogueEffect("angry");
    expect(effect.cssClass).toBe("dialogue-text-shake");
    expect(effect.pitchMultiplier).toBeLessThan(1);
    expect(effect.tempoMultiplier).toBeGreaterThan(1);
  });

  it("flustered returns wave class", () => {
    const effect = getDialogueEffect("flustered");
    expect(effect.cssClass).toBe("dialogue-text-wave");
  });

  it("excited returns bounce class", () => {
    const effect = getDialogueEffect("excited");
    expect(effect.cssClass).toBe("dialogue-text-bounce");
  });

  it("neutral returns empty class", () => {
    const effect = getDialogueEffect("neutral");
    expect(effect.cssClass).toBe("");
    expect(effect.pitchMultiplier).toBe(1);
    expect(effect.tempoMultiplier).toBe(1);
  });

  it("devoted returns whisper class", () => {
    const effect = getDialogueEffect("devoted");
    expect(effect.cssClass).toBe("dialogue-text-whisper");
  });
});
