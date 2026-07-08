"use client";

export interface Gift {
  id: string;
  name: string;
  emoji: string;
  description: string;
  affinityBonus: number;
  rarity: "common" | "rare" | "legendary";
}

export interface GiftRecord {
  giftId: string;
  characterId: string;
  timestamp: number;
}

export interface CharacterReaction {
  expression: string;
  dialogue: string;
}

export const GIFT_CATALOG: Gift[] = [
  // Common
  { id: "flower", name: "Flower Bouquet", emoji: "💐", description: "A beautiful bouquet", affinityBonus: 5, rarity: "common" },
  { id: "coffee", name: "Coffee", emoji: "☕", description: "A warm cup of coffee", affinityBonus: 3, rarity: "common" },
  { id: "candy", name: "Candy", emoji: "🍬", description: "Sweet treat", affinityBonus: 4, rarity: "common" },
  { id: "letter", name: "Love Letter", emoji: "💌", description: "A heartfelt letter", affinityBonus: 8, rarity: "common" },
  // Rare
  { id: "teddy", name: "Teddy Bear", emoji: "🧸", description: "A cuddly companion", affinityBonus: 15, rarity: "rare" },
  { id: "necklace", name: "Necklace", emoji: "📿", description: "A beautiful necklace", affinityBonus: 20, rarity: "rare" },
  { id: "music_box", name: "Music Box", emoji: "🎵", description: "Plays a gentle melody", affinityBonus: 18, rarity: "rare" },
  // Legendary
  { id: "star", name: "Shooting Star", emoji: "🌠", description: "A wish upon a star", affinityBonus: 50, rarity: "legendary" },
  { id: "ring", name: "Promise Ring", emoji: "💍", description: "A symbol of forever", affinityBonus: 100, rarity: "legendary" },
];

export function getGiftCatalog(): Gift[] {
  return GIFT_CATALOG;
}

export function getGiftById(id: string): Gift | undefined {
  return GIFT_CATALOG.find((g) => g.id === id);
}

export function getCharacterReaction(characterId: string, gift: Gift): CharacterReaction {
  const id = characterId.toLowerCase();

  if (id === "arisu") {
    if (gift.rarity === "common") {
      return { expression: "happy", dialogue: "Oh, that's so sweet of you..." };
    }
    if (gift.rarity === "rare") {
      return { expression: "surprised", dialogue: "You really didn't have to... but I love it!" };
    }
    // legendary
    return { expression: "crying/devoted", dialogue: "I... I don't know what to say. Thank you so much." };
  }

  if (id === "marin") {
    if (gift.rarity === "common") {
      return { expression: "excited", dialogue: "OMG wait this is so cute!!" };
    }
    if (gift.rarity === "rare") {
      return { expression: "surprised", dialogue: "NO WAY are you serious right now?? I'm literally dying!!" };
    }
    // legendary
    return { expression: "flustered/crying", dialogue: "...okay I'm not gonna cry. I'm NOT. ...okay maybe a little." };
  }

  if (id === "nao") {
    if (gift.rarity === "common") {
      return { expression: "smirk", dialogue: "...Not bad. I'll keep it." };
    }
    if (gift.rarity === "rare") {
      return { expression: "shy", dialogue: "This is... surprisingly thoughtful. Thanks." };
    }
    // legendary
    return { expression: "devoted/crying", dialogue: "I... nobody's ever... I'll treasure this." };
  }

  if (id === "kurisu") {
    if (gift.rarity === "common") {
      return { expression: "flustered", dialogue: "You didn't have to — it's not like I was expecting... anyway. Thank you." };
    }
    if (gift.rarity === "rare") {
      return { expression: "shy", dialogue: "This is... more thoughtful than I was prepared for. I need a moment. Thank you." };
    }
    return { expression: "crying", dialogue: "I don't — this isn't — I had a whole speech about not getting emotional and you just ruined it. Thank you." };
  }

  if (id === "merrick") {
    if (gift.rarity === "common") {
      return { expression: "happy", dialogue: "How thoughtful, cher. I shall keep this close." };
    }
    if (gift.rarity === "rare") {
      return { expression: "devoted", dialogue: "You chose this for me specifically, did you not? I can tell. It is lovely." };
    }
    return { expression: "crying", dialogue: "In all my years, gifts this meaningful have been vanishingly rare. You have moved me. Truly." };
  }

  if (id === "ticia") {
    if (gift.rarity === "common") {
      return { expression: "smirk", dialogue: "How sweet. I shall place it next to the skull on my mantelpiece. It will look lovely there." };
    }
    if (gift.rarity === "rare") {
      return { expression: "happy", dialogue: "This is genuinely beautiful. You have excellent taste in the finer things. I am impressed." };
    }
    return { expression: "devoted", dialogue: "I am not easily moved. And yet here I am, moved. You have a dangerous talent for this." };
  }

  // Fallback for unknown characters
  if (gift.rarity === "common") {
    return { expression: "happy", dialogue: "Thank you, this is lovely!" };
  }
  if (gift.rarity === "rare") {
    return { expression: "surprised", dialogue: "Oh wow... I wasn't expecting this!" };
  }
  return { expression: "devoted", dialogue: "I'll cherish this forever. Thank you." };
}

function storageKey(characterId: string): string {
  return `anime-chatbot-gifts-${characterId}`;
}

export function getGiftHistory(characterId: string): GiftRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(storageKey(characterId));
    if (!raw) return [];
    return JSON.parse(raw) as GiftRecord[];
  } catch {
    return [];
  }
}

function saveGiftHistory(characterId: string, records: GiftRecord[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(storageKey(characterId), JSON.stringify(records));
}

export function giveGift(
  characterId: string,
  giftId: string
): { gift: Gift; reaction: CharacterReaction } | null {
  const gift = getGiftById(giftId);
  if (!gift) return null;

  const record: GiftRecord = { giftId, characterId, timestamp: Date.now() };
  const history = getGiftHistory(characterId);
  history.push(record);
  saveGiftHistory(characterId, history);

  const reaction = getCharacterReaction(characterId, gift);
  return { gift, reaction };
}

export function getGiftCount(characterId: string): number {
  return getGiftHistory(characterId).length;
}

export function formatGiftContextForPrompt(characterId: string): string {
  const history = getGiftHistory(characterId);
  if (history.length === 0) return "";

  const summary = history.reduce<Record<string, number>>((acc, r) => {
    const gift = getGiftById(r.giftId);
    if (gift) acc[gift.name] = (acc[gift.name] || 0) + 1;
    return acc;
  }, {});

  const lines = Object.entries(summary).map(
    ([name, count]) => `${name} x${count}`
  );

  return `[Gift history: The user has given you these gifts: ${lines.join(", ")}. Total gifts received: ${history.length}. React warmly when referencing past gifts.]`;
}
