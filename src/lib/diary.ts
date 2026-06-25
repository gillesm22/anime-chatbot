"use client";

export interface DiaryEntry {
  id: string;
  characterId: string;
  date: string;
  mood: string;
  content: string;
  topics: string[];
}

const MAX_ENTRIES = 30;

const storageKey = (characterId: string) =>
  `anime-chatbot-diary-${characterId}`;

export function getDiaryEntries(characterId: string): DiaryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(storageKey(characterId));
    if (!raw) return [];
    const entries: DiaryEntry[] = JSON.parse(raw);
    return entries.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  } catch {
    return [];
  }
}

export function addDiaryEntry(
  characterId: string,
  content: string,
  mood: string,
  topics: string[]
): void {
  if (typeof window === "undefined") return;
  try {
    const existing = getDiaryEntries(characterId);
    const newEntry: DiaryEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      characterId,
      date: new Date().toISOString(),
      mood,
      content,
      topics,
    };
    const updated = [newEntry, ...existing].slice(0, MAX_ENTRIES);
    localStorage.setItem(storageKey(characterId), JSON.stringify(updated));
  } catch {
    // localStorage may be unavailable (private browsing quota, etc.)
  }
}

export function getLatestEntry(characterId: string): DiaryEntry | null {
  const entries = getDiaryEntries(characterId);
  return entries.length > 0 ? entries[0] : null;
}

export function getDiaryCount(characterId: string): number {
  return getDiaryEntries(characterId).length;
}

export function generateDiaryPrompt(
  characterId: string,
  conversationSummary: string
): string {
  const personalityHint = (() => {
    switch (characterId) {
      case "arisu":
        return (
          "You are Arisu: gentle, reflective, and deeply in touch with your feelings. " +
          "Write in soft, careful language. Focus on emotions and quiet observations."
        );
      case "marin":
        return (
          "You are Marin: energetic and enthusiastic even when writing privately. " +
          "Use abbreviations, exclamation marks, and write about fun or exciting moments. " +
          "Let your bubbly personality shine through."
        );
      case "nao":
        return (
          "You are Suzuka: terse and analytical by nature. Write in short, precise observations. " +
          "Occasionally let a hint of vulnerability slip through, though you would never admit it."
        );
      default:
        return "Write in a personal, reflective tone.";
    }
  })();

  return (
    `${personalityHint}\n\n` +
    `Write 2-4 sentences as if writing in your private diary about the following conversation. ` +
    `Be honest and personal -- no one else will read this.\n\n` +
    `Conversation summary:\n${conversationSummary}\n\n` +
    `Diary entry (write only the entry text, no date or heading):`
  );
}
