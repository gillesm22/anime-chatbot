"use client";

import type { Expression } from "@/lib/characters/types";

export type Mood = "cheerful" | "neutral" | "thoughtful" | "excited";

const STORAGE_PREFIX = "anime-chatbot-mood-";

export function getMood(characterId: string): Mood {
  if (typeof window === "undefined") return "neutral";
  const stored = localStorage.getItem(`${STORAGE_PREFIX}${characterId}`);
  if (stored === "cheerful" || stored === "thoughtful" || stored === "excited") {
    return stored;
  }
  return "neutral";
}

export function updateMood(characterId: string, recentExpressions: string[]): Mood {
  // Use the last 5-10 expressions to determine mood drift
  const recent = recentExpressions.slice(-10);
  if (recent.length < 3) {
    // Not enough data to shift mood yet
    return getMood(characterId);
  }

  const counts: Record<string, number> = {};
  for (const expr of recent) {
    counts[expr] = (counts[expr] || 0) + 1;
  }

  const total = recent.length;
  const happy = (counts["happy"] || 0) + (counts["laugh"] || 0) + (counts["smirk"] || 0);
  const somber = (counts["thinking"] || 0) + (counts["sad"] || 0);
  const energetic = (counts["surprised"] || 0) + (counts["laugh"] || 0);

  let mood: Mood = "neutral";

  // "mostly" means more than half
  if (happy > total / 2) {
    mood = "cheerful";
  } else if (somber > total / 2) {
    mood = "thoughtful";
  } else if (energetic > total / 2) {
    mood = "excited";
  }

  localStorage.setItem(`${STORAGE_PREFIX}${characterId}`, mood);

  return mood;
}

export function moodToExpression(mood: Mood): Expression {
  switch (mood) {
    case "cheerful":
      return "happy";
    case "thoughtful":
      return "thinking";
    case "excited":
      return "smirk";
    case "neutral":
    default:
      return "neutral";
  }
}
