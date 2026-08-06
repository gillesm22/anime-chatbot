// IndexedDB-based save system for HEXXII anime chatbot
// Provides snapshot/restore/prune for all anime-chatbot-* localStorage keys

export const DB_NAME = "hexxii-saves";
export const DB_VERSION = 1;
export const STORE_NAME = "snapshots";
export const LS_PREFIX = "anime-chatbot-";

export interface SaveSnapshot {
  id?: number;
  timestamp: number;
  type: "full" | "diff";
  data: Record<string, string>;
}

/** Open (or create) the IndexedDB database with the snapshots store. */
export function openSaveDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id", autoIncrement: true });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/** Collect all localStorage keys starting with LS_PREFIX into a record. */
export function getAllLocalStorageData(): Record<string, string> {
  const data: Record<string, string> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(LS_PREFIX)) {
      data[key] = localStorage.getItem(key)!;
    }
  }
  return data;
}

/** Read all snapshots from IndexedDB, ordered by id (insertion order). */
export function getAllSnapshots(): Promise<SaveSnapshot[]> {
  return new Promise(async (resolve, reject) => {
    const db = await openSaveDB();
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => {
      db.close();
      resolve(request.result as SaveSnapshot[]);
    };
    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
}

/** Internal: write a snapshot record to IndexedDB. Returns assigned id. */
function writeSnapshot(snapshot: SaveSnapshot): Promise<number> {
  return new Promise(async (resolve, reject) => {
    const db = await openSaveDB();
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const request = store.add(snapshot);
    request.onsuccess = () => {
      db.close();
      resolve(request.result as number);
    };
    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
}

/**
 * Prune old snapshots: keep the last 3 full snapshots and their
 * associated diffs. Delete everything older.
 */
async function pruneOldSnapshots(): Promise<void> {
  const all = await getAllSnapshots();
  // Find indices of full snapshots
  const fullIndices: number[] = [];
  for (let i = 0; i < all.length; i++) {
    if (all[i].type === "full") fullIndices.push(i);
  }
  // Keep last 3 fulls and everything after the cutoff
  if (fullIndices.length <= 3) return; // nothing to prune

  const cutoffIndex = fullIndices[fullIndices.length - 3]; // index of 3rd-to-last full
  const toDelete = all.slice(0, cutoffIndex);
  if (toDelete.length === 0) return;

  const db = await openSaveDB();
  const tx = db.transaction(STORE_NAME, "readwrite");
  const store = tx.objectStore(STORE_NAME);
  for (const snap of toDelete) {
    if (snap.id != null) store.delete(snap.id);
  }
  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}

/**
 * Build the merged state from the last full snapshot + subsequent diffs.
 */
function mergeSnapshots(snapshots: SaveSnapshot[]): Record<string, string> {
  // Find last full snapshot
  let lastFullIdx = -1;
  for (let i = snapshots.length - 1; i >= 0; i--) {
    if (snapshots[i].type === "full") {
      lastFullIdx = i;
      break;
    }
  }
  if (lastFullIdx === -1) return {};

  const merged = { ...snapshots[lastFullIdx].data };
  // Apply diffs after it
  for (let i = lastFullIdx + 1; i < snapshots.length; i++) {
    if (snapshots[i].type === "diff") {
      Object.assign(merged, snapshots[i].data);
    }
  }
  return merged;
}

/**
 * Save a snapshot of current localStorage state.
 * - First save: full snapshot
 * - Subsequent: diff if data changed (skips if nothing changed)
 * - Every 5th diff or if diff > 50% of keys: writes full instead
 */
export async function saveSnapshot(): Promise<"full" | "diff" | "skipped"> {
  const current = getAllLocalStorageData();
  const allSnapshots = await getAllSnapshots();

  // First save — always full
  if (allSnapshots.length === 0) {
    await writeSnapshot({ timestamp: Date.now(), type: "full", data: current });
    void pushSnapshotToServer(current);
    return "full";
  }

  // Merge existing state
  const lastState = mergeSnapshots(allSnapshots);

  // Compute diff
  const diff: Record<string, string> = {};
  const allKeys = new Set([...Object.keys(current), ...Object.keys(lastState)]);
  for (const key of allKeys) {
    if (current[key] !== lastState[key]) {
      diff[key] = current[key] ?? ""; // empty string if key was removed
    }
  }

  // Nothing changed
  if (Object.keys(diff).length === 0) {
    return "skipped";
  }

  // Count diffs since last full
  let diffsSinceLastFull = 0;
  for (let i = allSnapshots.length - 1; i >= 0; i--) {
    if (allSnapshots[i].type === "full") break;
    if (allSnapshots[i].type === "diff") diffsSinceLastFull++;
  }

  // Force full if 5th diff or diff exceeds 50% of keys
  const totalKeys = Object.keys(current).length;
  const shouldForceFull =
    diffsSinceLastFull >= 4 || // this would be the 5th diff
    Object.keys(diff).length > totalKeys * 0.5;

  if (shouldForceFull) {
    await writeSnapshot({ timestamp: Date.now(), type: "full", data: current });
    await pruneOldSnapshots();
    void pushSnapshotToServer(current);
    return "full";
  }

  await writeSnapshot({ timestamp: Date.now(), type: "diff", data: diff });
  void pushSnapshotToServer(current);
  return "diff";
}

/**
 * Fire-and-forget push of the full blob to the on-disk save. Gated on
 * `serverSyncEnabled` (turned on by initSaveSystem) so pure unit tests of
 * saveSnapshot don't reach for the network.
 */
async function pushSnapshotToServer(data: Record<string, string>): Promise<void> {
  if (!serverSyncEnabled) return;
  await saveToServer(data);
}

/** Character-specific key patterns that indicate real user data. */
const CHARACTER_KEY_PATTERNS = [
  "history-",
  "affinity-",
  "memories-",
  "diary-",
  "mood-",
  "daily-quests-",
  "gifts-",
  "confession-",
  "summaries-",
  "username-",
];

/** Check if localStorage has any character-specific data. */
export function hasCharacterData(): boolean {
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      for (const pattern of CHARACTER_KEY_PATTERNS) {
        if (key.includes(pattern)) return true;
      }
    }
  }
  return false;
}

/**
 * Restore data from IndexedDB into localStorage.
 * Only restores when localStorage has no character data.
 * Returns true if restoration happened, false otherwise.
 */
export async function restoreFromIndexedDB(): Promise<boolean> {
  if (hasCharacterData()) return false;

  const allSnapshots = await getAllSnapshots();
  if (allSnapshots.length === 0) return false;

  const merged = mergeSnapshots(allSnapshots);
  if (Object.keys(merged).length === 0) return false;

  for (const [key, value] of Object.entries(merged)) {
    localStorage.setItem(key, value);
  }
  return true;
}

// ---------------------------------------------------------------------------
// On-disk durability via the local server (/api/save, /api/load)
// ---------------------------------------------------------------------------

/**
 * Push the full save blob to the local server, which writes it to disk.
 * Non-fatal: any failure (server down, offline) is swallowed and logged so
 * play continues on browser storage exactly as before. Returns true on success.
 */
export async function saveToServer(data: Record<string, string>): Promise<boolean> {
  try {
    const res = await fetch("/api/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data }),
    });
    if (!res.ok) return false;
    const body = await res.json();
    return body?.ok === true;
  } catch (err) {
    console.warn("[saveSystem] saveToServer failed (non-fatal):", err);
    return false;
  }
}

/**
 * Rescue progress from the on-disk save when the browser has none — e.g. after
 * a browser-data wipe or on a fresh browser. Never overwrites a live session:
 * bails out immediately if localStorage already has character data.
 * Returns true if it hydrated localStorage from disk.
 */
export async function restoreFromServer(): Promise<boolean> {
  if (hasCharacterData()) return false;
  try {
    const res = await fetch("/api/load");
    if (!res.ok) return false;
    const body = await res.json();
    const data = body?.data as Record<string, string> | null | undefined;
    if (!data || Object.keys(data).length === 0) return false;
    for (const [key, value] of Object.entries(data)) {
      localStorage.setItem(key, value);
    }
    return true;
  } catch (err) {
    console.warn("[saveSystem] restoreFromServer failed (non-fatal):", err);
    return false;
  }
}

// ---------------------------------------------------------------------------
// Module-level state for save system lifecycle
// ---------------------------------------------------------------------------

let saveInterval: ReturnType<typeof setInterval> | null = null;
let lastSaveTimestamp: number | null = null;
/** When true, saveSnapshot mirrors saves to the on-disk server store. */
let serverSyncEnabled = false;

/** Returns the timestamp of the last successful save, or null. */
export function getLastSaveTime(): number | null {
  return lastSaveTimestamp;
}

/**
 * Initialize the save system:
 * 1. Attempt restore from IndexedDB (only if localStorage is empty)
 * 2. Take an initial snapshot
 * 3. Set up auto-save every 5 minutes (only when page is visible)
 * 4. Save on page hide (visibilitychange)
 */
export async function initSaveSystem(): Promise<{ restored: boolean }> {
  // Enable on-disk mirroring for this session's saves.
  serverSyncEnabled = true;

  // Ask the browser not to evict our storage (best-effort, guarded).
  try {
    await navigator.storage?.persist?.();
  } catch {
    // Unsupported or denied — safe to ignore.
  }

  // Layered restore — stop at the first source with data so a live session is
  // never rolled back:
  //   1. localStorage already has data → both restores below no-op.
  //   2. else IndexedDB (instant, same-browser).
  //   3. else on-disk save via /api/load (survives a browser-data wipe).
  let restored = await restoreFromIndexedDB();
  if (!restored) {
    restored = await restoreFromServer();
  }

  // Initial snapshot
  await saveSnapshot();
  lastSaveTimestamp = Date.now();

  // Auto-save every 5 minutes, but only when page is visible
  if (saveInterval) clearInterval(saveInterval);
  saveInterval = setInterval(async () => {
    if (document.visibilityState === "visible") {
      await saveSnapshot();
      lastSaveTimestamp = Date.now();
    }
  }, 300_000);

  // Save when the user navigates away / switches tabs
  document.addEventListener("visibilitychange", async () => {
    if (document.visibilityState === "hidden") {
      await saveSnapshot();
      lastSaveTimestamp = Date.now();
    }
  });

  // Hard-close durability: a browser tab close may not run async saves in time,
  // so flush the current blob to disk with sendBeacon (fire-and-forget, keeps
  // the request alive through unload). Guarded for environments without it.
  window.addEventListener("pagehide", () => {
    try {
      if (typeof navigator.sendBeacon !== "function") return;
      const data = getAllLocalStorageData();
      if (Object.keys(data).length === 0) return;
      const blob = new Blob([JSON.stringify({ data })], { type: "application/json" });
      navigator.sendBeacon("/api/save", blob);
    } catch {
      // Best-effort; the visibilitychange save above already covers most cases.
    }
  });

  return { restored };
}

/**
 * Export all anime-chatbot-* localStorage data as a downloadable JSON file.
 * Filename: hexxii-save-YYYY-MM-DD.json
 */
export function exportFullBackup(): void {
  const data = getAllLocalStorageData();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `hexxii-save-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
