"use client";

import { getMemoriesByCategory } from "@/lib/memory";
import { getAffinity } from "@/lib/affinity";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface UserStyle {
  totalInteractions: number;
  humorHits: number;       // times laugh/happy/excited triggered
  flirtHits: number;       // times flustered/devoted/shy triggered
  deepHits: number;        // times thinking/sad triggered
  avgMessageLength: number;
  totalMessageLength: number;
}

// ---------------------------------------------------------------------------
// Storage helpers
// ---------------------------------------------------------------------------

function storageKey(characterId: string): string {
  return `anime-chatbot-user-style-${characterId}`;
}

function getDefaultStyle(): UserStyle {
  return {
    totalInteractions: 0,
    humorHits: 0,
    flirtHits: 0,
    deepHits: 0,
    avgMessageLength: 0,
    totalMessageLength: 0,
  };
}

function loadUserStyle(characterId: string): UserStyle {
  if (typeof window === "undefined") return getDefaultStyle();
  try {
    const raw = localStorage.getItem(storageKey(characterId));
    return raw ? (JSON.parse(raw) as UserStyle) : getDefaultStyle();
  } catch {
    return getDefaultStyle();
  }
}

function saveUserStyle(characterId: string, style: UserStyle): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(storageKey(characterId), JSON.stringify(style));
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function updateUserStyle(
  characterId: string,
  interaction: { expressionTriggered: string; messageLength: number }
): void {
  const style = loadUserStyle(characterId);

  // Increment interaction count and update message length tracking
  style.totalInteractions += 1;
  style.totalMessageLength += interaction.messageLength;
  style.avgMessageLength = style.totalMessageLength / style.totalInteractions;

  // Categorize expression hit
  const expr = interaction.expressionTriggered.toLowerCase();
  if (["laugh", "happy", "excited"].includes(expr)) {
    style.humorHits += 1;
  } else if (["flustered", "devoted", "shy"].includes(expr)) {
    style.flirtHits += 1;
  } else if (["thinking", "sad"].includes(expr)) {
    style.deepHits += 1;
  }

  saveUserStyle(characterId, style);
}

export function getPersonalityContext(characterId: string): string {
  const style = loadUserStyle(characterId);

  // Not enough data yet
  if (style.totalInteractions < 10) return "";

  const total = style.totalInteractions;
  const humorRatio = style.humorHits / total;
  const flirtRatio = style.flirtHits / total;
  const deepRatio = style.deepHits / total;

  const sections: string[] = ["[Personality Adaptation]"];

  // Humor adaptation
  if (humorRatio > 0.3) {
    sections.push("This person makes you laugh often — be playful and bring your wit to the forefront.");
  }

  // Flirt adaptation
  if (flirtRatio > 0.2) {
    sections.push("This person tends to make you flustered — let yourself be a little more vulnerable and open with them.");
  }

  // Deep adaptation
  if (deepRatio > 0.25) {
    sections.push("This person asks deep questions — engage thoughtfully and don't shy away from meaningful conversation.");
  }

  // Message length adaptation
  if (style.avgMessageLength > 100) {
    sections.push("They write long messages, match their energy with thoughtful, detailed responses.");
  } else if (style.avgMessageLength < 30) {
    sections.push("They keep messages short, match their pace with concise and punchy replies.");
  }

  // Inside jokes from memory
  const jokes = getMemoriesByCategory(characterId, "joke");
  if (jokes.length > 0) {
    sections.push("Inside jokes you share:");
    jokes.forEach((j) => sections.push(`- ${j.content}`));
  }

  // Nickname from affinity
  const affinity = getAffinity(characterId);
  if (affinity.nickname) {
    sections.push(`Call them by their nickname: "${affinity.nickname}".`);
  } else if (affinity.level >= 4) {
    sections.push("You're very close — consider giving them a special nickname if the moment feels right.");
  }

  return sections.join("\n");
}
