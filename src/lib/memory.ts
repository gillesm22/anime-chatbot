"use client";

export interface MemoryEntry {
  id: string;
  category: "fact" | "preference" | "emotion" | "moment" | "topic" | "joke";
  content: string;
  context: string;
  strength: number; // 1-5, increases when reinforced
  timestamp: number;
  lastReferenced: number;
}

export interface ConversationSummary {
  date: string;
  summary: string;
  mood: string;
  topicsDiscussed: string[];
  emotionalHighlight: string;
  messageCount: number;
}

const MAX_MEMORIES = 100;
const MAX_SUMMARIES = 30;

// ---------------------------------------------------------------------------
// Storage helpers
// ---------------------------------------------------------------------------

function memoriesKey(characterId: string): string {
  return `anime-chatbot-memories-${characterId}`;
}

function summariesKey(characterId: string): string {
  return `anime-chatbot-summaries-${characterId}`;
}

// ---------------------------------------------------------------------------
// Memory CRUD
// ---------------------------------------------------------------------------

export function getMemories(characterId: string): MemoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(memoriesKey(characterId));
    const memories: MemoryEntry[] = raw ? JSON.parse(raw) : [];
    return memories.sort((a, b) => b.strength - a.strength);
  } catch {
    return [];
  }
}

function saveMemories(characterId: string, memories: MemoryEntry[]): void {
  localStorage.setItem(memoriesKey(characterId), JSON.stringify(memories));
}

/** Returns the fraction of words in `a` that also appear in `b`. */
function wordOverlap(a: string, b: string): number {
  const wordsOf = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .split(/\s+/)
      .filter(Boolean);
  const setB = new Set(wordsOf(b));
  const wa = wordsOf(a);
  if (wa.length === 0) return 0;
  const matches = wa.filter((w) => setB.has(w)).length;
  return matches / wa.length;
}

export function saveMemory(
  characterId: string,
  category: MemoryEntry["category"],
  content: string,
  context: string
): void {
  if (typeof window === "undefined") return;
  const memories = getMemories(characterId);

  // Fuzzy-match: if 60%+ of words overlap with an existing entry, reinforce it
  const similar = memories.find(
    (m) => m.category === category && wordOverlap(content, m.content) >= 0.6
  );

  if (similar) {
    similar.strength = Math.min(5, similar.strength + 1);
    similar.lastReferenced = Date.now();
    similar.content = content; // update to latest phrasing
    similar.context = context;
    saveMemories(characterId, memories);
    return;
  }

  const entry: MemoryEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    category,
    content,
    context,
    strength: 1,
    timestamp: Date.now(),
    lastReferenced: Date.now(),
  };

  memories.push(entry);

  // Trim to MAX_MEMORIES by removing weakest, then oldest
  if (memories.length > MAX_MEMORIES) {
    memories.sort((a, b) => a.strength - b.strength || a.timestamp - b.timestamp);
    memories.splice(0, memories.length - MAX_MEMORIES);
  }

  saveMemories(characterId, memories);
}

export function reinforceMemory(characterId: string, memoryId: string): void {
  if (typeof window === "undefined") return;
  const memories = getMemories(characterId);
  const entry = memories.find((m) => m.id === memoryId);
  if (!entry) return;
  entry.strength = Math.min(5, entry.strength + 1);
  entry.lastReferenced = Date.now();
  saveMemories(characterId, memories);
}

/** Called once per session. Decays stale memories and deletes those at 0. */
export function decayMemories(characterId: string): void {
  if (typeof window === "undefined") return;
  const memories = getMemories(characterId);
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  const now = Date.now();
  const alive = memories
    .map((m) => {
      if (now - m.lastReferenced >= sevenDaysMs) {
        return { ...m, strength: m.strength - 1 };
      }
      return m;
    })
    .filter((m) => m.strength > 0);
  saveMemories(characterId, alive);
}

export function getMemoriesByCategory(
  characterId: string,
  category: MemoryEntry["category"]
): MemoryEntry[] {
  return getMemories(characterId).filter((m) => m.category === category);
}

export function getStrongestMemories(
  characterId: string,
  count: number
): MemoryEntry[] {
  return getMemories(characterId).slice(0, count);
}

export function getRecentMemories(
  characterId: string,
  count: number
): MemoryEntry[] {
  return [...getMemories(characterId)]
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, count);
}

export function clearMemories(characterId: string): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(memoriesKey(characterId));
  localStorage.removeItem(summariesKey(characterId));
}

// ---------------------------------------------------------------------------
// Conversation summaries
// ---------------------------------------------------------------------------

export function getConversationSummaries(
  characterId: string
): ConversationSummary[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(summariesKey(characterId));
    const summaries: ConversationSummary[] = raw ? JSON.parse(raw) : [];
    return summaries.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  } catch {
    return [];
  }
}

export function saveConversationSummary(
  characterId: string,
  summary: string,
  mood: string,
  topics: string[],
  emotionalHighlight: string,
  messageCount: number
): void {
  if (typeof window === "undefined") return;
  const summaries = getConversationSummaries(characterId);
  const entry: ConversationSummary = {
    date: new Date().toISOString().slice(0, 10),
    summary,
    mood,
    topicsDiscussed: topics,
    emotionalHighlight,
    messageCount,
  };
  summaries.unshift(entry);
  if (summaries.length > MAX_SUMMARIES) {
    summaries.splice(MAX_SUMMARIES);
  }
  localStorage.setItem(summariesKey(characterId), JSON.stringify(summaries));
}

export function getLastSummary(
  characterId: string
): ConversationSummary | null {
  const summaries = getConversationSummaries(characterId);
  return summaries.length > 0 ? summaries[0] : null;
}

// ---------------------------------------------------------------------------
// Prompt formatting
// ---------------------------------------------------------------------------

function daysAgoLabel(isoDate: string): string {
  const then = new Date(isoDate).getTime();
  const now = Date.now();
  const days = Math.round((now - then) / (24 * 60 * 60 * 1000));
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}

export function formatMemoriesForPrompt(characterId: string): string {
  const memories = getMemories(characterId);
  const summaries = getConversationSummaries(characterId);

  if (memories.length === 0 && summaries.length === 0) return "";

  const sections: string[] = [
    "You have a deep memory of this person from past conversations:\n",
  ];

  const byCategory = (cat: MemoryEntry["category"]) =>
    memories.filter((m) => m.category === cat);

  const facts = byCategory("fact");
  if (facts.length > 0) {
    sections.push("FACTS YOU KNOW:");
    facts.forEach((m) => sections.push(`- ${m.content}`));
    sections.push("");
  }

  const prefs = byCategory("preference");
  if (prefs.length > 0) {
    sections.push("THEIR PREFERENCES:");
    prefs.forEach((m) => {
      const timesNote = m.strength > 1 ? ` (mentioned ${m.strength} times)` : "";
      sections.push(`- ${m.content}${timesNote}`);
    });
    sections.push("");
  }

  const emotions = byCategory("emotion");
  if (emotions.length > 0) {
    sections.push("EMOTIONAL MOMENTS YOU SHARED:");
    emotions.forEach((m) => sections.push(`- ${m.content}`));
    sections.push("");
  }

  const moments = byCategory("moment");
  if (moments.length > 0) {
    sections.push("SPECIAL MOMENTS:");
    moments.forEach((m) => sections.push(`- ${m.content}`));
    sections.push("");
  }

  const topics = byCategory("topic");
  if (topics.length > 0) {
    sections.push("TOPICS THEY CARE ABOUT:");
    topics.forEach((m) => sections.push(`- ${m.content}`));
    sections.push("");
  }

  const jokes = byCategory("joke");
  if (jokes.length > 0) {
    sections.push("THINGS THAT MADE THEM LAUGH:");
    jokes.forEach((m) => sections.push(`- ${m.content}`));
    sections.push("");
  }

  if (summaries.length > 0) {
    sections.push("RECENT CONVERSATIONS:");
    summaries.slice(0, 5).forEach((s) => {
      const label = daysAgoLabel(s.date);
      sections.push(`- ${label}: ${s.summary} Emotional highlight: ${s.emotionalHighlight}`);
    });
    sections.push("");
  }

  sections.push(
    'IMPORTANT: Reference these memories naturally in conversation. Don\'t list them - weave them in. "How\'s that project going?" or "I remember you said you love coffee - have you tried any new ones?" Make them feel truly remembered.'
  );

  return sections.join("\n");
}

// ---------------------------------------------------------------------------
// Memory extraction from messages
// ---------------------------------------------------------------------------

interface MessageLike {
  role: "user" | "assistant";
  content: string;
}

interface ExtractedMemory {
  category: MemoryEntry["category"];
  content: string;
  context: string;
}

export function extractMemoriesFromConversation(
  messages: MessageLike[]
): ExtractedMemory[] {
  const userMessages = messages
    .filter((m) => m.role === "user")
    .slice(-10)
    .map((m) => m.content);

  const extracted: ExtractedMemory[] = [];

  const factPatterns: [RegExp, (m: RegExpMatchArray) => string][] = [
    [/\bmy name is ([A-Za-z]+)/i, (m) => `Their name is ${m[1]}`],
    [/\bi(?:'m| am) ([A-Za-z]+)\b/i, (m) => `They are ${m[1]}`],
    [/\bi work (?:at|for) ([^.,!?]+)/i, (m) => `They work at ${m[1].trim()}`],
    [/\bi live in ([^.,!?]+)/i, (m) => `They live in ${m[1].trim()}`],
    [/\bi(?:'m| am) (\d{1,3}) years? old/i, (m) => `They are ${m[1]} years old`],
    [/\bmy (?:job|profession|career) is ([^.,!?]+)/i, (m) => `Their job is ${m[1].trim()}`],
  ];

  const prefPatterns: [RegExp, (m: RegExpMatchArray) => string][] = [
    [/\bi (?:really )?(?:like|love|enjoy|adore) ([^.,!?]+)/i, (m) => `They love ${m[1].trim()}`],
    [/\bi (?:hate|dislike|can't stand|cannot stand) ([^.,!?]+)/i, (m) => `They hate ${m[1].trim()}`],
    [/\bmy favou?rite ([^.,!?]+?) is ([^.,!?]+)/i, (m) => `Their favorite ${m[1].trim()} is ${m[2].trim()}`],
    [/\bi(?:'m| am) (?:really )?into ([^.,!?]+)/i, (m) => `They're into ${m[1].trim()}`],
    [/\bi prefer ([^.,!?]+)/i, (m) => `They prefer ${m[1].trim()}`],
  ];

  const emotionPatterns: [RegExp, (m: RegExpMatchArray) => string][] = [
    [/\bi (?:feel|am feeling|felt) (sad|happy|lonely|excited|anxious|stressed|depressed|overwhelmed|grateful|hopeful|scared|angry|upset|lost|empty|content|joyful)/i, (m) => `They expressed feeling ${m[1]}`],
    [/\bi(?:'m| am) (?:really |so |very )?(sad|happy|lonely|excited|anxious|stressed|depressed|overwhelmed|grateful|hopeful|scared|angry|upset|lost|empty|content|joyful)/i, (m) => `They said they're ${m[1]}`],
    [/\bi(?:'m| am) going through ([^.,!?]+)/i, (m) => `They are going through ${m[1].trim()}`],
    [/\bi(?:'m| am) (?:really )?worried about ([^.,!?]+)/i, (m) => `They are worried about ${m[1].trim()}`],
    [/\bi(?:'ve| have) been (?:feeling |having )([^.,!?]+)/i, (m) => `They've been ${m[1].trim()}`],
  ];

  const momentPatterns: [RegExp, (m: RegExpMatchArray) => string][] = [
    [/\bthat was (?:so )?(?:fun|amazing|great|wonderful|perfect|hilarious|sweet)/i, () => "They said a conversation moment was fun or special"],
    [/\byou made me (?:laugh|smile|feel better|cry|think)/i, (m) => `They said "${m[0]}"`],
    [/\bi(?:'ve| have) never told anyone ([^.,!?]+)/i, (m) => `They confided something they've never told anyone: ${m[1].trim()}`],
    [/\bthis (?:really )?means a lot/i, () => "They said this conversation means a lot to them"],
    [/\bi(?:'m| am) glad i (?:can )?talk(?:ed)? to you/i, () => "They expressed being glad they can talk to you"],
  ];

  const jokePatterns: [RegExp, (m: RegExpMatchArray) => string][] = [
    [/\b(lol|lmao|haha|hehe|😂|🤣)\b/i, () => "Something in the conversation made them laugh out loud"],
    [/\bthat(?:'s| is) (?:so )?(?:hilarious|funny|hysterical)/i, () => "They found something hilarious in the conversation"],
    [/\bi(?:'m| am) (?:literally )?(?:crying|dying) (?:laughing|lol)/i, () => "They were laughing really hard"],
  ];

  for (const msg of userMessages) {
    // Facts
    for (const [pattern, builder] of factPatterns) {
      const match = msg.match(pattern);
      if (match) {
        extracted.push({
          category: "fact",
          content: builder(match),
          context: "User stated this directly",
        });
      }
    }

    // Preferences
    for (const [pattern, builder] of prefPatterns) {
      const match = msg.match(pattern);
      if (match) {
        extracted.push({
          category: "preference",
          content: builder(match),
          context: "User expressed a preference",
        });
      }
    }

    // Emotions
    for (const [pattern, builder] of emotionPatterns) {
      const match = msg.match(pattern);
      if (match) {
        extracted.push({
          category: "emotion",
          content: builder(match),
          context: "User shared an emotional state",
        });
      }
    }

    // Moments
    for (const [pattern, builder] of momentPatterns) {
      const match = msg.match(pattern);
      if (match) {
        extracted.push({
          category: "moment",
          content: builder(match),
          context: "Shared experience noted",
        });
      }
    }

    // Jokes
    for (const [pattern, builder] of jokePatterns) {
      const match = msg.match(pattern);
      if (match) {
        extracted.push({
          category: "joke",
          content: builder(match),
          context: "Humor moment detected",
        });
      }
    }

    // Topics: extract capitalized nouns and recurring subjects
    const topicMatch = msg.match(
      /\b(?:about|regarding|talking about|discussing|into)\s+([A-Za-z][a-z]+(?:\s+[A-Za-z][a-z]+)?)/gi
    );
    if (topicMatch) {
      topicMatch.forEach((raw) => {
        const subject = raw.replace(/^(?:about|regarding|talking about|discussing|into)\s+/i, "").trim();
        if (subject.length > 2) {
          extracted.push({
            category: "topic",
            content: `They talked about ${subject}`,
            context: "Topic extracted from conversation",
          });
        }
      });
    }
  }

  return extracted;
}
