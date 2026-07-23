# HEXXII Remote · Design

Control HEXXII from your phone, anywhere, and have it run real (allowlisted)
commands on the PC. Designed 2026-07-22.

## Goal

Reach HEXXII from the phone when away from the PC, trigger long-running jobs
(mainly sprite regen), and get a real push notification when a job finishes.
The PC must be on and HEXXII running for any of this to work.

## Three locks (security model)

The command endpoint is effectively remote code execution, so safety is the
design, not an add-on. Three locks stack:

1. **Tailscale** · only your own devices can reach the server. Nothing is on
   the public internet.
2. **Shared token** · every `/api/remote/*` call must carry a secret token
   (`REMOTE_TOKEN` in `.env.local`, sent as `x-hexxii-token`).
3. **Allowlist** · only named actions defined in the action registry can run.
   Parameters (like character name) are validated against a fixed list before
   anything spawns. No arbitrary shell in v1.

## Transport · Tailscale + HTTPS

- Install Tailscale on PC + phone (free, one app each).
- `tailscale serve https / proxy 3000` gives a private HTTPS URL like
  `https://hexxii.<tailnet>.ts.net`, reachable only inside your tailnet.
- HTTPS matters: service workers + Web Push need a secure context. A raw
  `http://<ip>:3000` will NOT let push register on the phone. `tailscale serve`
  provides a valid Let's Encrypt cert AND keeps it private.
- iOS: web push only works when the PWA is added to the Home Screen (iOS 16.4+).

## Action catalog (allowlist)

Art pipeline (long jobs, notify on finish):
1. **Regen sprites** · param `character` from a fixed list
   (kurisu / merrick / arisu / marin / suzuka / ticia / nao). Runs the matching
   `scripts/regen-<char>.mjs`. Depends on ComfyUI running (localhost:8188).
2. **Build review gallery** · `scripts/build-regen-gallery.mjs`.
3. **Apply selection** · `scripts/apply-regen-selection.mjs`.

Dev / ops (quick):
4. **Start / restart dev server** · `rm -rf .next && next dev --webpack -p 3000`.
5. **Git pull**.
6. **Git status** · read-only peek at the working tree.
7. **Start ComfyUI** · art actions depend on it.

Dev-assist (optional, later):
8. **Launch Claude Code in anime-chatbot**.

v1 = actions 1, 2, 4, 5, 6 plus push. Defer 3, 7, 8 as fast-follows.
Actions that depend on ComfyUI must fail cleanly (readable error), not hang.

## Architecture

```
Phone (PWA)  --HTTPS over Tailscale-->  PC: HEXXII Next.js server
  /remote UI                             /api/remote/* routes
  push notifications <--web-push------    action registry -> spawn scripts
                                          job manager (tracks long jobs)
```

Long jobs run async: the phone gets an instant "started" with a `jobId`; the
job churns on the PC; on exit the server sends a push.

## Units (files)

- `src/server/actions.ts` · action registry. Single source of truth for what
  can run: `{ id, label, category, command, buildArgs, validateParams,
  longRunning }`. Not here = cannot run.
- `src/server/jobs.ts` · job manager. Spawns via `child_process`, streams
  stdout/stderr into a ring buffer (last N lines), tracks status
  (running / done / failed + exit code), persists to a small on-disk file so
  history survives a restart and push can fire on completion.
- `src/server/auth.ts` · token guard for every remote route.
- `src/server/push.ts` · web-push wrapper (VAPID). Sends job-done notifications
  to stored subscriptions.
- API routes (thin wrappers over the above):
  - `POST /api/remote/run` · validate token + params, spawn, return `jobId`
    (or result for quick actions).
  - `GET  /api/remote/jobs` and `/api/remote/jobs/[id]` · status + log tail.
  - `GET  /api/remote/actions` · catalog for the UI.
  - `POST /api/remote/push/subscribe` · store a push subscription.
- `src/app/remote/page.tsx` · phone UI. Action buttons grouped by category,
  character dropdown for regen, live Jobs list (tap for log tail). Token entered
  once, stored on the phone. Styled to match the HEXXII VN look.
- `public/sw.js` · currently a self-unregistering stub. Needs a real `push`
  event handler that shows the notification. (Note: re-enabling the SW may
  interact with the existing unregister logic. Handle deliberately.)

## Notification look

- **Push icon = BloodBat mascot** (the HEXXII mascot), so every notification
  reads as a HEXXII notification at a glance. Set it as the notification `icon`
  (and `badge` for the iOS status-bar glyph). Add a suitably sized PNG under
  `public/icons/` if the current icons are SVG only (iOS notifications want a
  raster icon).
- Banner size/shape is the standard iOS notification banner (OS-controlled); the
  icon inside it is fully HEXXII.
- Tapping a notification opens HEXXII and deep-links to the relevant page (e.g.
  a regen-done push opens the review gallery, not just the home screen).
- Copy is per-action and HEXXII-flavored with emoji, e.g.
  `HEXXII` / `Merrick regen complete - 24 sprites ready. Tap to review.`
- Use a `tag` per job type so a new status replaces the old one instead of
  stacking.

## Web push setup

- Generate VAPID keys (`web-push`). Public key in client, private in `.env.local`.
- Phone: install PWA to Home Screen, grant notification permission, subscribe
  via `pushManager.subscribe`, POST the subscription to
  `/api/remote/push/subscribe` (stored on disk).
- Server: on job exit, `web-push` sends to stored subscriptions.
- `web-push` needs adding to dependencies.

## Testing

Vitest is already set up.
- Action registry rejects unknown character / unknown action id.
- Only allowlisted commands can spawn.
- Job manager state transitions (running -> done / failed, exit code captured).
- Auth guard rejects missing / wrong token.
- Manual end-to-end: trigger a regen from the phone, watch the job, receive the
  push.

## Build order

1. Tailscale on PC + phone; `tailscale serve https / proxy 3000`.
2. Server: `actions.ts` -> `jobs.ts` -> `auth.ts` -> `/api/remote/*` routes.
3. Web push: VAPID keys, real `sw.js` push handler, subscribe flow, fire-on-done.
4. `/remote` phone UI.
5. Tests + one live end-to-end regen from the phone.

## Constraints / notes

- Runs with `--webpack` only (the `$` in the `G$` path breaks Turbopack).
- framer-motion v10 is pinned. Do not upgrade.
- Repo is also Drive-synced; re-read files from disk before editing.
