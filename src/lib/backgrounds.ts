"use client";

export type SceneId =
  | "night_sky"
  | "sunset"
  | "morning"
  | "cafe"
  | "beach"
  | "rain"
  | "sakura"
  | "cyberpunk"
  | "cozy_room"
  | "moonlight";

export interface SceneConfig {
  id: SceneId;
  name: string;
  gradient: string;
  gradientLight: string;
  bgImage?: string;
  particles?: "stars" | "sakura" | "rain" | "sparkles" | "fireflies";
  particleColor?: string;
  particleColorLight?: string;
  ambientGlow?: string;
}

export const SCENES: Record<SceneId, SceneConfig> = {
  night_sky: {
    id: "night_sky",
    name: "Night Sky",
    gradient: "linear-gradient(to bottom, #0a0a2e 0%, #0d0d3b 40%, #050510 100%)",
    gradientLight: "linear-gradient(to bottom, #c5cae9 0%, #9fa8da 40%, #7986cb 100%)",
    bgImage: "/backgrounds/bg-starfield.png",
    particles: "stars",
    particleColor: "#ffffff",
    particleColorLight: "#5c6bc0",
    ambientGlow: "rgba(100, 120, 255, 0.08)",
  },
  sunset: {
    id: "sunset",
    name: "Sunset",
    gradient: "linear-gradient(to bottom, #1a0533 0%, #6b1a6e 20%, #c2185b 45%, #f4511e 65%, #ff8f00 80%, #ffca28 100%)",
    gradientLight: "linear-gradient(to bottom, #fce4ec 0%, #f8bbd0 20%, #ffab91 45%, #ffcc80 65%, #fff9c4 80%, #fffde7 100%)",
    particles: "sparkles",
    particleColor: "#ffd54f",
    particleColorLight: "#ff8a65",
    ambientGlow: "rgba(255, 100, 50, 0.12)",
  },
  morning: {
    id: "morning",
    name: "Morning",
    gradient: "linear-gradient(to bottom, #b3e5fc 0%, #e1f5fe 30%, #fff9e6 65%, #fffde7 100%)",
    gradientLight: "linear-gradient(to bottom, #e3f2fd 0%, #f1f8fe 30%, #fffef5 65%, #ffffff 100%)",
    particles: "sparkles",
    particleColor: "#fff176",
    particleColorLight: "#ffd54f",
    ambientGlow: "rgba(255, 255, 180, 0.15)",
  },
  cafe: {
    id: "cafe",
    name: "Cafe",
    gradient: "linear-gradient(to bottom, #3e1f0d 0%, #6d3a1e 30%, #a0522d 60%, #c68642 100%)",
    gradientLight: "linear-gradient(to bottom, #efebe9 0%, #d7ccc8 30%, #bcaaa4 60%, #e8d5b7 100%)",
    bgImage: "/backgrounds/bg-cafe.png",
    particles: "fireflies",
    particleColor: "#ffcc80",
    particleColorLight: "#a1887f",
    ambientGlow: "rgba(180, 100, 30, 0.15)",
  },
  beach: {
    id: "beach",
    name: "Beach",
    gradient: "linear-gradient(to bottom, #29b6f6 0%, #81d4fa 35%, #e0f7fa 60%, #f5f0c0 80%, #f0d090 100%)",
    gradientLight: "linear-gradient(to bottom, #81d4fa 0%, #b3e5fc 35%, #e8f5e9 60%, #fff8e1 80%, #ffe0b2 100%)",
    bgImage: "/backgrounds/bg-beach.png",
    particles: "sparkles",
    particleColor: "#e0f7fa",
    particleColorLight: "#4fc3f7",
    ambientGlow: "rgba(0, 200, 220, 0.1)",
  },
  rain: {
    id: "rain",
    name: "Rain",
    gradient: "linear-gradient(to bottom, #1c2a3a 0%, #263646 35%, #2e3f50 70%, #1a2530 100%)",
    gradientLight: "linear-gradient(to bottom, #b0bec5 0%, #cfd8dc 35%, #eceff1 70%, #b0bec5 100%)",
    bgImage: "/backgrounds/bg-rain.png",
    particles: "rain",
    particleColor: "rgba(180, 210, 240, 0.6)",
    particleColorLight: "rgba(100, 140, 180, 0.5)",
    ambientGlow: "rgba(80, 120, 170, 0.1)",
  },
  sakura: {
    id: "sakura",
    name: "Sakura",
    gradient: "linear-gradient(to bottom, #fce4ec 0%, #f8bbd0 25%, #fce4ec 55%, #fff9fb 100%)",
    gradientLight: "linear-gradient(to bottom, #ffeef5 0%, #fce4ec 25%, #fff0f5 55%, #ffffff 100%)",
    bgImage: "/backgrounds/bg-sakura.png",
    particles: "sakura",
    particleColor: "#f48fb1",
    particleColorLight: "#ec407a",
    ambientGlow: "rgba(240, 120, 160, 0.1)",
  },
  cyberpunk: {
    id: "cyberpunk",
    name: "Cyberpunk",
    gradient: "linear-gradient(to bottom, #0d001a 0%, #1a0033 30%, #0a001f 60%, #00101a 100%)",
    gradientLight: "linear-gradient(to bottom, #ede7f6 0%, #d1c4e9 30%, #e8eaf6 60%, #e0f2f1 100%)",
    bgImage: "/backgrounds/bg-cyberpunk.png",
    particles: "stars",
    particleColor: "#00e5ff",
    particleColorLight: "#7c4dff",
    ambientGlow: "rgba(0, 229, 255, 0.08)",
  },
  cozy_room: {
    id: "cozy_room",
    name: "Cozy Room",
    gradient: "linear-gradient(to bottom, #1a0e05 0%, #2e1a0a 30%, #3d2210 60%, #4a2c14 100%)",
    gradientLight: "linear-gradient(to bottom, #fff3e0 0%, #ffe0b2 30%, #ffcc80 60%, #ffe0b2 100%)",
    bgImage: "/backgrounds/bg-bedroom.png",
    particles: "fireflies",
    particleColor: "#ffb74d",
    particleColorLight: "#ff9800",
    ambientGlow: "rgba(200, 120, 40, 0.12)",
  },
  moonlight: {
    id: "moonlight",
    name: "Moonlight",
    gradient: "linear-gradient(to bottom, #05071a 0%, #0c1030 30%, #111840 60%, #0a0f2a 100%)",
    gradientLight: "linear-gradient(to bottom, #e8eaf6 0%, #c5cae9 30%, #b0bec5 60%, #e0e0e0 100%)",
    bgImage: "/backgrounds/bg-rooftop.png",
    particles: "stars",
    particleColor: "#e8eaf6",
    particleColorLight: "#7986cb",
    ambientGlow: "rgba(180, 190, 240, 0.08)",
  },
};

export function getTimeBasedScene(): SceneId {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 11) return "morning";
  if (hour >= 11 && hour < 17) return "cafe";
  if (hour >= 17 && hour < 20) return "sunset";
  if (hour >= 20 || hour < 5) return "night_sky";
  return "moonlight";
}

export function getCharacterDefaultScene(characterId: string): SceneId {
  const map: Record<string, SceneId> = {
    arisu: "sakura",
    marin: "beach",
    nao: "cyberpunk",
    kurisu: "cozy_room",
    merrick: "moonlight",
  };
  return map[characterId.toLowerCase()] ?? "night_sky";
}

export function getAllScenes(): SceneConfig[] {
  return Object.values(SCENES);
}
