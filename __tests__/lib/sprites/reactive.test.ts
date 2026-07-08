import { describe, it, expect } from "vitest";
import { getReactiveAnimation, getConversationAnimation } from "@/lib/sprites/reactive";

describe("getReactiveAnimation", () => {
  it("returns animation for happy expression", () => {
    const anim = getReactiveAnimation("happy");
    expect(anim).toBeDefined();
    expect(anim!.duration).toBeGreaterThan(0);
    expect(typeof anim!.apply).toBe("function");
  });

  it("returns animation for all mapped expressions", () => {
    const mapped = ["happy","laugh","thinking","surprised","flustered","shy","angry","sad","crying","excited","teasing","smirk","devoted","sleepy","jealous"] as const;
    for (const expr of mapped) {
      expect(getReactiveAnimation(expr), `missing ${expr}`).toBeDefined();
    }
  });

  it("returns null for neutral", () => {
    expect(getReactiveAnimation("neutral")).toBeNull();
  });

  it("apply returns transforms at t=0.5", () => {
    const anim = getReactiveAnimation("surprised")!;
    const tr = anim.apply(0.5, 1.0);
    expect(tr.head || tr.torso || tr.base).toBeTruthy();
  });
});

describe("getConversationAnimation", () => {
  it("returns animation for message_sent", () => {
    const anim = getConversationAnimation("message_sent");
    expect(anim).toBeDefined();
    expect(anim!.duration).toBeGreaterThan(0);
  });
});
