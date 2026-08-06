import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { initSaveSystem, saveSnapshot } from "@/lib/saveSystem";

// Route a mocked fetch by URL so /api/load and /api/save behave independently.
function mockServer(loadResponse: { data: Record<string, string> | null }) {
  const loadCalls: string[] = [];
  const saveCalls: string[] = [];
  const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
    if (url === "/api/load") {
      loadCalls.push(url);
      return { ok: true, json: async () => loadResponse } as Response;
    }
    if (url === "/api/save") {
      saveCalls.push(url);
      return { ok: true, json: async () => ({ ok: true, timestamp: 1 }) } as Response;
    }
    throw new Error(`unexpected url ${url}`);
  });
  vi.stubGlobal("fetch", fetchMock as unknown as typeof fetch);
  return { loadCalls, saveCalls };
}

beforeEach(() => {
  const { IDBFactory } = require("fake-indexeddb");
  globalThis.indexedDB = new IDBFactory();
  localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("initSaveSystem layered restore", () => {
  it("restores from the server when browser and IndexedDB are both empty", async () => {
    const server = mockServer({
      data: { "anime-chatbot-history-arisu": "[9]" },
    });

    const { restored } = await initSaveSystem();

    expect(restored).toBe(true);
    expect(server.loadCalls).toHaveLength(1);
    expect(localStorage.getItem("anime-chatbot-history-arisu")).toBe("[9]");
  });

  it("does not touch the server or overwrite when the browser already has progress", async () => {
    localStorage.setItem("anime-chatbot-history-arisu", "LOCAL");
    const server = mockServer({ data: { "anime-chatbot-history-arisu": "REMOTE" } });

    const { restored } = await initSaveSystem();

    expect(restored).toBe(false);
    expect(server.loadCalls).toHaveLength(0); // never reached /api/load
    expect(localStorage.getItem("anime-chatbot-history-arisu")).toBe("LOCAL");
  });

  it("uses IndexedDB before falling back to the server", async () => {
    // Seed IndexedDB with a snapshot, then clear localStorage.
    localStorage.setItem("anime-chatbot-history-arisu", "FROM_IDB");
    await saveSnapshot(); // writes a full snapshot to IndexedDB
    localStorage.clear();

    const server = mockServer({ data: { "anime-chatbot-history-arisu": "FROM_SERVER" } });

    const { restored } = await initSaveSystem();

    expect(restored).toBe(true);
    expect(server.loadCalls).toHaveLength(0); // IndexedDB satisfied the restore
    expect(localStorage.getItem("anime-chatbot-history-arisu")).toBe("FROM_IDB");
  });
});
