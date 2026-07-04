export interface SceneObject {
  id: string;
  label: string;
  x: number;     // percentage 0-100
  y: number;     // percentage 0-100
  size: number;  // px
  icon: string;  // emoji
  scenes: string[];
  action: string;
}

export const SCENE_OBJECTS: SceneObject[] = [
  { id: "notebook", label: "Notebook", x: 12, y: 65, size: 36, icon: "📓", scenes: ["cozy_room", "cafe", "lab"], action: "notebook" },
  { id: "clock",    label: "Clock",    x: 88, y: 15, size: 32, icon: "🕐", scenes: ["cozy_room", "lab", "cyberpunk"], action: "timer" },
  { id: "phone",    label: "Phone",    x: 85, y: 70, size: 30, icon: "📱", scenes: ["cozy_room", "cafe", "morning"], action: "reminders" },
  { id: "pinboard", label: "Board",    x: 15, y: 25, size: 34, icon: "📌", scenes: ["cozy_room", "lab", "cyberpunk"], action: "todos" },
  { id: "bookshelf",label: "Books",    x: 10, y: 40, size: 34, icon: "📚", scenes: ["cozy_room", "lab"], action: "notes" },
];

export function getObjectsForScene(sceneId: string): SceneObject[] {
  return SCENE_OBJECTS.filter(obj => obj.scenes.includes(sceneId));
}
