// Server-side on-disk save handlers for HEXXII.
// Pure filesystem functions (dependency-injected directory) used by the
// /api/save and /api/load routes to give game progress durability beyond the
// browser sandbox. Local-only: relies on the Next.js server having FS access.

import fs from "fs";
import path from "path";

export type SaveData = Record<string, string>;

const LATEST = "latest.json";
const COPY_PREFIX = "hexxii-save-";
const COPY_SUFFIX = ".json";
const DEFAULT_KEEP = 10;

/** Build a Windows-safe, chronologically-sortable filename for a copy. */
function copyName(now: number): string {
  // ISO timestamps contain ':' and '.', both illegal on Windows filesystems.
  const stamp = new Date(now).toISOString().replace(/[:.]/g, "-");
  return `${COPY_PREFIX}${stamp}${COPY_SUFFIX}`;
}

function listCopies(dir: string): string[] {
  return fs
    .readdirSync(dir)
    .filter((f) => f.startsWith(COPY_PREFIX) && f.endsWith(COPY_SUFFIX));
}

/** Keep only the newest `keep` timestamped copies; delete the rest. */
function prune(dir: string, keep: number): void {
  const copies = listCopies(dir).sort(); // sanitized-ISO names sort chronologically
  const excess = copies.slice(0, Math.max(0, copies.length - keep));
  for (const f of excess) {
    try {
      fs.rmSync(path.join(dir, f), { force: true });
    } catch {
      // best-effort prune; leaving an extra copy is harmless
    }
  }
}

/**
 * A coarse "how much progress" score for a save blob: total affinity points +
 * total chat-history length across characters. In normal play these only grow,
 * so a lower score means the incoming save is blank/regressed — used to stop a
 * fresh or polluted browser from overwriting real progress on disk.
 */
export function progressScore(data: SaveData): number {
  let score = 0;
  for (const [key, value] of Object.entries(data)) {
    try {
      if (key.includes("affinity-")) {
        const points = (JSON.parse(value) as { points?: number }).points;
        if (typeof points === "number") score += points;
      } else if (key.includes("history-")) {
        const arr = JSON.parse(value);
        if (Array.isArray(arr)) score += arr.length;
      }
    } catch {
      // unparseable value contributes nothing
    }
  }
  return score;
}

/**
 * Write the merged save to disk:
 * - `latest.json` written atomically (temp file + rename) so a crash mid-write
 *   cannot corrupt it.
 * - a timestamped history copy for rollback.
 * - prunes history to the newest `keep` copies.
 * Empty/missing data is a no-op returning { ok: false }.
 */
export function writeSave(
  dir: string,
  data: SaveData,
  opts: { keep?: number; now: number }
): { ok: boolean; timestamp: number } {
  const keep = opts.keep ?? DEFAULT_KEEP;
  const now = opts.now;

  if (!data || Object.keys(data).length === 0) {
    return { ok: false, timestamp: now };
  }

  // Guard: never let a lower-progress save clobber real progress already on
  // disk (a blank/fresh browser must not overwrite a good save).
  const existing = readSave(dir);
  if (existing.data && progressScore(data) < progressScore(existing.data)) {
    return { ok: false, timestamp: now };
  }

  fs.mkdirSync(dir, { recursive: true });

  const json = JSON.stringify(data, null, 2);

  // Atomic write of latest.json: write temp, then rename over the target.
  const target = path.join(dir, LATEST);
  const tmp = path.join(dir, `${LATEST}.tmp`);
  fs.writeFileSync(tmp, json);
  fs.renameSync(tmp, target);

  // Timestamped history copy.
  fs.writeFileSync(path.join(dir, copyName(now)), json);

  prune(dir, keep);

  return { ok: true, timestamp: now };
}

/**
 * Read and parse `latest.json`. Returns { data: null } when the file is
 * missing or unparseable so callers can treat "no durable save" uniformly.
 * The timestamp is the file's last-modified time.
 */
export function readSave(dir: string): { data: SaveData | null; timestamp: number } {
  const target = path.join(dir, LATEST);
  try {
    const raw = fs.readFileSync(target, "utf8");
    const data = JSON.parse(raw) as SaveData;
    const timestamp = fs.statSync(target).mtimeMs;
    return { data, timestamp };
  } catch {
    return { data: null, timestamp: 0 };
  }
}
