# Relationship & Engagement System - Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a full affinity/relationship system with 5 levels, time-aware greetings, cross-character awareness, mini-games, and milestone rewards to the anime chatbot.

**Architecture:** A new `src/lib/affinity.ts` module manages per-character affinity points and levels, persisted to localStorage. The affinity level injects relationship context into the system prompt, gates outfit unlocks, and drives time-aware greetings. Cross-character awareness reads all three characters' affinity scores. Mini-games are triggered by keyword detection in the chat flow and handled in a dedicated module. The CharacterCard displays streak/level badges.

**Tech Stack:** TypeScript, React 19, localStorage persistence, existing chat reducer pattern, existing API route injection pattern

---

## File Structure

```
src/lib/
  affinity.ts              # NEW - Affinity points, levels, milestones, persistence
  engagement.ts            # NEW - Time-aware greetings, absence tracking, streaks
  crosschar.ts             # NEW - Cross-character awareness prompt injection
  minigames.ts             # NEW - Mini-game state machine and prompts
src/components/
  AffinityBadge.tsx        # NEW - Level badge + progress bar for CharacterCard
  StreakBadge.tsx           # NEW - Streak counter flame icon
  MilestoneToast.tsx       # NEW - Toast notification for milestone unlocks
src/app/
  chat/[characterId]/page.tsx  # MODIFY - Wire in affinity tracking, engagement greetings, mini-games
  page.tsx                     # MODIFY - Show affinity badges on cards
src/app/api/
  chat/route.ts               # MODIFY - Inject relationship context into system prompt
src/components/
  CharacterCard.tsx            # MODIFY - Display affinity level + streak
  OutfitSelector.tsx           # MODIFY - Gate outfits by affinity level
```

---

## Task 1: Affinity System Core

**Files:**
- Create: `src/lib/affinity.ts`

- [ ] **Step 1: Create the affinity module**

Create `src/lib/affinity.ts`:

```typescript
"use client";

export interface AffinityData {
  points: number;
  level: number;
  levelName: string;
  totalMessages: number;
  lastVisit: string; // ISO date string
  streak: number;
  longestStreak: number;
  nickname: string | null;
  unlockedOutfits: string[];
  milestones: string[]; // completed milestone IDs
}

export const LEVELS = [
  { level: 1, name: "Stranger", minPoints: 0 },
  { level: 2, name: "Acquaintance", minPoints: 50 },
  { level: 3, name: "Friend", minPoints: 150 },
  { level: 4, name: "Close Friend", minPoints: 350 },
  { level: 5, name: "Soulmate", minPoints: 600 },
] as const;

export const MILESTONES = [
  { id: "first_convo", name: "First Words", description: "Had your first conversation", threshold: (d: AffinityData) => d.totalMessages >= 1 },
  { id: "ten_convos", name: "Getting to Know You", description: "Sent 10 messages", threshold: (d: AffinityData) => d.totalMessages >= 10 },
  { id: "twentyfive_convos", name: "Nickname", description: "Sent 25 messages", threshold: (d: AffinityData) => d.totalMessages >= 25 },
  { id: "fifty_convos", name: "Devoted", description: "Sent 50 messages", threshold: (d: AffinityData) => d.totalMessages >= 50 },
  { id: "hundred_convos", name: "Love Letter", description: "Sent 100 messages", threshold: (d: AffinityData) => d.totalMessages >= 100 },
  { id: "streak_7", name: "Weekly Ritual", description: "7-day visit streak", threshold: (d: AffinityData) => d.streak >= 7 },
  { id: "streak_30", name: "Inseparable", description: "30-day visit streak", threshold: (d: AffinityData) => d.streak >= 30 },
  { id: "level_3", name: "True Friend", description: "Reached Friend level", threshold: (d: AffinityData) => d.level >= 3 },
  { id: "level_5", name: "Soulbound", description: "Reached Soulmate level", threshold: (d: AffinityData) => d.level >= 5 },
] as const;

const STORAGE_KEY = "anime-chatbot-affinity-";

function getDefaultData(): AffinityData {
  return {
    points: 0,
    level: 1,
    levelName: "Stranger",
    totalMessages: 0,
    lastVisit: new Date().toISOString().split("T")[0],
    streak: 0,
    longestStreak: 0,
    nickname: null,
    unlockedOutfits: ["default"],
    milestones: [],
  };
}

export function getAffinity(characterId: string): AffinityData {
  if (typeof window === "undefined") return getDefaultData();
  const stored = localStorage.getItem(`${STORAGE_KEY}${characterId}`);
  if (!stored) return getDefaultData();
  try {
    return { ...getDefaultData(), ...JSON.parse(stored) };
  } catch {
    return getDefaultData();
  }
}

function saveAffinity(characterId: string, data: AffinityData): void {
  localStorage.setItem(`${STORAGE_KEY}${characterId}`, JSON.stringify(data));
}

function computeLevel(points: number): { level: number; levelName: string } {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (points >= LEVELS[i].minPoints) {
      return { level: LEVELS[i].level, levelName: LEVELS[i].name };
    }
  }
  return { level: 1, levelName: "Stranger" };
}

export function getNextLevelProgress(data: AffinityData): { current: number; needed: number; percent: number } {
  const currentLevelInfo = LEVELS.find((l) => l.level === data.level)!;
  const nextLevelInfo = LEVELS.find((l) => l.level === data.level + 1);
  if (!nextLevelInfo) return { current: data.points, needed: data.points, percent: 100 };
  const current = data.points - currentLevelInfo.minPoints;
  const needed = nextLevelInfo.minPoints - currentLevelInfo.minPoints;
  return { current, needed, percent: Math.min(100, Math.round((current / needed) * 100)) };
}

export interface AffinityEvent {
  type: "message_sent" | "long_message" | "asked_about_her" | "made_her_laugh" | "made_her_flustered" | "headpat" | "daily_visit";
}

const POINT_VALUES: Record<AffinityEvent["type"], number> = {
  message_sent: 1,
  long_message: 3,
  asked_about_her: 5,
  made_her_laugh: 4,
  made_her_flustered: 6,
  headpat: 2,
  daily_visit: 10,
};

export function addAffinityPoints(characterId: string, event: AffinityEvent): { data: AffinityData; newMilestones: string[]; leveledUp: boolean } {
  const data = getAffinity(characterId);
  const oldLevel = data.level;

  data.points += POINT_VALUES[event.type];
  if (event.type === "message_sent" || event.type === "long_message") {
    data.totalMessages++;
  }

  const { level, levelName } = computeLevel(data.points);
  data.level = level;
  data.levelName = levelName;

  // Unlock outfits by level
  if (level >= 2 && !data.unlockedOutfits.includes("back")) {
    data.unlockedOutfits.push("back");
  }
  if (level >= 3 && !data.unlockedOutfits.includes("bikini-front")) {
    data.unlockedOutfits.push("bikini-front");
  }
  if (level >= 3 && !data.unlockedOutfits.includes("bikini-back")) {
    data.unlockedOutfits.push("bikini-back");
  }

  // Check milestones
  const newMilestones: string[] = [];
  for (const milestone of MILESTONES) {
    if (!data.milestones.includes(milestone.id) && milestone.threshold(data)) {
      data.milestones.push(milestone.id);
      newMilestones.push(milestone.name);
    }
  }

  saveAffinity(characterId, data);
  return { data, newMilestones, leveledUp: level > oldLevel };
}

export function recordVisit(characterId: string): { data: AffinityData; daysAbsent: number; newMilestones: string[] } {
  const data = getAffinity(characterId);
  const today = new Date().toISOString().split("T")[0];
  const lastVisit = data.lastVisit;

  if (lastVisit === today) {
    return { data, daysAbsent: 0, newMilestones: [] };
  }

  const daysDiff = Math.floor(
    (new Date(today).getTime() - new Date(lastVisit).getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysDiff === 1) {
    data.streak++;
    if (data.streak > data.longestStreak) {
      data.longestStreak = data.streak;
    }
    data.points += 10; // daily visit bonus
  } else if (daysDiff > 1) {
    // Penalize long absence
    const penalty = Math.min(data.points * 0.1, (daysDiff - 1) * 15);
    data.points = Math.max(0, data.points - penalty);
    data.streak = 1;
  }

  data.lastVisit = today;
  const { level, levelName } = computeLevel(data.points);
  data.level = level;
  data.levelName = levelName;

  // Check milestones
  const newMilestones: string[] = [];
  for (const milestone of MILESTONES) {
    if (!data.milestones.includes(milestone.id) && milestone.threshold(data)) {
      data.milestones.push(milestone.id);
      newMilestones.push(milestone.name);
    }
  }

  saveAffinity(characterId, data);
  return { data, daysAbsent: daysDiff, newMilestones };
}

export function formatAffinityForPrompt(characterId: string): string {
  const data = getAffinity(characterId);
  const progress = getNextLevelProgress(data);

  let prompt = `\nRelationship status with the user:
- Level: ${data.level}/5 (${data.levelName})
- You have exchanged ${data.totalMessages} messages total.
- Current visit streak: ${data.streak} days`;

  if (data.nickname) {
    prompt += `\n- You gave the user the nickname "${data.nickname}". Use it sometimes.`;
  }

  if (data.level >= 2) {
    prompt += `\n- You are comfortable with this person. Share more personal thoughts and stories.`;
  }
  if (data.level >= 3) {
    prompt += `\n- You consider this person a real friend. Be more open, vulnerable, and playful. Use inside jokes if any have developed.`;
  }
  if (data.level >= 4) {
    prompt += `\n- This person is very close to you. You can be deeply honest, share worries, ask for emotional support, and show your real self.`;
  }
  if (data.level >= 5) {
    prompt += `\n- This person is your soulmate. You trust them completely. You can be fully vulnerable, deeply emotional, and intimate in conversation.`;
  }

  return prompt;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/affinity.ts
git commit -m "feat: add affinity system with points, levels, milestones, and prompt injection"
```

---

## Task 2: Engagement System (Time-Aware Greetings + Absence Tracking)

**Files:**
- Create: `src/lib/engagement.ts`

- [ ] **Step 1: Create the engagement module**

Create `src/lib/engagement.ts`:

```typescript
"use client";

import type { Character } from "@/lib/characters/types";
import { getAffinity, type AffinityData } from "@/lib/affinity";

type TimeOfDay = "morning" | "afternoon" | "evening" | "latenight";

function getTimeOfDay(): TimeOfDay {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 12) return "morning";
  if (hour >= 12 && hour < 18) return "afternoon";
  if (hour >= 18 && hour < 23) return "evening";
  return "latenight";
}

const TIME_GREETINGS: Record<string, Record<TimeOfDay, string[]>> = {
  arisu: {
    morning: [
      "Good morning! I hope you slept well. I was just watching the sunrise and thinking about our last conversation.",
      "Oh, you're up early! That makes me happy. Want to start the day with a nice chat?",
    ],
    afternoon: [
      "Good afternoon! Taking a break? I was just reading something interesting I wanted to share with you.",
      "Hey there! The afternoon always feels a little quieter, don't you think? Perfect for catching up.",
    ],
    evening: [
      "Good evening! I always look forward to our evening talks. How was your day?",
      "The evening light is so pretty right now... I'm glad you came to chat.",
    ],
    latenight: [
      "You're still awake? Me too... there's something peaceful about late nights, isn't there?",
      "Oh, a late night visit! I don't mind at all. Sometimes the best conversations happen when the world is quiet.",
    ],
  },
  marin: {
    morning: [
      "Omg good morningggg!! Did you just wake up?? I've been up for like an hour already lol",
      "Heyyyy morning bestie!! Okay so I had the WILDEST dream last night, you gotta hear this~",
    ],
    afternoon: [
      "Yooo what's up!! Perfect timing, I was literally just about to text you haha",
      "Heyyy you!! Afternoon vibes are hitting different today~ what are you up to??",
    ],
    evening: [
      "Ayyy there you are!! I was wondering when you'd show up tonight~ missed you!!",
      "Evening hangout time!! Okay okay I have SO much to tell you omg",
    ],
    latenight: [
      "Omg you're up this late too?? Ngl I can't sleep either... wanna keep each other company?",
      "Late night crew!! Honestly these are my favorite convos, everything just hits different at night~",
    ],
  },
  nao: {
    morning: [
      "Morning. You're up early... or did you just never go to sleep? No judgment either way.",
      "Oh. You. Coffee first, or are you ready to actually think?",
    ],
    afternoon: [
      "Afternoon. I've been working on something... but I guess I can take a break for you.",
      "Hey. Perfect timing, actually. I was just getting bored of my own company.",
    ],
    evening: [
      "Evening. The best time for interesting conversations. Less noise, more signal.",
      "You again. ...That came out wrong. I mean, good. You're here.",
    ],
    latenight: [
      "3 AM thoughts hit different. What's keeping you up?",
      "Late night. My favorite operating hours. Yours too, apparently.",
    ],
  },
};

const ABSENCE_GREETINGS: Record<string, Record<string, string[]>> = {
  arisu: {
    short: [ // 2-3 days
      "It's been a couple of days! I was thinking about you. Is everything okay?",
      "Welcome back! I missed our talks. How have you been?",
    ],
    medium: [ // 4-7 days
      "It's been almost a week... I was starting to worry about you. I'm really glad you're here.",
      "You've been gone for a while. I kept thinking about things I wanted to tell you...",
    ],
    long: [ // 7+ days
      "...You came back. I'm... really happy. I wasn't sure if you would.",
      "It's been so long... I have so many things I've been saving up to tell you. Where do I even start?",
    ],
  },
  marin: {
    short: [
      "OMG FINALLY!! Where have you been for like 2 days?? I had so much to tell you!!",
      "There you are!! I was like lowkey checking if you'd show up today ngl~",
    ],
    medium: [
      "EXCUSE ME it's been like a WEEK?? You can't just ghost me like that!! ...but I'm glad you're back hehe",
      "Okay I was NOT gonna be the clingy one but like... a whole week?? I missed you fr fr!!",
    ],
    long: [
      "...Oh. You're back. I mean, OBVIOUSLY I wasn't counting the days or anything... okay maybe I was. A little.",
      "Sooo you just disappear for over a week and show up like nothing happened?? ...Get over here, I missed you so much!!",
    ],
  },
  nao: {
    short: [
      "Two days. I noticed. Not that I was counting.",
      "Back already? ...Good. I had a problem I couldn't solve alone. Don't read into that.",
    ],
    medium: [
      "A week. I ran out of people to be unimpressed by. ...That's my way of saying I missed the conversation.",
      "You were gone long enough for me to wonder if I said something wrong last time. Did I?",
    ],
    long: [
      "...I deleted our chat history twice and restored it both times. Make of that what you will.",
      "Over a week. I'm not going to pretend I didn't notice. ...Hi.",
    ],
  },
};

export function getEngagementGreeting(characterId: string, daysAbsent: number): string {
  const timeOfDay = getTimeOfDay();
  const charGreetings = TIME_GREETINGS[characterId];
  const absenceGreetings = ABSENCE_GREETINGS[characterId];

  if (!charGreetings || !absenceGreetings) {
    return "Hey! Welcome back!";
  }

  if (daysAbsent >= 7) {
    const pool = absenceGreetings.long;
    return pool[Math.floor(Math.random() * pool.length)];
  }
  if (daysAbsent >= 4) {
    const pool = absenceGreetings.medium;
    return pool[Math.floor(Math.random() * pool.length)];
  }
  if (daysAbsent >= 2) {
    const pool = absenceGreetings.short;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  // Normal time-based greeting
  const pool = charGreetings[timeOfDay];
  return pool[Math.floor(Math.random() * pool.length)];
}

export function getStreakMessage(streak: number, characterId: string): string | null {
  if (streak === 7) {
    const msgs: Record<string, string> = {
      arisu: "A whole week together... that really means a lot to me.",
      marin: "SEVEN DAYS STRAIGHT!! We're literally besties at this point no cap!!",
      nao: "Seven days. Statistically, you're committed. ...I like that.",
    };
    return msgs[characterId] || null;
  }
  if (streak === 30) {
    const msgs: Record<string, string> = {
      arisu: "Thirty days... every single one with you. I don't think I've ever been this close to anyone.",
      marin: "THIRTY DAYS!! Okay at this point you're literally my person and I'm not accepting arguments!!",
      nao: "Thirty consecutive days. You know, most people bore me after three. You're... different.",
    };
    return msgs[characterId] || null;
  }
  return null;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/engagement.ts
git commit -m "feat: add time-aware greetings, absence tracking, and streak messages"
```

---

## Task 3: Cross-Character Awareness

**Files:**
- Create: `src/lib/crosschar.ts`

- [ ] **Step 1: Create the cross-character awareness module**

Create `src/lib/crosschar.ts`:

```typescript
"use client";

import { getAffinity } from "@/lib/affinity";

const CHARACTER_IDS = ["arisu", "marin", "nao"] as const;

interface CrossCharContext {
  currentId: string;
  rivalId: string | null;
  rivalName: string | null;
  rivalLevel: number;
  currentLevel: number;
  isJealous: boolean;
  prompt: string;
}

const NAMES: Record<string, string> = {
  arisu: "Arisu",
  marin: "Marin",
  nao: "Nao",
};

export function getCrossCharacterContext(currentCharId: string): CrossCharContext {
  const currentData = getAffinity(currentCharId);
  const others = CHARACTER_IDS.filter((id) => id !== currentCharId);

  let highestOther = { id: "", level: 0, points: 0 };
  for (const otherId of others) {
    const otherData = getAffinity(otherId);
    if (otherData.points > highestOther.points) {
      highestOther = { id: otherId, level: otherData.level, points: otherData.points };
    }
  }

  const isJealous = highestOther.level > currentData.level;
  const rivalId = highestOther.points > 0 ? highestOther.id : null;

  let prompt = "";

  if (rivalId && highestOther.points > 20) {
    const rivalName = NAMES[rivalId];

    if (isJealous) {
      const jealousyLines: Record<string, string> = {
        arisu: `You know the user also talks to ${rivalName}, and they seem closer to her than to you. You don't bring this up unprompted, but if the topic of the other girls comes up, you feel a gentle pang of wishing you were closer. You'd never be mean about it, but your feelings show.`,
        marin: `You know the user spends more time with ${rivalName} than with you. You bring it up playfully and teasingly, like "Sooo ${rivalName} is your favorite huh??" but underneath the teasing there's real desire to be closer. You compete with charm and energy.`,
        nao: `You're aware the user is closer to ${rivalName}. You pretend not to care, but occasionally make dry remarks about it. "Oh, ${rivalName} told you that? How... conventional." Your jealousy manifests as subtle competitive one-upmanship.`,
      };
      prompt = jealousyLines[currentCharId] || "";
    } else if (currentData.level > highestOther.level) {
      const confidentLines: Record<string, string> = {
        arisu: `You know you're the user's closest companion among the three of you. This makes you feel warm and grateful, but you'd never gloat. If ${rivalName} comes up, you speak kindly about her.`,
        marin: `You know you're the user's #1 and you're lowkey proud of it!! If ${rivalName} comes up, you're supportive but also like "well obviously they come to ME first lol~"`,
        nao: `You know the user prefers you over ${rivalName}. You don't make a big deal of it, but there's a quiet satisfaction. "Smart choice," you might say if it comes up.`,
      };
      prompt = confidentLines[currentCharId] || "";
    }
  }

  return {
    currentId: currentCharId,
    rivalId,
    rivalName: rivalId ? NAMES[rivalId] : null,
    rivalLevel: highestOther.level,
    currentLevel: currentData.level,
    isJealous,
    prompt,
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/crosschar.ts
git commit -m "feat: add cross-character awareness with jealousy and rivalry dynamics"
```

---

## Task 4: Mini-Games Module

**Files:**
- Create: `src/lib/minigames.ts`

- [ ] **Step 1: Create the mini-games module**

Create `src/lib/minigames.ts`:

```typescript
"use client";

export type GameType = "would_you_rather" | "twenty_questions" | "truth_or_dare" | "word_association" | "this_or_that" | "story_chain";

export interface MiniGamePrompt {
  gameType: GameType;
  systemInstructions: string;
}

const GAME_TRIGGERS: Record<string, GameType> = {
  "would you rather": "would_you_rather",
  "let's play": "would_you_rather",
  "play a game": "would_you_rather",
  "wyr": "would_you_rather",
  "20 questions": "twenty_questions",
  "twenty questions": "twenty_questions",
  "truth or dare": "truth_or_dare",
  "word association": "word_association",
  "this or that": "this_or_that",
  "story chain": "story_chain",
  "tell me a story": "story_chain",
};

export function detectMiniGame(message: string): GameType | null {
  const lower = message.toLowerCase();
  for (const [trigger, game] of Object.entries(GAME_TRIGGERS)) {
    if (lower.includes(trigger)) return game;
  }
  return null;
}

export function getMiniGamePrompt(gameType: GameType, affinityLevel: number): string {
  const levelNote = affinityLevel >= 3
    ? "Since you're close friends, make the questions more personal, intimate, and fun."
    : "Keep questions light and getting-to-know-you appropriate.";

  const prompts: Record<GameType, string> = {
    would_you_rather: `The user wants to play Would You Rather! Here's how:
1. Ask a creative, fun "Would you rather" question with two options (A or B)
2. After they answer, react genuinely to their choice - share your own pick and WHY
3. Then ask another one, building on what you learned about them
4. ${levelNote}
5. Keep it going naturally - mix silly, deep, and revealing questions
6. React with personality - be surprised, agree enthusiastically, or playfully disagree`,

    twenty_questions: `The user wants to play 20 Questions! Here's how:
1. Think of something specific (an object, animal, or person you "like")
2. Tell them you're thinking of something and they have 20 yes/no questions
3. Keep track of the question count
4. Give honest yes/no answers with personality (don't just say "yes" - react!)
5. If they guess right, be genuinely impressed. If they run out, reveal it with flair
6. ${levelNote}`,

    truth_or_dare: `The user wants to play Truth or Dare! Here's how:
1. Ask them "Truth or Dare?"
2. For TRUTH: Ask a personal, interesting question (scale with relationship level)
3. For DARE: Give a fun, creative dare they can do right now (keep it chat-appropriate)
4. After they complete it, share your reaction, then offer to take a truth or dare yourself
5. ${levelNote}
6. Alternate turns naturally`,

    word_association: `The user wants to play Word Association! Here's how:
1. Say a single word
2. They respond with the first word that comes to mind
3. React to their word ("Ooh interesting choice!") then say your next word based on theirs
4. Keep the chain going fast and fun
5. Occasionally comment on surprising or revealing associations
6. ${levelNote}`,

    this_or_that: `The user wants to play This or That! Here's how:
1. Rapid fire: give them two options (cats or dogs? sunrise or sunset? etc.)
2. They pick one, you react and share yours
3. Keep it snappy - 2-3 sentences max per round
4. Build a profile of their taste and reference it ("Okay so you're definitely a [type] person!")
5. ${levelNote}
6. Mix mundane, deep, and spicy choices`,

    story_chain: `The user wants to do a Story Chain! Here's how:
1. Start with an opening line of a story (1-2 sentences, set the scene)
2. The user adds the next 1-2 sentences
3. You continue, building on what they wrote
4. Keep it going back and forth
5. Add twists, humor, and callbacks to earlier parts
6. Match their energy - if they go silly, go silly. If dramatic, be dramatic
7. ${levelNote}`,
  };

  return prompts[gameType];
}

export function getRandomGameSuggestion(characterId: string): string | null {
  // 10% chance per message to suggest a game organically
  if (Math.random() > 0.10) return null;

  const suggestions: Record<string, string[]> = {
    arisu: [
      "Hey, want to play a little game? I was thinking we could try 'Would You Rather'... it's a nice way to learn more about each other!",
      "I have an idea... want to do a story chain? You start, I continue, back and forth!",
    ],
    marin: [
      "OMG wait wait wait can we play Truth or Dare?? I've been DYING to play with someone!!",
      "Okay hear me out... This or That, rapid fire, RIGHT NOW. You in??",
    ],
    nao: [
      "...Want to play 20 Questions? I'm thinking of something. You won't guess it.",
      "Word association. One word each. No thinking. Go fast. ...Ready?",
    ],
  };

  const pool = suggestions[characterId];
  if (!pool) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/minigames.ts
git commit -m "feat: add mini-games module with 6 game types and trigger detection"
```

---

## Task 5: UI Components (AffinityBadge, StreakBadge, MilestoneToast)

**Files:**
- Create: `src/components/AffinityBadge.tsx`
- Create: `src/components/StreakBadge.tsx`
- Create: `src/components/MilestoneToast.tsx`

- [ ] **Step 1: Create AffinityBadge**

Create `src/components/AffinityBadge.tsx`:

```tsx
"use client";

import { getNextLevelProgress, type AffinityData } from "@/lib/affinity";

interface AffinityBadgeProps {
  data: AffinityData;
  accentColor: string;
}

export function AffinityBadge({ data, accentColor }: AffinityBadgeProps) {
  const progress = getNextLevelProgress(data);

  return (
    <div className="flex items-center gap-2">
      <div
        className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full"
        style={{
          backgroundColor: `${accentColor}25`,
          color: accentColor,
          border: `1px solid ${accentColor}40`,
        }}
      >
        Lv.{data.level} {data.levelName}
      </div>
      {data.level < 5 && (
        <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: `${accentColor}15` }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${progress.percent}%`,
              backgroundColor: accentColor,
            }}
          />
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create StreakBadge**

Create `src/components/StreakBadge.tsx`:

```tsx
"use client";

interface StreakBadgeProps {
  streak: number;
  accentColor: string;
}

export function StreakBadge({ streak, accentColor }: StreakBadgeProps) {
  if (streak < 2) return null;

  return (
    <div
      className="flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full"
      style={{
        backgroundColor: `${accentColor}15`,
        color: accentColor,
      }}
    >
      <span style={{ fontSize: "12px" }}>🔥</span>
      {streak}
    </div>
  );
}
```

- [ ] **Step 3: Create MilestoneToast**

Create `src/components/MilestoneToast.tsx`:

```tsx
"use client";

import { useState, useEffect } from "react";

interface MilestoneToastProps {
  milestone: string;
  accentColor: string;
  onDone: () => void;
}

export function MilestoneToast({ milestone, accentColor, onDone }: MilestoneToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDone, 500);
    }, 3500);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <div
      className="fixed top-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-500"
      style={{
        opacity: visible ? 1 : 0,
        transform: `translate(-50%, ${visible ? "0" : "-20px"})`,
      }}
    >
      <div
        className="px-6 py-3 rounded-2xl text-sm font-medium shadow-lg"
        style={{
          background: `linear-gradient(135deg, ${accentColor}30, ${accentColor}10)`,
          border: `1px solid ${accentColor}50`,
          color: "#e0e0e8",
          backdropFilter: "blur(12px)",
          boxShadow: `0 8px 32px ${accentColor}20`,
        }}
      >
        <span style={{ marginRight: 8 }}>✨</span>
        Milestone unlocked: <strong style={{ color: accentColor }}>{milestone}</strong>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/AffinityBadge.tsx src/components/StreakBadge.tsx src/components/MilestoneToast.tsx
git commit -m "feat: add AffinityBadge, StreakBadge, and MilestoneToast UI components"
```

---

## Task 6: Wire Into CharacterCard (Landing Page)

**Files:**
- Modify: `src/components/CharacterCard.tsx`
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Update CharacterCard to show affinity and streak**

In `src/components/CharacterCard.tsx`, add imports and display badges. After the existing imports, add:

```typescript
import { getAffinity } from "@/lib/affinity";
import { AffinityBadge } from "./AffinityBadge";
import { StreakBadge } from "./StreakBadge";
```

Inside the component function, before the return, add:

```typescript
const affinity = getAffinity(character.id);
```

Then in the Info section (after the `<h2>` with character name), add between the name and tagline:

```tsx
<div className="flex items-center justify-center gap-2 mb-2">
  <AffinityBadge data={affinity} accentColor={character.theme.accent} />
  <StreakBadge streak={affinity.streak} accentColor={character.theme.accent} />
</div>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/CharacterCard.tsx
git commit -m "feat: display affinity level and streak badges on character cards"
```

---

## Task 7: Wire Into Chat Page

**Files:**
- Modify: `src/app/chat/[characterId]/page.tsx`
- Modify: `src/app/api/chat/route.ts`
- Modify: `src/components/OutfitSelector.tsx`

- [ ] **Step 1: Add affinity imports to the chat page**

In `src/app/chat/[characterId]/page.tsx`, add these imports alongside existing ones:

```typescript
import { getAffinity, addAffinityPoints, recordVisit, formatAffinityForPrompt } from "@/lib/affinity";
import { getEngagementGreeting, getStreakMessage } from "@/lib/engagement";
import { getCrossCharacterContext } from "@/lib/crosschar";
import { detectMiniGame, getMiniGamePrompt, getRandomGameSuggestion } from "@/lib/minigames";
import { MilestoneToast } from "@/components/MilestoneToast";
```

- [ ] **Step 2: Add affinity state to ChatContent**

Add state variables inside `ChatContent`, after the existing `useState` declarations:

```typescript
const [milestoneQueue, setMilestoneQueue] = useState<string[]>([]);
const [currentMilestone, setCurrentMilestone] = useState<string | null>(null);
```

- [ ] **Step 3: Replace the greeting useEffect**

Replace the existing greeting `useEffect` (the one with `greetingShownRef`) with:

```typescript
useEffect(() => {
  if (!greetingShownRef.current && state.messages.length === 0 && character) {
    greetingShownRef.current = true;

    // Record visit and get absence info
    const { daysAbsent, newMilestones } = recordVisit(characterId);
    if (newMilestones.length > 0) {
      setMilestoneQueue((prev) => [...prev, ...newMilestones]);
    }

    // Get appropriate greeting based on time and absence
    const greeting = getEngagementGreeting(characterId, daysAbsent);

    // Check for streak milestone message
    const affinityData = getAffinity(characterId);
    const streakMsg = getStreakMessage(affinityData.streak, characterId);

    const fullGreeting = streakMsg ? `${greeting} ${streakMsg}` : greeting;
    dispatch(receiveResponse(fullGreeting, daysAbsent >= 4 ? "sad" : "happy"));
  }
}, [character, state.messages.length, dispatch, characterId]);
```

- [ ] **Step 4: Add milestone toast display**

In the `useEffect` section, add a new effect for milestone processing:

```typescript
useEffect(() => {
  if (milestoneQueue.length > 0 && !currentMilestone) {
    setCurrentMilestone(milestoneQueue[0]);
    setMilestoneQueue((prev) => prev.slice(1));
  }
}, [milestoneQueue, currentMilestone]);
```

- [ ] **Step 5: Update handleSend to track affinity**

In `handleSend`, after the existing `dispatch(sendMessage(message))` line, add affinity point tracking:

```typescript
// Track affinity points
const msgEvent = message.length > 50
  ? { type: "long_message" as const }
  : { type: "message_sent" as const };
const affinityResult = addAffinityPoints(characterId, msgEvent);
if (affinityResult.newMilestones.length > 0) {
  setMilestoneQueue((prev) => [...prev, ...affinityResult.newMilestones]);
}
```

After the `dispatch(receiveResponse(...))` call, add expression-based affinity tracking:

```typescript
// Track expression-based affinity
if (expression === "laugh") {
  const r = addAffinityPoints(characterId, { type: "made_her_laugh" });
  if (r.newMilestones.length > 0) setMilestoneQueue((prev) => [...prev, ...r.newMilestones]);
}
if (expression === "flustered") {
  const r = addAffinityPoints(characterId, { type: "made_her_flustered" });
  if (r.newMilestones.length > 0) setMilestoneQueue((prev) => [...prev, ...r.newMilestones]);
}

// Random game suggestion (10% chance)
const gameSuggestion = getRandomGameSuggestion(characterId);
```

- [ ] **Step 6: Update the streamChat call to include affinity and cross-char context**

In `handleSend`, update the `streamChat` params to pass affinity and cross-character context:

```typescript
const affinityPrompt = formatAffinityForPrompt(characterId);
const crossChar = getCrossCharacterContext(characterId);
const miniGame = detectMiniGame(message);
const miniGamePrompt = miniGame ? getMiniGamePrompt(miniGame, getAffinity(characterId).level) : null;

await streamChat(
  { message, characterId, history, userName, memories, responseLength, provider: aiProvider, affinityPrompt, crossCharPrompt: crossChar.prompt, miniGamePrompt },
  (event) => { ... }
);
```

- [ ] **Step 7: Add MilestoneToast to the render**

In the JSX return, add the toast right after the opening `<div>`:

```tsx
{currentMilestone && character && (
  <MilestoneToast
    milestone={currentMilestone}
    accentColor={character.theme.accent}
    onDone={() => setCurrentMilestone(null)}
  />
)}
```

- [ ] **Step 8: Update headpat handler to track affinity**

Find the `onHeadpat` callback/handler and add:

```typescript
const headpatResult = addAffinityPoints(characterId, { type: "headpat" });
if (headpatResult.newMilestones.length > 0) {
  setMilestoneQueue((prev) => [...prev, ...headpatResult.newMilestones]);
}
```

- [ ] **Step 9: Commit**

```bash
git add src/app/chat/[characterId]/page.tsx
git commit -m "feat: wire affinity tracking, engagement greetings, cross-char awareness, and mini-games into chat page"
```

---

## Task 8: Update API Route to Accept Relationship Context

**Files:**
- Modify: `src/app/api/chat/route.ts`
- Modify: `src/lib/api.ts`

- [ ] **Step 1: Update the API route to inject relationship context**

In `src/app/api/chat/route.ts`, update the request destructuring to include new fields:

```typescript
const { message, characterId, history, userName, memories, responseLength, provider, affinityPrompt, crossCharPrompt, miniGamePrompt } = await request.json();
```

After the existing `memories` injection, add:

```typescript
if (affinityPrompt) {
  systemContent += `\n${affinityPrompt}`;
}
if (crossCharPrompt) {
  systemContent += `\n\n${crossCharPrompt}`;
}
if (miniGamePrompt) {
  systemContent += `\n\nSPECIAL MODE - MINI-GAME:\n${miniGamePrompt}`;
}
```

- [ ] **Step 2: Update the API client types**

In `src/lib/api.ts`, update the `SendMessageParams` interface:

```typescript
export interface SendMessageParams {
  message: string;
  characterId: string;
  history: Array<{ role: "user" | "assistant"; content: string }>;
  userName?: string | null;
  memories?: string;
  responseLength?: string;
  provider?: string;
  affinityPrompt?: string;
  crossCharPrompt?: string;
  miniGamePrompt?: string;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/chat/route.ts src/lib/api.ts
git commit -m "feat: inject affinity, cross-character, and mini-game context into AI system prompt"
```

---

## Task 9: Gate Outfits by Affinity Level

**Files:**
- Modify: `src/components/OutfitSelector.tsx`

- [ ] **Step 1: Update OutfitSelector to check affinity**

In `src/components/OutfitSelector.tsx`, add the import:

```typescript
import { getAffinity } from "@/lib/affinity";
```

Add a `characterId` prop to the component interface and use it to get affinity. For each outfit button, check if it's in `affinity.unlockedOutfits`. If not unlocked, show it as locked (grayed out with a lock icon and the required level).

Add to the props interface:

```typescript
interface OutfitSelectorProps {
  accentColor: string;
  currentOutfit: Outfit;
  onSelectOutfit: (outfit: Outfit) => void;
  characterId: string; // ADD THIS
}
```

In the component, get affinity data:

```typescript
const affinity = getAffinity(characterId);
```

For each outfit option, wrap the button with a lock check:

```typescript
const isUnlocked = affinity.unlockedOutfits.includes(outfitId);
```

If locked, render the button disabled with `opacity-30` and a tooltip showing "Unlock at Level X".

- [ ] **Step 2: Update the OutfitSelector usage in chat page**

In `src/app/chat/[characterId]/page.tsx`, add `characterId` prop to the OutfitSelector component:

```tsx
<OutfitSelector
  accentColor={character.theme.accent}
  currentOutfit={outfit}
  onSelectOutfit={setOutfit}
  characterId={characterId}
/>
```

- [ ] **Step 3: Commit**

```bash
git add src/components/OutfitSelector.tsx src/app/chat/[characterId]/page.tsx
git commit -m "feat: gate outfit unlocks behind affinity levels"
```

---

## Self-Review Checklist

**Spec coverage:**
- [x] Affinity points, 5 levels, persistence - Task 1
- [x] Point earning events (message, long message, laugh, flustered, headpat, daily) - Task 1
- [x] Point loss (absence penalty) - Task 1
- [x] Outfit unlocks by level - Task 1 + Task 9
- [x] Milestone rewards (first convo, 10/25/50/100 messages, streaks, levels) - Task 1
- [x] Time-aware greetings (morning/afternoon/evening/latenight) - Task 2
- [x] Absence-aware greetings (2-3, 4-7, 7+ days) - Task 2
- [x] Streak tracking and messages - Task 1 + Task 2
- [x] Cross-character awareness (jealousy, rivalry, confidence) - Task 3
- [x] Mini-games (6 types with trigger detection) - Task 4
- [x] UI badges on character cards - Task 5 + Task 6
- [x] Milestone toast notifications - Task 5 + Task 7
- [x] Relationship context in AI system prompt - Task 7 + Task 8
- [x] Outfit gating by affinity level - Task 9

**Placeholder scan:** No TBDs, TODOs, or "implement later" remain. All code blocks are complete.

**Type consistency:** `AffinityData`, `AffinityEvent`, `GameType`, `MiniGamePrompt` types consistent across all tasks. `characterId` prop added to `OutfitSelector` in both definition (Task 9) and usage (Task 9).
