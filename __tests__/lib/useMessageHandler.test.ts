import { describe, it, expect } from "vitest";
import { extractMemoriesFromMessage, extractNameFromIntroduction } from "@/hooks/useMessageHandler";

describe("extractMemoriesFromMessage", () => {
  it("extracts likes", () => {
    const result = extractMemoriesFromMessage("i really like chocolate cake");
    expect(result).toHaveLength(1);
    expect(result[0].topic).toBe("likes:ch");
    expect(result[0].detail).toBe("i really like ch");
  });

  it("extracts loves", () => {
    const result = extractMemoriesFromMessage("i love programming");
    expect(result).toHaveLength(1);
    expect(result[0].topic).toContain("loves:");
  });

  it("extracts identity", () => {
    const result = extractMemoriesFromMessage("i am a software engineer");
    expect(result).toHaveLength(1);
    expect(result[0].topic).toContain("identity");
  });

  it("returns empty for no matches", () => {
    expect(extractMemoriesFromMessage("hello there")).toHaveLength(0);
  });
});

describe("extractNameFromIntroduction", () => {
  it("extracts name from 'my name is X'", () => {
    expect(extractNameFromIntroduction("my name is Gilles")).toBe("Gilles");
  });

  it("extracts name from 'call me X'", () => {
    expect(extractNameFromIntroduction("call me Ace")).toBe("Ace");
  });

  it("ignores common words", () => {
    expect(extractNameFromIntroduction("I'm fine")).toBeNull();
    expect(extractNameFromIntroduction("I'm happy")).toBeNull();
  });

  it("returns null for no match", () => {
    expect(extractNameFromIntroduction("what's up")).toBeNull();
  });
});
