import { describe, it, expect, beforeEach, vi } from "vitest";
import { haptic } from "@/lib/haptics";

describe("haptics", () => {
  beforeEach(() => {
    vi.stubGlobal("navigator", { vibrate: vi.fn(() => true) });
    vi.stubGlobal("localStorage", { getItem: () => null, setItem: () => {} });
  });

  it("tick fires a short vibration", () => {
    haptic.tick();
    expect(navigator.vibrate).toHaveBeenCalledWith(5);
  });
  it("pulse fires a medium vibration", () => {
    haptic.pulse();
    expect(navigator.vibrate).toHaveBeenCalledWith(10);
  });
  it("success fires a pattern", () => {
    haptic.success();
    expect(navigator.vibrate).toHaveBeenCalledWith([10, 30, 20, 30, 30]);
  });
  it("pet fires a petting pattern", () => {
    haptic.pet();
    expect(navigator.vibrate).toHaveBeenCalledWith([8, 40, 8, 40, 8]);
  });
  it("expression maps angry to rumble", () => {
    haptic.expression("angry");
    expect(navigator.vibrate).toHaveBeenCalledWith([15, 30, 15, 30, 15]);
  });
  it("expression maps happy to soft", () => {
    haptic.expression("happy");
    expect(navigator.vibrate).toHaveBeenCalledWith(8);
  });
  it("expression maps surprised to doubleTap", () => {
    haptic.expression("surprised");
    expect(navigator.vibrate).toHaveBeenCalledWith([10, 50, 10]);
  });
  it("does nothing when vibrate is not supported", () => {
    vi.stubGlobal("navigator", {});
    haptic.tick();
  });
  it("does nothing when haptics disabled in settings", () => {
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => key === "anime-chatbot-haptics-enabled" ? "false" : null,
      setItem: () => {},
    });
    haptic.tick();
    expect(navigator.vibrate).not.toHaveBeenCalled();
  });
});
