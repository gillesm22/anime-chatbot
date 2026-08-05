# Auto-Save System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prevent data loss by auto-saving all game progress to IndexedDB with incremental updates, auto-restoring on empty localStorage, and providing a quick-access save button.

**Architecture:** A single `saveSystem.ts` module handles all IndexedDB operations (open, snapshot, diff, restore, prune). It's initialized once from the chat page's client component. A `SaveToast` component shows feedback. The save button lives in `BottomNav`. The existing Settings backup/restore stays untouched.

**Tech Stack:** IndexedDB (raw API, no library), React hooks, existing toast pattern from `MilestoneToast.tsx`.

---

### Task 1: Create `saveSystem.ts` — IndexedDB Core

**Files:**
- Create: `src/lib/saveSystem.ts`
- Test: `__tests__/lib/saveSystem.test.ts`

- [ ] **Step 1: Write the failing test for `openSaveDB`**

Create `__tests__/lib/saveSystem.test.ts`:

```ts
import { describe, it, expect, beforeEach } from "vitest";
import "fake-indexeddb/auto";
import { openSaveDB } from "@/lib/saveSystem";

describe("saveSystem", () => {
  beforeEach(() => {
    // Reset IndexedDB between tests
    indexedDB = new IDBFactory();
  });

  describe("openSaveDB", () => {
    it("opens the hexxii-saves database with snapshots store", async () => {
      const db = await openSaveDB();
      expect(db.name).toBe("hexxii-saves");
      expect(db.objectStoreNames.contains("snapshots")).toBe(true);
      db.close();
    });
  });
});
```

- [ ] **Step 2: Install fake-indexeddb**

Run: `npm install --save-dev fake-indexeddb`

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run __tests__/lib/saveSystem.test.ts`
Expected: FAIL — `openSaveDB` not found

- [ ] **Step 4: Implement `openSaveDB`**

Create `src/lib/saveSystem.ts`:

```ts
const DB_NAME = "hexxii-saves";
const DB_VERSION = 1;
const STORE_NAME = "snapshots";
const LS_PREFIX = "anime-chatbot-";

export interface SaveSnapshot {
  id?: number;
  timestamp: number;
  type: "full" | "diff";
  data: Record<string, string>;
}

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
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run __tests__/lib/saveSystem.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/lib/saveSystem.ts __tests__/lib/saveSystem.test.ts package.json package-lock.json
git commit -m "feat(save): add IndexedDB core with openSaveDB"
```

---

### Task 2: Implement `saveSnapshot` (Full + Incremental)

**Files:**
- Modify: `src/lib/saveSystem.ts`
- Modify: `__tests__/lib/saveSystem.test.ts`

- [ ] **Step 1: Write failing tests for `saveSnapshot`**

Add to `__tests__/lib/saveSystem.test.ts`:

```ts
import { openSaveDB, saveSnapshot, getAllSnapshots } from "@/lib/saveSystem";

describe("saveSnapshot", () => {
  beforeEach(() => {
    indexedDB = new IDBFactory();
    localStorage.clear();
  });

  it("saves a full snapshot on first save", async () => {
    localStorage.setItem("anime-chatbot-history-arisu", '["msg1"]');
    localStorage.setItem("anime-chatbot-affinity-arisu", '{"points":50}');
    localStorage.setItem("unrelated-key", "ignored");

    await saveSnapshot();

    const snapshots = await getAllSnapshots();
    expect(snapshots).toHaveLength(1);
    expect(snapshots[0].type).toBe("full");
    expect(snapshots[0].data["anime-chatbot-history-arisu"]).toBe('["msg1"]');
    expect(snapshots[0].data["anime-chatbot-affinity-arisu"]).toBe('{"points":50}');
    expect(snapshots[0].data["unrelated-key"]).toBeUndefined();
  });

  it("saves a diff snapshot when data changes", async () => {
    localStorage.setItem("anime-chatbot-history-arisu", '["msg1"]');
    localStorage.setItem("anime-chatbot-affinity-arisu", '{"points":50}');
    await saveSnapshot();

    // Change one key
    localStorage.setItem("anime-chatbot-history-arisu", '["msg1","msg2"]');
    await saveSnapshot();

    const snapshots = await getAllSnapshots();
    expect(snapshots).toHaveLength(2);
    expect(snapshots[1].type).toBe("diff");
    expect(Object.keys(snapshots[1].data)).toEqual(["anime-chatbot-history-arisu"]);
    expect(snapshots[1].data["anime-chatbot-history-arisu"]).toBe('["msg1","msg2"]');
  });

  it("skips save when nothing changed", async () => {
    localStorage.setItem("anime-chatbot-history-arisu", '["msg1"]');
    await saveSnapshot();
    await saveSnapshot();

    const snapshots = await getAllSnapshots();
    expect(snapshots).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run __tests__/lib/saveSystem.test.ts`
Expected: FAIL — `saveSnapshot` and `getAllSnapshots` not found

- [ ] **Step 3: Implement `saveSnapshot` and `getAllSnapshots`**

Add to `src/lib/saveSystem.ts`:

```ts
function getAllLocalStorageData(): Record<string, string> {
  const data: Record<string, string> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(LS_PREFIX)) {
      data[key] = localStorage.getItem(key) || "";
    }
  }
  return data;
}

export async function getAllSnapshots(): Promise<SaveSnapshot[]> {
  const db = await openSaveDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => {
      db.close();
      resolve(request.result);
    };
    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
}

let lastSavedData: Record<string, string> | null = null;

export async function saveSnapshot(): Promise<boolean> {
  const currentData = getAllLocalStorageData();

  // Determine if this is first save or incremental
  const snapshots = await getAllSnapshots();
  const lastFull = [...snapshots].reverse().find((s) => s.type === "full");

  if (!lastFull) {
    // First save — full snapshot
    if (Object.keys(currentData).length === 0) return false;
    await writeSnapshot({ timestamp: Date.now(), type: "full", data: currentData });
    lastSavedData = { ...currentData };
    return true;
  }

  // Build merged state from last full + subsequent diffs
  const merged = { ...lastFull.data };
  const diffsAfterFull = snapshots.filter(
    (s) => s.type === "diff" && s.timestamp > lastFull.timestamp
  );
  for (const diff of diffsAfterFull) {
    Object.assign(merged, diff.data);
  }

  // Compute diff against merged state
  const diff: Record<string, string> = {};
  for (const [key, value] of Object.entries(currentData)) {
    if (merged[key] !== value) {
      diff[key] = value;
    }
  }

  if (Object.keys(diff).length === 0) return false;

  // Every 5th save or if diff is large, write a new full snapshot
  const diffCount = diffsAfterFull.length;
  const isLargeDiff = Object.keys(diff).length > Object.keys(currentData).length * 0.5;

  if (diffCount >= 4 || isLargeDiff) {
    await writeSnapshot({ timestamp: Date.now(), type: "full", data: currentData });
    await pruneOldSnapshots();
  } else {
    await writeSnapshot({ timestamp: Date.now(), type: "diff", data: diff });
  }

  lastSavedData = { ...currentData };
  return true;
}

async function writeSnapshot(snapshot: SaveSnapshot): Promise<void> {
  const db = await openSaveDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    store.add(snapshot);
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run __tests__/lib/saveSystem.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/saveSystem.ts __tests__/lib/saveSystem.test.ts
git commit -m "feat(save): implement incremental saveSnapshot with diff logic"
```

---

### Task 3: Implement `restoreFromIndexedDB` and `pruneOldSnapshots`

**Files:**
- Modify: `src/lib/saveSystem.ts`
- Modify: `__tests__/lib/saveSystem.test.ts`

- [ ] **Step 1: Write failing tests**

Add to `__tests__/lib/saveSystem.test.ts`:

```ts
import { openSaveDB, saveSnapshot, getAllSnapshots, restoreFromIndexedDB } from "@/lib/saveSystem";

describe("restoreFromIndexedDB", () => {
  beforeEach(() => {
    indexedDB = new IDBFactory();
    localStorage.clear();
  });

  it("restores data when localStorage is empty", async () => {
    // Save some data
    localStorage.setItem("anime-chatbot-history-arisu", '["msg1"]');
    localStorage.setItem("anime-chatbot-affinity-arisu", '{"points":50}');
    await saveSnapshot();

    // Simulate data loss
    localStorage.clear();

    const restored = await restoreFromIndexedDB();
    expect(restored).toBe(true);
    expect(localStorage.getItem("anime-chatbot-history-arisu")).toBe('["msg1"]');
    expect(localStorage.getItem("anime-chatbot-affinity-arisu")).toBe('{"points":50}');
  });

  it("restores merged full + diffs", async () => {
    localStorage.setItem("anime-chatbot-history-arisu", '["msg1"]');
    await saveSnapshot();

    localStorage.setItem("anime-chatbot-history-arisu", '["msg1","msg2"]');
    localStorage.setItem("anime-chatbot-mood-arisu", "happy");
    await saveSnapshot();

    localStorage.clear();

    await restoreFromIndexedDB();
    expect(localStorage.getItem("anime-chatbot-history-arisu")).toBe('["msg1","msg2"]');
    expect(localStorage.getItem("anime-chatbot-mood-arisu")).toBe("happy");
  });

  it("returns false when no snapshots exist", async () => {
    const restored = await restoreFromIndexedDB();
    expect(restored).toBe(false);
  });

  it("does not restore when localStorage has character data", async () => {
    localStorage.setItem("anime-chatbot-history-arisu", '["msg1"]');
    await saveSnapshot();

    // localStorage still has data — should not overwrite
    const restored = await restoreFromIndexedDB();
    expect(restored).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run __tests__/lib/saveSystem.test.ts`
Expected: FAIL — `restoreFromIndexedDB` not found

- [ ] **Step 3: Implement `restoreFromIndexedDB` and `pruneOldSnapshots`**

Add to `src/lib/saveSystem.ts`:

```ts
const CHARACTER_DATA_PATTERNS = [
  "history-", "affinity-", "memories-", "diary-",
  "mood-", "daily-quests-", "gifts-", "confession-",
  "summaries-", "username-",
];

function hasCharacterData(): boolean {
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(LS_PREFIX)) {
      if (CHARACTER_DATA_PATTERNS.some((p) => key.includes(p))) {
        return true;
      }
    }
  }
  return false;
}

export async function restoreFromIndexedDB(): Promise<boolean> {
  if (hasCharacterData()) return false;

  try {
    const snapshots = await getAllSnapshots();
    if (snapshots.length === 0) return false;

    // Find the last full snapshot
    const lastFull = [...snapshots].reverse().find((s) => s.type === "full");
    if (!lastFull) return false;

    // Merge full + subsequent diffs
    const merged = { ...lastFull.data };
    const diffs = snapshots.filter(
      (s) => s.type === "diff" && s.timestamp > lastFull.timestamp
    );
    for (const diff of diffs) {
      Object.assign(merged, diff.data);
    }

    // Restore to localStorage
    for (const [key, value] of Object.entries(merged)) {
      localStorage.setItem(key, value);
    }

    return true;
  } catch {
    return false;
  }
}

const MAX_FULL_SNAPSHOTS = 3;

async function pruneOldSnapshots(): Promise<void> {
  const snapshots = await getAllSnapshots();
  const fullSnapshots = snapshots.filter((s) => s.type === "full");

  if (fullSnapshots.length <= MAX_FULL_SNAPSHOTS) return;

  // Keep only the last MAX_FULL_SNAPSHOTS full snapshots
  const cutoffTimestamp = fullSnapshots[fullSnapshots.length - MAX_FULL_SNAPSHOTS].timestamp;

  const db = await openSaveDB();
  const tx = db.transaction(STORE_NAME, "readwrite");
  const store = tx.objectStore(STORE_NAME);

  for (const snapshot of snapshots) {
    if (snapshot.timestamp < cutoffTimestamp && snapshot.id != null) {
      store.delete(snapshot.id);
    }
  }

  return new Promise((resolve) => {
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      resolve();
    };
  });
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run __tests__/lib/saveSystem.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/saveSystem.ts __tests__/lib/saveSystem.test.ts
git commit -m "feat(save): add restoreFromIndexedDB and pruneOldSnapshots"
```

---

### Task 4: Implement `initSaveSystem` and `exportFullBackup`

**Files:**
- Modify: `src/lib/saveSystem.ts`

- [ ] **Step 1: Add `initSaveSystem`, `exportFullBackup`, and `getLastSaveTime`**

Add to `src/lib/saveSystem.ts`:

```ts
let saveInterval: ReturnType<typeof setInterval> | null = null;
let lastSaveTimestamp: number | null = null;

export function getLastSaveTime(): number | null {
  return lastSaveTimestamp;
}

export async function initSaveSystem(): Promise<{ restored: boolean }> {
  // Step 1: Check if we need to restore
  const restored = await restoreFromIndexedDB();

  // Step 2: Do an initial save of current state
  const saved = await saveSnapshot();
  if (saved) lastSaveTimestamp = Date.now();

  // Step 3: Set up auto-save every 5 minutes (only when tab visible)
  if (saveInterval) clearInterval(saveInterval);
  saveInterval = setInterval(async () => {
    if (document.visibilityState === "visible") {
      const didSave = await saveSnapshot();
      if (didSave) lastSaveTimestamp = Date.now();
    }
  }, 5 * 60 * 1000);

  // Step 4: Save on page hide / unload
  const onVisibilityChange = async () => {
    if (document.visibilityState === "hidden") {
      const didSave = await saveSnapshot();
      if (didSave) lastSaveTimestamp = Date.now();
    }
  };
  document.addEventListener("visibilitychange", onVisibilityChange);

  const onBeforeUnload = () => {
    // Use sync approach for unload — build data and queue it
    try {
      const data = getAllLocalStorageData();
      if (Object.keys(data).length > 0) {
        // Navigator.sendBeacon won't work for IndexedDB, but visibilitychange
        // already handles the async save. This is a best-effort fallback.
      }
    } catch {
      // Best effort
    }
  };
  window.addEventListener("beforeunload", onBeforeUnload);

  return { restored };
}

export function exportFullBackup(): void {
  const data: Record<string, string> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(LS_PREFIX)) {
      data[key] = localStorage.getItem(key) || "";
    }
  }
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
```

- [ ] **Step 2: Run all tests**

Run: `npx vitest run __tests__/lib/saveSystem.test.ts`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/lib/saveSystem.ts
git commit -m "feat(save): add initSaveSystem, exportFullBackup, getLastSaveTime"
```

---

### Task 5: Create `SaveToast` Component

**Files:**
- Create: `src/components/SaveToast.tsx`

- [ ] **Step 1: Create `SaveToast.tsx`**

Based on the existing `MilestoneToast.tsx` pattern:

```tsx
"use client";
import { useState, useEffect } from "react";

interface SaveToastProps {
  message: string;
  type: "save" | "restore";
  onDone: () => void;
}

export function SaveToast({ message, type, onDone }: SaveToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const showTimer = requestAnimationFrame(() => setVisible(true));

    const hideTimer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDone, 500);
    }, 3000);

    return () => {
      cancelAnimationFrame(showTimer);
      clearTimeout(hideTimer);
    };
  }, [onDone]);

  const color = type === "restore" ? "#f59e0b" : "#4ade80";
  const icon = type === "restore" ? "\u21BA" : "\u2713";

  return (
    <div
      style={{
        position: "fixed",
        bottom: "80px",
        left: "50%",
        transform: visible
          ? "translateX(-50%) translateY(0)"
          : "translateX(-50%) translateY(10px)",
        opacity: visible ? 1 : 0,
        transition: "opacity 400ms ease, transform 400ms ease",
        zIndex: 55,
        pointerEvents: "none",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        background: `linear-gradient(135deg, ${color}25 0%, ${color}10 100%)`,
        border: `1px solid ${color}40`,
        boxShadow: `0 4px 16px ${color}15, 0 2px 4px rgba(0,0,0,0.2)`,
        borderRadius: "10px",
        padding: "10px 16px",
        color: "#fff",
        fontSize: "13px",
        whiteSpace: "nowrap",
        display: "flex",
        alignItems: "center",
        gap: "8px",
      }}
    >
      <span style={{ fontSize: "16px", color }}>{icon}</span>
      {message}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/SaveToast.tsx
git commit -m "feat(save): add SaveToast component"
```

---

### Task 6: Add Save Button to BottomNav

**Files:**
- Modify: `src/components/BottomNav.tsx`

- [ ] **Step 1: Add a `SaveIcon` SVG and `onSave` prop**

In `src/components/BottomNav.tsx`, add after the `DotsIcon` function (around line 125):

```tsx
function SaveIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
    </svg>
  );
}
```

- [ ] **Step 2: Update `BottomNavProps` to include `onSave`**

In the `BottomNavProps` interface, add:

```ts
onSave?: () => void;
```

- [ ] **Step 3: Replace the "More" button with a "Save" button**

Change the last `NavButton` in the `BottomNav` return from:

```tsx
<NavButton
  label="More"
  active={activeTab === "more"}
  accentColor={accentColor}
  onClick={onShowQuests}
  icon={<DotsIcon />}
/>
```

to:

```tsx
<NavButton
  label="Save"
  active={false}
  accentColor={accentColor}
  onClick={() => onSave?.()}
  icon={<SaveIcon />}
/>
<NavButton
  label="More"
  active={activeTab === "more"}
  accentColor={accentColor}
  onClick={onShowQuests}
  icon={<DotsIcon />}
/>
```

- [ ] **Step 4: Commit**

```bash
git add src/components/BottomNav.tsx
git commit -m "feat(save): add Save button to BottomNav"
```

---

### Task 7: Integrate Save System into Chat Page

**Files:**
- Modify: `src/app/chat/[characterId]/page.tsx`

- [ ] **Step 1: Add imports**

Add at the top of the chat page imports (after the existing imports around line 69):

```ts
import { initSaveSystem, saveSnapshot, exportFullBackup } from "@/lib/saveSystem";
import { SaveToast } from "@/components/SaveToast";
```

- [ ] **Step 2: Add save state and initialization**

Find the component's state declarations (around line 127-170). Add after the existing state:

```ts
const [saveToast, setSaveToast] = useState<{ message: string; type: "save" | "restore" } | null>(null);
const saveInitialized = useRef(false);
```

Add a `useEffect` for save system initialization. Place it after the existing `useEffect` blocks (look for a good spot after mount effects):

```ts
useEffect(() => {
  if (saveInitialized.current) return;
  saveInitialized.current = true;

  initSaveSystem().then(({ restored }) => {
    if (restored) {
      setSaveToast({ message: "Progress restored from backup", type: "restore" });
    }
  }).catch(() => {
    // Silent fail — save system is non-critical
  });
}, []);
```

- [ ] **Step 3: Add the save handler**

Add a handler function near the other handler functions:

```ts
const handleSave = useCallback(async () => {
  haptic.tick();
  await saveSnapshot();
  exportFullBackup();
  setSaveToast({ message: "Progress saved!", type: "save" });
}, []);
```

- [ ] **Step 4: Wire up BottomNav `onSave` prop**

Find the `<BottomNav` JSX (around line 991) and add the `onSave` prop:

```tsx
onSave={handleSave}
```

- [ ] **Step 5: Add SaveToast to JSX**

Find where `MilestoneToast` is rendered (around line 604) and add nearby:

```tsx
{saveToast && (
  <SaveToast
    message={saveToast.message}
    type={saveToast.type}
    onDone={() => setSaveToast(null)}
  />
)}
```

- [ ] **Step 6: Run dev server and test**

Run: `cd "C:/Users/G$/Kikaku 企画/anime-chatbot" && rm -rf .next && npx next dev --webpack -p 3000`

Test:
1. Open http://localhost:3000, go to any character chat
2. Verify the Save button appears in the bottom nav
3. Click Save — should download a `.json` file and show "Progress saved!" toast
4. Send a few messages, navigate away and back — data persists
5. Open DevTools > Application > IndexedDB > hexxii-saves > snapshots — verify entries exist

- [ ] **Step 7: Commit**

```bash
git add src/app/chat/[characterId]/page.tsx
git commit -m "feat(save): integrate auto-save system into chat page"
```

---

### Task 8: Run Full Test Suite and Verify

**Files:** None (verification only)

- [ ] **Step 1: Run all tests**

Run: `npx vitest run`
Expected: All existing tests pass + new saveSystem tests pass

- [ ] **Step 2: Run the dev server for manual verification**

Run: `cd "C:/Users/G$/Kikaku 企画/anime-chatbot" && rm -rf .next && npx next dev --webpack -p 3000`

Verify:
1. Fresh load — no restore toast (localStorage has data)
2. Click Save in BottomNav — file downloads, toast shows
3. Wait 5 minutes with tab open — check IndexedDB for new snapshot
4. Clear localStorage in DevTools, reload — restore toast appears, data is back
5. Settings page backup/restore still works independently

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "feat: complete auto-save system with IndexedDB backup and quick-save button"
```
