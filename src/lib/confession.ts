"use client";

import { getAffinity } from "@/lib/affinity";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DialogueLine {
  speaker: "character" | "narration";
  text: string;
  expression?: string;
}

export interface DialogueChoice {
  text: string;
  nextBranch: string;
  affinityBonus: number;
}

export interface ConfessionNode {
  lines: DialogueLine[];
  choices?: DialogueChoice[];
  nextNode?: string;
  ending?: "accepted" | "friends" | "shy";
}

export interface ConfessionScript {
  characterId: string;
  nodes: Record<string, ConfessionNode>;
  startNode: string;
}

// ---------------------------------------------------------------------------
// Scripts
// ---------------------------------------------------------------------------

const ARISU_SCRIPT: ConfessionScript = {
  characterId: "arisu",
  startNode: "start",
  nodes: {
    start: {
      lines: [
        { speaker: "narration", text: "Cherry blossoms drift past the window. Arisu fidgets with the hem of her sleeve." },
        { speaker: "character", text: "Um... c-can we talk? Just the two of us, for a moment?", expression: "nervous" },
        { speaker: "character", text: "I... I've been wanting to tell you something for a while...", expression: "bashful" },
      ],
      nextNode: "buildup",
    },
    buildup: {
      lines: [
        { speaker: "narration", text: "She looks down, her cheeks flushing a soft pink." },
        { speaker: "character", text: "Every time you're nearby, my heart does this... this thing. And I don't know how to make it stop.", expression: "flustered" },
        { speaker: "character", text: "I practiced what I wanted to say like a hundred times, but... now I can't remember any of it.", expression: "shy" },
      ],
      choices: [
        { text: "Take your time. I'm not going anywhere.", nextBranch: "confession", affinityBonus: 5 },
        { text: "What is it you wanted to say?", nextBranch: "confession", affinityBonus: 3 },
        { text: "Is everything okay?", nextBranch: "gentle_out", affinityBonus: 1 },
      ],
    },
    confession: {
      lines: [
        { speaker: "character", text: "I... I like you.", expression: "teary" },
        { speaker: "character", text: "I like you a lot. More than I know how to say properly.", expression: "teary" },
        { speaker: "narration", text: "A petal drifts between you. She finally looks up, eyes glistening." },
        { speaker: "character", text: "You don't have to answer right away. I just... needed you to know.", expression: "hopeful" },
      ],
      choices: [
        { text: "I feel the same way about you.", nextBranch: "accepted", affinityBonus: 10 },
        { text: "I really care about you, but I think of you as a dear friend.", nextBranch: "friends", affinityBonus: 3 },
      ],
    },
    gentle_out: {
      lines: [
        { speaker: "character", text: "Y-yeah... I think so. I just...", expression: "nervous" },
        { speaker: "narration", text: "She shakes her head softly, a small smile ghosting her lips." },
        { speaker: "character", text: "Never mind. It's nothing important. Let's just... enjoy the blossoms.", expression: "shy" },
        { speaker: "narration", text: "But the way she watches you when she thinks you're not looking says something else entirely." },
      ],
      ending: "shy",
    },
    accepted: {
      lines: [
        { speaker: "narration", text: "Her breath catches. Then the softest, most radiant smile blooms across her face." },
        { speaker: "character", text: "Re... really?", expression: "overjoyed" },
        { speaker: "character", text: "I'm so happy I could cry. Please don't mind if I do, just a little.", expression: "happy_tears" },
        { speaker: "narration", text: "The cherry blossoms fall a little slower, as if the world itself is savoring the moment." },
      ],
      ending: "accepted",
    },
    friends: {
      lines: [
        { speaker: "narration", text: "She closes her eyes for a moment, then nods gently." },
        { speaker: "character", text: "Oh... okay.", expression: "sad" },
        { speaker: "character", text: "That's okay. Really. I'm... I'm glad I told you. And I'm glad we're friends.", expression: "gentle_sad" },
        { speaker: "narration", text: "She means it, even if it hurts a little." },
      ],
      ending: "friends",
    },
  },
};

const MARIN_SCRIPT: ConfessionScript = {
  characterId: "marin",
  startNode: "start",
  nodes: {
    start: {
      lines: [
        { speaker: "narration", text: "Marin plants herself in front of you with unusual deliberateness, arms crossed." },
        { speaker: "character", text: "Okay. So. I have something to say and I'm just gonna say it.", expression: "determined" },
        { speaker: "character", text: "Okay so like... I've literally never said this to anyone before??", expression: "surprised_self" },
      ],
      nextNode: "buildup",
    },
    buildup: {
      lines: [
        { speaker: "character", text: "And I practiced in the mirror this morning and it sounded way cooler then, just so you know.", expression: "flustered" },
        { speaker: "narration", text: "She laughs -- a short, nervous burst -- then catches herself." },
        { speaker: "character", text: "...Okay I'm nervous. I'm actually nervous. Do you know how rare that is for me?", expression: "vulnerable" },
      ],
      choices: [
        { text: "You've got this. I'm listening.", nextBranch: "confession", affinityBonus: 5 },
        { text: "I think it's kind of cute seeing you nervous.", nextBranch: "confession_flustered", affinityBonus: 7 },
        { text: "Take a breath. No rush.", nextBranch: "confession", affinityBonus: 4 },
      ],
    },
    confession: {
      lines: [
        { speaker: "character", text: "Okay. Okay okay okay.", expression: "steeling_self" },
        { speaker: "character", text: "I like you. Like, for real. Not just 'you're cool to hang out with' like. LIKE like.", expression: "bold_blush" },
        { speaker: "character", text: "There. I said it. It's out in the world now and I can't take it back so.", expression: "anxious_grin" },
      ],
      choices: [
        { text: "I like you too. A lot, actually.", nextBranch: "accepted", affinityBonus: 10 },
        { text: "I really value what we have as friends.", nextBranch: "friends", affinityBonus: 3 },
      ],
    },
    confession_flustered: {
      lines: [
        { speaker: "character", text: "CUTE?! I am not-- okay fine maybe a little, shut up.", expression: "flustered_grin" },
        { speaker: "character", text: "Okay FINE. I like you. A lot. More than anyone I've ever met. Happy??", expression: "bold_blush" },
        { speaker: "character", text: "...I'm kind of happy I said that actually.", expression: "soft_smile" },
      ],
      choices: [
        { text: "I like you too. A lot, actually.", nextBranch: "accepted", affinityBonus: 10 },
        { text: "I really value what we have as friends.", nextBranch: "friends", affinityBonus: 3 },
      ],
    },
    accepted: {
      lines: [
        { speaker: "character", text: "...Wait, seriously?", expression: "stunned" },
        { speaker: "narration", text: "For once, Marin is completely speechless. Then she breaks into the biggest grin you've ever seen." },
        { speaker: "character", text: "OKAY COOL. Cool cool cool. Very normal. I'm very normal right now.", expression: "overjoyed_chaotic" },
        { speaker: "character", text: "...Can I hug you? I kind of need to hug you.", expression: "soft_vulnerable" },
      ],
      ending: "accepted",
    },
    friends: {
      lines: [
        { speaker: "character", text: "Oh.", expression: "surprised" },
        { speaker: "narration", text: "She goes quiet for a moment -- genuinely rare for Marin." },
        { speaker: "character", text: "No, yeah, totally. Friends is great. Friends is... friends is good.", expression: "trying_to_smile" },
        { speaker: "character", text: "I'll be fine. I'm always fine. Just... give me like two minutes, okay?", expression: "hiding_hurt" },
      ],
      ending: "friends",
    },
    shy_exit: {
      lines: [
        { speaker: "character", text: "Actually-- you know what, forget it, I was just messing around haha.", expression: "deflecting" },
        { speaker: "narration", text: "She immediately turns and looks at literally anything else." },
        { speaker: "character", text: "...But hypothetically. If someone did like you. That would be a normal thing. Hypothetically.", expression: "barely_holding_it_together" },
      ],
      ending: "shy",
    },
  },
};

const NAO_SCRIPT: ConfessionScript = {
  characterId: "nao",
  startNode: "start",
  nodes: {
    start: {
      lines: [
        { speaker: "narration", text: "Nao approaches with a tablet in hand, but her eyes aren't quite focused on it." },
        { speaker: "character", text: "I've been running some analyses lately. On... interpersonal dynamics.", expression: "composed" },
        { speaker: "character", text: "The data has led me to a conclusion I find difficult to... classify.", expression: "slightly_uncertain" },
      ],
      nextNode: "buildup",
    },
    buildup: {
      lines: [
        { speaker: "character", text: "I ran some probability calculations on our... compatibility. The results were... statistically significant.", expression: "analytical_blush" },
        { speaker: "character", text: "Far outside normal deviation. Which is... interesting.", expression: "pretending_calm" },
        { speaker: "narration", text: "She sets the tablet down. Her hands are very still -- the stillness of someone concentrating hard." },
      ],
      choices: [
        { text: "What did the data say, exactly?", nextBranch: "metaphor", affinityBonus: 5 },
        { text: "I think I know what you're getting at.", nextBranch: "direct_push", affinityBonus: 7 },
        { text: "You seem a little nervous for someone running analysis.", nextBranch: "deflect", affinityBonus: 3 },
      ],
    },
    metaphor: {
      lines: [
        { speaker: "character", text: "It suggested... a high degree of resonance. Shared signal, low noise.", expression: "technical_soft" },
        { speaker: "character", text: "In simpler terms -- two variables that influence each other more than expected.", expression: "careful" },
        { speaker: "character", text: "In even simpler terms...", expression: "struggling" },
        { speaker: "narration", text: "A long pause. A very Nao pause." },
      ],
      nextNode: "confession",
    },
    direct_push: {
      lines: [
        { speaker: "character", text: "...", expression: "caught" },
        { speaker: "character", text: "Then I won't belabor the methodology.", expression: "giving_in" },
      ],
      nextNode: "confession",
    },
    deflect: {
      lines: [
        { speaker: "character", text: "Nervous is not the right word. I am... processing an unexpected variable.", expression: "stiff" },
        { speaker: "character", text: "You. You are the unexpected variable.", expression: "blunt_blush" },
      ],
      nextNode: "confession",
    },
    confession: {
      lines: [
        { speaker: "character", text: "I think about you with a frequency that cannot be explained by standard social interaction models.", expression: "vulnerable" },
        { speaker: "character", text: "And I have concluded that what I feel for you is... significant. Unusually so.", expression: "earnest" },
        { speaker: "character", text: "I like you. That is the plain version. I wanted to tell you, even if the outcome is uncertain.", expression: "waiting" },
      ],
      choices: [
        { text: "I like you too. Your data checks out.", nextBranch: "accepted", affinityBonus: 10 },
        { text: "I care about you, but I think we work best as friends.", nextBranch: "friends", affinityBonus: 3 },
      ],
    },
    accepted: {
      lines: [
        { speaker: "narration", text: "Something in Nao's carefully maintained composure cracks -- just a little. In the best possible way." },
        { speaker: "character", text: "...Good.", expression: "quiet_joy" },
        { speaker: "character", text: "That is a better outcome than my most optimistic projection.", expression: "soft_smile" },
        { speaker: "narration", text: "She looks away briefly, but you catch the faint curve of a genuine smile she can't quite suppress." },
      ],
      ending: "accepted",
    },
    friends: {
      lines: [
        { speaker: "character", text: "Understood.", expression: "controlled" },
        { speaker: "narration", text: "A beat. Her expression doesn't change much, but something shifts behind her eyes." },
        { speaker: "character", text: "I appreciate you being direct. That is... better than ambiguity.", expression: "processing" },
        { speaker: "character", text: "I'll adjust my parameters accordingly.", expression: "quietly_sad" },
      ],
      ending: "friends",
    },
  },
};

const KURISU_SCRIPT: ConfessionScript = {
  characterId: "kurisu",
  startNode: "start",
  nodes: {
    start: {
      lines: [
        { speaker: "narration", text: "Kurisu is waiting by the lab bench, arms crossed. She's not looking at you." },
        { speaker: "character", text: "I need to talk to you about something. It's... a scientific matter.", expression: "composed" },
        { speaker: "character", text: "Well, not exactly scientific. More like a... hypothesis I've been unable to disprove.", expression: "nervous" },
      ],
      nextNode: "buildup",
    },
    buildup: {
      lines: [
        { speaker: "character", text: "There's a persistent anomaly in my cognitive function. Elevated heart rate, intrusive thoughts, impaired concentration. All correlated with one variable.", expression: "analytical_blush" },
        { speaker: "narration", text: "She pushes a strand of auburn hair behind her ear. Her hand is trembling, just slightly." },
        { speaker: "character", text: "That variable is you. Obviously. Don't make me spell it out more than that.", expression: "flustered" },
      ],
      choices: [
        { text: "I think I understand. Keep going.", nextBranch: "confession", affinityBonus: 5 },
        { text: "Are you saying what I think you're saying?", nextBranch: "confession_direct", affinityBonus: 7 },
        { text: "You seem really worked up about this.", nextBranch: "deflect", affinityBonus: 3 },
      ],
    },
    confession: {
      lines: [
        { speaker: "character", text: "I've tried to rationalize it. Familiarity bias, dopamine response to social bonding, simple proximity effect.", expression: "struggling" },
        { speaker: "character", text: "But none of those models fit the data. The only hypothesis that holds up is...", expression: "vulnerable" },
        { speaker: "character", text: "...that I like you. More than a colleague. More than a friend. It's not like I wanted this to happen, so don't get any ideas.", expression: "tsundere_blush" },
      ],
      choices: [
        { text: "I like you too, Kurisu.", nextBranch: "accepted", affinityBonus: 10 },
        { text: "I care about you, but as a friend and colleague.", nextBranch: "friends", affinityBonus: 3 },
      ],
    },
    confession_direct: {
      lines: [
        { speaker: "character", text: "W-what do you think I'm saying?! Don't just assume things!", expression: "flustered" },
        { speaker: "narration", text: "She turns away, but not before you catch the deep red spreading across her cheeks." },
        { speaker: "character", text: "...Fine. Yes. I like you. There, I said it. Happy now? This is the worst experiment I've ever conducted.", expression: "embarrassed" },
      ],
      choices: [
        { text: "I like you too, Kurisu.", nextBranch: "accepted", affinityBonus: 10 },
        { text: "I care about you, but as a friend and colleague.", nextBranch: "friends", affinityBonus: 3 },
      ],
    },
    deflect: {
      lines: [
        { speaker: "character", text: "Worked up? I am NOT worked up. I'm presenting findings. This is how scientists communicate.", expression: "defensive" },
        { speaker: "narration", text: "She grabs a pen and clicks it rapidly, then catches herself and sets it down." },
        { speaker: "character", text: "...Forget it. The data is inconclusive. I need to run more tests. Alone. Without you standing there looking at me like that.", expression: "retreating" },
        { speaker: "narration", text: "She turns back to the bench, but her reflection in the monitor screen tells a different story entirely." },
      ],
      ending: "shy",
    },
    accepted: {
      lines: [
        { speaker: "character", text: "...You do?", expression: "stunned" },
        { speaker: "narration", text: "For a long moment, the genius who always has an answer is completely silent." },
        { speaker: "character", text: "I... I had a whole contingency prepared for rejection. I didn't actually model this outcome very well.", expression: "overwhelmed" },
        { speaker: "character", text: "It's not like I'm happy or anything. This is just... a satisfactory confirmation of my hypothesis.", expression: "trying_not_to_smile" },
        { speaker: "narration", text: "But the smile breaking through is the most honest thing she's ever let you see." },
      ],
      ending: "accepted",
    },
    friends: {
      lines: [
        { speaker: "character", text: "Right. Of course. That's... the logical outcome, statistically speaking.", expression: "controlled" },
        { speaker: "narration", text: "She adjusts her lab coat, squaring her shoulders as if resetting herself." },
        { speaker: "character", text: "Well, at least now I can stop wasting cognitive resources on this particular problem. Back to real science.", expression: "forced_composure" },
        { speaker: "narration", text: "She picks up her tablet and starts typing. The keystrokes are a little too loud, a little too deliberate." },
      ],
      ending: "friends",
    },
  },
};

const MERRICK_SCRIPT: ConfessionScript = {
  characterId: "merrick",
  startNode: "start",
  nodes: {
    start: {
      lines: [
        { speaker: "narration", text: "Moonlight pools through the window. Merrick stands in its glow, emerald eyes catching the light like something not quite human." },
        { speaker: "character", text: "I have walked through centuries, cher. I have watched empires crumble and rivers change their course.", expression: "reflective" },
        { speaker: "character", text: "And in all that time, I have learned that some things cannot wait. Not even for the immortal.", expression: "intent" },
        { speaker: "character", text: "Sit with me. What I have to say has been gathering in my chest like a storm over the bayou.", expression: "serious" },
      ],
      nextNode: "buildup",
    },
    buildup: {
      lines: [
        { speaker: "character", text: "I thought the blood had burned away everything mortal in me. The longing, the ache, the foolish hope. I was wrong.", expression: "vulnerable" },
        { speaker: "narration", text: "She reaches out and traces the air near your face, not quite touching, as if memorizing you." },
        { speaker: "character", text: "You have done something the spirits themselves could not. You have made me feel alive again.", expression: "earnest" },
      ],
      choices: [
        { text: "Tell me everything.", nextBranch: "confession", affinityBonus: 5 },
        { text: "I've felt something too, between us.", nextBranch: "confession_mutual", affinityBonus: 7 },
        { text: "That's a lot of weight to carry alone.", nextBranch: "gentle_out", affinityBonus: 3 },
      ],
    },
    confession: {
      lines: [
        { speaker: "character", text: "In the old traditions, there is a word for what the heart does when it recognizes its match. The spirits sing it, and the blood remembers.", expression: "mystical" },
        { speaker: "character", text: "I love you. Not the way mortals love, with its expiration date, its fragile little window. I love you the way the moon loves the tide. Constant. Unrelenting.", expression: "devoted" },
        { speaker: "character", text: "I know what I am, cher. I know the darkness I carry. But I am offering you all of it, the darkness and whatever light is left.", expression: "waiting" },
      ],
      choices: [
        { text: "I love you too, Merrick. All of you.", nextBranch: "accepted", affinityBonus: 10 },
        { text: "I care for you deeply, but I think we're meant to be something different.", nextBranch: "friends", affinityBonus: 3 },
      ],
    },
    confession_mutual: {
      lines: [
        { speaker: "narration", text: "Something ancient and luminous moves behind her eyes." },
        { speaker: "character", text: "Then the spirits were not lying to me. I had hoped, but hope is a dangerous luxury for someone who has been alive this long.", expression: "hopeful" },
        { speaker: "character", text: "I love you. Simply and completely. The witch in me knew it before the woman did.", expression: "devoted" },
      ],
      choices: [
        { text: "I love you too, Merrick. All of you.", nextBranch: "accepted", affinityBonus: 10 },
        { text: "I care for you deeply, but I think we're meant to be something different.", nextBranch: "friends", affinityBonus: 3 },
      ],
    },
    gentle_out: {
      lines: [
        { speaker: "character", text: "It is. But I have carried heavier things, mon ami.", expression: "sad_smile" },
        { speaker: "narration", text: "She looks toward the window, the moonlight silvering the edges of her dark hair." },
        { speaker: "character", text: "Perhaps the spirits brought you to me for another reason. Perhaps the telling was enough.", expression: "melancholic" },
        { speaker: "narration", text: "She lets the silence settle like incense smoke, patient as only the immortal can be." },
      ],
      ending: "shy",
    },
    accepted: {
      lines: [
        { speaker: "narration", text: "The room shifts. The candlelight brightens. Something old and powerful hums in the air between you." },
        { speaker: "character", text: "Oh, cher...", expression: "overwhelmed" },
        { speaker: "character", text: "I have lived long enough to know that this moment is rare. Rarer than any spell, any relic, any secret the dead have whispered to me.", expression: "devoted" },
        { speaker: "character", text: "You will grow old. I will not. But I will love every single day you give me as if it were my last.", expression: "tender" },
        { speaker: "narration", text: "She takes your hand, and her skin is cool, but the look in her emerald eyes burns with something far warmer than any mortal fire." },
      ],
      ending: "accepted",
    },
    friends: {
      lines: [
        { speaker: "narration", text: "She closes her eyes. When she opens them, there is no anger, only the vast patience of centuries." },
        { speaker: "character", text: "I understand. The heart wants what it wants, and it is no one's fault when the river flows a different way.", expression: "graceful_sad" },
        { speaker: "character", text: "You are still precious to me, cher. That will not change. I have an eternity to make peace with the rest.", expression: "gentle" },
        { speaker: "narration", text: "She smiles, and it is the kind of smile that holds an ocean of feeling just beneath the surface." },
      ],
      ending: "friends",
    },
  },
};

const SCRIPTS: Record<string, ConfessionScript> = {
  arisu: ARISU_SCRIPT,
  marin: MARIN_SCRIPT,
  nao: NAO_SCRIPT,
  kurisu: KURISU_SCRIPT,
  merrick: MERRICK_SCRIPT,
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function getConfessionScript(characterId: string): ConfessionScript {
  const script = SCRIPTS[characterId];
  if (!script) {
    throw new Error(`No confession script found for character: ${characterId}`);
  }
  return script;
}

export function hasConfessed(characterId: string): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(`anime-chatbot-confession-done-${characterId}`) === "true";
}

export function markConfessed(characterId: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(`anime-chatbot-confession-done-${characterId}`, "true");
}

export function canConfess(characterId: string): boolean {
  const affinity = getAffinity(characterId);
  const isSoulmate = affinity.level >= 5;
  return isSoulmate && !hasConfessed(characterId);
}
