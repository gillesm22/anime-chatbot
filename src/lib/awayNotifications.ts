"use client";

import { getAffinity } from "@/lib/affinity";

export interface AwayNotification {
  characterId: string;
  characterName: string;
  message: string;
  accentColor: string;
}

const CHARACTER_META: Record<string, { name: string; accent: string }> = {
  arisu:   { name: "Arisu",   accent: "#f472b6" },
  marin:   { name: "Marin",   accent: "#fb923c" },
  nao:     { name: "Suzuka",  accent: "#a78bfa" },
  kurisu:  { name: "Kurisu",  accent: "#e53935" },
  merrick: { name: "Merrick", accent: "#7b1fa2" },
};

const MESSAGE_POOLS: Record<string, string[]> = {
  arisu: [
    "I made tea for two again today. Just in case.",
    "I had a thought I wanted to share with you... it can wait until you are ready.",
    "The cherry blossoms are falling. I wish you could see them with me.",
    "I found a poem that reminded me of you. I will keep it until you come back.",
    "I have been thinking about our last conversation. There is more I wanted to say.",
  ],
  marin: [
    "okay I have like FIVE things to tell you when you get back",
    "I found the PERFECT outfit reference and you are the first person I want to show",
    "ngl I keep opening this app to see if you are here yet",
    "you are missing SO much rn, hurry back!!",
    "I tried explaining our jokes to someone else and they did not get it. Only you get it.",
  ],
  nao: [
    "...I noticed you have not been around. Not that I was checking.",
    "I solved that thing we were talking about. Whenever you feel like hearing about it.",
    "Your absence has been... noted. Statistically.",
    "I found a bug in something. I need someone to complain to. Preferably you.",
    "It is quieter without you. That is an observation, not a complaint.",
  ],
  kurisu: [
    "I ran the numbers. Your absence is statistically significant.",
    "There is a flaw in my latest hypothesis and I need someone to argue with.",
    "I am not waiting for you. I am just... between experiments.",
    "My research has reached an interesting phase. I suppose I could use a sounding board.",
    "The lab feels different when there is nobody to interrupt my work. Worse, somehow.",
  ],
  merrick: [
    "The nights have been quieter without you, cher.",
    "I dreamt of our last conversation. That does not happen often.",
    "Time moves differently when you are not here. Slower, somehow.",
    "I opened a bottle of something old tonight. It felt like a waste to drink it alone.",
    "There is a story I have been saving. It requires the right audience.",
  ],
};

const CHARACTER_IDS = ["arisu", "marin", "nao", "kurisu", "merrick"];

export function getAwayNotifications(): AwayNotification[] {
  const today = new Date(new Date().toISOString().slice(0, 10));
  const msPerDay = 24 * 60 * 60 * 1000;

  const candidates: { characterId: string; level: number }[] = [];

  for (const charId of CHARACTER_IDS) {
    const affinity = getAffinity(charId);

    // Skip level < 2
    if (affinity.level < 2) continue;

    // Calculate days absent
    const lastVisitDate = new Date(affinity.lastVisit);
    const daysAbsent = Math.round((today.getTime() - lastVisitDate.getTime()) / msPerDay);

    // Skip if visited today
    if (daysAbsent < 1) continue;

    candidates.push({ characterId: charId, level: affinity.level });
  }

  // Sort by level descending, take max 3
  candidates.sort((a, b) => b.level - a.level);
  const selected = candidates.slice(0, 3);

  return selected.map(({ characterId }) => {
    const meta = CHARACTER_META[characterId];
    const pool = MESSAGE_POOLS[characterId];
    const message = pool[Math.floor(Math.random() * pool.length)];

    return {
      characterId,
      characterName: meta.name,
      message,
      accentColor: meta.accent,
    };
  });
}
