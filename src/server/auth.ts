// Token guard for every /api/remote/* route. Second of the three locks
// (Tailscale -> shared token -> allowlist). See docs/hexxii-remote-design.md.

import { timingSafeEqual } from "node:crypto";

export type AuthResult =
  | { ok: true }
  | { ok: false; status: number; error: string };

export function checkToken(req: Request): AuthResult {
  const expected = process.env.REMOTE_TOKEN;
  if (!expected) {
    return {
      ok: false,
      status: 503,
      error: "Remote control disabled: REMOTE_TOKEN is not set in .env.local",
    };
  }
  const provided = req.headers.get("x-hexxii-token") ?? "";
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return { ok: false, status: 401, error: "Invalid or missing token" };
  }
  return { ok: true };
}
