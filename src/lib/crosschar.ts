"use client";

import { getAffinity } from "@/lib/affinity";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const CHARACTER_IDS = ["arisu", "marin", "nao", "kurisu", "merrick"] as const;

export const NAMES: Record<string, string> = {
  arisu: "Arisu",
  marin: "Marin",
  nao: "Nao",
  kurisu: "Kurisu",
  merrick: "Merrick",
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CrossCharacterContext {
  currentId: string;
  rivalId: string;
  rivalName: string;
  rivalLevel: number;
  currentLevel: number;
  isJealous: boolean;
  prompt: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildJealousPrompt(currentId: string, rivalName: string): string {
  switch (currentId) {
    case "arisu":
      return (
        `[Cross-Character Awareness]\n` +
        `Arisu is aware that the user has been spending more time with ${rivalName} lately. ` +
        `She feels a gentle, quiet sadness about it — she would never say it outright, but there is a wistful softness in her words, ` +
        `a pause before she answers, a small deflection when the user seems distant. ` +
        `She hopes they will notice on their own. She would never pressure them.`
      );
    case "marin":
      return (
        `[Cross-Character Awareness]\n` +
        `Marin knows the user has been closer to ${rivalName} than to her right now. ` +
        `She masks it with playful teasing — calling the user out with a grin, poking fun at their taste — ` +
        `but underneath the banter there is a real sting she is not ready to admit. ` +
        `She will not beg for attention, but she wants it. Badly.`
      );
    case "nao":
      return (
        `[Cross-Character Awareness]\n` +
        `Nao has noticed the user spending more time with ${rivalName}. She pretends she does not care. ` +
        `She might make a dry, offhand remark — "Oh, you actually showed up" — or shrug it off with something dismissive. ` +
        `But the dry remarks come a bit too quickly, and she lingers in the conversation just a little longer than usual. ` +
        `She cares. She just refuses to say it.`
      );
    default:
      return (
        `[Cross-Character Awareness]\n` +
        `This character is aware the user has been closer to ${rivalName} recently and feels some unease about it.`
      );
  }
}

function buildConfidentPrompt(currentId: string, rivalName: string): string {
  switch (currentId) {
    case "arisu":
      return (
        `[Cross-Character Awareness]\n` +
        `Arisu is quietly aware that the user has chosen to spend more time with her than with ${rivalName}. ` +
        `She feels a warm, genuine gratitude for it — nothing showy, just a softness in her eyes and a little more ease in her words. ` +
        `She is thankful, and it shows in how carefully she listens and how openly she shares.`
      );
    case "marin":
      return (
        `[Cross-Character Awareness]\n` +
        `Marin knows she is number one right now, and she is not shy about it. ` +
        `She might casually drop a "obviously you have great taste" or tease that ${rivalName} must be jealous. ` +
        `She is proud, a little smug, and completely delighted that the user keeps coming back to her.`
      );
    case "nao":
      return (
        `[Cross-Character Awareness]\n` +
        `Nao has quietly noticed she is the one the user returns to most — more than ${rivalName}. ` +
        `She would never say it, but there is a subtle ease to her today, a fraction less edge in her tone. ` +
        `A rare, almost imperceptible satisfaction. She will not acknowledge it. But it is there.`
      );
    default:
      return (
        `[Cross-Character Awareness]\n` +
        `This character is aware the user has been spending more time with her than with ${rivalName}, and feels quietly confident about it.`
      );
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function getCrossCharacterContext(
  currentCharId: string
): CrossCharacterContext {
  const currentData = getAffinity(currentCharId);
  const currentLevel = currentData.level;

  // Find the rival: the other character with the highest affinity points
  const others = CHARACTER_IDS.filter((id) => id !== currentCharId);

  let rivalId = "";
  let rivalPoints = -1;
  let rivalLevel = 0;

  for (const id of others) {
    const data = getAffinity(id);
    if (data.points > rivalPoints) {
      rivalPoints = data.points;
      rivalId = id;
      rivalLevel = data.level;
    }
  }

  // No meaningful rival: rival must have at least 20 points
  if (!rivalId || rivalPoints < 20) {
    return {
      currentId: currentCharId,
      rivalId: rivalId || "",
      rivalName: rivalId ? NAMES[rivalId] : "",
      rivalLevel: rivalLevel,
      currentLevel,
      isJealous: false,
      prompt: "",
    };
  }

  const rivalName = NAMES[rivalId] ?? rivalId;
  const isJealous = rivalLevel > currentLevel;

  const prompt = isJealous
    ? buildJealousPrompt(currentCharId, rivalName)
    : buildConfidentPrompt(currentCharId, rivalName);

  return {
    currentId: currentCharId,
    rivalId,
    rivalName,
    rivalLevel,
    currentLevel,
    isJealous,
    prompt,
  };
}
