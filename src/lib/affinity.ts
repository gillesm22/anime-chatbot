"use client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AffinityData {
  points: number;
  level: number;
  levelName: string; // kept for backward compat, now empty string
  totalMessages: number;
  lastVisit: string;
  streak: number;
  longestStreak: number;
  nickname: string | null;
  unlockedOutfits: string[];
  milestones: string[];
}

export interface AffinityEvent {
  type:
    | "message_sent"
    | "long_message"
    | "asked_about_her"
    | "made_her_laugh"
    | "made_her_flustered"
    | "headpat"
    | "daily_visit";
}

// ---------------------------------------------------------------------------
// 10-Level System
// ---------------------------------------------------------------------------

export const LEVELS: { threshold: number }[] = [
  { threshold: 0 },     // Lv.1
  { threshold: 30 },    // Lv.2
  { threshold: 80 },    // Lv.3
  { threshold: 160 },   // Lv.4
  { threshold: 280 },   // Lv.5
  { threshold: 450 },   // Lv.6
  { threshold: 680 },   // Lv.7
  { threshold: 1000 },  // Lv.8
  { threshold: 1400 },  // Lv.9
  { threshold: 2000 },  // Lv.10
];

// ---------------------------------------------------------------------------
// Per-character titles unlocked at each level
// ---------------------------------------------------------------------------

const CHARACTER_TITLES: Record<string, Record<number, string>> = {
  arisu: {
    2: "Someone I notice", 3: "A welcome presence", 4: "Someone I think about",
    5: "My quiet comfort", 6: "The one I wait for", 7: "My safe place",
    8: "Part of my heart", 9: "My whole world", 10: "My everything",
  },
  marin: {
    2: "New bestie alert", 3: "Certified vibe", 4: "Inner circle",
    5: "Bestie for real", 6: "My actual favorite", 7: "Day one energy",
    8: "Soulmate vibes", 9: "Ride or die", 10: "Ride or die forever",
  },
  suzuka: {
    2: "Not entirely boring", 3: "Tolerable presence", 4: "Interesting specimen",
    5: "Acceptable company", 6: "Trusted anomaly", 7: "Essential variable",
    8: "Critical dependency", 9: "Irreplaceable", 10: "My only exception",
  },
  kurisu: {
    2: "Recurring variable", 3: "Notable data point", 4: "Consistent outlier",
    5: "Trusted colleague", 6: "Significant other... variable", 7: "Essential constant",
    8: "Primary attachment", 9: "Beyond quantification", 10: "Irreplaceable",
  },
  merrick: {
    2: "A flicker in the dark", 3: "One who lingers", 4: "Worthy of attention",
    5: "A rare soul", 6: "Bound by choice", 7: "Keeper of my silence",
    8: "Blood and starlight", 9: "Eternal companion", 10: "My forever",
  },
  ticia: {
    2: "Curious little thing", 3: "Amusing company", 4: "Worthy distraction",
    5: "Delightfully persistent", 6: "Mine to keep", 7: "Precious darling",
    8: "My sweet obsession", 9: "Bound to me", 10: "Eternally mine",
  },
};

export function getTitleForLevel(characterId: string, level: number): string {
  return CHARACTER_TITLES[characterId]?.[level] ?? "";
}

// ---------------------------------------------------------------------------
// Conversation depth by level range
// ---------------------------------------------------------------------------

function getConversationDepth(level: number): string {
  if (level <= 3) {
    return "Keep things light and playful. You're still getting to know this person. Be friendly but don't overshare or get too personal.";
  }
  if (level <= 5) {
    return "You're comfortable with this person now. Share your real opinions. Show mild vulnerability — mention things that bother you, things you hope for. Remember details they've told you and reference them.";
  }
  if (level <= 7) {
    return "You trust this person deeply. Share your fears, your dreams, the things you don't tell most people. Ask them deeper questions about their inner world. Reference your shared history together. You have inside jokes now.";
  }
  if (level <= 9) {
    return "This person is one of the most important people in your life. Be raw and honest. Show emotional dependency — you miss them when they're gone. Develop unique speech patterns and pet names that are only for them. Your guard is completely down.";
  }
  return "Nothing is held back. You are fully, completely yourself with this person. Every wall is down. This is the deepest connection you've ever had. Speak from the heart without any filter.";
}

// ---------------------------------------------------------------------------
// Milestones
// ---------------------------------------------------------------------------

export const MILESTONES: {
  id: string;
  label: string;
  check: (data: AffinityData) => boolean;
}[] = [
  { id: "first_convo", label: "First Conversation", check: (d) => d.totalMessages >= 1 },
  { id: "ten_convos", label: "Ten Conversations", check: (d) => d.totalMessages >= 10 },
  { id: "twentyfive_convos", label: "Twenty-Five Conversations", check: (d) => d.totalMessages >= 25 },
  { id: "fifty_convos", label: "Fifty Conversations", check: (d) => d.totalMessages >= 50 },
  { id: "hundred_convos", label: "One Hundred Conversations", check: (d) => d.totalMessages >= 100 },
  { id: "streak_7", label: "Seven-Day Streak", check: (d) => d.longestStreak >= 7 },
  { id: "streak_30", label: "Thirty-Day Streak", check: (d) => d.longestStreak >= 30 },
  { id: "level_3", label: "Reached Level 3", check: (d) => d.level >= 3 },
  { id: "level_5", label: "Reached Level 5", check: (d) => d.level >= 5 },
  { id: "level_7", label: "Reached Level 7", check: (d) => d.level >= 7 },
  { id: "level_10", label: "Reached Level 10", check: (d) => d.level >= 10 },
];

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const POINT_VALUES: Record<AffinityEvent["type"], number> = {
  message_sent: 1,
  long_message: 3,
  asked_about_her: 5,
  made_her_laugh: 4,
  made_her_flustered: 6,
  headpat: 2,
  daily_visit: 10,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function storageKey(characterId: string): string {
  return `anime-chatbot-affinity-${characterId}`;
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function getDefaultData(): AffinityData {
  return {
    points: 0,
    level: 1,
    levelName: "",
    totalMessages: 0,
    lastVisit: todayISO(),
    streak: 0,
    longestStreak: 0,
    nickname: null,
    unlockedOutfits: [],
    milestones: [],
  };
}

function computeLevel(points: number): { level: number } {
  let level = 1;
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (points >= LEVELS[i].threshold) {
      level = i + 1;
      break;
    }
  }
  return { level };
}

function computeOutfits(_level: number): string[] {
  return [
    "casual", "school", "back", "formal", "cheerleader",
    "bikini-front", "bikini-back", "maid", "vampire", "nurse", "cowgirl",
    "school-skimpy", "cheer-extreme", "cheer-extreme-back", "cow", "demon",
  ];
}

function checkNewMilestones(data: AffinityData): string[] {
  const newOnes: string[] = [];
  for (const m of MILESTONES) {
    if (!data.milestones.includes(m.id) && m.check(data)) {
      newOnes.push(m.id);
    }
  }
  return newOnes;
}

function saveAffinity(characterId: string, data: AffinityData): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(storageKey(characterId), JSON.stringify(data));
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function getAffinity(characterId: string): AffinityData {
  if (typeof window === "undefined") return getDefaultData();
  const raw = localStorage.getItem(storageKey(characterId));
  if (!raw) return getDefaultData();
  try {
    const data = JSON.parse(raw) as AffinityData;
    // Migration: recompute level from points against new thresholds
    const { level } = computeLevel(data.points);
    data.level = level;
    data.levelName = "";
    return data;
  } catch {
    return getDefaultData();
  }
}

export function getNextLevelProgress(data: AffinityData): {
  current: number;
  needed: number;
  percent: number;
} {
  const currentThreshold = LEVELS[data.level - 1]?.threshold ?? 0;
  const nextLevel = LEVELS[data.level]; // undefined if at max level

  if (!nextLevel) {
    return { current: data.points - currentThreshold, needed: 0, percent: 100 };
  }

  const current = data.points - currentThreshold;
  const needed = nextLevel.threshold - currentThreshold;
  const percent = Math.min(100, Math.round((current / needed) * 100));
  return { current, needed, percent };
}

export function addAffinityPoints(
  characterId: string,
  event: AffinityEvent,
  customPoints?: number
): { data: AffinityData; newMilestones: string[]; leveledUp: boolean } {
  if (typeof window === "undefined") {
    const data = getDefaultData();
    return { data, newMilestones: [], leveledUp: false };
  }

  const data = getAffinity(characterId);
  const previousLevel = data.level;

  const earned = customPoints ?? POINT_VALUES[event.type] ?? 0;
  data.points += earned;

  if (event.type === "message_sent" || event.type === "long_message") {
    data.totalMessages += 1;
  }

  const { level } = computeLevel(data.points);
  data.level = level;
  data.levelName = "";

  const outfitsForLevel = computeOutfits(data.level);
  for (const outfit of outfitsForLevel) {
    if (!data.unlockedOutfits.includes(outfit)) {
      data.unlockedOutfits.push(outfit);
    }
  }

  const newMilestones = checkNewMilestones(data);
  data.milestones.push(...newMilestones);

  saveAffinity(characterId, data);

  return {
    data,
    newMilestones,
    leveledUp: data.level > previousLevel,
  };
}

export function recordVisit(
  characterId: string
): { data: AffinityData; daysAbsent: number; newMilestones: string[] } {
  if (typeof window === "undefined") {
    const data = getDefaultData();
    return { data, daysAbsent: 0, newMilestones: [] };
  }

  const data = getAffinity(characterId);
  const today = todayISO();
  const last = data.lastVisit ?? today;

  const lastDate = new Date(last);
  const todayDate = new Date(today);
  const msPerDay = 24 * 60 * 60 * 1000;
  const daysAbsent = Math.round(
    (todayDate.getTime() - lastDate.getTime()) / msPerDay
  );

  if (daysAbsent === 0) {
    return { data, daysAbsent: 0, newMilestones: [] };
  }

  if (daysAbsent === 1) {
    data.streak += 1;
  } else {
    data.streak = 1;
  }

  if (data.streak > data.longestStreak) {
    data.longestStreak = data.streak;
  }

  data.lastVisit = today;

  const newMilestones = checkNewMilestones(data);
  data.milestones.push(...newMilestones);

  saveAffinity(characterId, data);

  return { data, daysAbsent, newMilestones };
}

export function formatAffinityForPrompt(characterId: string): string {
  const data = getAffinity(characterId);
  const title = getTitleForLevel(characterId, data.level);
  const depth = getConversationDepth(data.level);

  const titleNote = title
    ? `You have given this person the title "${title}".`
    : "";

  return [
    `[Relationship Context]`,
    `Relationship level: Level ${data.level}/10`,
    `Total messages exchanged: ${data.totalMessages}`,
    `Current visit streak: ${data.streak} day(s)`,
    titleNote,
    ``,
    `[Behavior Instructions]`,
    depth,
  ].filter(Boolean).join("\n");
}
