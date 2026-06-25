import { describe, it, expect } from "vitest";
import { characters, getCharacter } from "@/lib/characters";
import type { Character, Expression } from "@/lib/characters/types";

const ALL_EXPRESSIONS: Expression[] = ["neutral", "happy", "thinking", "surprised", "sad"];

describe("Character registry", () => {
  it("exports exactly 3 characters", () => {
    expect(Object.keys(characters)).toHaveLength(3);
    expect(characters.arisu).toBeDefined();
    expect(characters.marin).toBeDefined();
    expect(characters.nao).toBeDefined();
  });

  it("getCharacter returns a character by id", () => {
    const arisu = getCharacter("arisu");
    expect(arisu).toBeDefined();
    expect(arisu!.name).toBe("Arisu");
  });

  it("getCharacter returns undefined for unknown id", () => {
    expect(getCharacter("nobody")).toBeUndefined();
  });

  it.each(["arisu", "marin", "nao"])("%s has all required fields", (id) => {
    const char = characters[id] as Character;
    expect(char.id).toBe(id);
    expect(char.name).toBeTruthy();
    expect(char.tagline).toBeTruthy();
    expect(char.systemPrompt).toBeTruthy();
    expect(char.theme.accent).toMatch(/^#/);
    expect(char.sprite.basePath).toBe(`/sprites/${id}`);
    expect(char.sprite.poses.length).toBeGreaterThanOrEqual(2);
  });

  it.each(["arisu", "marin", "nao"])("%s has all expression mappings", (id) => {
    const char = characters[id] as Character;
    for (const expr of ALL_EXPRESSIONS) {
      const mapping = char.sprite.expressionMap[expr];
      expect(mapping).toBeDefined();
      expect(mapping.eyes).toBeTruthy();
      expect(mapping.eyebrows).toBeTruthy();
      expect(mapping.mouth).toBeTruthy();
    }
  });
});
