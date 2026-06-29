import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach } from "vitest";
import {
  openSaveDB,
  DB_NAME,
  STORE_NAME,
  saveSnapshot,
  getAllSnapshots,
  getAllLocalStorageData,
  hasCharacterData,
  restoreFromIndexedDB,
} from "@/lib/saveSystem";

// Reset IndexedDB and localStorage before each test
beforeEach(() => {
  // Create a fresh IDBFactory for isolation
  const { IDBFactory } = require("fake-indexeddb");
  globalThis.indexedDB = new IDBFactory();
  localStorage.clear();
});

describe("openSaveDB", () => {
  it("opens a database named 'hexxii-saves' with a 'snapshots' object store", async () => {
    const db = await openSaveDB();
    expect(db.name).toBe(DB_NAME);
    expect(db.objectStoreNames.contains(STORE_NAME)).toBe(true);
    db.close();
  });
});

describe("saveSnapshot", () => {
  it("first save creates a 'full' snapshot of all anime-chatbot-* keys", async () => {
    localStorage.setItem("anime-chatbot-history-arisu", '[{"role":"user"}]');
    localStorage.setItem("anime-chatbot-affinity-arisu", '{"level":2}');
    localStorage.setItem("unrelated-key", "ignored");

    const result = await saveSnapshot();
    expect(result).toBe("full");

    const snapshots = await getAllSnapshots();
    expect(snapshots).toHaveLength(1);
    expect(snapshots[0].type).toBe("full");
    expect(snapshots[0].data["anime-chatbot-history-arisu"]).toBe('[{"role":"user"}]');
    expect(snapshots[0].data["anime-chatbot-affinity-arisu"]).toBe('{"level":2}');
    expect(snapshots[0].data["unrelated-key"]).toBeUndefined();
  });

  it("creates a 'diff' snapshot when data changes", async () => {
    // Need multiple keys so changing one is < 50%
    localStorage.setItem("anime-chatbot-history-arisu", "v1");
    localStorage.setItem("anime-chatbot-affinity-arisu", "a");
    localStorage.setItem("anime-chatbot-mood-arisu", "neutral");
    await saveSnapshot(); // full

    localStorage.setItem("anime-chatbot-history-arisu", "v2");
    const result = await saveSnapshot();
    expect(result).toBe("diff");

    const snapshots = await getAllSnapshots();
    expect(snapshots).toHaveLength(2);
    expect(snapshots[1].type).toBe("diff");
    expect(snapshots[1].data["anime-chatbot-history-arisu"]).toBe("v2");
  });

  it("skips save when nothing changed", async () => {
    localStorage.setItem("anime-chatbot-mood-arisu", "happy");
    await saveSnapshot(); // full

    const result = await saveSnapshot();
    expect(result).toBe("skipped");

    const snapshots = await getAllSnapshots();
    expect(snapshots).toHaveLength(1);
  });

  it("writes a full snapshot on every 5th diff", async () => {
    // Set up initial data and first full save
    localStorage.setItem("anime-chatbot-key1", "a");
    localStorage.setItem("anime-chatbot-key2", "b");
    localStorage.setItem("anime-chatbot-key3", "c");
    localStorage.setItem("anime-chatbot-key4", "d");
    localStorage.setItem("anime-chatbot-key5", "e");
    await saveSnapshot(); // full #1

    // Create 4 diffs (each changes just one key)
    for (let i = 1; i <= 4; i++) {
      localStorage.setItem("anime-chatbot-key1", `change-${i}`);
      const r = await saveSnapshot();
      expect(r).toBe("diff");
    }

    // 5th diff should become a full
    localStorage.setItem("anime-chatbot-key1", "change-5");
    const result = await saveSnapshot();
    expect(result).toBe("full");
  });

  it("writes a full snapshot when diff exceeds 50% of keys", async () => {
    localStorage.setItem("anime-chatbot-a", "1");
    localStorage.setItem("anime-chatbot-b", "2");
    localStorage.setItem("anime-chatbot-c", "3");
    localStorage.setItem("anime-chatbot-d", "4");
    await saveSnapshot(); // full

    // Change 3 of 4 keys (75% > 50%)
    localStorage.setItem("anime-chatbot-a", "x");
    localStorage.setItem("anime-chatbot-b", "x");
    localStorage.setItem("anime-chatbot-c", "x");
    const result = await saveSnapshot();
    expect(result).toBe("full");
  });
});

describe("restoreFromIndexedDB", () => {
  it("restores data when localStorage is empty", async () => {
    // Save some data first
    localStorage.setItem("anime-chatbot-history-arisu", "saved-history");
    localStorage.setItem("anime-chatbot-affinity-marin", "saved-affinity");
    await saveSnapshot();

    // Clear localStorage to simulate fresh load
    localStorage.clear();
    expect(hasCharacterData()).toBe(false);

    const restored = await restoreFromIndexedDB();
    expect(restored).toBe(true);
    expect(localStorage.getItem("anime-chatbot-history-arisu")).toBe("saved-history");
    expect(localStorage.getItem("anime-chatbot-affinity-marin")).toBe("saved-affinity");
  });

  it("restores merged full + diffs correctly", async () => {
    localStorage.setItem("anime-chatbot-history-arisu", "v1");
    localStorage.setItem("anime-chatbot-mood-arisu", "neutral");
    await saveSnapshot(); // full

    localStorage.setItem("anime-chatbot-history-arisu", "v2");
    await saveSnapshot(); // diff

    localStorage.setItem("anime-chatbot-mood-arisu", "happy");
    await saveSnapshot(); // diff

    // Clear and restore
    localStorage.clear();
    const restored = await restoreFromIndexedDB();
    expect(restored).toBe(true);
    expect(localStorage.getItem("anime-chatbot-history-arisu")).toBe("v2");
    expect(localStorage.getItem("anime-chatbot-mood-arisu")).toBe("happy");
  });

  it("returns false when no snapshots exist", async () => {
    const restored = await restoreFromIndexedDB();
    expect(restored).toBe(false);
  });

  it("does NOT restore when localStorage already has character data", async () => {
    // Save data to IndexedDB
    localStorage.setItem("anime-chatbot-history-arisu", "old-data");
    await saveSnapshot();

    // Simulate existing character data in localStorage
    localStorage.clear();
    localStorage.setItem("anime-chatbot-history-marin", "existing");

    const restored = await restoreFromIndexedDB();
    expect(restored).toBe(false);
    // Should not have overwritten or added arisu data
    expect(localStorage.getItem("anime-chatbot-history-arisu")).toBeNull();
  });
});

describe("pruneOldSnapshots (called internally)", () => {
  it("keeps last 3 full snapshots and prunes older ones", async () => {
    // Create enough data so diffs don't exceed 50% threshold
    // We need many keys so changing one key is < 50%
    for (let i = 0; i < 10; i++) {
      localStorage.setItem(`anime-chatbot-key${i}`, `val${i}`);
    }
    await saveSnapshot(); // full #1

    // Create 4 diffs then a forced full (5th diff -> full)
    for (let d = 1; d <= 4; d++) {
      localStorage.setItem("anime-chatbot-key0", `round1-${d}`);
      await saveSnapshot(); // diff
    }
    localStorage.setItem("anime-chatbot-key0", "round1-5");
    await saveSnapshot(); // full #2 (5th diff -> forced full, prune runs)

    // Create 4 more diffs then a forced full
    for (let d = 1; d <= 4; d++) {
      localStorage.setItem("anime-chatbot-key0", `round2-${d}`);
      await saveSnapshot(); // diff
    }
    localStorage.setItem("anime-chatbot-key0", "round2-5");
    await saveSnapshot(); // full #3 (prune runs)

    // Create 4 more diffs then forced full -> this triggers prune with 4 fulls
    for (let d = 1; d <= 4; d++) {
      localStorage.setItem("anime-chatbot-key0", `round3-${d}`);
      await saveSnapshot(); // diff
    }
    localStorage.setItem("anime-chatbot-key0", "round3-5");
    await saveSnapshot(); // full #4 -> prune should remove full #1 and its diffs

    const snapshots = await getAllSnapshots();
    const fulls = snapshots.filter((s) => s.type === "full");
    expect(fulls.length).toBeLessThanOrEqual(3);
  });
});
