import { describe, it, expect } from "vitest";
import { getSpritePaths, parseExpressionTag, parseSceneTag } from "@/lib/sprites/expressions";
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

describe("parseSceneTag", () => {
  it("extracts scene tag from text", () => {
    const result = parseSceneTag("Let's go to the beach! [scene:beach] It's beautiful.");
    expect(result).toEqual({ sceneId: "beach", text: "Let's go to the beach! It's beautiful." });
  });

  it("returns null when no scene tag", () => {
    expect(parseSceneTag("Just a normal message.")).toBeNull();
  });

  it("handles scene tag at start of text", () => {
    const result = parseSceneTag("[scene:rain] The sky opened up.");
    expect(result).toEqual({ sceneId: "rain", text: "The sky opened up." });
  });

  it("handles scene tag at end of text", () => {
    const result = parseSceneTag("Follow me. [scene:rooftop]");
    expect(result).toEqual({ sceneId: "rooftop", text: "Follow me." });
  });

  it("only extracts the first scene tag", () => {
    const result = parseSceneTag("[scene:cafe] Let's move. [scene:beach]");
    expect(result!.sceneId).toBe("cafe");
  });
});
