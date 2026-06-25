"use client";

import { characters } from "@/lib/characters";
import { getAffinity, LEVELS, type AffinityData } from "@/lib/affinity";
import { getHeroConfig, HERO_CLASS_MAP } from "@/lib/heroAvatar";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PlayerStats {
  totalMessages: number;
  totalAffinityPoints: number;
  averageLevel: number;
  highestLevel: { characterId: string; characterName: string; level: number; levelName: string };
  longestStreak: number;
  currentStreak: number;
  charactersUnlocked: number;
  totalCharacters: number;
  totalMilestones: number;
  totalOutfits: number;
  favoriteCharacter: { id: string; name: string; messages: number } | null;
  /** Per-character affinity snapshot */
  characterBreakdown: {
    id: string;
    name: string;
    color: string;
    level: number;
    levelName: string;
    points: number;
    nextThreshold: number;
    messages: number;
    milestones: number;
    outfits: number;
  }[];
}

// ---------------------------------------------------------------------------
// Character metadata
// ---------------------------------------------------------------------------

const CHARACTER_COLORS: Record<string, string> = {
  arisu: "#f472b6",
  marin: "#fb923c",
  nao: "#a78bfa",
  kurisu: "#e53935",
  merrick: "#7b1fa2",
};

// ---------------------------------------------------------------------------
// Compute
// ---------------------------------------------------------------------------

export function computePlayerStats(): PlayerStats {
  const charList = Object.values(characters);
  const breakdown: PlayerStats["characterBreakdown"] = [];

  let totalMessages = 0;
  let totalAffinityPoints = 0;
  let totalMilestones = 0;
  let totalOutfits = 0;
  let longestStreak = 0;
  let currentStreak = 0;
  let charactersUnlocked = 0;
  let highestLevel = { characterId: "", characterName: "", level: 0, levelName: "Stranger" };
  let favoriteCharacter: PlayerStats["favoriteCharacter"] = null;

  for (const char of charList) {
    const aff: AffinityData = getAffinity(char.id);
    const nextLevelDef = LEVELS[aff.level]; // undefined at max
    const nextThreshold = nextLevelDef ? nextLevelDef.threshold : aff.points;

    breakdown.push({
      id: char.id,
      name: char.name,
      color: CHARACTER_COLORS[char.id] ?? "#888",
      level: aff.level,
      levelName: aff.levelName,
      points: aff.points,
      nextThreshold,
      messages: aff.totalMessages,
      milestones: aff.milestones.length,
      outfits: aff.unlockedOutfits.length,
    });

    totalMessages += aff.totalMessages;
    totalAffinityPoints += aff.points;
    totalMilestones += aff.milestones.length;
    totalOutfits += aff.unlockedOutfits.length;

    if (aff.longestStreak > longestStreak) longestStreak = aff.longestStreak;
    if (aff.streak > currentStreak) currentStreak = aff.streak;

    if (aff.totalMessages > 0) charactersUnlocked += 1;

    if (aff.level > highestLevel.level) {
      highestLevel = {
        characterId: char.id,
        characterName: char.name,
        level: aff.level,
        levelName: aff.levelName,
      };
    }

    if (!favoriteCharacter || aff.totalMessages > favoriteCharacter.messages) {
      if (aff.totalMessages > 0) {
        favoriteCharacter = { id: char.id, name: char.name, messages: aff.totalMessages };
      }
    }
  }

  const averageLevel =
    breakdown.length > 0
      ? Math.round((breakdown.reduce((sum, b) => sum + b.level, 0) / breakdown.length) * 10) / 10
      : 0;

  return {
    totalMessages,
    totalAffinityPoints,
    averageLevel,
    highestLevel,
    longestStreak,
    currentStreak,
    charactersUnlocked,
    totalCharacters: charList.length,
    totalMilestones,
    totalOutfits,
    favoriteCharacter,
    characterBreakdown: breakdown,
  };
}

/**
 * Compute a single "Player Level" from total affinity points across all characters.
 * Every 200 combined points = 1 player level (uncapped).
 */
export function computePlayerLevel(totalPoints: number): {
  level: number;
  pointsInLevel: number;
  pointsForNext: number;
  percent: number;
} {
  const perLevel = 200;
  const level = Math.floor(totalPoints / perLevel) + 1;
  const pointsInLevel = totalPoints % perLevel;
  const percent = Math.round((pointsInLevel / perLevel) * 100);
  return { level, pointsInLevel, pointsForNext: perLevel, percent };
}
