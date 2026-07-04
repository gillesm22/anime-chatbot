"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getCharacter } from "@/lib/characters";
import type { Expression } from "@/lib/characters/types";
import type { SceneId } from "@/lib/backgrounds";
import { getCharacterDefaultScene } from "@/lib/backgrounds";
import {
  getAffinity,
  addAffinityPoints,
  recordVisit,
  formatAffinityForPrompt,
  getNextLevelProgress,
} from "@/lib/affinity";
import type { AffinityEvent } from "@/lib/affinity";
import { getMood, updateMood, moodToExpression, saveSessionEndMood, getSessionStartMood } from "@/lib/mood";
import { startAmbientMusic, stopAmbientMusic } from "@/lib/ambient";
import { startSceneAudio, stopSceneAudio } from "@/lib/sceneSounds";
import { startIdleTimer, resetIdleTimer, stopHumming } from "@/lib/humming";
import { initSaveSystem, saveSnapshot, exportFullBackup } from "@/lib/saveSystem";
import { haptic } from "@/lib/haptics";

export type Outfit = string;

export interface CharacterSession {
  character: ReturnType<typeof getCharacter>;
  outfit: Outfit;
  setOutfit: (o: Outfit) => void;
  currentScene: SceneId;
  setCurrentScene: (s: SceneId) => void;
  currentMood: string;
  updateMoodFromExpressions: (expressions: string[]) => string;
  milestoneQueue: string[];
  setMilestoneQueue: React.Dispatch<React.SetStateAction<string[]>>;
  levelUpMilestone: { level: number; levelName: string } | null;
  setLevelUpMilestone: React.Dispatch<React.SetStateAction<{ level: number; levelName: string } | null>>;
  addAffinity: (event: AffinityEvent, bonus?: number) => {
    newMilestones: string[];
    leveledUp: boolean;
    data: ReturnType<typeof getAffinity>;
  };
  handleSave: () => Promise<void>;
  saveToast: { message: string; type: "save" | "restore" } | null;
  setSaveToast: React.Dispatch<React.SetStateAction<{ message: string; type: "save" | "restore" } | null>>;
  resetIdle: () => void;
  userName: string | null;
  setUserName: (name: string) => void;
  textSpeed: number;
  responseLength: "short" | "medium" | "long";
  aiProvider: string;
}

export function useCharacterSession(characterId: string): CharacterSession {
  const character = getCharacter(characterId);
  const router = useRouter();
  const currentMoodRef = useRef<string>("neutral");
  const saveInitialized = useRef(false);

  // Outfit persistence
  const [outfit, setOutfitState] = useState<Outfit>(() => {
    if (typeof window === "undefined") return "default";
    return localStorage.getItem(`anime-chatbot-outfit-${characterId}`) || "default";
  });

  const setOutfit = useCallback((o: Outfit) => {
    setOutfitState(o);
    if (o !== "default") {
      try { localStorage.setItem(`anime-chatbot-outfit-${characterId}`, o); } catch {}
    } else {
      localStorage.removeItem(`anime-chatbot-outfit-${characterId}`);
    }
  }, [characterId]);

  // Scene
  const [currentScene, setCurrentScene] = useState<SceneId>(() => getCharacterDefaultScene(characterId));

  // Milestones
  const [milestoneQueue, setMilestoneQueue] = useState<string[]>([]);
  const [levelUpMilestone, setLevelUpMilestone] = useState<{ level: number; levelName: string } | null>(null);

  // Save toast
  const [saveToast, setSaveToast] = useState<{ message: string; type: "save" | "restore" } | null>(null);

  // User settings
  const [userName, setUserNameState] = useState<string | null>(null);
  const [textSpeed, setTextSpeed] = useState(12);
  const [responseLength, setResponseLength] = useState<"short" | "medium" | "long">("medium");
  const [aiProvider, setAiProvider] = useState("gpt-4o");

  const setUserName = useCallback((name: string) => {
    setUserNameState(name);
    // Also persist via the chat context's saveUserName (called by useMessageHandler)
  }, []);

  // --- Lifecycle effects ---

  // Session mood persistence
  useEffect(() => {
    const saveState = () => saveSessionEndMood(characterId, currentMoodRef.current);
    const handleVisibility = () => { if (document.visibilityState === "hidden") saveState(); };
    window.addEventListener("beforeunload", saveState);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      saveState();
      window.removeEventListener("beforeunload", saveState);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [characterId]);

  // Load settings + start ambient music
  useEffect(() => {
    currentMoodRef.current = getMood(characterId);
    if (typeof window !== "undefined") {
      const savedName = localStorage.getItem(`anime-chatbot-username-${characterId}`);
      if (savedName) setUserNameState(savedName);
      const savedSpeed = localStorage.getItem("anime-chatbot-text-speed");
      if (savedSpeed) setTextSpeed(Number(savedSpeed));
      const savedLength = localStorage.getItem("anime-chatbot-response-length");
      if (savedLength) setResponseLength(savedLength as "short" | "medium" | "long");
      const savedProvider = localStorage.getItem("anime-chatbot-ai-provider");
      if (savedProvider) setAiProvider(savedProvider);
    }

    const startMusic = () => {
      startAmbientMusic();
      document.removeEventListener("click", startMusic);
      document.removeEventListener("keydown", startMusic);
    };
    document.addEventListener("click", startMusic);
    document.addEventListener("keydown", startMusic);
    return () => {
      stopAmbientMusic();
      document.removeEventListener("click", startMusic);
      document.removeEventListener("keydown", startMusic);
    };
  }, [characterId]);

  // Scene audio
  useEffect(() => {
    startSceneAudio(currentScene, characterId);
    return () => { stopSceneAudio(); };
  }, [characterId, currentScene]);

  // Humming
  useEffect(() => {
    const timer = setTimeout(() => startIdleTimer(characterId), 2000);
    return () => { clearTimeout(timer); stopHumming(); };
  }, [characterId]);

  // Save system
  useEffect(() => {
    if (saveInitialized.current) return;
    saveInitialized.current = true;
    initSaveSystem().then(({ restored }) => {
      if (restored) setSaveToast({ message: "Progress restored from backup", type: "restore" });
    }).catch(() => {});
  }, []);

  // Theme-color meta
  useEffect(() => {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", character?.theme.tint || "#0d0d12");
    return () => {
      const m = document.querySelector('meta[name="theme-color"]');
      if (m) m.setAttribute("content", "#0d0d12");
    };
  }, [character]);

  // Redirect if character not found
  useEffect(() => {
    if (!character) router.replace("/");
  }, [character, router]);

  // --- Actions ---

  const addAffinity = useCallback((event: AffinityEvent, bonus?: number) => {
    const result = addAffinityPoints(characterId, { type: event }, bonus);
    if (result.newMilestones.length > 0) {
      setMilestoneQueue(prev => [...prev, ...result.newMilestones]);
    }
    if (result.leveledUp && result.data.level >= 2 && result.data.level <= 4) {
      setLevelUpMilestone({ level: result.data.level, levelName: result.data.levelName });
      haptic.success();
    }
    return result;
  }, [characterId]);

  const updateMoodFromExpressions = useCallback((expressions: string[]) => {
    const newMood = updateMood(characterId, expressions);
    currentMoodRef.current = newMood;
    return newMood;
  }, [characterId]);

  const handleSave = useCallback(async () => {
    haptic.tick();
    await saveSnapshot();
    exportFullBackup();
    setSaveToast({ message: "Progress saved!", type: "save" });
  }, []);

  return {
    character,
    outfit,
    setOutfit,
    currentScene,
    setCurrentScene,
    currentMood: currentMoodRef.current,
    updateMoodFromExpressions,
    milestoneQueue,
    setMilestoneQueue,
    levelUpMilestone,
    setLevelUpMilestone,
    addAffinity,
    handleSave,
    saveToast,
    setSaveToast,
    resetIdle: resetIdleTimer,
    userName,
    setUserName,
    textSpeed,
    responseLength,
    aiProvider,
  };
}
