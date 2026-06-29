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
    return "full";
  }

  await writeSnapshot({ timestamp: Date.now(), type: "diff", data: diff });
  return "diff";
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
// Module-level state for save system lifecycle
// ---------------------------------------------------------------------------

let saveInterval: ReturnType<typeof setInterval> | null = null;
let lastSaveTimestamp: number | null = null;

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
  const restored = await restoreFromIndexedDB();

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
