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

export interface GiftPreference {
  giftId: string;
  multiplier: number; // >1 = favorite, <1 = dislike
  reaction: CharacterReaction;
}

export const GIFT_PREFERENCES: Record<string, GiftPreference[]> = {
  arisu: [
    { giftId: "letter", multiplier: 2, reaction: { expression: "crying", dialogue: "You wrote this... for me? I'm going to read it again and again. Thank you." } },
    { giftId: "music_box", multiplier: 1.5, reaction: { expression: "devoted", dialogue: "A music box... the melody is so gentle. It sounds like how I feel when you're here." } },
    { giftId: "flower", multiplier: 1.5, reaction: { expression: "happy", dialogue: "Flowers! They're beautiful. I'll press one and keep it. Is that too much? I don't care." } },
  ],
  marin: [
    { giftId: "teddy", multiplier: 2, reaction: { expression: "excited", dialogue: "A TEDDY BEAR?? oh my GOD it's so soft I'm literally never letting go of this okay it's MINE now!!" } },
    { giftId: "candy", multiplier: 1.5, reaction: { expression: "laugh", dialogue: "CANDY!! you know me SO well bestie, this is literally my love language okay thank youuu!!" } },
    { giftId: "coffee", multiplier: 0.5, reaction: { expression: "thinking", dialogue: "coffee?? I mean... I'll drink it but like... you know I'm more of a boba person right lol" } },
  ],
  nao: [
    { giftId: "coffee", multiplier: 1.5, reaction: { expression: "smirk", dialogue: "Coffee. You actually remembered I run on this. ...That's annoyingly thoughtful of you." } },
    { giftId: "letter", multiplier: 0.5, reaction: { expression: "flustered", dialogue: "A love letter. You're really doing this. I — okay. I'll read it later. Alone. Stop looking at me." } },
    { giftId: "flower", multiplier: 0.5, reaction: { expression: "neutral", dialogue: "Flowers. Romantic. They'll be dead in a week, you know. ...Fine, I'll put them in water." } },
  ],
  kurisu: [
    { giftId: "coffee", multiplier: 2, reaction: { expression: "happy", dialogue: "Coffee. You — yes. This is exactly what I needed. How did you know? Don't answer that. Thank you." } },
    { giftId: "beaker", multiplier: 2, reaction: { expression: "excited", dialogue: "A proper Erlenmeyer flask! The glass quality on this is excellent. This is going on my desk immediately." } },
    { giftId: "lab_notebook", multiplier: 1.5, reaction: { expression: "shy", dialogue: "A research journal... the binding is beautiful. I'll use it for my most important work. Which is — never mind." } },
    { giftId: "candy", multiplier: 0.5, reaction: { expression: "neutral", dialogue: "Candy. How... juvenile. I'll eat it, obviously, but I want it noted that I have more sophisticated tastes." } },
  ],
  merrick: [
    { giftId: "voodoo_doll", multiplier: 2, reaction: { expression: "excited", dialogue: "A spirit doll — and hand-stitched, no less. You understand my traditions. That is rarer than you know, cher." } },
    { giftId: "hex_candle", multiplier: 1.5, reaction: { expression: "happy", dialogue: "A hex candle. The markings are old — older than most people would recognize. You chose well. I am touched." } },
    { giftId: "necklace", multiplier: 1.5, reaction: { expression: "devoted", dialogue: "A necklace. I shall wear it against my skin, close to the heart. You have excellent taste." } },
    { giftId: "candy", multiplier: 0.5, reaction: { expression: "smirk", dialogue: "Candy. How charmingly mortal. I suppose I will try it — my palate has changed over the centuries, but not entirely." } },
  ],
  ticia: [
    { giftId: "dead_rose", multiplier: 2, reaction: { expression: "devoted", dialogue: "A dead rose. You understand that death is not an ending but a perfection. This is the most romantic thing anyone has ever given me." } },
    { giftId: "poison_vial", multiplier: 2, reaction: { expression: "excited", dialogue: "Poison. How thoughtful. The color is exquisite — is it hemlock? Nightshade? No, do not tell me. The mystery is half the pleasure." } },
    { giftId: "flower", multiplier: 0.5, reaction: { expression: "neutral", dialogue: "A living flower. How optimistic of you. I shall watch it wither — that will be the truly beautiful part." } },
    { giftId: "star", multiplier: 0.5, reaction: { expression: "thinking", dialogue: "A shooting star. Bright and fleeting. I prefer things that endure in darkness. But the gesture is... noted. With warmth." } },
  ],
};

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
  { id: "beaker", name: "Lab Beaker", emoji: "🧪", description: "A pristine Erlenmeyer flask", affinityBonus: 18, rarity: "rare" },
  { id: "voodoo_doll", name: "Voodoo Doll", emoji: "🪆", description: "A hand-stitched spirit doll", affinityBonus: 18, rarity: "rare" },
  { id: "dead_rose", name: "Dead Rose", emoji: "🥀", description: "A perfectly withered black rose", affinityBonus: 18, rarity: "rare" },
  { id: "lab_notebook", name: "Research Journal", emoji: "📓", description: "A leather-bound lab notebook", affinityBonus: 15, rarity: "rare" },
  { id: "hex_candle", name: "Hex Candle", emoji: "🕯️", description: "A black candle with strange markings", affinityBonus: 15, rarity: "rare" },
  { id: "poison_vial", name: "Poison Vial", emoji: "🧴", description: "An elegant glass vial of something suspicious", affinityBonus: 15, rarity: "rare" },
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

  // Check gift-specific preferences first
  const prefs = GIFT_PREFERENCES[id];
  if (prefs) {
    const match = prefs.find((p) => p.giftId === gift.id);
    if (match) return match.reaction;
  }

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

  // Apply preference multiplier to affinity bonus
  const prefs = GIFT_PREFERENCES[characterId];
  const prefMatch = prefs?.find((p) => p.giftId === giftId);
  const multiplier = prefMatch?.multiplier ?? 1;
  const adjustedGift: Gift = multiplier !== 1
    ? { ...gift, affinityBonus: Math.round(gift.affinityBonus * multiplier) }
    : gift;

  const record: GiftRecord = { giftId, characterId, timestamp: Date.now() };
  const history = getGiftHistory(characterId);
  history.push(record);
  saveGiftHistory(characterId, history);

  const reaction = getCharacterReaction(characterId, adjustedGift);
  return { gift: adjustedGift, reaction };
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
