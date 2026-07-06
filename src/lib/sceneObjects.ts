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
