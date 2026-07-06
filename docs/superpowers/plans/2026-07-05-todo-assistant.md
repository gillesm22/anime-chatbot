# Todo Assistant Layer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire the first assistant feature — a task board accessible by tapping invisible hotspots in indoor scenes (lab, cafe, cyberpunk), with in-character reactions from the active girl.

**Architecture:** Replace the visible emoji scene objects with invisible hotspots mapped to scene art elements. Create a todo CRUD module with localStorage persistence. Build a slide-up TodoPanel UI. Wire hotspot taps to open the panel, and dispatch character reactions as ephemeral toasts.

**Tech Stack:** React 19, localStorage, framer-motion v10, existing expression/toast patterns

---

## File Structure

### New files
| File | Responsibility |
|------|---------------|
| `src/lib/todos.ts` | Todo CRUD (add, toggle, delete, getAll), localStorage persistence, 20-item cap |
| `src/components/TodoPanel.tsx` | Slide-up task board UI: add input, task list with checkboxes, delete buttons |

### Modified files
| File | Changes |
|------|---------|
| `src/lib/sceneObjects.ts` | Replace all emoji objects with a single invisible "todos" hotspot per indoor scene |
| `src/components/SceneObjects.tsx` | Render invisible tap zones with first-discovery glow instead of emoji circles |
| `src/app/chat/[characterId]/page.tsx` | Wire `onObjectTap("todos")` to open TodoPanel, add character reactions |

---

## Task 1: Create `todos.ts` — CRUD + persistence

**Files:**
- Create: `src/lib/todos.ts`
- Test: `__tests__/lib/todos.test.ts`

- [ ] **Step 1: Write tests**

```typescript
// __tests__/lib/todos.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import { getTodos, addTodo, toggleTodo, deleteTodo } from "@/lib/todos";

describe("todos", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns empty array when no todos exist", () => {
    expect(getTodos()).toEqual([]);
  });

  it("adds a todo", () => {
    const todo = addTodo("Buy milk");
    expect(todo.text).toBe("Buy milk");
    expect(todo.completed).toBe(false);
    expect(todo.id).toBeTruthy();
    expect(getTodos()).toHaveLength(1);
  });

  it("toggles a todo", () => {
    const todo = addTodo("Buy milk");
    toggleTodo(todo.id);
    expect(getTodos()[0].completed).toBe(true);
    toggleTodo(todo.id);
    expect(getTodos()[0].completed).toBe(false);
  });

  it("deletes a todo", () => {
    const todo = addTodo("Buy milk");
    addTodo("Walk dog");
    deleteTodo(todo.id);
    expect(getTodos()).toHaveLength(1);
    expect(getTodos()[0].text).toBe("Walk dog");
  });

  it("enforces max 20 todos by removing oldest completed", () => {
    for (let i = 0; i < 20; i++) {
      addTodo(`Task ${i}`);
    }
    // Complete the first one
    const todos = getTodos();
    toggleTodo(todos[0].id);
    // Adding 21st should remove the completed one
    addTodo("Task 20");
    const result = getTodos();
    expect(result).toHaveLength(20);
    expect(result.find(t => t.text === "Task 0")).toBeUndefined();
  });

  it("returns null from addTodo when at cap with none completed", () => {
    for (let i = 0; i < 20; i++) {
      addTodo(`Task ${i}`);
    }
    const result = addTodo("Task 20");
    expect(result).toBeNull();
    expect(getTodos()).toHaveLength(20);
  });

  it("persists to localStorage", () => {
    addTodo("Persistent task");
    const raw = localStorage.getItem("anime-chatbot-todos");
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw!);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].text).toBe("Persistent task");
  });
});
```

- [ ] **Step 2: Write implementation**

```typescript
// src/lib/todos.ts
const STORAGE_KEY = "anime-chatbot-todos";
const MAX_TODOS = 20;

export interface Todo {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
}

function makeId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export function getTodos(): Todo[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveTodos(todos: Todo[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}

export function addTodo(text: string): Todo | null {
  const todos = getTodos();
  if (todos.length >= MAX_TODOS) {
    // Remove oldest completed todo to make room
    const oldestCompletedIdx = todos.findIndex(t => t.completed);
    if (oldestCompletedIdx === -1) return null; // all active, can't add
    todos.splice(oldestCompletedIdx, 1);
  }
  const todo: Todo = {
    id: makeId(),
    text: text.slice(0, 100),
    completed: false,
    createdAt: Date.now(),
  };
  todos.push(todo);
  saveTodos(todos);
  return todo;
}

export function toggleTodo(id: string): void {
  const todos = getTodos();
  const todo = todos.find(t => t.id === id);
  if (todo) {
    todo.completed = !todo.completed;
    saveTodos(todos);
  }
}

export function deleteTodo(id: string): void {
  const todos = getTodos().filter(t => t.id !== id);
  saveTodos(todos);
}
```

- [ ] **Step 3: Run tests**

Run: `cd "C:/Users/G$/anime-chatbot" && npx vitest run __tests__/lib/todos.test.ts`
Expected: All 7 tests pass

- [ ] **Step 4: Commit**

```bash
git add src/lib/todos.ts __tests__/lib/todos.test.ts
git commit -m "feat: add todo CRUD with localStorage persistence"
```

---

## Task 2: Create `TodoPanel.tsx` — slide-up task board UI

**Files:**
- Create: `src/components/TodoPanel.tsx`

- [ ] **Step 1: Write the component**

```tsx
// src/components/TodoPanel.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { getTodos, addTodo, toggleTodo, deleteTodo, type Todo } from "@/lib/todos";
import { haptic } from "@/lib/haptics";

interface TodoPanelProps {
  accentColor: string;
  isOpen: boolean;
  onClose: () => void;
  onAdd?: () => void;
  onComplete?: () => void;
}

export function TodoPanel({ accentColor, isOpen, onClose, onAdd, onComplete }: TodoPanelProps) {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Refresh todos when panel opens
  useEffect(() => {
    if (isOpen) {
      setTodos(getTodos());
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const handleAdd = () => {
    const text = inputValue.trim();
    if (!text) return;
    const result = addTodo(text);
    if (result) {
      setTodos(getTodos());
      setInputValue("");
      haptic.tick();
      onAdd?.();
    }
  };

  const handleToggle = (id: string) => {
    toggleTodo(id);
    setTodos(getTodos());
    haptic.tick();
    const todo = getTodos().find(t => t.id === id);
    if (todo?.completed) onComplete?.();
  };

  const handleDelete = (id: string) => {
    deleteTodo(id);
    setTodos(getTodos());
    haptic.tick();
  };

  const activeTodos = todos.filter(t => !t.completed);
  const completedTodos = todos.filter(t => t.completed);

  return (
    <div
      style={{
        position: "absolute",
        bottom: 40,
        left: 0,
        right: 0,
        zIndex: 35,
        background: "rgba(10,10,16,0.95)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        borderTop: `1px solid ${accentColor}20`,
        borderRadius: "16px 16px 0 0",
        padding: "16px 16px 20px",
        maxHeight: "50vh",
        display: "flex",
        flexDirection: "column",
        transform: isOpen ? "translateY(0)" : "translateY(110%)",
        transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        pointerEvents: isOpen ? "auto" : "none",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "rgba(255,255,255,0.7)" }}>
            Tasks
          </span>
          {activeTodos.length > 0 && (
            <span style={{
              fontSize: 10, fontWeight: 700, color: accentColor,
              background: `${accentColor}20`, padding: "2px 8px",
              borderRadius: 99, lineHeight: 1.4,
            }}>
              {activeTodos.length}
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          style={{
            background: "rgba(255,255,255,0.08)", border: "none", borderRadius: "50%",
            width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", color: "rgba(255,255,255,0.5)", fontSize: 14,
          }}
        >
          ✕
        </button>
      </div>

      {/* Add input */}
      <form
        onSubmit={(e) => { e.preventDefault(); handleAdd(); }}
        style={{ display: "flex", gap: 8, marginBottom: 12 }}
      >
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Add a task..."
          maxLength={100}
          style={{
            flex: 1, padding: "8px 14px", borderRadius: 12,
            background: "rgba(255,255,255,0.06)",
            border: `1px solid ${accentColor}25`,
            color: "rgba(255,255,255,0.9)", fontSize: 13, outline: "none",
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = `${accentColor}60`; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = `${accentColor}25`; }}
        />
        <button
          type="submit"
          style={{
            padding: "8px 14px", borderRadius: 12, border: "none",
            background: accentColor, color: "#fff", fontSize: 13,
            fontWeight: 600, cursor: "pointer", flexShrink: 0,
          }}
        >
          Add
        </button>
      </form>

      {/* Task list */}
      <div style={{ overflowY: "auto", flex: 1 }}>
        {todos.length === 0 && (
          <p style={{ textAlign: "center", color: "rgba(255,255,255,0.25)", fontSize: 13, padding: "20px 0" }}>
            No tasks yet
          </p>
        )}

        {/* Active tasks first */}
        {activeTodos.map((todo) => (
          <TodoItem
            key={todo.id}
            todo={todo}
            accentColor={accentColor}
            onToggle={handleToggle}
            onDelete={handleDelete}
          />
        ))}

        {/* Completed tasks */}
        {completedTodos.length > 0 && activeTodos.length > 0 && (
          <div style={{
            height: 1, background: "rgba(255,255,255,0.06)",
            margin: "8px 0",
          }} />
        )}
        {completedTodos.map((todo) => (
          <TodoItem
            key={todo.id}
            todo={todo}
            accentColor={accentColor}
            onToggle={handleToggle}
            onDelete={handleDelete}
          />
        ))}
      </div>
    </div>
  );
}

function TodoItem({
  todo,
  accentColor,
  onToggle,
  onDelete,
}: {
  todo: Todo;
  accentColor: string;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "8px 4px", borderRadius: 8,
        background: hovered ? "rgba(255,255,255,0.04)" : "transparent",
        transition: "background 0.15s",
      }}
    >
      {/* Checkbox */}
      <button
        onClick={() => onToggle(todo.id)}
        style={{
          width: 20, height: 20, borderRadius: 6, flexShrink: 0,
          border: `2px solid ${todo.completed ? accentColor : "rgba(255,255,255,0.2)"}`,
          background: todo.completed ? accentColor : "transparent",
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          transition: "all 0.15s",
          padding: 0,
        }}
      >
        {todo.completed && (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2.5 6L5 8.5L9.5 3.5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      {/* Text */}
      <span style={{
        flex: 1, fontSize: 13, lineHeight: 1.4,
        color: todo.completed ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.85)",
        textDecoration: todo.completed ? "line-through" : "none",
        transition: "color 0.15s, text-decoration 0.15s",
      }}>
        {todo.text}
      </span>

      {/* Delete */}
      <button
        onClick={() => onDelete(todo.id)}
        style={{
          opacity: hovered ? 0.6 : 0, transition: "opacity 0.15s",
          background: "none", border: "none", cursor: "pointer",
          color: "rgba(255,255,255,0.5)", fontSize: 14, padding: "2px 4px",
          flexShrink: 0,
        }}
      >
        ✕
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Run all tests**

Run: `cd "C:/Users/G$/anime-chatbot" && npx vitest run`
Expected: All tests pass

- [ ] **Step 3: Commit**

```bash
git add src/components/TodoPanel.tsx
git commit -m "feat: add TodoPanel slide-up task board UI"
```

---

## Task 3: Replace scene objects with invisible hotspots

**Files:**
- Modify: `src/lib/sceneObjects.ts`
- Modify: `src/components/SceneObjects.tsx`

- [ ] **Step 1: Rewrite sceneObjects.ts**

Replace the entire file:

```typescript
// src/lib/sceneObjects.ts

export interface SceneHotspot {
  id: string;
  /** Which scenes this hotspot appears in */
  scenes: string[];
  /** What action it triggers */
  action: string;
  /** Position and size as percentage of viewport */
  x: number;      // left edge %
  y: number;      // top edge %
  width: number;  // % of viewport width
  height: number; // % of viewport height
}

export const SCENE_HOTSPOTS: SceneHotspot[] = [
  // Lab: desk/papers area (bottom-left)
  { id: "todos-lab", scenes: ["lab"], action: "todos", x: 15, y: 55, width: 15, height: 20 },
  // Cafe: foreground table (bottom-center)
  { id: "todos-cafe", scenes: ["cafe"], action: "todos", x: 35, y: 65, width: 20, height: 15 },
  // Cyberpunk: neon screen (right side)
  { id: "todos-cyberpunk", scenes: ["cyberpunk"], action: "todos", x: 70, y: 25, width: 18, height: 25 },
];

export function getHotspotsForScene(sceneId: string): SceneHotspot[] {
  return SCENE_HOTSPOTS.filter(h => h.scenes.includes(sceneId));
}
```

- [ ] **Step 2: Rewrite SceneObjects.tsx**

Replace the entire file:

```tsx
// src/components/SceneObjects.tsx
"use client";

import { useState, useEffect } from "react";
import { getHotspotsForScene } from "@/lib/sceneObjects";
import { haptic } from "@/lib/haptics";

const DISCOVERED_KEY = "anime-chatbot-todo-discovered";

interface SceneObjectsProps {
  sceneId: string;
  accentColor: string;
  onObjectTap: (action: string) => void;
}

export function SceneObjects({ sceneId, accentColor, onObjectTap }: SceneObjectsProps) {
  const hotspots = getHotspotsForScene(sceneId);
  const [discovered, setDiscovered] = useState(true);

  useEffect(() => {
    const d = localStorage.getItem(DISCOVERED_KEY);
    setDiscovered(d === "true");
  }, []);

  const handleTap = (action: string) => {
    haptic.tick();
    if (!discovered) {
      localStorage.setItem(DISCOVERED_KEY, "true");
      setDiscovered(true);
    }
    onObjectTap(action);
  };

  if (hotspots.length === 0) return null;

  return (
    <>
      {hotspots.map((hotspot) => (
        <button
          key={hotspot.id}
          onClick={() => handleTap(hotspot.action)}
          style={{
            position: "absolute",
            left: `${hotspot.x}%`,
            top: `${hotspot.y}%`,
            width: `${hotspot.width}%`,
            height: `${hotspot.height}%`,
            zIndex: 8,
            background: "transparent",
            border: "none",
            cursor: "pointer",
            padding: 0,
            outline: "none",
            // Subtle glow pulse on undiscovered hotspots
            ...(!discovered ? {
              boxShadow: `inset 0 0 20px ${accentColor}15, 0 0 30px ${accentColor}10`,
              animation: "hotspot-pulse 3s ease-in-out infinite",
              borderRadius: 12,
            } : {}),
          }}
          aria-label="Open task board"
        />
      ))}
      {!discovered && (
        <style>{`
          @keyframes hotspot-pulse {
            0%, 100% { opacity: 0.3; }
            50% { opacity: 0.7; }
          }
        `}</style>
      )}
    </>
  );
}
```

- [ ] **Step 3: Update test**

```typescript
// __tests__/lib/sceneObjects.test.ts — update to match new API
import { describe, it, expect } from "vitest";
import { getHotspotsForScene, SCENE_HOTSPOTS } from "@/lib/sceneObjects";

describe("getHotspotsForScene", () => {
  it("returns hotspots for lab", () => {
    const hotspots = getHotspotsForScene("lab");
    expect(hotspots.length).toBeGreaterThan(0);
    expect(hotspots.every(h => h.scenes.includes("lab"))).toBe(true);
  });

  it("returns hotspots for cafe", () => {
    const hotspots = getHotspotsForScene("cafe");
    expect(hotspots.length).toBeGreaterThan(0);
  });

  it("returns hotspots for cyberpunk", () => {
    const hotspots = getHotspotsForScene("cyberpunk");
    expect(hotspots.length).toBeGreaterThan(0);
  });

  it("returns empty for outdoor scenes", () => {
    expect(getHotspotsForScene("sakura")).toHaveLength(0);
    expect(getHotspotsForScene("beach")).toHaveLength(0);
    expect(getHotspotsForScene("rain")).toHaveLength(0);
  });

  it("all hotspots have valid positions", () => {
    for (const h of SCENE_HOTSPOTS) {
      expect(h.x).toBeGreaterThanOrEqual(0);
      expect(h.x + h.width).toBeLessThanOrEqual(100);
      expect(h.y).toBeGreaterThanOrEqual(0);
      expect(h.y + h.height).toBeLessThanOrEqual(100);
    }
  });
});
```

- [ ] **Step 4: Run tests**

Run: `cd "C:/Users/G$/anime-chatbot" && npx vitest run`
Expected: All tests pass

- [ ] **Step 5: Commit**

```bash
git add src/lib/sceneObjects.ts src/components/SceneObjects.tsx __tests__/lib/sceneObjects.test.ts
git commit -m "refactor: replace emoji scene objects with invisible hotspots"
```

---

## Task 4: Wire todo panel + character reactions into chat page

**Files:**
- Modify: `src/app/chat/[characterId]/page.tsx`

- [ ] **Step 1: Add character reaction data and wire everything**

At the top of the file (after existing imports), add:

```typescript
import { TodoPanel } from "@/components/TodoPanel";
```

Add reaction data inside `ChatContent` (before the return):

```typescript
// Character todo reactions
const TODO_ADD_REACTIONS: Record<string, string[]> = {
  arisu: ["I'll remember that for you.", "Adding it to the list~ Let's get it done together.", "That's important to you, isn't it? I'll keep track."],
  marin: ["Ooh writing stuff down, look at you being productive!", "Got it got it!! We're SO on top of this.", "Added! Now don't forget ok??"],
  nao: ["Noted. I'll hold you accountable.", "...fine, I'll help you stay organized.", "Task logged. Don't slack off."],
  kurisu: ["Documented. I expect you to follow through.", "Adding it to the queue. Efficiency matters.", "Hmph. At least you're being systematic about it."],
  merrick: ["I shall remember this... across the ages if necessary.", "Written in ink that does not fade.", "Consider it etched into the record."],
  ticia: ["Mm, I'll keep that safe for you~", "Another thing to do... how deliciously mortal.", "Noted, darling."],
};

const TODO_COMPLETE_REACTIONS: Record<string, string[]> = {
  arisu: ["You did it! I'm proud of you.", "One less thing to worry about~", "See? You're more capable than you think."],
  marin: ["YESSS checked off!! Let's GOOO!", "Productivity queen!! Slay!!", "Another one DONE! You're unstoppable!"],
  nao: ["...impressive. Don't let it go to your head.", "Task eliminated. Acceptable performance.", "Hm. Maybe you're not hopeless after all."],
  kurisu: ["Completed. Your efficiency is... noted.", "Good. One variable resolved.", "Don't expect praise for doing what you should. ...Well done though."],
  merrick: ["Another burden lifted from your mortal shoulders.", "It is done. Time moves ever forward.", "Satisfying, isn't it? The completion of a task."],
  ticia: ["Mmm, well done~", "How productive of you... I approve.", "Crossed off. You're full of surprises."],
};

function pickReaction(pool: string[]): string | null {
  if (Math.random() > 0.6) return null; // 60% chance to react
  return pool[Math.floor(Math.random() * pool.length)];
}
```

Replace the `onObjectTap` handler:

```typescript
// In the overlays section, find the SceneObjects component and update onObjectTap:
onObjectTap={(action) => {
  if (action === "todos") {
    panels.openPanel("outfits"); // temporary — we need "todos" as a panel ID
  }
}}
```

Wait — `PanelId` doesn't include "todos". We need to add it.

- [ ] **Step 2: Add "todos" to PanelId type**

In `src/hooks/usePanels.ts`, add `"todos"` to the PanelId union:

Current:
```typescript
export type PanelId = "history" | "charInfo" | "diary" | "gifts" | "outfits" | "quests" | "scenes" | "screenshot" | "more" | null;
```

Change to:
```typescript
export type PanelId = "history" | "charInfo" | "diary" | "gifts" | "outfits" | "quests" | "scenes" | "screenshot" | "todos" | "more" | null;
```

- [ ] **Step 3: Wire todo panel in chat page**

In `src/app/chat/[characterId]/page.tsx`:

Update the `onObjectTap` in the SceneObjects component:
```typescript
onObjectTap={(action) => {
  if (action === "todos") panels.openPanel("todos");
}}
```

Add the TodoPanel in the overlays section (near the other panels):
```tsx
<TodoPanel
  accentColor={accent}
  isOpen={panels.isOpen("todos")}
  onClose={panels.closePanel}
  onAdd={() => {
    const reactions = TODO_ADD_REACTIONS[characterId] || TODO_ADD_REACTIONS.arisu;
    const line = pickReaction(reactions);
    if (line) {
      dispatch(setExpression("thinking"));
      setDiscoveryToast({ line, expression: "thinking" });
      setTimeout(() => setDiscoveryToast(null), 3500);
    }
  }}
  onComplete={() => {
    const reactions = TODO_COMPLETE_REACTIONS[characterId] || TODO_COMPLETE_REACTIONS.arisu;
    const line = pickReaction(reactions);
    if (line) {
      dispatch(setExpression("happy"));
      setDiscoveryToast({ line, expression: "happy" });
      setTimeout(() => setDiscoveryToast(null), 3500);
    }
  }}
/>
```

- [ ] **Step 4: Run tests**

Run: `cd "C:/Users/G$/anime-chatbot" && npx vitest run`
Expected: All tests pass

- [ ] **Step 5: Commit**

```bash
git add src/hooks/usePanels.ts src/app/chat/\\[characterId\\]/page.tsx
git commit -m "feat: wire todo panel with character reactions to scene hotspots"
```

---

## Task 5: Visual QA

- [ ] **Step 1: Test in browser**

Run: `cd "C:/Users/G$/anime-chatbot" && rm -rf .next && npx next dev --webpack -p 3000`

Test:
1. Go to a character chat, switch to lab/cafe/cyberpunk scene
2. Tap the hotspot area — todo panel should slide up
3. First time: faint glow pulse should be visible before tapping
4. Add a task — character may react with a toast
5. Complete a task — character may react with happiness
6. Delete a task
7. Close panel, reopen — tasks persist
8. Switch characters — same tasks (global list)
9. Switch to outdoor scene (sakura, beach) — no hotspots, no tap zones
10. Verify max 20 limit works

- [ ] **Step 2: Fix any issues found**

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "fix: visual polish for todo assistant layer"
```

---

## Summary

| Task | What | Files |
|------|------|-------|
| 1 | Todo CRUD + tests | `todos.ts`, test |
| 2 | TodoPanel UI | `TodoPanel.tsx` |
| 3 | Invisible hotspots | `sceneObjects.ts`, `SceneObjects.tsx`, test |
| 4 | Wire into chat page | `page.tsx`, `usePanels.ts` |
| 5 | Visual QA | Various |
