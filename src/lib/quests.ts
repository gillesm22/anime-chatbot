"use client";

export interface Quest {
  id: string;
  title: string;
  description: string;
  target: number;
  reward: number;
  type: "laugh" | "flustered" | "messages" | "gifts" | "headpat";
}

export interface QuestProgress {
  questId: string;
  current: number;
  completed: boolean;
  claimed: boolean;
}

export interface DailyQuestState {
  date: string;
  quests: QuestProgress[];
}

export const QUEST_POOL: Quest[] = [
  {
    id: "laugh-3",
    title: "Make her laugh 3 times",
    description: "Get her to laugh during your conversation.",
    target: 3,
    reward: 15,
    type: "laugh",
  },
  {
    id: "flustered-2",
    title: "Make her flustered 2 times",
    description: "Say something that makes her flustered.",
    target: 2,
    reward: 20,
    type: "flustered",
  },
  {
    id: "messages-10",
    title: "Send 10 messages",
    description: "Keep the conversation going.",
    target: 10,
    reward: 10,
    type: "messages",
  },
  {
    id: "gifts-2",
    title: "Give 2 gifts",
    description: "Surprise her with gifts.",
    target: 2,
    reward: 12,
    type: "gifts",
  },
  {
    id: "headpat-5",
    title: "Headpat 5 times",
    description: "Give her some headpats.",
    target: 5,
    reward: 8,
    type: "headpat",
  },
  {
    id: "messages-20",
    title: "Send 20 messages",
    description: "Have a long conversation today.",
    target: 20,
    reward: 25,
    type: "messages",
  },
  {
    id: "laugh-5",
    title: "Make her laugh 5 times",
    description: "Be extra funny today.",
    target: 5,
    reward: 30,
    type: "laugh",
  },
  {
    id: "gifts-5",
    title: "Give 5 gifts",
    description: "Shower her with gifts.",
    target: 5,
    reward: 25,
    type: "gifts",
  },
  {
    id: "flustered-5",
    title: "Make her flustered 5 times",
    description: "Keep catching her off guard.",
    target: 5,
    reward: 35,
    type: "flustered",
  },
  {
    id: "headpat-10",
    title: "Headpat 10 times",
    description: "She secretly loves the attention.",
    target: 10,
    reward: 20,
    type: "headpat",
  },
];

function getStorageKey(characterId: string): string {
  return `anime-chatbot-quests-${characterId}`;
}

function getTodayString(): string {
  return new Date().toISOString().slice(0, 10);
}

function pickDailyQuests(date: string, characterId: string): Quest[] {
  // Deterministic seed based on date + characterId so quests are consistent per day per character
  const seed = `${date}-${characterId}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }

  const pool = [...QUEST_POOL];
  const selected: Quest[] = [];

  for (let i = 0; i < 3; i++) {
    hash = (hash * 1664525 + 1013904223) >>> 0;
    const idx = hash % pool.length;
    selected.push(pool[idx]);
    pool.splice(idx, 1);
  }

  return selected;
}

function loadState(characterId: string): DailyQuestState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(getStorageKey(characterId));
    if (!raw) return null;
    return JSON.parse(raw) as DailyQuestState;
  } catch {
    return null;
  }
}

function saveState(characterId: string, state: DailyQuestState): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(getStorageKey(characterId), JSON.stringify(state));
}

export function getDailyQuests(
  characterId: string
): { quest: Quest; progress: QuestProgress }[] {
  const today = getTodayString();
  let state = loadState(characterId);

  if (!state || state.date !== today) {
    const quests = pickDailyQuests(today, characterId);
    state = {
      date: today,
      quests: quests.map((q) => ({
        questId: q.id,
        current: 0,
        completed: false,
        claimed: false,
      })),
    };
    saveState(characterId, state);
  }

  return state.quests.map((progress) => {
    const quest = QUEST_POOL.find((q) => q.id === progress.questId)!;
    return { quest, progress };
  });
}

export function updateQuestProgress(
  characterId: string,
  type: string
): { completed: boolean; quest: Quest } | null {
  const today = getTodayString();
  const state = loadState(characterId);
  if (!state || state.date !== today) return null;

  let result: { completed: boolean; quest: Quest } | null = null;

  for (const progress of state.quests) {
    if (progress.completed || progress.claimed) continue;

    const quest = QUEST_POOL.find((q) => q.id === progress.questId);
    if (!quest || quest.type !== type) continue;

    progress.current = Math.min(progress.current + 1, quest.target);

    if (progress.current >= quest.target && !progress.completed) {
      progress.completed = true;
      result = { completed: true, quest };
    }

    break;
  }

  saveState(characterId, state);
  return result;
}

export function claimQuestReward(
  characterId: string,
  questId: string
): number {
  const today = getTodayString();
  const state = loadState(characterId);
  if (!state || state.date !== today) return 0;

  const progress = state.quests.find((p) => p.questId === questId);
  if (!progress || !progress.completed || progress.claimed) return 0;

  const quest = QUEST_POOL.find((q) => q.id === questId);
  if (!quest) return 0;

  progress.claimed = true;
  saveState(characterId, state);

  return quest.reward;
}
