# Auto-Save System Design

**Date:** 2026-06-29  
**Status:** Approved  
**Goal:** Prevent data loss by auto-saving progress to IndexedDB with incremental updates, plus a quick-access save button for physical file backups.

---

## Problem

All game state (affinity, memories, diary, quests, chat history, settings) lives in localStorage only. If the browser clears site data, a service worker wipes caches, or Google Drive sync interferes, everything is lost. The existing backup feature is buried in Settings and requires manual action — easy to forget.

## Solution

### 1. Auto-Save to IndexedDB (Silent, Incremental)

**Database:** `hexxii-saves` (IndexedDB)  
**Object Store:** `snapshots`

**Schema per snapshot:**
```ts
interface SaveSnapshot {
  id: number;           // auto-increment
  timestamp: number;    // Date.now()
  type: 'full' | 'diff';
  data: Record<string, string>;  // full: all keys, diff: only changed keys
}
```

**Save triggers:**
- Every 5 minutes of active use (visibility API — only when tab is visible)
- On page unload (`visibilitychange` to `hidden` + `beforeunload`)
- On manual save button press

**Incremental logic:**
- First save: full snapshot of all `anime-chatbot-*` localStorage keys
- Subsequent saves: compare current localStorage against last full snapshot, only write changed keys as a `diff` entry
- Every 5th save OR if diff exceeds 50% of keys: write a new `full` snapshot and prune old diffs

**Retention:** Keep last 3 full snapshots + their associated diffs. Prune older ones on each save cycle.

**Auto-restore on load:**
- On app mount, check if localStorage has any `anime-chatbot-*` keys
- If empty (or only has settings, no character data), check IndexedDB for the latest full snapshot
- If found: restore all keys, show toast "Progress restored from backup"
- If localStorage has data: do nothing (normal flow)

### 2. Quick-Access Save Button

**Location:** BottomNav area — a small floppy-disk/save icon, always accessible from chat  
**Behavior:**
- Tap triggers two actions simultaneously:
  1. Snapshot to IndexedDB (incremental save)
  2. Download a physical `hexxii-save-{date}.json` file with full merged state
- Show toast: "Progress saved!" with a checkmark animation

### 3. Existing Settings Backup (Unchanged)

The current Settings > Backup & Restore section stays as-is. It provides the same full export/import for users who want manual control.

---

## Architecture

### New file: `src/lib/saveSystem.ts`

Core module handling all save logic:

```
initSaveSystem()        — called once on app mount, sets up intervals + listeners
saveToIndexedDB()       — incremental save logic
restoreFromIndexedDB()  — auto-restore if localStorage is empty
exportFullBackup()      — download physical file (reuses existing pattern)
getLastSaveTime()       — for UI display
```

**IndexedDB wrapper:** Use raw IndexedDB API (no library needed — the operations are simple: open db, put, getAll, delete).

### Integration points

- **`src/app/layout.tsx`** or root client component: call `initSaveSystem()` on mount
- **`src/components/BottomNav.tsx`**: add save icon button
- **Toast notification**: reuse existing toast/alert pattern in the app

---

## Edge Cases

- **Multiple tabs:** IndexedDB handles concurrent access. Last-write-wins is fine for our use case since all tabs share the same localStorage.
- **Corrupt IndexedDB:** Wrap restore in try/catch. If IndexedDB read fails, proceed normally (no data loss, just no restore).
- **localStorage quota:** Not a concern — max ~700KB, well under the 5-10MB limit.
- **IndexedDB quota:** Keeping 3 snapshots at ~700KB each = ~2MB. Well under limits.

## Non-Goals

- Cloud sync / server-side storage
- Versioned save slots (pick which save to load)
- Encryption of backup files
