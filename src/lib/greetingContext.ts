"use client";

import { getSessionStartMood } from "@/lib/mood";
import { getTimeOfDay } from "@/lib/engagement";
import { getCrossCharacterContext } from "@/lib/crosschar";
import { getStrongestMemories, getLastSummary } from "@/lib/memory";

export function buildGreetingContext(
  characterId: string,
  daysAbsent: number,
  streak: number
): string {
  const sections: string[] = [];

  // 1. Session mood
  const sessionMood = getSessionStartMood(characterId, daysAbsent, streak);
  if (sessionMood.prompt) {
    sections.push(`[Session Mood]\n${sessionMood.prompt}`);
  }

  // 2. Time of day
  const timeOfDay = getTimeOfDay();
  const timeLabel =
    timeOfDay === "latenight" ? "late night" : timeOfDay;
  sections.push(`[Time Context]\nIt is ${timeLabel}.`);

  // 3. Streak
  if (streak > 1) {
    sections.push(
      `[Visit Streak]\nThis person has visited you ${streak} days in a row.`
    );
  }

  // 4. Absence
  if (daysAbsent >= 2) {
    sections.push(
      `[Absence]\nThey haven't seen you in ${daysAbsent} days.`
    );
  }

  // 5. Cross-character context
  const crossChar = getCrossCharacterContext(characterId);
  if (crossChar.prompt) {
    sections.push(crossChar.prompt);
  }

  // 6. Memory references
  const memories = getStrongestMemories(characterId, 3);
  if (memories.length > 0) {
    const memoryLines = memories.map((m) => `- ${m.content}`).join("\n");
    sections.push(`[Things You Remember]\n${memoryLines}`);
  }

  // 7. Last summary
  const lastSummary = getLastSummary(characterId);
  if (lastSummary) {
    sections.push(
      `[Last Conversation]\n${lastSummary.summary}`
    );
  }

  return sections.join("\n\n");
}
