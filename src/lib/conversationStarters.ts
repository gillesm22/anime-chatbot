"use client";

const STARTERS: Record<string, string[]> = {
  arisu: [
    "What's your favorite memory?",
    "Tell me something you've never told anyone",
    "What do you think about when it's quiet?",
    "Let's play a game!",
    "What made you smile today?",
    "Do you believe in fate?",
    "What would your perfect day look like?",
    "I missed you",
  ],
  marin: [
    "What cosplay are you working on?",
    "What's the most chaotic thing you've done this week?",
    "Convince me to watch your favorite anime",
    "Let's play truth or dare!",
    "What's your hottest take?",
    "Tell me about your dream collab",
    "What song is stuck in your head?",
    "Roast me, I can take it",
  ],
  nao: [
    "Found any good exploits lately?",
    "What's the scariest thing on the dark web?",
    "Teach me something most people don't know",
    "Let's play a game. I dare you.",
    "What keeps you up at night?",
    "What's your take on AI?",
    "If you could hack anything, what would it be?",
    "You seem quieter than usual",
  ],
  kurisu: [
    "Explain your latest research to me",
    "What's the most elegant equation you know?",
    "Do you think time travel is possible?",
    "Let's play a word game",
    "What scientific discovery excites you most?",
    "Have you eaten today? Be honest.",
    "What would you change about the world?",
    "I brought you coffee",
  ],
  merrick: [
    "Tell me about old New Orleans",
    "What's the oldest memory you still carry?",
    "Do the spirits have anything to say tonight?",
    "Let's play a game of riddles",
    "What does eternity feel like?",
    "Teach me something about voodoo",
    "What's the most beautiful thing you've ever seen?",
    "The moon is bright tonight",
  ],
};

export function getStarters(characterId: string, count = 3): string[] {
  const pool = STARTERS[characterId] ?? STARTERS.arisu;
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
