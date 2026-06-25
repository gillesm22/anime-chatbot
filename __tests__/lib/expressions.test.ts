import { describe, it, expect } from "vitest";
import { getSpritePaths, parseExpressionTag } from "@/lib/sprites/expressions";
import { arisu } from "@/lib/characters/arisu";

describe("getSpritePaths", () => {
  it("returns correct paths for neutral expression", () => {
    const paths = getSpritePaths(arisu.sprite, "neutral", "neutral");
    expect(paths).toEqual({
      body: "/sprites/arisu/body-neutral.png",
      eyes: "/sprites/arisu/eyes-neutral.png",
      eyebrows: "/sprites/arisu/eyebrows-neutral.png",
      mouth: "/sprites/arisu/mouth-closed.png",
    });
  });

  it("returns correct paths for happy expression", () => {
    const paths = getSpritePaths(arisu.sprite, "happy", "neutral");
    expect(paths).toEqual({
      body: "/sprites/arisu/body-neutral.png",
      eyes: "/sprites/arisu/eyes-happy.png",
      eyebrows: "/sprites/arisu/eyebrows-neutral.png",
      mouth: "/sprites/arisu/mouth-smile.png",
    });
  });

  it("uses specified pose for body", () => {
    const paths = getSpritePaths(arisu.sprite, "neutral", "arms-crossed");
    expect(paths.body).toBe("/sprites/arisu/body-arms-crossed.png");
  });
});

describe("parseExpressionTag", () => {
  it("extracts expression from tagged response", () => {
    const result = parseExpressionTag("[happy]\nHello there!");
    expect(result).toEqual({ expression: "happy", text: "Hello there!" });
  });

  it("extracts expression with multiple lines of text", () => {
    const result = parseExpressionTag("[thinking]\nLet me consider.\nHere is my answer.");
    expect(result).toEqual({
      expression: "thinking",
      text: "Let me consider.\nHere is my answer.",
    });
  });

  it("defaults to neutral when no tag found", () => {
    const result = parseExpressionTag("No tag here");
    expect(result).toEqual({ expression: "neutral", text: "No tag here" });
  });

  it("handles tag with extra whitespace", () => {
    const result = parseExpressionTag("  [surprised]  \n  Wow!");
    expect(result).toEqual({ expression: "surprised", text: "Wow!" });
  });
});
