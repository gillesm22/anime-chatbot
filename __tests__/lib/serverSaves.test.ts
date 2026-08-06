// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";
import { writeSave, readSave } from "@/lib/serverSaves";

let dir: string;

beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), "hexxii-saves-test-"));
});

afterEach(() => {
  fs.rmSync(dir, { recursive: true, force: true });
});

function timestampedFiles(d: string): string[] {
  return fs
    .readdirSync(d)
    .filter((f) => f.startsWith("hexxii-save-") && f.endsWith(".json"));
}

describe("writeSave", () => {
  it("writes latest.json with the data and returns ok + timestamp", () => {
    const data = { "anime-chatbot-history-arisu": "[1,2]" };
    const result = writeSave(dir, data, { now: 1000 });

    expect(result.ok).toBe(true);
    expect(result.timestamp).toBe(1000);
    const written = JSON.parse(fs.readFileSync(path.join(dir, "latest.json"), "utf8"));
    expect(written).toEqual(data);
  });

  it("also writes a timestamped history copy of the data", () => {
    const data = { "anime-chatbot-mood-arisu": "happy" };
    writeSave(dir, data, { now: 1000 });

    const copies = timestampedFiles(dir);
    expect(copies).toHaveLength(1);
    const copy = JSON.parse(fs.readFileSync(path.join(dir, copies[0]), "utf8"));
    expect(copy).toEqual(data);
  });

  it("leaves no .tmp file behind (atomic write)", () => {
    writeSave(dir, { "anime-chatbot-x": "1" }, { now: 1000 });
    const leftovers = fs.readdirSync(dir).filter((f) => f.endsWith(".tmp"));
    expect(leftovers).toHaveLength(0);
  });

  it("is a no-op for empty data and returns ok:false", () => {
    const result = writeSave(dir, {}, { now: 1000 });
    expect(result.ok).toBe(false);
    expect(fs.existsSync(path.join(dir, "latest.json"))).toBe(false);
    expect(timestampedFiles(dir)).toHaveLength(0);
  });

  it("prunes timestamped copies to the newest `keep`", () => {
    for (let i = 1; i <= 12; i++) {
      writeSave(dir, { "anime-chatbot-x": String(i) }, { now: i * 1000, keep: 3 });
    }
    const copies = timestampedFiles(dir).sort();
    expect(copies).toHaveLength(3);
    // Newest three are for now = 10000, 11000, 12000
    const contents = copies.map(
      (f) => JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"))["anime-chatbot-x"]
    );
    expect(contents.sort((a, b) => Number(a) - Number(b))).toEqual(["10", "11", "12"]);
  });
});

describe("readSave", () => {
  it("returns parsed data and a timestamp from latest.json", () => {
    const data = { "anime-chatbot-affinity-arisu": '{"level":3}' };
    writeSave(dir, data, { now: 1000 });

    const result = readSave(dir);
    expect(result.data).toEqual(data);
    expect(result.timestamp).toBeGreaterThan(0);
  });

  it("returns { data: null } when there is no save file", () => {
    const result = readSave(dir);
    expect(result.data).toBeNull();
  });

  it("returns { data: null } when latest.json is corrupt", () => {
    fs.writeFileSync(path.join(dir, "latest.json"), "{ not valid json");
    const result = readSave(dir);
    expect(result.data).toBeNull();
  });
});
