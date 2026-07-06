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
