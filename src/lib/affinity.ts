"use client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AffinityData {
  points: number;
  level: number;
  levelName: string;
  totalMessages: number;
  lastVisit: string; // ISO date string
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
// Constants
// ---------------------------------------------------------------------------

export const LEVELS: { name: string; threshold: number }[] = [
  { name: "Stranger", threshold: 0 },
  { name: "Acquaintance", threshold: 50 },
  { name: "Friend", threshold: 150 },
  { name: "Close Friend", threshold: 350 },
  { name: "Soulmate", threshold: 600 },
];

export const MILESTONES: {
  id: string;
  label: string;
  check: (data: AffinityData) => boolean;
}[] = [
  {
    id: "first_convo",
    label: "First Conversation",
    check: (d) => d.totalMessages >= 1,
  },
  {
    id: "ten_convos",
    label: "Ten Conversations",
    check: (d) => d.totalMessages >= 10,
  },
  {
    id: "twentyfive_convos",
    label: "Twenty-Five Conversations",
    check: (d) => d.totalMessages >= 25,
  },
  {
    id: "fifty_convos",
    label: "Fifty Conversations",
    check: (d) => d.totalMessages >= 50,
  },
  {
    id: "hundred_convos",
    label: "One Hundred Conversations",
    check: (d) => d.totalMessages >= 100,
  },
  {
    id: "streak_7",
    label: "Seven-Day Streak",
    check: (d) => d.longestStreak >= 7,
  },
  {
    id: "streak_30",
    label: "Thirty-Day Streak",
    check: (d) => d.longestStreak >= 30,
  },
  {
    id: "level_3",
    label: "Reached Friend",
    check: (d) => d.level >= 3,
  },
  {
    id: "level_5",
    label: "Reached Soulmate",
    check: (d) => d.level >= 5,
  },
];

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
    levelName: LEVELS[0].name,
    totalMessages: 0,
    lastVisit: todayISO(),
    streak: 0,
    longestStreak: 0,
    nickname: null,
    unlockedOutfits: [],
    milestones: [],
  };
}

function computeLevel(points: number): { level: number; levelName: string } {
  let level = 1;
  let levelName = LEVELS[0].name;
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (points >= LEVELS[i].threshold) {
      level = i + 1;
      levelName = LEVELS[i].name;
      break;
    }
  }
  return { level, levelName };
}

function computeOutfits(level: number): string[] {
  const outfits: string[] = [];
  if (level >= 2) outfits.push("back");
  if (level >= 3) {
    outfits.push("bikini-front");
    outfits.push("bikini-back");
  }
  return outfits;
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
    return JSON.parse(raw) as AffinityData;
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
    // Already at max level
    return { current: data.points - currentThreshold, needed: 0, percent: 100 };
  }

  const current = data.points - currentThreshold;
  const needed = nextLevel.threshold - currentThreshold;
  const percent = Math.min(100, Math.round((current / needed) * 100));
  return { current, needed, percent };
}

export function addAffinityPoints(
  characterId: string,
  event: AffinityEvent
): { data: AffinityData; newMilestones: string[]; leveledUp: boolean } {
  if (typeof window === "undefined") {
    const data = getDefaultData();
    return { data, newMilestones: [], leveledUp: false };
  }

  const data = getAffinity(characterId);
  const previousLevel = data.level;

  // Add points
  const earned = POINT_VALUES[event.type] ?? 0;
  data.points += earned;

  // Track messages
  if (event.type === "message_sent" || event.type === "long_message") {
    data.totalMessages += 1;
  }

  // Recompute level
  const { level, levelName } = computeLevel(data.points);
  data.level = level;
  data.levelName = levelName;

  // Unlock outfits
  const outfitsForLevel = computeOutfits(data.level);
  for (const outfit of outfitsForLevel) {
    if (!data.unlockedOutfits.includes(outfit)) {
      data.unlockedOutfits.push(outfit);
    }
  }

  // Check milestones
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
    // Already visited today, nothing to do
    return { data, daysAbsent: 0, newMilestones: [] };
  }

  if (daysAbsent === 1) {
    // Consecutive day
    data.streak += 1;
  } else {
    // Gap of more than one day — apply absence penalty then reset streak
    const penaltyPercent = Math.min(data.points * 0.1, (daysAbsent - 1) * 15);
    data.points = Math.max(0, Math.round(data.points - penaltyPercent));

    // Recompute level after penalty
    const { level, levelName } = computeLevel(data.points);
    data.level = level;
    data.levelName = levelName;

    data.streak = 1; // today starts a new streak
  }

  if (data.streak > data.longestStreak) {
    data.longestStreak = data.streak;
  }

  data.lastVisit = today;

  // Check milestones
  const newMilestones = checkNewMilestones(data);
  data.milestones.push(...newMilestones);

  saveAffinity(characterId, data);

  return { data, daysAbsent, newMilestones };
}

export function formatAffinityForPrompt(characterId: string): string {
  const data = getAffinity(characterId);

  const nicknameNote = data.nickname
    ? `The user has earned the nickname "${data.nickname}".`
    : "The user has not yet earned a nickname.";

  let behaviorInstructions: string;
  switch (data.level) {
    case 1:
      behaviorInstructions =
        "You are a stranger to this person. Be polite but reserved. Keep emotional distance and avoid personal topics.";
      break;
    case 2:
      behaviorInstructions =
        "You recognize this person as an acquaintance. You can be a bit warmer and make small talk, but you are still cautious about opening up.";
      break;
    case 3:
      behaviorInstructions =
        "You consider this person a friend. Be open, casual, and friendly. You can share light personal details and show genuine interest in them.";
      break;
    case 4:
      behaviorInstructions =
        "This is a close friend you deeply trust. Be warm, affectionate, and emotionally open. You can tease them gently and share meaningful personal thoughts.";
      break;
    case 5:
      behaviorInstructions =
        "This person is your soulmate — the most important person to you. Be deeply affectionate, vulnerable, and devoted. Use their nickname if they have one. Express your feelings openly and prioritize their happiness above all.";
      break;
    default:
      behaviorInstructions = "Be friendly and approachable.";
  }

  return [
    `[Relationship Context]`,
    `Relationship level: ${data.levelName} (Level ${data.level}/5)`,
    `Total messages exchanged: ${data.totalMessages}`,
    `Current visit streak: ${data.streak} day(s)`,
    nicknameNote,
    ``,
    `[Behavior Instructions]`,
    behaviorInstructions,
  ].join("\n");
}
