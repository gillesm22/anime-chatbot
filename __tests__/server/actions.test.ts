import { describe, it, expect } from "vitest";
import {
  getAction,
  listActions,
  REGEN_CHARACTERS,
} from "@/server/actions";

describe("action registry", () => {
  it("exposes exactly the v1 actions", () => {
    const ids = listActions().map((a) => a.id).sort();
    expect(ids).toEqual(
      ["build-gallery", "dev-restart", "git-pull", "git-status", "regen-sprites"].sort()
    );
  });

  it("returns undefined for unknown action ids", () => {
    expect(getAction("rm-rf-everything")).toBeUndefined();
    expect(getAction("")).toBeUndefined();
  });

  it("regen-sprites requires a character param", () => {
    const action = getAction("regen-sprites")!;
    expect(() => action.build({})).toThrow(/character/i);
  });

  it("regen-sprites rejects characters outside the fixed list", () => {
    const action = getAction("regen-sprites")!;
    expect(() => action.build({ character: "hatsune-miku" })).toThrow(/character/i);
    expect(() => action.build({ character: "merrick; rm -rf /" })).toThrow(/character/i);
    expect(() => action.build({ character: "../../etc/passwd" })).toThrow(/character/i);
  });

  it("regen-sprites maps every allowed character to a node script", () => {
    const action = getAction("regen-sprites")!;
    for (const character of REGEN_CHARACTERS) {
      const { cmd, args } = action.build({ character });
      expect(cmd).toBe("node");
      expect(args).toHaveLength(1);
      expect(args[0]).toMatch(/^scripts[\\/]regen-.*\.mjs$/);
    }
  });

  it("regen-sprites merrick maps to the current merrick script", () => {
    const action = getAction("regen-sprites")!;
    const { args } = action.build({ character: "merrick" });
    expect(args[0]).toBe("scripts/regen-merrick-v2.mjs");
  });

  it("regen-sprites is long-running and categorized as art", () => {
    const action = getAction("regen-sprites")!;
    expect(action.longRunning).toBe(true);
    expect(action.category).toBe("art");
  });

  it("build-gallery runs the gallery build script", () => {
    const action = getAction("build-gallery")!;
    const { cmd, args } = action.build({});
    expect(cmd).toBe("node");
    expect(args).toEqual(["scripts/build-regen-gallery.mjs"]);
    expect(action.longRunning).toBe(true);
  });

  it("git-status is a quick read-only action", () => {
    const action = getAction("git-status")!;
    const { cmd, args } = action.build({});
    expect(cmd).toBe("git");
    expect(args).toEqual(["status"]);
    expect(action.longRunning).toBe(false);
  });

  it("git-pull runs git pull", () => {
    const action = getAction("git-pull")!;
    const { cmd, args } = action.build({});
    expect(cmd).toBe("git");
    expect(args).toEqual(["pull"]);
    expect(action.longRunning).toBe(false);
  });

  it("dev-restart is detached (fire-and-forget)", () => {
    const action = getAction("dev-restart")!;
    expect(action.detached).toBe(true);
    const { cmd, args } = action.build({});
    expect(cmd).toBe("cmd.exe");
    expect(args.join(" ")).toContain("restart-dev.cmd");
  });

  it("every action builds an argv array, never a shell string", () => {
    for (const summary of listActions()) {
      const action = getAction(summary.id)!;
      const params: Record<string, string> =
        summary.id === "regen-sprites" ? { character: REGEN_CHARACTERS[0] } : {};
      const { cmd, args } = action.build(params);
      expect(typeof cmd).toBe("string");
      expect(Array.isArray(args)).toBe(true);
      // no shell metacharacters smuggled into argv
      for (const a of args) expect(a).not.toMatch(/[&|;><`$]/);
    }
  });

  it("catalog entries include what the UI needs and no build function", () => {
    for (const entry of listActions()) {
      expect(entry).toHaveProperty("id");
      expect(entry).toHaveProperty("label");
      expect(entry).toHaveProperty("category");
      expect(entry).toHaveProperty("longRunning");
      expect(entry).not.toHaveProperty("build");
    }
    const regen = listActions().find((a) => a.id === "regen-sprites")!;
    expect(regen.params).toEqual([
      { name: "character", values: [...REGEN_CHARACTERS] },
    ]);
  });
});
