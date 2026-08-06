import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { buildBootstrapScript } from "@/lib/bootstrapRestore";

// A synchronous XMLHttpRequest stub so we can execute the real bootstrap
// script (which uses sync XHR, exactly as it runs beforeInteractive) in jsdom.
function stubSyncXHR(response: { status: number; body: unknown }) {
  const calls: Array<{ method: string; url: string; async: boolean }> = [];
  class FakeXHR {
    status = 0;
    responseText = "";
    private _url = "";
    open(method: string, url: string, async: boolean) {
      calls.push({ method, url, async });
      this._url = url;
    }
    send() {
      this.status = response.status;
      this.responseText = JSON.stringify(response.body);
    }
  }
  vi.stubGlobal("XMLHttpRequest", FakeXHR as unknown as typeof XMLHttpRequest);
  return calls;
}

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

// affinity points + history length = "progress score" (mirrors serverSaves)
const HIGH_DISK = {
  "anime-chatbot-affinity-arisu": '{"points":755,"level":7}',
  "anime-chatbot-history-arisu": JSON.stringify(new Array(180).fill({ role: "user" })),
};

describe("bootstrap restore script", () => {
  it("hydrates localStorage from a synchronous /api/load when the browser has no progress", () => {
    const calls = stubSyncXHR({ status: 200, body: { data: HIGH_DISK } });

    // eslint-disable-next-line no-eval
    eval(buildBootstrapScript());

    expect(localStorage.getItem("anime-chatbot-affinity-arisu")).toBe('{"points":755,"level":7}');
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe("/api/load");
    expect(calls[0].async).toBe(false); // must be synchronous (runs before React)
  });

  it("heals a blank/polluted browser: restores when the disk has MORE progress", () => {
    // Browser looks like a fresh session (level 1, one message) — the exact
    // failure mode that used to stick users at level 1.
    localStorage.setItem("anime-chatbot-affinity-arisu", '{"points":10,"level":1}');
    localStorage.setItem("anime-chatbot-history-arisu", '[{"role":"user"}]');
    stubSyncXHR({ status: 200, body: { data: HIGH_DISK } });

    // eslint-disable-next-line no-eval
    eval(buildBootstrapScript());

    expect(JSON.parse(localStorage.getItem("anime-chatbot-affinity-arisu")!).points).toBe(755);
    expect(JSON.parse(localStorage.getItem("anime-chatbot-history-arisu")!)).toHaveLength(180);
  });

  it("does NOT overwrite a browser that is ahead of the disk", () => {
    localStorage.setItem("anime-chatbot-affinity-arisu", '{"points":900,"level":8}');
    localStorage.setItem("anime-chatbot-history-arisu", JSON.stringify(new Array(200).fill({ role: "user" })));
    stubSyncXHR({ status: 200, body: { data: HIGH_DISK } });

    // eslint-disable-next-line no-eval
    eval(buildBootstrapScript());

    expect(JSON.parse(localStorage.getItem("anime-chatbot-affinity-arisu")!).points).toBe(900);
  });

  it("is a no-op when the server has no save (data: null)", () => {
    stubSyncXHR({ status: 200, body: { data: null } });

    // eslint-disable-next-line no-eval
    eval(buildBootstrapScript());

    expect(localStorage.length).toBe(0);
  });

  it("swallows a non-200 response without throwing", () => {
    stubSyncXHR({ status: 500, body: {} });
    // eslint-disable-next-line no-eval
    expect(() => eval(buildBootstrapScript())).not.toThrow();
    expect(localStorage.length).toBe(0);
  });
});
