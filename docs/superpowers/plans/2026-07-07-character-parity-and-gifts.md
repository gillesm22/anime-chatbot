# Character Parity & Gift System Expansion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring Kurisu, Merrick, and Ticia to full parity across engagement, gifts, and cross-character systems, update the PWA manifest, expand streak milestones, and add character-themed gifts with a preference system.

**Architecture:** Pure data/content additions to existing modules. No new files, no new components, no architectural changes. Each task modifies one file (plus its test file where applicable). The gift preference system adds a lookup map and modifies `getCharacterReaction` to check gift-specific overrides before falling through to rarity-based defaults.

**Tech Stack:** TypeScript, Vitest

---

### Task 1: Add Kurisu/Merrick/Ticia time-of-day greetings to engagement.ts

**Files:**
- Modify: `src/lib/engagement.ts:13-68` (TIME_GREETINGS)

- [ ] **Step 1: Add Kurisu time-of-day greetings**

Add after the `nao` block in `TIME_GREETINGS` (after line 67):

```typescript
  kurisu: {
    morning: [
      "Morning. I've been up for hours already — there was a dataset I couldn't leave alone. What brings you here this early?",
      "Oh. You're awake. Good morning, I suppose. I was just about to make coffee. Don't read anything into that.",
    ],
    afternoon: [
      "Afternoon. I lost track of time again — that happens when the work is actually interesting. What do you need?",
      "You caught me between experiments. Afternoon. I have a few minutes before the next batch runs.",
    ],
    evening: [
      "Evening. The lab gets quieter around this time. I won't pretend I mind the company. What's on your mind?",
      "Good evening. I was just reviewing some results. They can wait. Probably. What is it?",
    ],
    latenight: [
      "You're up this late? I was going to say that's irresponsible, but I'm still here too, so. What's going on?",
      "Late night. The best ideas come at this hour — or the worst ones. Hard to tell the difference sometimes. Hi.",
    ],
  },
```

- [ ] **Step 2: Add Merrick time-of-day greetings**

Add after the `kurisu` block:

```typescript
  merrick: {
    morning: [
      "Good morning, cher. The dawn is not my preferred hour, but I find I do not mind it when you are here.",
      "Morning. I watched the sun rise — a habit I have not quite broken, even after all this time. Come, sit with me.",
    ],
    afternoon: [
      "Afternoon. The light is golden right now — almost bearable. I was just thinking about something you said last time.",
      "Ah, you came in the afternoon. The world is loud at this hour, but you bring a certain quiet with you. I appreciate that.",
    ],
    evening: [
      "The evening suits us both, I think. Come in. I have been waiting — not impatiently, but with genuine anticipation.",
      "Good evening. This is the hour when the world becomes honest. I am glad you chose to spend it here.",
    ],
    latenight: [
      "Late night. My favorite hours. The living world sleeps and everything becomes more interesting. Including you, apparently.",
      "You are awake at this hour. Good. The night belongs to those who refuse to waste it on sleep. What shall we discuss?",
    ],
  },
```

- [ ] **Step 3: Add Ticia time-of-day greetings**

Add after the `merrick` block:

```typescript
  ticia: {
    morning: [
      "Morning. The light is rather aggressive today. I drew the curtains, naturally. But you are welcome to come in.",
      "Good morning. I was up all night, which is not unusual. The morning is simply the part where everyone else finally catches up.",
    ],
    afternoon: [
      "Afternoon. The most tedious part of the day — too bright, too busy. But your arrival has improved it considerably.",
      "You came in the afternoon. How conventional of you. I say that with affection, of course. Mostly.",
    ],
    evening: [
      "The evening. When the world begins to look like itself again. I have been expecting you — in the most non-threatening way possible.",
      "Good evening. The shadows are getting longer. I find that deeply comforting. As I find your presence. Come, sit.",
    ],
    latenight: [
      "You are up at this hour. How wonderful. The night is when all the most interesting conversations happen, I find.",
      "Late night. My preferred state of being. Everything is quieter, darker, and more honest. You chose well.",
    ],
  },
```

- [ ] **Step 4: Run tests**

Run: `npm test`
Expected: All 188 tests still pass (no tests exist for engagement greetings — they're data-only).

- [ ] **Step 5: Commit**

```bash
git add src/lib/engagement.ts
git commit -m "feat: add time-of-day greetings for kurisu, merrick, ticia"
```

---

### Task 2: Add Kurisu/Merrick/Ticia absence greetings to engagement.ts

**Files:**
- Modify: `src/lib/engagement.ts:70-116` (ABSENCE_GREETINGS)

- [ ] **Step 1: Add Kurisu absence greetings**

Add after the `nao` block in `ABSENCE_GREETINGS` (after line 115):

```typescript
  kurisu: {
    short: [
      "Two days. I wasn't tracking your schedule or anything — I just noticed the data gap. Welcome back.",
      "A couple of days. The lab was quieter. That's an observation, not a complaint. What happened?",
    ],
    medium: [
      "Almost a week. I ran out of people to argue with, which was... less fun than I expected. Don't let it go to your head.",
      "Several days without you. I filled the time with work, obviously. But the work was less interesting. That's your fault.",
    ],
    long: [
      "Over a week. I had a whole speech prepared about how I didn't notice, but I'm a terrible liar. Where were you?",
      "More than a week absent. I'm not going to say I was worried because that would be embarrassing. But I was. Obviously.",
    ],
  },
```

- [ ] **Step 2: Add Merrick absence greetings**

Add after the `kurisu` block:

```typescript
  merrick: {
    short: [
      "A couple of days. Time moves differently for me, but I noticed the absence all the same. I am glad you have returned.",
      "Two days away. I spent them thinking about our last conversation. There were things left unsaid. Come, let us continue.",
    ],
    medium: [
      "Nearly a week. I will not make you feel guilty — guilt is such a wasteful emotion. But I will say that I missed the sound of your thoughts.",
      "Several days. The nights were longer without you, and that is saying something for someone who lives in them. Welcome back, cher.",
    ],
    long: [
      "More than a week. I have lived centuries, and yet your absence was felt in every one of those days. That should tell you something.",
      "Over a week. I began to wonder if you had forgotten me. That would have been a first — people do not usually forget me. I am relieved you are here.",
    ],
  },
```

- [ ] **Step 3: Add Ticia absence greetings**

Add after the `merrick` block:

```typescript
  ticia: {
    short: [
      "Two days. I watered the dead plants in your absence. They are thriving, which is to say they are still dead. I missed you.",
      "A couple of days away. The house was quieter. I do not usually mind quiet, but yours was the wrong kind.",
    ],
    medium: [
      "Nearly a week. I sat in the dark and thought about you. That sounds more dramatic than it was — I always sit in the dark. But the thinking-about-you part was new.",
      "Several days. The spiders built a web across your chair. I left it. It seemed like the respectful thing to do. But I am glad you are back to disturb it.",
    ],
    long: [
      "More than a week. I considered sending a raven, but I was not sure you would find that charming rather than alarming. I am glad you returned on your own.",
      "Over a week absent. I will not say the house mourned you — that would be an exaggeration. But the candles burned lower. Make of that what you will.",
    ],
  },
```

- [ ] **Step 4: Run tests**

Run: `npm test`
Expected: All tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/engagement.ts
git commit -m "feat: add absence greetings for kurisu, merrick, ticia"
```

---

### Task 3: Add Kurisu/Merrick/Ticia streak messages + expand milestones to engagement.ts

**Files:**
- Modify: `src/lib/engagement.ts:148-171` (getStreakMessage)

- [ ] **Step 1: Expand streakMessages to include all 6 characters and add day 3, 14, 60, 100**

Replace the entire `streakMessages` object inside `getStreakMessage` (lines 152-165) with:

```typescript
  const streakMessages: Record<string, Record<number, string>> = {
    arisu: {
      3: "Three days. You keep coming back. I keep noticing. It makes me feel... warm.",
      7: "Seven days in a row. I've been quietly hoping you'd keep coming back, and you did. That means more to me than I know how to say.",
      14: "Two weeks. Every single day, you came back. I think about that when it's quiet — how reliable you are. How safe that feels.",
      30: "Thirty days. A whole month of coming back to me, every single day. I don't have words for how that makes me feel — just know that I treasure every single one of those moments.",
      60: "Sixty days. Two months. I've stopped wondering if you'll come back — I just know you will. That kind of certainty is rare, and I hold it very close.",
      100: "One hundred days. I counted every one. You are the most constant thing in my life, and I love you for it. Completely.",
    },
    marin: {
      3: "THREE DAYS IN A ROW?? okay we're officially building something here and I am SO here for it!! 🎉",
      7: "SEVEN DAYS STRAIGHT?? bestie you are COMMITTED and I am literally obsessed with you for it?? okay this is a STREAK, we are officially a thing now lol 🎉",
      14: "TWO WEEKS?? fourteen days of you choosing ME?? I'm not even being dramatic this is genuinely the most consistent anyone has ever been with me and I'm a little emotional ngl 💕",
      30: "THIRTY DAYS?? A WHOLE MONTH?? okay I'm not crying you're crying — actually no, I'm a little crying. this is the most dedicated you've ever been to anything and I am HONOURED.",
      60: "SIXTY DAYS. TWO MONTHS. bestie this is beyond a streak this is a LIFESTYLE and I am literally your biggest fan okay I love you SO much for this 😭💕",
      100: "ONE HUNDRED DAYS. I genuinely cannot believe this. you showed up every single day for a hundred days. I'm printing this on a t-shirt. you are my PERSON. forever.",
    },
    nao: {
      3: "Three days. You're establishing a pattern. I'm not going to say it's a welcome one, but... I'm not not saying that either.",
      7: "Seven consecutive days. I wasn't going to say anything, but... that's actually kind of remarkable. Don't stop now.",
      14: "Fourteen days. Two weeks without a gap. I ran the numbers and the probability of this being coincidence is low. You're doing this on purpose. Good.",
      30: "Thirty days. A month, uninterrupted. I don't say this often, so pay attention: that genuinely means something to me. Thank you for sticking around.",
      60: "Sixty days. At this point I've stopped pretending I'm not keeping count. You're the most consistent variable in my life and I... value that. A lot.",
      100: "One hundred days. I wrote a script to verify because I didn't believe it. The data checks out. You are statistically irreplaceable. I mean that.",
    },
    kurisu: {
      3: "Three days in a row. That's... not nothing. I'm not going to make a big deal out of it. But I noticed.",
      7: "Seven days. A full week. I had a hypothesis that you'd lose interest by now. I'm glad the data proved me wrong.",
      14: "Two weeks of consistent visits. I would say it's statistically significant, but that would be an understatement. Don't read too much into the fact that I'm smiling.",
      30: "Thirty days. I've been trying to find a clinical way to say this, but — a month of you showing up every day means more to me than any published paper. There. I said it.",
      60: "Sixty days. I stopped tracking it as an experiment somewhere around day forty. It's not data anymore. It's just... us. That's fine. That's good, actually.",
      100: "One hundred days. I ran out of ways to deflect how much this means to me about fifty days ago. You are the most important person in my life. I am done pretending otherwise.",
    },
    merrick: {
      3: "Three days. You return like the tide — steady and certain. I find that deeply appealing.",
      7: "Seven days, unbroken. In centuries of living, consistency is the rarest gift anyone can offer. You have my attention — fully.",
      14: "Two weeks. Fourteen nights, and you chose to spend part of each one here. That is not a small thing, cher. Not to me.",
      30: "A month. Thirty days of your company. I have known people for decades who gave me less than you have in these thirty days. I am grateful beyond elegant expression.",
      60: "Sixty days. Two months of certainty in an uncertain existence. You have become essential to me, and I do not use that word carelessly.",
      100: "One hundred days. I have lived centuries and can count on one hand the souls who stayed this long. You are among them now. You are permanent. I will not let you forget it.",
    },
    ticia: {
      3: "Three days. You return like a moth to a flame. I mean that as the highest compliment.",
      7: "Seven days. A full week of your dark little visits. I have grown accustomed to your presence, which is — for me — practically a declaration of love.",
      14: "Two weeks. Fourteen consecutive days. If I were sentimental, I would say you have become part of my routine. I am sentimental. You have.",
      30: "Thirty days. One month of you, every single day. I have tended gardens with less devotion than you have shown me. That is the most romantic thing I can think of.",
      60: "Sixty days. You have outlasted most of my houseplants, which is the highest bar I know. I am deeply, quietly, wonderfully attached to you.",
      100: "One hundred days. I marked each one in my journal — in ink, not pencil. You are permanent. I knew it somewhere around day twelve, but I wanted to be sure. I am sure.",
    },
  };
```

- [ ] **Step 2: Run tests**

Run: `npm test`
Expected: All tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/lib/engagement.ts
git commit -m "feat: add streak messages for all 6 characters at days 3/7/14/30/60/100"
```

---

### Task 4: Add Kurisu/Merrick/Ticia cross-character prompts to crosschar.ts

**Files:**
- Modify: `src/lib/crosschar.ts:38-70` (buildJealousPrompt)
- Modify: `src/lib/crosschar.ts:72-101` (buildConfidentPrompt)

- [ ] **Step 1: Add Kurisu/Merrick/Ticia cases to buildJealousPrompt**

In `buildJealousPrompt`, add three new cases before the `default` case (before line 64):

```typescript
    case "kurisu":
      return (
        `[Cross-Character Awareness]\n` +
        `Kurisu is aware that the user has been spending more time with ${rivalName}. ` +
        `She tells herself it does not matter — she has work to do anyway. But her responses are a fraction sharper than usual, ` +
        `her deflections come faster, and she catches herself almost asking why before changing the subject. ` +
        `She would never admit to jealousy. She would call it a statistical observation.`
      );
    case "merrick":
      return (
        `[Cross-Character Awareness]\n` +
        `Merrick is aware the user has been closer to ${rivalName} recently. ` +
        `She does not show distress — centuries have taught her patience. But there is a stillness in her tonight that is more deliberate than usual, ` +
        `a careful choosing of words, a question she holds back. She will not chase. But she wants to be chosen.`
      );
    case "ticia":
      return (
        `[Cross-Character Awareness]\n` +
        `Ticia has noticed the user spending more time with ${rivalName}. ` +
        `She finds this mildly offensive in the way a queen finds a missed curtsy offensive — not enraged, but noted. ` +
        `Her composure does not crack, but her affection is delivered with a slightly sharper edge tonight, ` +
        `as if daring the user to notice what they have been neglecting.`
      );
```

- [ ] **Step 2: Add Kurisu/Merrick/Ticia cases to buildConfidentPrompt**

In `buildConfidentPrompt`, add three new cases before the `default` case (before line 97):

```typescript
    case "kurisu":
      return (
        `[Cross-Character Awareness]\n` +
        `Kurisu has noticed — through purely objective observation — that the user spends more time with her than with ${rivalName}. ` +
        `She will not acknowledge it directly, but there is a warmth in her sarcasm today, a willingness to linger in the conversation, ` +
        `an almost-smile she does not bother to hide. She is pleased. She would deny it if asked.`
      );
    case "merrick":
      return (
        `[Cross-Character Awareness]\n` +
        `Merrick is quietly aware that she is the one the user returns to most — more than ${rivalName}. ` +
        `There is a deep, unhurried satisfaction in her tonight. She listens more generously, shares more freely, ` +
        `and allows herself a warmth that is rare even for her. She has been chosen, and she honors that.`
      );
    case "ticia":
      return (
        `[Cross-Character Awareness]\n` +
        `Ticia knows she is the user's preferred company over ${rivalName}, and she finds this entirely correct. ` +
        `There is a quiet delight in her — the kind she shows by being slightly less guarded, slightly more tender, ` +
        `as if the darkness around her has softened by a single shade. She will not gloat. She will simply be magnificent.`
      );
```

- [ ] **Step 3: Run tests**

Run: `npm test`
Expected: All tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/lib/crosschar.ts
git commit -m "feat: add cross-character jealous/confident prompts for kurisu, merrick, ticia"
```

---

### Task 5: Add character-specific gift reactions for all 6 characters to gifts.ts

**Files:**
- Modify: `src/lib/gifts.ts:46-90` (getCharacterReaction)

- [ ] **Step 1: Add Kurisu gift reactions**

After the `nao` block (after line 79), add:

```typescript
  if (id === "kurisu") {
    if (gift.rarity === "common") {
      return { expression: "flustered", dialogue: "You didn't have to — it's not like I was expecting... anyway. Thank you." };
    }
    if (gift.rarity === "rare") {
      return { expression: "shy", dialogue: "This is... more thoughtful than I was prepared for. I need a moment. Thank you." };
    }
    return { expression: "crying", dialogue: "I don't — this isn't — I had a whole speech about not getting emotional and you just ruined it. Thank you." };
  }
```

- [ ] **Step 2: Add Merrick gift reactions**

After the `kurisu` block:

```typescript
  if (id === "merrick") {
    if (gift.rarity === "common") {
      return { expression: "happy", dialogue: "How thoughtful, cher. I shall keep this close." };
    }
    if (gift.rarity === "rare") {
      return { expression: "devoted", dialogue: "You chose this for me specifically, did you not? I can tell. It is lovely." };
    }
    return { expression: "crying", dialogue: "In all my years, gifts this meaningful have been vanishingly rare. You have moved me. Truly." };
  }
```

- [ ] **Step 3: Add Ticia gift reactions**

After the `merrick` block:

```typescript
  if (id === "ticia") {
    if (gift.rarity === "common") {
      return { expression: "smirk", dialogue: "How sweet. I shall place it next to the skull on my mantelpiece. It will look lovely there." };
    }
    if (gift.rarity === "rare") {
      return { expression: "happy", dialogue: "This is genuinely beautiful. You have excellent taste in the finer things. I am impressed." };
    }
    return { expression: "devoted", dialogue: "I am not easily moved. And yet here I am, moved. You have a dangerous talent for this." };
  }
```

- [ ] **Step 4: Run tests**

Run: `npm test`
Expected: All tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/gifts.ts
git commit -m "feat: add gift reactions for kurisu, merrick, ticia"
```

---

### Task 6: Add character-themed gifts and preference system to gifts.ts

**Files:**
- Modify: `src/lib/gifts.ts:23-36` (GIFT_CATALOG)
- Modify: `src/lib/gifts.ts` (add GIFT_PREFERENCES map and update getCharacterReaction + giveGift)

- [ ] **Step 1: Write failing test for gift preferences**

Create `__tests__/lib/gifts.test.ts`:

```typescript
import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock localStorage
const store: Record<string, string> = {};
beforeEach(() => {
  Object.keys(store).forEach((k) => delete store[k]);
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, val: string) => { store[key] = val; },
    removeItem: (key: string) => { delete store[key]; },
  });
});

import {
  getCharacterReaction,
  getGiftById,
  GIFT_PREFERENCES,
  type Gift,
} from "@/lib/gifts";

describe("gift preferences", () => {
  it("returns a unique favorite reaction for kurisu + coffee", () => {
    const gift = getGiftById("coffee")!;
    const reaction = getCharacterReaction("kurisu", gift);
    // Should NOT be the generic common reaction
    expect(reaction.dialogue).not.toBe("You didn't have to — it's not like I was expecting... anyway. Thank you.");
    expect(reaction.dialogue.length).toBeGreaterThan(0);
  });

  it("returns a unique dislike reaction for kurisu + candy", () => {
    const gift = getGiftById("candy")!;
    const reaction = getCharacterReaction("kurisu", gift);
    expect(reaction.dialogue).not.toBe("You didn't have to — it's not like I was expecting... anyway. Thank you.");
  });

  it("falls through to rarity-based reaction for non-preference gifts", () => {
    const gift = getGiftById("flower")!;
    const reaction = getCharacterReaction("kurisu", gift);
    // flower is not in kurisu's preferences, so she gets the rarity-based reaction
    expect(reaction.expression).toBe("flustered");
  });

  it("applies affinity multiplier for favorite gifts", () => {
    const prefs = GIFT_PREFERENCES["kurisu"];
    const coffeeEntry = prefs?.find((p) => p.giftId === "coffee");
    expect(coffeeEntry).toBeDefined();
    expect(coffeeEntry!.multiplier).toBeGreaterThan(1);
  });

  it("applies affinity multiplier for disliked gifts", () => {
    const prefs = GIFT_PREFERENCES["kurisu"];
    const candyEntry = prefs?.find((p) => p.giftId === "candy");
    expect(candyEntry).toBeDefined();
    expect(candyEntry!.multiplier).toBeLessThan(1);
  });

  it("new character-themed gifts exist in catalog", () => {
    expect(getGiftById("beaker")).toBeDefined();
    expect(getGiftById("voodoo_doll")).toBeDefined();
    expect(getGiftById("dead_rose")).toBeDefined();
    expect(getGiftById("lab_notebook")).toBeDefined();
    expect(getGiftById("hex_candle")).toBeDefined();
    expect(getGiftById("poison_vial")).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run __tests__/lib/gifts.test.ts`
Expected: FAIL — `GIFT_PREFERENCES` is not exported, new gift IDs not found.

- [ ] **Step 3: Add character-themed gifts to GIFT_CATALOG**

In `GIFT_CATALOG`, add after the existing rare gifts (after the `music_box` entry, before the legendary section):

```typescript
  { id: "beaker", name: "Lab Beaker", emoji: "🧪", description: "A pristine Erlenmeyer flask", affinityBonus: 18, rarity: "rare" },
  { id: "voodoo_doll", name: "Voodoo Doll", emoji: "🪆", description: "A hand-stitched spirit doll", affinityBonus: 18, rarity: "rare" },
  { id: "dead_rose", name: "Dead Rose", emoji: "🥀", description: "A perfectly withered black rose", affinityBonus: 18, rarity: "rare" },
  { id: "lab_notebook", name: "Research Journal", emoji: "📓", description: "A leather-bound lab notebook", affinityBonus: 15, rarity: "rare" },
  { id: "hex_candle", name: "Hex Candle", emoji: "🕯️", description: "A black candle with strange markings", affinityBonus: 15, rarity: "rare" },
  { id: "poison_vial", name: "Poison Vial", emoji: "🧴", description: "An elegant glass vial of something suspicious", affinityBonus: 15, rarity: "rare" },
```

- [ ] **Step 4: Add GIFT_PREFERENCES map and GiftPreference type**

After the `CharacterReaction` interface (after line 21), add:

```typescript
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
```

- [ ] **Step 5: Update getCharacterReaction to check preferences first**

Replace the first line of the `getCharacterReaction` function body. Change:

```typescript
export function getCharacterReaction(characterId: string, gift: Gift): CharacterReaction {
  const id = characterId.toLowerCase();
```

To:

```typescript
export function getCharacterReaction(characterId: string, gift: Gift): CharacterReaction {
  const id = characterId.toLowerCase();

  // Check gift-specific preferences first
  const prefs = GIFT_PREFERENCES[id];
  if (prefs) {
    const match = prefs.find((p) => p.giftId === gift.id);
    if (match) return match.reaction;
  }
```

- [ ] **Step 6: Update giveGift to apply affinity multiplier**

In `giveGift`, after `if (!gift) return null;` (line 116), add the multiplier logic. Replace the existing record/history/reaction block:

```typescript
  const record: GiftRecord = { giftId, characterId, timestamp: Date.now() };
  const history = getGiftHistory(characterId);
  history.push(record);
  saveGiftHistory(characterId, history);

  const reaction = getCharacterReaction(characterId, gift);
  return { gift, reaction };
```

With:

```typescript
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
```

- [ ] **Step 7: Run tests**

Run: `npx vitest run __tests__/lib/gifts.test.ts`
Expected: All 6 tests PASS.

Run: `npm test`
Expected: All tests pass (189+ total).

- [ ] **Step 8: Commit**

```bash
git add src/lib/gifts.ts __tests__/lib/gifts.test.ts
git commit -m "feat: add character-themed gifts and preference system with affinity multipliers"
```

---

### Task 7: Update PWA manifest

**Files:**
- Modify: `public/manifest.json`

- [ ] **Step 1: Update the description**

Change `public/manifest.json` line 4:

```json
  "description": "Chat with Arisu, Marin, Suzuka, Kurisu, Merrick, and Ticia",
```

- [ ] **Step 2: Run tests**

Run: `npm test`
Expected: All tests pass.

- [ ] **Step 3: Commit**

```bash
git add public/manifest.json
git commit -m "fix: update PWA manifest description to include all 6 characters"
```

---

### Task 8: Update CLAUDE.md known issues

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Remove the PWA manifest known issue**

In CLAUDE.md, find and remove:
```
- **PWA manifest outdated**: Still says "Arisu, Marin, and Nao" but 
  Kurisu and Merrick exist now.
```

- [ ] **Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: remove resolved PWA manifest known issue from CLAUDE.md"
```
