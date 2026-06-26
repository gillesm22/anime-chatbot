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

const SESSION_MOOD_PREFIX = "anime-chatbot-session-mood-";

export function saveSessionEndMood(characterId: string, mood: Mood): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(`${SESSION_MOOD_PREFIX}${characterId}`, mood);
}

export function getSessionStartMood(
  characterId: string,
  daysAbsent: number,
  streak: number
): { mood: Mood; prompt: string } {
  if (typeof window === "undefined") {
    return { mood: "neutral", prompt: "" };
  }

  // Long absence: emotional distance
  if (daysAbsent >= 5) {
    return {
      mood: "neutral",
      prompt:
        "It has been a while since you last spoke. Acknowledge the gap warmly but with a hint of emotional distance — you missed them but aren't sure how to pick back up.",
    };
  }

  const stored = localStorage.getItem(`${SESSION_MOOD_PREFIX}${characterId}`);

  // No prior session recorded
  if (!stored) {
    return {
      mood: "neutral",
      prompt:
        "This is a fresh start. Greet the user openly and with curiosity, as if meeting for the first time.",
    };
  }

  const lastMood = stored as Mood;

  // Last session ended sad or thoughtful — check in gently
  if (lastMood === "thoughtful") {
    return {
      mood: "thoughtful",
      prompt:
        "Last time things felt a little heavy. Gently check in on how they are doing before diving into anything new.",
    };
  }

  // Consecutive days with positive mood — warm familiar tone
  if (streak >= 2 && (lastMood === "cheerful" || lastMood === "excited")) {
    return {
      mood: lastMood,
      prompt:
        "You two have been connecting well lately. Pick up with a warm, familiar energy — no need for formalities.",
    };
  }

  // Short absence (2-4 days)
  if (daysAbsent >= 2) {
    return {
      mood: "neutral",
      prompt:
        "A few days have passed. Acknowledge the brief gap casually and ease back into conversation.",
    };
  }

  // Default: returning same day or next day with a neutral/non-positive last mood
  return {
    mood: lastMood,
    prompt: "Continue naturally from where you left off.",
  };
}
