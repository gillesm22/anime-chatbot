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
