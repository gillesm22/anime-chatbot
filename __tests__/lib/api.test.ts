import { describe, it, expect } from "vitest";
import { parseSSEChunk } from "@/lib/api";

describe("parseSSEChunk", () => {
  it("parses a text event", () => {
    const result = parseSSEChunk('data: {"type":"text","content":"Hello"}');
    expect(result).toEqual({ type: "text", content: "Hello" });
  });

  it("parses an expression event", () => {
    const result = parseSSEChunk('data: {"type":"expression","expression":"happy"}');
    expect(result).toEqual({ type: "expression", expression: "happy" });
  });

  it("parses a done event", () => {
    const result = parseSSEChunk('data: {"type":"done"}');
    expect(result).toEqual({ type: "done" });
  });

  it("returns null for empty lines", () => {
    expect(parseSSEChunk("")).toBeNull();
    expect(parseSSEChunk("\n")).toBeNull();
  });

  it("returns null for comment lines", () => {
    expect(parseSSEChunk(": keep-alive")).toBeNull();
  });

  it("returns null for data: [DONE]", () => {
    expect(parseSSEChunk("data: [DONE]")).toBeNull();
  });
});
