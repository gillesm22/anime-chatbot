# HEXXII Durable Save System — Design

**Date:** 2026-08-06
**Status:** Approved (design)
**Scope:** Local-only. A future hosted/multi-device version is explicitly out of scope (see Non-Goals).

## Problem

Game progress lives in browser `localStorage` (keys prefixed `anime-chatbot-`). This
persists across normal app close/reopen, and an existing IndexedDB backup auto-restores
when `localStorage` is empty. But both stores are browser-sandboxed: clearing browser
data, switching browsers, or running on a different port/origin wipes them together,
losing all progress. The only durable exports today are manual JSON downloads that a web
page cannot auto-read.

## Goal

On startup, automatically restore the most recent save **when the browser has no
progress** — including after a browser-data wipe or on a fresh browser — without ever
rolling back a live in-progress session. Achieve this by persisting saves to a file on
the local machine that the app's own server reads and writes.

## Non-Goals (YAGNI)

- No cloud/hosted durability. This relies on the local Next.js server having filesystem
  access; it will not work on serverless/Vercel (ephemeral FS). Revisit with a database +
  auth if HEXXII is ever deployed for real multi-device use.
- No save-slot manager UI. Timestamped files on disk cover rollback.
- No new IndexedDB work. The existing IndexedDB restore stays as-is (free same-browser
  fast-path) but nothing new is built on it.

## Design Overview

Two durable layers:

1. **Live browser store** (`localStorage`) — unchanged; the source of truth during play.
2. **On-disk save file** — new; durable backup + rescue, read/written by the local server.

Restore is layered and stops at the first source with data, so a live session is never
clobbered:

1. `localStorage` already has character data → trust it, touch nothing. *(safe behavior)*
2. else existing IndexedDB restore (instant, same-browser).
3. else fetch `/api/load` from disk → hydrate `localStorage`. *(new durability layer)*

Additionally, request `navigator.storage.persist()` once on init to reduce the chance the
browser evicts storage in the first place.

## Components

### 1. On-disk save directory

- Location: `saves/` at the project root (`process.cwd()/saves`).
- Files:
  - `latest.json` — the current merged save (`Record<string,string>` of all
    `anime-chatbot-*` keys).
  - `hexxii-save-<ISO-timestamp>.json` — timestamped history copies.
- Retention: keep the newest ~10 timestamped copies; prune older.
- **Gitignored** — personal progress, never committed. Add `/saves/` to `.gitignore`.

### 2. `POST /api/save`

- Body: `{ data: Record<string,string> }` (the full `anime-chatbot-*` blob).
- Behavior: write `latest.json` **atomically** (write to `latest.json.tmp`, then rename)
  so a crash mid-write can't corrupt the file; also write a timestamped copy; prune to the
  retention limit.
- Response: `{ ok: true, timestamp: number }`.
- Ignores an empty/missing `data` object (no-op, `ok: false`).

### 3. `GET /api/load`

- Behavior: read and parse `latest.json`.
- Response: `{ data: Record<string,string>, timestamp: number }`, or `{ data: null }` if
  no file exists or it can't be parsed.

### 4. `saveSystem.ts` changes

- **`saveToServer(data)`** (new): `POST /api/save`; wrapped in try/catch, failures are
  non-fatal and logged only.
- **`restoreFromServer()`** (new): if `!hasCharacterData()`, `GET /api/load`; if it returns
  data, write each key into `localStorage` and return `true`. Non-fatal on failure.
- **`saveSnapshot()`**: after the existing IndexedDB write, also call `saveToServer` with
  the current blob. (IndexedDB path unchanged.)
- **`initSaveSystem()`**: run the layered restore — existing IndexedDB restore first; if it
  did not restore and there's still no character data, call `restoreFromServer()`. Report
  whichever restore fired via the returned `{ restored }` so the existing "Progress
  restored" toast still shows. Call `navigator.storage.persist()` (guarded for support).
- **Hard-close durability**: on `pagehide`, best-effort `navigator.sendBeacon('/api/save', ...)`
  so a hard close still flushes to disk. Keep the existing visibilitychange-hidden save.

### 5. Seed

- Copy `hexxii-save-2026-07-07.json` (from the user's Downloads) into `saves/latest.json`
  and one timestamped copy, so the first disk-load returns real progress. One-time setup
  step, done during implementation.

## Data Flow

**Save** (auto every 5 min while visible, on tab-hide, on manual Save button, on pagehide):
`localStorage` → IndexedDB snapshot (existing) + `POST /api/save` → `saves/latest.json`
(atomic) + timestamped copy (pruned).

**Load** (startup, in `initSaveSystem`):
`localStorage` has data? → use it. Else IndexedDB restore. Else `GET /api/load` → write to
`localStorage`.

## Error Handling

- All server calls wrapped so failures are non-fatal: if the server is unreachable or the
  file is missing/corrupt, the app runs on browser storage exactly as today.
- Atomic write (temp + rename) prevents corrupting `latest.json`.
- `/api/load` returns `{ data: null }` rather than erroring when there's no save.
- `navigator.storage.persist` / `sendBeacon` guarded for environments that lack them.

## Testing

- Unit-test the file handlers (write `latest.json` + timestamped, atomic rename, prune to
  limit, read-back) against a temp directory.
- Unit-test `restoreFromServer` hydration with `fetch` mocked (data present, data null,
  fetch throws — all handled).
- Confirm existing `saveSystem` tests still pass (IndexedDB behavior unchanged).
- Manual acceptance: clear ALL browser data → reopen app → progress returns from disk; and
  with progress present in the browser, reopening does not overwrite it.

## Interaction With Recent Work

Independent of the Ticia "graveyard" scene and clown/flamenco outfit changes — those are
application code; this feature only moves game-progress data. No conflict.
