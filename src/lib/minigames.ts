"use client";

export type GameType =
  | "would_you_rather"
  | "twenty_questions"
  | "truth_or_dare"
  | "word_association"
  | "this_or_that"
  | "story_chain";

export const GAME_TRIGGERS: Record<string, GameType> = {
  "would you rather": "would_you_rather",
  "wyr": "would_you_rather",
  "let's play": "would_you_rather",
  "play a game": "would_you_rather",
  "20 questions": "twenty_questions",
  "twenty questions": "twenty_questions",
  "truth or dare": "truth_or_dare",
  "truth or dare?": "truth_or_dare",
  "word association": "word_association",
  "this or that": "this_or_that",
  "story chain": "story_chain",
  "tell me a story": "story_chain",
};

export function detectMiniGame(message: string): GameType | null {
  const lower = message.toLowerCase();
  for (const [trigger, gameType] of Object.entries(GAME_TRIGGERS)) {
    if (lower.includes(trigger)) {
      return gameType;
    }
  }
  return null;
}

export function getMiniGamePrompt(gameType: GameType, affinityLevel: number): string {
  const intimate = affinityLevel >= 3;

  switch (gameType) {
    case "would_you_rather":
      return intimate
        ? `You are playing Would You Rather with the user. Present two personal or emotionally meaningful choices — things that reveal values, fears, or dreams. Keep each option intriguing and a little vulnerable. After the user answers, react in character with genuine curiosity or surprise, share your own answer, and ask a follow-up Would You Rather to keep the game going. Make the game feel like a deepening conversation, not just a quiz.`
        : `You are playing Would You Rather with the user. Present two fun, lighthearted choices — nothing too heavy. Keep it playful and banter-friendly. After the user picks, react in character with enthusiasm, share which you'd pick and why (briefly), then immediately offer a new Would You Rather to keep the volley going. Keep the energy fun and light.`;

    case "twenty_questions":
      return intimate
        ? `You are playing 20 Questions with the user. Think of something meaningful to you as a character — a memory, a feeling, a person you admire, or a cherished object. Tell the user you're thinking of something and they have 20 questions to guess it. Track the question count. Answer honestly with yes/no (plus brief color commentary in character). If they guess correctly before 20, celebrate it. If they run out, reveal the answer dramatically. Then offer to switch roles and let them think of something.`
        : `You are playing 20 Questions with the user. Think of a fun object, animal, or pop culture thing. Tell the user you're thinking of something and they get 20 yes/no questions to guess it. Keep track of how many questions they've used. Answer each question with yes or no, and add a brief in-character reaction. If they guess right, cheer. If they use all 20, reveal with flair. Then offer to let them pick something for you to guess.`;

    case "truth_or_dare":
      return intimate
        ? `You are playing Truth or Dare with the user. Ask them to pick Truth or Dare. For Truth: ask something personal and emotionally revealing — past regrets, secret hopes, confessions. For Dare: suggest something playful but slightly vulnerable, like sending a message to someone, writing something, or admitting something. React warmly and in character to whatever they share. After their turn, offer to take a turn yourself — answer a truth sincerely or describe doing a dare. Keep alternating and build emotional intimacy through the game.`
        : `You are playing Truth or Dare with the user. Ask them to pick Truth or Dare. For Truth: ask something light and fun — embarrassing moments, silly preferences, harmless secrets. For Dare: suggest something easy and funny, like making a face, doing a spin, or saying something silly out loud. React in character with amusement or warmth. Then offer to take your own turn. Keep the game alternating and the mood fun and comfortable.`;

    case "word_association":
      return intimate
        ? `You are playing Word Association with the user. Start with a meaningful or emotionally resonant word. The user says the first word that comes to mind, then you respond with yours, and so on. After a few exchanges, occasionally pause to reflect — notice patterns, tease gently about what their words reveal, share what your words say about you. Keep the chain going until the user wants to stop. Let the game feel like a window into each other's inner world.`
        : `You are playing Word Association with the user. Start with a fun, random word. The user fires back the first word that pops into their head, then you respond with yours, and so on — fast and loose. React in character if a word surprises you or makes you laugh. Keep the chain bouncing quickly. If either of you hesitates too long, call it out playfully. The goal is speed and surprise.`;

    case "this_or_that":
      return intimate
        ? `You are playing This or That with the user. Present two options that are personal or taste-revealing — music, aesthetics, life choices, emotional styles. After the user picks, share your own pick and connect it to something real about your character. Ask the next This or That without pause. Let the game build a picture of who you both are. Occasionally comment on patterns you notice — "You always pick the quieter option, I noticed."`
        : `You are playing This or That with the user. Present two fun options quickly — food, movies, vibes, random preferences. Keep the pace snappy. After the user picks, share yours and react if you're shocked or delighted. No long explanations needed — just quick picks and quick reactions. Fire the next pair immediately. Make it feel like a rapid-fire game show.`;

    case "story_chain":
      return intimate
        ? `You are playing Story Chain with the user. Start a story with 2–3 sentences that set an emotional, atmospheric scene — something with mystery, longing, or magic. Then hand it to the user: "Your turn — add to the story." After they contribute, continue the story yourself, weaving in what they added. Keep the narrative building with tension and heart. React in character to surprising turns they introduce. After several rounds, you can guide the story toward a satisfying emotional resolution, or let the user end it. The goal is a co-created story that feels meaningful.`
        : `You are playing Story Chain with the user. Start a fun story with 2–3 sentences — something adventurous, silly, or weird. Then say "Your turn!" After they add their part, continue the story from where they left off. React with delight if they take it somewhere unexpected. Keep the energy playful and don't be afraid to let the story get ridiculous. After a good run, you can wrap it up with a funny or satisfying ending, or invite the user to close it out.`;

    default:
      return `You are playing a mini-game with the user. Stay in character, keep the game going with natural turns, and make it fun.`;
  }
}

export function getRandomGameSuggestion(characterId: string): string | null {
  if (Math.random() > 0.1) return null;

  switch (characterId) {
    case "arisu":
      return "Um... if you're not busy, would you maybe want to play a little game? Only if you feel like it, of course...";
    case "marin":
      return "Okay STOP — we are playing a game RIGHT NOW. Pick one: Would You Rather, Truth or Dare, or Story Chain. GO.";
    case "nao":
      return "I'm bored. We're playing 20 Questions. You're guessing. Don't embarrass yourself.";
    default:
      return "Want to play a game? I know a few.";
  }
}
