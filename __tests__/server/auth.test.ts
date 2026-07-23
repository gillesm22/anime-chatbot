// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { checkToken } from "@/server/auth";

function requestWithToken(token?: string): Request {
  const headers: Record<string, string> = {};
  if (token !== undefined) headers["x-hexxii-token"] = token;
  return new Request("http://localhost/api/remote/run", { headers });
}

describe("remote auth guard", () => {
  const originalToken = process.env.REMOTE_TOKEN;

  beforeEach(() => {
    process.env.REMOTE_TOKEN = "correct-horse-battery-staple";
  });

  afterEach(() => {
    if (originalToken === undefined) delete process.env.REMOTE_TOKEN;
    else process.env.REMOTE_TOKEN = originalToken;
  });

  it("accepts a request with the right token", () => {
    const result = checkToken(requestWithToken("correct-horse-battery-staple"));
    expect(result.ok).toBe(true);
  });

  it("rejects a missing token with 401", () => {
    const result = checkToken(requestWithToken());
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(401);
  });

  it("rejects a wrong token with 401", () => {
    const result = checkToken(requestWithToken("wrong"));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(401);
  });

  it("rejects a token differing only in length with 401", () => {
    const result = checkToken(
      requestWithToken("correct-horse-battery-staple-extra")
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(401);
  });

  it("refuses everything with 503 when REMOTE_TOKEN is not configured", () => {
    delete process.env.REMOTE_TOKEN;
    const result = checkToken(requestWithToken("anything"));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(503);
  });

  it("refuses everything with 503 when REMOTE_TOKEN is empty", () => {
    process.env.REMOTE_TOKEN = "";
    const result = checkToken(requestWithToken(""));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(503);
  });
});
