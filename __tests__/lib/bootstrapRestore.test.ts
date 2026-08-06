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

describe("bootstrap restore script", () => {
  it("hydrates localStorage from a synchronous /api/load when the browser has no progress", () => {
    const calls = stubSyncXHR({
      status: 200,
      body: {
        data: {
          "anime-chatbot-history-arisu": "[1,2]",
          "anime-chatbot-affinity-arisu": '{"level":5}',
        },
      },
    });

    // eslint-disable-next-line no-eval
    eval(buildBootstrapScript());

    expect(localStorage.getItem("anime-chatbot-history-arisu")).toBe("[1,2]");
    expect(localStorage.getItem("anime-chatbot-affinity-arisu")).toBe('{"level":5}');
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe("/api/load");
    expect(calls[0].async).toBe(false); // must be synchronous (runs before React)
  });

  it("does not fetch or overwrite when the browser already has character data", () => {
    localStorage.setItem("anime-chatbot-history-arisu", "LOCAL");
    const calls = stubSyncXHR({ status: 200, body: { data: { "anime-chatbot-history-arisu": "REMOTE" } } });

    // eslint-disable-next-line no-eval
    eval(buildBootstrapScript());

    expect(calls).toHaveLength(0);
    expect(localStorage.getItem("anime-chatbot-history-arisu")).toBe("LOCAL");
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
