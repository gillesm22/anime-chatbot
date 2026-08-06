import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { saveToServer, restoreFromServer } from "@/lib/saveSystem";

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("saveToServer", () => {
  it("POSTs the data to /api/save and returns true when the server responds ok", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true, timestamp: 123 }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const data = { "anime-chatbot-history-arisu": "[1]" };
    const result = await saveToServer(data);

    expect(result).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/save");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body)).toEqual({ data });
  });

  it("returns false without throwing when fetch rejects", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network")));
    const result = await saveToServer({ "anime-chatbot-x": "1" });
    expect(result).toBe(false);
  });
});

describe("restoreFromServer", () => {
  it("hydrates localStorage from /api/load and returns true when the browser has no progress", async () => {
    const serverData = {
      "anime-chatbot-history-arisu": "[1,2,3]",
      "anime-chatbot-affinity-arisu": '{"level":4}',
    };
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ data: serverData, timestamp: 999 }),
      })
    );

    const result = await restoreFromServer();

    expect(result).toBe(true);
    expect(localStorage.getItem("anime-chatbot-history-arisu")).toBe("[1,2,3]");
    expect(localStorage.getItem("anime-chatbot-affinity-arisu")).toBe('{"level":4}');
  });

  it("does not fetch or overwrite when the browser already has character data", async () => {
    localStorage.setItem("anime-chatbot-history-arisu", "LOCAL");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const result = await restoreFromServer();

    expect(result).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(localStorage.getItem("anime-chatbot-history-arisu")).toBe("LOCAL");
  });

  it("returns false when the server has no save (data: null)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ data: null }) })
    );
    const result = await restoreFromServer();
    expect(result).toBe(false);
  });

  it("returns false without throwing when fetch rejects", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network")));
    const result = await restoreFromServer();
    expect(result).toBe(false);
  });
});
