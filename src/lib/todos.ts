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
