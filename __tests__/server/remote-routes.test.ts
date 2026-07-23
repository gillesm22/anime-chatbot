// @vitest-environment node
import { describe, it, expect, beforeAll } from "vitest";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const TOKEN = "test-token-for-routes";

beforeAll(() => {
  process.env.REMOTE_TOKEN = TOKEN;
  process.env.HEXXII_REMOTE_DATA_DIR = mkdtempSync(join(tmpdir(), "hexxii-state-"));
});

function post(url: string, body: unknown, token?: string): Request {
  return new Request(`http://localhost${url}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(token ? { "x-hexxii-token": token } : {}),
    },
    body: JSON.stringify(body),
  });
}

function get(url: string, token?: string): Request {
  return new Request(`http://localhost${url}`, {
    headers: token ? { "x-hexxii-token": token } : {},
  });
}

describe("POST /api/remote/run", () => {
  it("rejects a missing token with 401", async () => {
    const { POST } = await import("@/app/api/remote/run/route");
    const res = await POST(post("/api/remote/run", { action: "git-status" }));
    expect(res.status).toBe(401);
  });

  it("rejects an unknown action with 400 and does not spawn", async () => {
    const { POST } = await import("@/app/api/remote/run/route");
    const res = await POST(
      post("/api/remote/run", { action: "format-c-drive" }, TOKEN)
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/unknown action/i);
  });

  it("rejects an invalid character with 400", async () => {
    const { POST } = await import("@/app/api/remote/run/route");
    const res = await POST(
      post(
        "/api/remote/run",
        { action: "regen-sprites", params: { character: "not-a-char" } },
        TOKEN
      )
    );
    expect(res.status).toBe(400);
  });

  it("rejects a non-JSON body with 400", async () => {
    const { POST } = await import("@/app/api/remote/run/route");
    const res = await POST(
      new Request("http://localhost/api/remote/run", {
        method: "POST",
        headers: { "x-hexxii-token": TOKEN },
        body: "not json",
      })
    );
    expect(res.status).toBe(400);
  });

  it("runs a quick action synchronously and returns its output", async () => {
    const { POST } = await import("@/app/api/remote/run/route");
    const res = await POST(
      post("/api/remote/run", { action: "git-status" }, TOKEN)
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.exitCode).toBe(0);
    expect(body.output).toMatch(/branch/i);
  });
});

describe("GET /api/remote/actions", () => {
  it("rejects a missing token", async () => {
    const { GET } = await import("@/app/api/remote/actions/route");
    const res = await GET(get("/api/remote/actions"));
    expect(res.status).toBe(401);
  });

  it("returns the v1 catalog", async () => {
    const { GET } = await import("@/app/api/remote/actions/route");
    const res = await GET(get("/api/remote/actions", TOKEN));
    expect(res.status).toBe(200);
    const body = await res.json();
    const ids = body.actions.map((a: { id: string }) => a.id).sort();
    expect(ids).toEqual(
      ["build-gallery", "dev-restart", "git-pull", "git-status", "regen-sprites"].sort()
    );
  });
});

describe("GET /api/remote/jobs", () => {
  it("rejects a missing token", async () => {
    const { GET } = await import("@/app/api/remote/jobs/route");
    const res = await GET(get("/api/remote/jobs"));
    expect(res.status).toBe(401);
  });

  it("returns a jobs array", async () => {
    const { GET } = await import("@/app/api/remote/jobs/route");
    const res = await GET(get("/api/remote/jobs", TOKEN));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.jobs)).toBe(true);
  });
});

describe("GET /api/remote/jobs/[id]", () => {
  it("404s for an unknown job id", async () => {
    const { GET } = await import("@/app/api/remote/jobs/[id]/route");
    const res = await GET(get("/api/remote/jobs/nope", TOKEN), {
      params: Promise.resolve({ id: "nope" }),
    });
    expect(res.status).toBe(404);
  });
});

describe("POST /api/remote/push/subscribe", () => {
  it("rejects a missing token", async () => {
    const { POST } = await import("@/app/api/remote/push/subscribe/route");
    const res = await POST(
      post("/api/remote/push/subscribe", { endpoint: "https://x", keys: {} })
    );
    expect(res.status).toBe(401);
  });

  it("stores a valid subscription", async () => {
    const { POST } = await import("@/app/api/remote/push/subscribe/route");
    const res = await POST(
      post(
        "/api/remote/push/subscribe",
        { endpoint: "https://push.example/route-test", keys: { p256dh: "p", auth: "a" } },
        TOKEN
      )
    );
    expect(res.status).toBe(200);
  });

  it("rejects a subscription without an endpoint", async () => {
    const { POST } = await import("@/app/api/remote/push/subscribe/route");
    const res = await POST(post("/api/remote/push/subscribe", { keys: {} }, TOKEN));
    expect(res.status).toBe(400);
  });
});
