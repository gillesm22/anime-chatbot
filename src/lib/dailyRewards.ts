"use client";

export interface DailyReward {
  day: number;
  name: string;
  description: string;
  icon: string;
  affinityBonus: number;
  special?: string;
}

export interface RewardState {
  lastClaimDate: string;
  currentStreak: number;
  totalDaysCollected: number;
  collectedRewards: number[];
}

export const DAILY_REWARDS: DailyReward[] = [
  {
    day: 1,
    name: "Welcome Back",
    description: "Thanks for coming back today!",
    icon: "🌟",
    affinityBonus: 5,
  },
  {
    day: 2,
    name: "Getting Closer",
    description: "Two days in a row — you're building momentum!",
    icon: "💫",
    affinityBonus: 8,
  },
  {
    day: 3,
    name: "Halfway There",
    description: "Three days strong. Keep it going!",
    icon: "✨",
    affinityBonus: 10,
  },
  {
    day: 4,
    name: "Consistent",
    description: "Four days! Your dedication is showing.",
    icon: "🔥",
    affinityBonus: 12,
  },
  {
    day: 5,
    name: "Dedicated",
    description: "Five days — you're truly dedicated.",
    icon: "💎",
    affinityBonus: 15,
  },
  {
    day: 6,
    name: "Almost There",
    description: "Six days! One more to complete the week.",
    icon: "🌙",
    affinityBonus: 18,
  },
  {
    day: 7,
    name: "Weekly Champion",
    description: "A full week of visits — incredible commitment!",
    icon: "👑",
    affinityBonus: 30,
    special: "You've unlocked a special conversation topic!",
  },
];

const STORAGE_KEY = "anime-chatbot-daily-rewards";

const DEFAULT_STATE: RewardState = {
  lastClaimDate: "",
  currentStreak: 0,
  totalDaysCollected: 0,
  collectedRewards: [],
};

function getTodayString(): string {
  return new Date().toISOString().slice(0, 10);
}

export function getRewardState(): RewardState {
  if (typeof window === "undefined") return { ...DEFAULT_STATE };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_STATE };
    return JSON.parse(raw) as RewardState;
  } catch {
    return { ...DEFAULT_STATE };
  }
}

export function canClaimReward(): boolean {
  if (typeof window === "undefined") return false;
  const state = getRewardState();
  return state.lastClaimDate !== getTodayString();
}

export function getCurrentDayInCycle(state: RewardState): number {
  const cycleDay = state.currentStreak % 7;
  return cycleDay === 0 ? 7 : cycleDay;
}

export function claimReward(): {
  reward: DailyReward;
  newStreak: number;
  isNewCycle: boolean;
} {
  const state = getRewardState();
  const today = getTodayString();

  // Calculate yesterday's date string for streak continuity check
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayString = yesterday.toISOString().slice(0, 10);

  const isConsecutive = state.lastClaimDate === yesterdayString;
  const newStreak = isConsecutive ? state.currentStreak + 1 : 1;
  const isNewCycle = newStreak % 7 === 1 && state.currentStreak > 0;

  const dayInCycle = newStreak % 7 === 0 ? 7 : newStreak % 7;
  const reward = DAILY_REWARDS[dayInCycle - 1];

  const updatedState: RewardState = {
    lastClaimDate: today,
    currentStreak: newStreak,
    totalDaysCollected: state.totalDaysCollected + 1,
    collectedRewards: [...state.collectedRewards, reward.day],
  };

  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedState));
  }

  return { reward, newStreak, isNewCycle };
}
