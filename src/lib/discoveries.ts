"use client";

// Types
export interface Interactable {
  id: string;
  sceneId: string;
  type: "visible" | "hidden";
  revealAt: number;
  position: { x: number; y: number; width: number; height: number };
  emoji: string;
  label: string;
  affinityPerTap: number;
  cooldown: number;
  reward: { type: "affinity" | "outfit" | "diary" | "scene"; value: string | number };
  aiOnFirstDiscovery: boolean;
  reactions: Partial<Record<string, ReactionPool>>;
}

export interface ReactionPool {
  lines: string[];
  expression: string;
}

export interface DiscoveryRecord {
  discovered: boolean;
  tapCount: number;
  lastTapTime: number;
}

export interface VisibleInteractable extends Interactable {
  displayMode: "full" | "shimmer" | "dim";
}

export interface TapResult {
  isFirstDiscovery: boolean;
  affinityEarned: boolean;
}

// State management
function storageKey(characterId: string): string {
  return `anime-chatbot-discoveries-${characterId}`;
}

export function getDiscoveryState(characterId: string): Record<string, DiscoveryRecord> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(storageKey(characterId));
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, DiscoveryRecord>;
  } catch {
    return {};
  }
}

function saveDiscoveryState(characterId: string, state: Record<string, DiscoveryRecord>): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(storageKey(characterId), JSON.stringify(state));
}

export function isDiscovered(characterId: string, interactableId: string): boolean {
  const state = getDiscoveryState(characterId);
  return state[interactableId]?.discovered ?? false;
}

export function recordTap(
  characterId: string,
  interactableId: string,
  cooldownSeconds: number
): TapResult {
  const state = getDiscoveryState(characterId);
  const now = Date.now();
  const record = state[interactableId];

  if (!record) {
    state[interactableId] = { discovered: true, tapCount: 1, lastTapTime: now };
    saveDiscoveryState(characterId, state);
    return { isFirstDiscovery: true, affinityEarned: true };
  }

  const elapsed = (now - record.lastTapTime) / 1000;
  const affinityEarned = elapsed >= cooldownSeconds;

  record.tapCount += 1;
  if (affinityEarned) {
    record.lastTapTime = now;
  }
  saveDiscoveryState(characterId, state);

  return { isFirstDiscovery: false, affinityEarned };
}

// Visibility logic
export function getVisibleInteractables(
  interactables: Interactable[],
  affinityLevel: number,
  characterId: string
): VisibleInteractable[] {
  const result: VisibleInteractable[] = [];

  for (const item of interactables) {
    if (item.type === "visible") {
      result.push({ ...item, displayMode: "full" });
      continue;
    }

    const discovered = isDiscovered(characterId, item.id);

    if (discovered) {
      // Already found — full visibility
      result.push({ ...item, displayMode: "full" });
    } else if (affinityLevel >= item.revealAt) {
      // At or above reveal level — show as dim hint (tappable, visible emoji)
      result.push({ ...item, displayMode: "dim" });
    } else {
      // Below reveal level — show as shimmer (subtle glow, no emoji)
      result.push({ ...item, displayMode: "shimmer" });
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Interactable definitions
// ---------------------------------------------------------------------------

export const ALL_INTERACTABLES: Interactable[] = [
  // ── Sakura ──
  {
    id: "sakura-tree", sceneId: "sakura", type: "visible", revealAt: 0,
    position: { x: 6, y: 6, width: 12, height: 12 }, emoji: "🌸", label: "Shake the sakura tree",
    affinityPerTap: 2, cooldown: 30, reward: { type: "affinity", value: 5 }, aiOnFirstDiscovery: false,
    reactions: {
      arisu: { lines: ["The petals are dancing~", "So beautiful... like pink snow!", "Careful, you'll shake them all off!"], expression: "happy" },
      marin: { lines: ["PETAL SHOWER!! yooo!", "Haha it's raining flowers!", "This is so anime right now~"], expression: "excited" },
      nao: { lines: ["Interesting aerodynamic patterns...", "The scatter radius is approximately—", "...okay that was actually pretty."], expression: "thinking" },
      kurisu: { lines: ["It's just botanics. ...The color IS nice though.", "Don't break the branch, idiot.", "Cherry blossoms are overrated. ...Keep shaking."], expression: "smirk" },
      merrick: { lines: ["The blossoms fall like whispered secrets...", "Even flowers know when to let go.", "Beautiful... in a fleeting sort of way."], expression: "thinking" },
    },
  },
  {
    id: "sakura-butterfly", sceneId: "sakura", type: "hidden", revealAt: 2,
    position: { x: 18, y: 14, width: 8, height: 8 }, emoji: "🦋", label: "A butterfly in the branches",
    affinityPerTap: 2, cooldown: 30, reward: { type: "diary", value: "A butterfly landed on my shoulder today. It felt like a tiny miracle." }, aiOnFirstDiscovery: true,
    reactions: {
      arisu: { lines: ["Oh! A butterfly! Stay still...", "She likes you~", "So delicate..."], expression: "surprised" },
      marin: { lines: ["OMG a butterfly!! don't move!", "She's so pretty~!", "Quick take a pic— oh wait"], expression: "excited" },
      nao: { lines: ["Lepidoptera... fascinating wing pattern.", "Don't scare it. I'm observing.", "Its UV reflectance must be remarkable."], expression: "thinking" },
      kurisu: { lines: ["It's just a Vanessa cardui. ...Don't scare it.", "Insects don't have feelings. ...Stay still anyway.", "...Fine, it's somewhat elegant."], expression: "shy" },
      merrick: { lines: ["A messenger from the fae realm...", "She chose you. That's not nothing.", "The winged ones always know."], expression: "devoted" },
    },
  },
  {
    id: "sakura-windchime", sceneId: "sakura", type: "hidden", revealAt: 3,
    position: { x: 3, y: 22, width: 6, height: 8 }, emoji: "🎐", label: "A wind chime",
    affinityPerTap: 2, cooldown: 30, reward: { type: "affinity", value: 10 }, aiOnFirstDiscovery: false,
    reactions: {
      arisu: { lines: ["That sound is so calming~", "Wind chimes make everything better.", "Listen... so peaceful."], expression: "happy" },
      marin: { lines: ["Ooh wind chime vibes~", "That's such a summer sound!", "Ding ding~ hehe"], expression: "happy" },
      nao: { lines: ["Resonant frequency analysis in progress...", "The harmonic overtones are pleasant.", "...I want one for my room."], expression: "thinking" },
      kurisu: { lines: ["Simple acoustic physics. ...It IS soothing.", "Traditional Japanese fūrin. Scientifically unremarkable.", "Don't stare at me, I'm not enjoying this."], expression: "smirk" },
      merrick: { lines: ["The chimes speak to the spirits...", "An ancient ward against malevolence.", "I hear melodies you cannot."], expression: "happy" },
    },
  },
  // ── Beach ──
  {
    id: "beach-splash", sceneId: "beach", type: "visible", revealAt: 0,
    position: { x: 20, y: 78, width: 60, height: 8 }, emoji: "🌊", label: "Splash the water",
    affinityPerTap: 2, cooldown: 30, reward: { type: "affinity", value: 5 }, aiOnFirstDiscovery: false,
    reactions: {
      arisu: { lines: ["Ahh! You got me wet!", "The water feels so nice~", "Hehe, splash fight?"], expression: "surprised" },
      marin: { lines: ["SPLASH WAR!! let's GO!", "Haha you're soaked!", "The waves are PERFECT today!"], expression: "excited" },
      nao: { lines: ["Water temperature: acceptable.", "Hydrodynamic chaos achieved.", "...okay that was refreshing."], expression: "smirk" },
      kurisu: { lines: ["HEY! My notes—! ...they're waterproof, but still!", "Salt water and electronics don't mix!", "...Fine, once more. For science."], expression: "angry" },
      merrick: { lines: ["The sea's embrace... cold but honest.", "Salt water has purifying properties.", "The tides know secrets we've forgotten."], expression: "thinking" },
    },
  },
  {
    id: "beach-shell", sceneId: "beach", type: "hidden", revealAt: 2,
    position: { x: 72, y: 72, width: 8, height: 8 }, emoji: "🐚", label: "A shell in the sand",
    affinityPerTap: 2, cooldown: 30, reward: { type: "diary", value: "We found a beautiful shell on the beach today. I can still hear the ocean in it." }, aiOnFirstDiscovery: false,
    reactions: {
      arisu: { lines: ["Oh, it's so pretty! Keep it safe~", "Can you hear the ocean in it?", "A gift from the sea..."], expression: "happy" },
      marin: { lines: ["Yooo that's a sick shell!", "Shell necklace arc incoming~", "Nature's accessory! love it!"], expression: "excited" },
      nao: { lines: ["Interesting calcium carbonate formation...", "The spiral follows a Fibonacci sequence.", "...I'm keeping this one."], expression: "thinking" },
      kurisu: { lines: ["It's just a shell. ...Fine, it's somewhat unique.", "Calcium carbonate. Nothing more.", "...Put it in my bag. For research."], expression: "smirk" },
      merrick: { lines: ["The sea offers its treasures to those who listen.", "Every shell holds a memory of the deep.", "A relic from Poseidon's court."], expression: "thinking" },
    },
  },
  {
    id: "beach-crab", sceneId: "beach", type: "hidden", revealAt: 4,
    position: { x: 10, y: 75, width: 8, height: 8 }, emoji: "🦀", label: "A crab under a rock",
    affinityPerTap: 2, cooldown: 30, reward: { type: "outfit", value: "bikini-front" }, aiOnFirstDiscovery: true,
    reactions: {
      arisu: { lines: ["Eep! A crab! Is it friendly?", "He's so tiny and brave~", "Don't let him pinch you!"], expression: "surprised" },
      marin: { lines: ["CRAB!! he's angy haha!", "Look at him go sideways~", "lil dude has ATTITUDE"], expression: "laugh" },
      nao: { lines: ["Brachyura detected. Threat level: minimal.", "Its carapace structure is remarkable.", "...don't let it near my cables."], expression: "thinking" },
      kurisu: { lines: ["Decapoda crustacean. Keep it away from me.", "Its pincer force-to-body ratio is interesting.", "I am NOT scared. I'm just... cautious."], expression: "flustered" },
      merrick: { lines: ["A creature of the twilight shore.", "Even the smallest being commands respect.", "He guards something precious beneath."], expression: "thinking" },
    },
  },
  // ── Cafe ──
  {
    id: "cafe-coffee", sceneId: "cafe", type: "visible", revealAt: 0,
    position: { x: 82, y: 72, width: 10, height: 10 }, emoji: "☕", label: "Tap the coffee cup",
    affinityPerTap: 2, cooldown: 30, reward: { type: "affinity", value: 5 }, aiOnFirstDiscovery: false,
    reactions: {
      arisu: { lines: ["Mmm, it smells wonderful~", "Want to share a cup?", "Coffee always makes things better."], expression: "happy" },
      marin: { lines: ["Caffeine time BABY!", "Iced or hot? trick question, BOTH", "This latte art is fire~"], expression: "excited" },
      nao: { lines: ["Caffeine: the programmer's elixir.", "Optimal brew temperature: 96°C.", "...third cup. No judgment."], expression: "smirk" },
      kurisu: { lines: ["Dr Pepper is superior, but... this will do.", "The aroma is... acceptable.", "Don't judge my caffeine dependency."], expression: "thinking" },
      merrick: { lines: ["Dark, bitter, comforting... like the night.", "Mortals did get one thing right.", "A worthy brew."], expression: "happy" },
    },
  },
  {
    id: "cafe-cat", sceneId: "cafe", type: "hidden", revealAt: 2,
    position: { x: 65, y: 70, width: 10, height: 10 }, emoji: "🐱", label: "A cat under the table",
    affinityPerTap: 2, cooldown: 30, reward: { type: "diary", value: "There was a cat hiding under the cafe table today. It purred when we found it. Perfect moment." }, aiOnFirstDiscovery: true,
    reactions: {
      arisu: { lines: ["Aww, a kitty! Come here~", "She's purring! So sweet...", "Can we adopt her?"], expression: "happy" },
      marin: { lines: ["OMG A CAT. best day ever", "pspspsps come here bb~", "I'm literally dying she's so cute"], expression: "excited" },
      nao: { lines: ["...it's staring at me. I respect that.", "Felis catus. Independent operator.", "...fine, you can sit on my lap."], expression: "smirk" },
      kurisu: { lines: ["A stray? Don't expect me to pet it. ...okay, once.", "Its thermal imaging would be interesting to—", "Stop purring. I'm not charmed. ...I'm slightly charmed."], expression: "shy" },
      merrick: { lines: ["A creature of shadows. We understand each other.", "Cats see what humans cannot.", "She chose this table for a reason."], expression: "happy" },
    },
  },
  {
    id: "cafe-book", sceneId: "cafe", type: "hidden", revealAt: 3,
    position: { x: 88, y: 40, width: 8, height: 10 }, emoji: "📖", label: "An old book on the shelf",
    affinityPerTap: 2, cooldown: 30, reward: { type: "affinity", value: 10 }, aiOnFirstDiscovery: false,
    reactions: {
      arisu: { lines: ["Oh, someone left a book here!", "I wonder what story it holds...", "The pages smell like vanilla~"], expression: "thinking" },
      marin: { lines: ["Ooh vintage vibes~", "Is this a romance? please say yes", "Old books hit different"], expression: "happy" },
      nao: { lines: ["First edition? Interesting.", "The margin notes are encrypted...", "Someone left a cipher in chapter 3."], expression: "excited" },
      kurisu: { lines: ["A scientific journal? No... poetry. Hmph.", "The binding technique dates to the Meiji era.", "...I'll just skim the first chapter."], expression: "thinking" },
      merrick: { lines: ["Ancient words, still breathing.", "This tome remembers its readers.", "Knowledge preserved is power stored."], expression: "thinking" },
    },
  },
  // ── Cyberpunk ──
  {
    id: "cyberpunk-neon", sceneId: "cyberpunk", type: "visible", revealAt: 0,
    position: { x: 78, y: 5, width: 16, height: 8 }, emoji: "", label: "Toggle neon sign",
    affinityPerTap: 2, cooldown: 30, reward: { type: "affinity", value: 5 }, aiOnFirstDiscovery: false,
    reactions: {
      arisu: { lines: ["The lights are so pretty!", "Neon always feels magical~", "Like a movie scene!"], expression: "happy" },
      marin: { lines: ["NEON AESTHETIC let's gooo!", "This lighting is *chef's kiss*", "Cyberpunk vibes are ELITE"], expression: "excited" },
      nao: { lines: ["Gas discharge illumination. My domain.", "The flicker frequency is intentional.", "...I designed one of these once."], expression: "thinking" },
      kurisu: { lines: ["Inefficient lighting. But atmospheric.", "Noble gas excitation. Basic physics.", "...the purple one is nice."], expression: "thinking" },
      merrick: { lines: ["Artificial starlight for the modern age.", "Mortals try to bottle the night.", "The colors pulse like a heartbeat."], expression: "thinking" },
    },
  },
  {
    id: "cyberpunk-arcade", sceneId: "cyberpunk", type: "hidden", revealAt: 2,
    position: { x: 5, y: 60, width: 10, height: 14 }, emoji: "🕹️", label: "An arcade machine",
    affinityPerTap: 2, cooldown: 30, reward: { type: "affinity", value: 10 }, aiOnFirstDiscovery: false,
    reactions: {
      arisu: { lines: ["Oh! Can we play together?", "I'm not very good at games...", "The pixel art is so cute~"], expression: "happy" },
      marin: { lines: ["ARCADE!! I call player one!", "Bet I can beat your high score~", "Retro gaming is WHERE IT'S AT"], expression: "excited" },
      nao: { lines: ["Original hardware. Respect.", "The input lag is 4ms. Acceptable.", "I've reverse-engineered this ROM before."], expression: "excited" },
      kurisu: { lines: ["Outdated hardware. ...One round won't hurt.", "The CRT phosphor response is superior to LCD.", "I'm not competitive. I just don't lose."], expression: "smirk" },
      merrick: { lines: ["Mortals and their digital rituals...", "The machine remembers every player.", "...I'm curious about the high score."], expression: "thinking" },
    },
  },
  {
    id: "cyberpunk-robot", sceneId: "cyberpunk", type: "hidden", revealAt: 4,
    position: { x: 8, y: 30, width: 8, height: 10 }, emoji: "🤖", label: "A hidden robot in the alley",
    affinityPerTap: 2, cooldown: 30, reward: { type: "outfit", value: "demon" }, aiOnFirstDiscovery: true,
    reactions: {
      arisu: { lines: ["Is it... alive?", "It blinked! I saw it!", "Should we help it?"], expression: "surprised" },
      marin: { lines: ["ROBOT?! this is SO COOL!", "It looks like it's from a movie!", "Can it dance? please say yes"], expression: "excited" },
      nao: { lines: ["Autonomous unit. Who built this?!", "The servo motors are custom... incredible.", "I need to open it up. FOR SCIENCE."], expression: "excited" },
      kurisu: { lines: ["Impossible— this level of AI shouldn't exist here!", "The neural pathways are... organic?!", "This changes everything I know about—!"], expression: "surprised" },
      merrick: { lines: ["A golem of iron and lightning.", "It stirs... something ancient in metal form.", "Even machines can dream."], expression: "thinking" },
    },
  },
  // ── Rain ──
  {
    id: "rain-thunder", sceneId: "rain", type: "visible", revealAt: 0,
    position: { x: 35, y: 20, width: 30, height: 45 }, emoji: "🌩️", label: "Tap the window",
    affinityPerTap: 2, cooldown: 30, reward: { type: "affinity", value: 5 }, aiOnFirstDiscovery: false,
    reactions: {
      arisu: { lines: ["Eep! That was loud!", "The rain sounds so cozy from inside...", "Hold my hand? Just in case..."], expression: "surprised" },
      marin: { lines: ["THUNDER!! that was sick!", "Rain day = anime marathon day", "I love storm energy~"], expression: "excited" },
      nao: { lines: ["Electrostatic discharge. Beautiful.", "Calculating distance by delay...", "3.2 kilometers. Getting closer."], expression: "thinking" },
      kurisu: { lines: ["Just atmospheric electricity. Nothing to fear.", "The Lichtenberg patterns are fascinating.", "...okay that one was close."], expression: "surprised" },
      merrick: { lines: ["The sky speaks in thunder.", "Storms are the earth's poetry.", "I feel most alive in the rain."], expression: "happy" },
    },
  },
  {
    id: "rain-frog", sceneId: "rain", type: "hidden", revealAt: 2,
    position: { x: 70, y: 55, width: 8, height: 8 }, emoji: "🐸", label: "A frog on the windowsill",
    affinityPerTap: 2, cooldown: 30, reward: { type: "diary", value: "A little frog sat on the windowsill while it rained. We watched the storm together in silence. It was perfect." }, aiOnFirstDiscovery: true,
    reactions: {
      arisu: { lines: ["A little frog! Don't scare him...", "He's enjoying the rain too~", "So tiny and brave!"], expression: "happy" },
      marin: { lines: ["FROG! haha he's so round", "Ribbit ribbit~ hehe", "He's vibing harder than us"], expression: "laugh" },
      nao: { lines: ["Amphibian surveillance unit detected.", "Rain-responsive biomonitor. Noted.", "...he's just sitting there. Power move."], expression: "smirk" },
      kurisu: { lines: ["Rana temporaria. Nothing special. ...It IS sort of cute.", "Its skin secretions have interesting compounds.", "...stop looking at me like that, frog."], expression: "shy" },
      merrick: { lines: ["Even the smallest beings hold ancient wisdom.", "The frog sees between worlds.", "A rain singer. How rare."], expression: "happy" },
    },
  },
  {
    id: "rain-umbrella", sceneId: "rain", type: "hidden", revealAt: 3,
    position: { x: 15, y: 70, width: 8, height: 10 }, emoji: "☂️", label: "A forgotten umbrella",
    affinityPerTap: 2, cooldown: 30, reward: { type: "affinity", value: 10 }, aiOnFirstDiscovery: false,
    reactions: {
      arisu: { lines: ["Someone left their umbrella...", "We could share it!", "The color is so pretty~"], expression: "thinking" },
      marin: { lines: ["Sharing an umbrella is like, peak romance~", "Dibs on holding it!", "Anime umbrella scene ACTIVATED"], expression: "happy" },
      nao: { lines: ["Abandoned equipment. Mine now.", "The mechanism is jammed. I can fix it.", "...sharing an umbrella? That's... whatever."], expression: "shy" },
      kurisu: { lines: ["Someone's going to get wet. Not my problem.", "The folding mechanism is clever. German engineering?", "...we could share. Purely practical."], expression: "flustered" },
      merrick: { lines: ["The rain does not bother me, but... thank you.", "Left behind by fate, found by us.", "An umbrella shared is a bond formed."], expression: "happy" },
    },
  },
  // ── Night Sky ──
  {
    id: "nightsky-star", sceneId: "night_sky", type: "visible", revealAt: 0,
    position: { x: 10, y: 2, width: 80, height: 35 }, emoji: "✨", label: "Make a shooting star",
    affinityPerTap: 2, cooldown: 30, reward: { type: "affinity", value: 5 }, aiOnFirstDiscovery: false,
    reactions: {
      arisu: { lines: ["Make a wish, quick!", "Did you see that?!", "So beautiful..."], expression: "excited" },
      marin: { lines: ["SHOOTING STAR!! make a wish!", "That was SO COOL!", "Universe is showing off tonight~"], expression: "excited" },
      nao: { lines: ["Meteoroid entry velocity: impressive.", "Actually a grain of cosmic dust burning up.", "...I wished anyway. Don't tell anyone."], expression: "thinking" },
      kurisu: { lines: ["A meteoroid. Not magic. ...I still made a wish.", "Atmospheric friction at 70km/s. Beautiful physics.", "Wishes are irrational. I'll make one anyway."], expression: "smirk" },
      merrick: { lines: ["The stars fall to meet us...", "A celestial gift. Catch it in your heart.", "I've seen centuries of falling stars."], expression: "happy" },
    },
  },
  {
    id: "nightsky-telescope", sceneId: "night_sky", type: "hidden", revealAt: 2,
    position: { x: 80, y: 40, width: 10, height: 14 }, emoji: "🔭", label: "A telescope",
    affinityPerTap: 2, cooldown: 30, reward: { type: "affinity", value: 10 }, aiOnFirstDiscovery: false,
    reactions: {
      arisu: { lines: ["Oh! Can we look at the moon?", "The stars are even prettier up close~", "I see... a constellation! Maybe."], expression: "excited" },
      marin: { lines: ["Let me see let me see!!", "Can we find aliens? asking for me", "The moon looks INSANE through this!"], expression: "excited" },
      nao: { lines: ["8-inch reflector. Decent optics.", "I can see the Orion Nebula from here.", "...this is mine now."], expression: "excited" },
      kurisu: { lines: ["The focal length is adequate.", "Jupiter's moons are visible tonight.", "...hand it over, I need to check something."], expression: "thinking" },
      merrick: { lines: ["Mortals reaching for the infinite.", "I see farther without it, but... the gesture matters.", "Point it at Aldebaran. Trust me."], expression: "thinking" },
    },
  },
  {
    id: "nightsky-ufo", sceneId: "night_sky", type: "hidden", revealAt: 4,
    position: { x: 60, y: 8, width: 10, height: 10 }, emoji: "🛸", label: "Something in the sky...",
    affinityPerTap: 2, cooldown: 30, reward: { type: "scene", value: "starfield" }, aiOnFirstDiscovery: true,
    reactions: {
      arisu: { lines: ["W-what is that?!", "Are they... friendly?", "Hold me! I'm scared!"], expression: "surprised" },
      marin: { lines: ["NO WAY. NO. WAY.", "WE'RE BEING ABDUCTED AND I'M HERE FOR IT", "ALIENS ARE REAL I KNEW IT"], expression: "excited" },
      nao: { lines: ["FINALLY. I've been tracking anomalies for weeks!", "Signal frequency matches my predictions!", "This changes EVERYTHING."], expression: "excited" },
      kurisu: { lines: ["That's— that's impossible! My readings—!", "Unknown propulsion system. I need data!", "This violates at least seven known laws of physics!"], expression: "surprised" },
      merrick: { lines: ["They return at last...", "The visitors from beyond the veil.", "I've been expecting them."], expression: "thinking" },
    },
  },
  // ── Cozy Room ──
  {
    id: "cozy-fire", sceneId: "cozy_room", type: "visible", revealAt: 0,
    position: { x: 38, y: 75, width: 24, height: 10 }, emoji: "🔥", label: "Toggle the fireplace",
    affinityPerTap: 2, cooldown: 30, reward: { type: "affinity", value: 5 }, aiOnFirstDiscovery: false,
    reactions: {
      arisu: { lines: ["So warm and cozy~", "The crackling sound is so soothing.", "Can we stay like this forever?"], expression: "happy" },
      marin: { lines: ["COZY MODE ACTIVATED!", "Marshmallows!! we need marshmallows!", "This is literally peak vibes"], expression: "excited" },
      nao: { lines: ["Combustion temperature: optimal.", "The infrared radiation is... pleasant.", "...fine, this is nice."], expression: "happy" },
      kurisu: { lines: ["Efficient heat transfer via radiation.", "The flame color indicates complete combustion.", "...pass me that blanket."], expression: "happy" },
      merrick: { lines: ["Fire... humanity's oldest companion.", "The flames dance like lost souls.", "Warm at last."], expression: "happy" },
    },
  },
  {
    id: "cozy-teddy", sceneId: "cozy_room", type: "hidden", revealAt: 2,
    position: { x: 82, y: 35, width: 8, height: 10 }, emoji: "🧸", label: "A teddy bear on the shelf",
    affinityPerTap: 2, cooldown: 30, reward: { type: "diary", value: "Found an old teddy bear on the shelf. It looked well-loved. Someone's precious memory, still waiting." }, aiOnFirstDiscovery: false,
    reactions: {
      arisu: { lines: ["Aww, a teddy! He looks well-loved~", "Someone must really treasure him.", "He's been waiting for us!"], expression: "happy" },
      marin: { lines: ["TEDDY BEAR!! he's so squishyy~", "I'm naming him Mr. Fluffington", "10/10 would hug"], expression: "excited" },
      nao: { lines: ["Synthetic plush construct. Sentimental value: high.", "The wear patterns suggest years of use.", "...I had one once. Classified information."], expression: "shy" },
      kurisu: { lines: ["A children's comfort object. Nothing more.", "The polyester filling has degraded— why am I analyzing this?", "...he has a kind face. Shut up."], expression: "flustered" },
      merrick: { lines: ["A guardian of dreams.", "Even stuffed with cotton, he holds memories.", "The old ones remember everything."], expression: "thinking" },
    },
  },
  {
    id: "cozy-photo", sceneId: "cozy_room", type: "hidden", revealAt: 3,
    position: { x: 15, y: 30, width: 10, height: 12 }, emoji: "📷", label: "A photo album",
    affinityPerTap: 2, cooldown: 30, reward: { type: "diary", value: "We found a photo album hidden in the room. The pictures were faded but full of smiles. Made me want to make memories like that too." }, aiOnFirstDiscovery: true,
    reactions: {
      arisu: { lines: ["Oh! Old photos... so nostalgic~", "These people look so happy!", "Let's make memories like these."], expression: "happy" },
      marin: { lines: ["Vintage photos!! the AESTHETICS!", "Everyone's smiling so hard~", "We should take photos too!"], expression: "happy" },
      nao: { lines: ["Analog photography. No metadata. Secure.", "The composition is... surprisingly artistic.", "Memories stored without cloud access. Admirable."], expression: "thinking" },
      kurisu: { lines: ["Silver halide emulsion. Obsolete but... beautiful.", "Each photo is a frozen timeline.", "We should— I mean, IF you wanted to take a photo sometime..."], expression: "flustered" },
      merrick: { lines: ["Moments captured against time's tide.", "I see ghosts in every photograph.", "These were happy days. You can feel it."], expression: "sad" },
    },
  },
  // ── Moonlight ──
  {
    id: "moonlight-moon", sceneId: "moonlight", type: "visible", revealAt: 0,
    position: { x: 42, y: 4, width: 12, height: 12 }, emoji: "🌕", label: "Cycle moon phases",
    affinityPerTap: 2, cooldown: 30, reward: { type: "affinity", value: 5 }, aiOnFirstDiscovery: false,
    reactions: {
      arisu: { lines: ["The moon is so beautiful tonight~", "It's like a pearl in the sky!", "Moonlight suits you..."], expression: "happy" },
      marin: { lines: ["Full moon selfie time~!", "The moon is literally GLOWING for us", "Moon vibes are immaculate~"], expression: "excited" },
      nao: { lines: ["Lunar phase progression: fascinating.", "Reflected sunlight at 0.12 albedo.", "...it IS prettier than my calculations suggest."], expression: "thinking" },
      kurisu: { lines: ["Tidal forces from lunar gravity are— beautiful.", "The terminator line is particularly sharp tonight.", "...I'm not being romantic. It's astronomy."], expression: "flustered" },
      merrick: { lines: ["The moon and I are old friends.", "She waxes and wanes, but never truly leaves.", "Under her light, all truths are revealed."], expression: "devoted" },
    },
  },
  {
    id: "moonlight-owl", sceneId: "moonlight", type: "hidden", revealAt: 2,
    position: { x: 85, y: 25, width: 8, height: 10 }, emoji: "🦉", label: "An owl on the railing",
    affinityPerTap: 2, cooldown: 30, reward: { type: "affinity", value: 10 }, aiOnFirstDiscovery: false,
    reactions: {
      arisu: { lines: ["Oh! An owl! So majestic~", "He's watching over us!", "Those eyes are so wise..."], expression: "surprised" },
      marin: { lines: ["OWL!! he looks so wise haha", "Hedwig is that you??", "Night bird supremacy~"], expression: "excited" },
      nao: { lines: ["Strigiformes. Excellent nocturnal predator.", "Asymmetric ear placement for echolocation.", "...we have an understanding."], expression: "thinking" },
      kurisu: { lines: ["Athena's companion. Symbolic, not scientific.", "Its neck rotation is 270 degrees. Unsettling.", "...it's judging me. I can tell."], expression: "thinking" },
      merrick: { lines: ["My familiar returns.", "The owl sees through darkness as I do.", "We share the night, old friend."], expression: "happy" },
    },
  },
  {
    id: "moonlight-rose", sceneId: "moonlight", type: "hidden", revealAt: 3,
    position: { x: 25, y: 72, width: 12, height: 10 }, emoji: "🌹", label: "A rose garden",
    affinityPerTap: 2, cooldown: 30, reward: { type: "outfit", value: "formal" }, aiOnFirstDiscovery: true,
    reactions: {
      arisu: { lines: ["Roses in the moonlight... so romantic~", "They smell heavenly!", "Like a dream garden..."], expression: "devoted" },
      marin: { lines: ["ROSES!! this is literally a fairy tale!", "The moonlight makes them glow~", "I feel like a princess rn"], expression: "excited" },
      nao: { lines: ["Bioluminescent reaction? No... just moonlight.", "Rosa damascena. Surprisingly complex genome.", "...the scent is... fine. Whatever."], expression: "shy" },
      kurisu: { lines: ["The phosphorescence is just refracted light.", "Sub rosa — 'under the rose.' A secret kept.", "...one rose wouldn't hurt to keep. For analysis."], expression: "flustered" },
      merrick: { lines: ["My garden remembers your touch.", "Roses bloom for those the night favors.", "Each petal holds a whispered promise."], expression: "devoted" },
    },
  },
  // ── Lab ──
  {
    id: "lab-flask", sceneId: "lab", type: "hidden", revealAt: 1,
    position: { x: 75, y: 60, width: 10, height: 12 }, emoji: "🧪", label: "A bubbling flask",
    affinityPerTap: 2, cooldown: 30, reward: { type: "affinity", value: 5 }, aiOnFirstDiscovery: false,
    reactions: {
      arisu: { lines: ["Is it safe to touch?", "The colors are so pretty!", "Science can be beautiful~"], expression: "surprised" },
      marin: { lines: ["Bubbles!! is it a potion?", "Mad scientist vibes~", "What happens if I drink it? jk jk"], expression: "excited" },
      nao: { lines: ["Exothermic reaction in progress.", "The catalyst ratio needs adjustment.", "...don't touch that. I'm serious."], expression: "thinking" },
      kurisu: { lines: ["MY experiment! Don't contaminate it!", "The reaction is proceeding as predicted.", "...want to see something cool?"], expression: "excited" },
      merrick: { lines: ["Alchemy in modern dress.", "The bubbles whisper of transformation.", "Even science has its magic."], expression: "thinking" },
    },
  },
  {
    id: "lab-monitor", sceneId: "lab", type: "hidden", revealAt: 3,
    position: { x: 10, y: 25, width: 14, height: 12 }, emoji: "📺", label: "A hidden monitor",
    affinityPerTap: 2, cooldown: 30, reward: { type: "diary", value: "Found a hidden monitor in the lab with strange data scrolling across it. The readings were unlike anything I've ever seen." }, aiOnFirstDiscovery: true,
    reactions: {
      arisu: { lines: ["What's on the screen?", "Those numbers look important...", "Is this a secret project?"], expression: "thinking" },
      marin: { lines: ["SECRET MONITOR!! spy movie arc!", "What's it say what's it say?!", "This is giving Area 51 energy~"], expression: "excited" },
      nao: { lines: ["Encrypted data stream. Challenge accepted.", "The refresh rate is non-standard... interesting.", "Someone doesn't want this found."], expression: "excited" },
      kurisu: { lines: ["These readings are— impossible!", "The data contradicts every known model!", "This monitor has been running for... years?!"], expression: "surprised" },
      merrick: { lines: ["Machines remembering what mortals forgot.", "The screen glows with forbidden knowledge.", "Some data was never meant to be found."], expression: "thinking" },
    },
  },
  {
    id: "lab-tesla", sceneId: "lab", type: "hidden", revealAt: 4,
    position: { x: 45, y: 15, width: 12, height: 14 }, emoji: "⚡", label: "A Tesla coil",
    affinityPerTap: 2, cooldown: 30, reward: { type: "affinity", value: 15 }, aiOnFirstDiscovery: false,
    reactions: {
      arisu: { lines: ["Waah! Electricity!", "That's scary but beautiful!", "Be careful!"], expression: "surprised" },
      marin: { lines: ["LIGHTNING IN A BOX!!", "This is the coolest thing EVER", "I feel like a supervillain~"], expression: "excited" },
      nao: { lines: ["Resonant transformer. 500kV potential.", "The arc frequency is tunable...", "I could power my entire setup with this."], expression: "excited" },
      kurisu: { lines: ["Tesla's greatest invention! Well, one of them.", "The resonant frequency is perfect!", "Stand back— this is REAL science!"], expression: "excited" },
      merrick: { lines: ["Tamed lightning. Prometheus would be proud.", "The spark of creation itself.", "Power flows to those who dare grasp it."], expression: "excited" },
    },
  },
  // ── Morning ──
  {
    id: "morning-bird", sceneId: "morning", type: "hidden", revealAt: 1,
    position: { x: 70, y: 15, width: 8, height: 8 }, emoji: "🐦", label: "A bird on the wire",
    affinityPerTap: 2, cooldown: 30, reward: { type: "affinity", value: 5 }, aiOnFirstDiscovery: false,
    reactions: {
      arisu: { lines: ["Good morning, little bird~", "What a sweet song!", "He's greeting the sun!"], expression: "happy" },
      marin: { lines: ["Birdie!! tweet tweet~", "Morning songbird vibes!", "He's just vibing up there"], expression: "happy" },
      nao: { lines: ["Passerine. Dawn chorus participant.", "Frequency: 2-4 kHz. Pleasant.", "...morning routines are important."], expression: "thinking" },
      kurisu: { lines: ["Circadian rhythm expressed via song.", "The early bird... well, you know.", "...it's a nice way to start the day."], expression: "happy" },
      merrick: { lines: ["The dawn herald arrives.", "Even I appreciate the morning song.", "Light returns... as it always does."], expression: "happy" },
    },
  },
  {
    id: "morning-sunflower", sceneId: "morning", type: "hidden", revealAt: 3,
    position: { x: 15, y: 70, width: 10, height: 14 }, emoji: "🌻", label: "A sunflower",
    affinityPerTap: 2, cooldown: 30, reward: { type: "affinity", value: 10 }, aiOnFirstDiscovery: false,
    reactions: {
      arisu: { lines: ["A sunflower! It's following the sun~", "So tall and bright!", "It's smiling at us!"], expression: "happy" },
      marin: { lines: ["SUNFLOWER!! she's gorgeous!", "Big flower energy~", "We match!! sunny and bright!"], expression: "excited" },
      nao: { lines: ["Heliotropism. Solar tracking behavior.", "The Fibonacci spiral in the seeds...", "Nature's algorithm. Elegant."], expression: "thinking" },
      kurisu: { lines: ["Helianthus annuus. Auxin-mediated phototropism.", "The seed arrangement IS mathematically interesting.", "...it does look cheerful. For a plant."], expression: "thinking" },
      merrick: { lines: ["It turns toward what gives it life.", "Even in darkness, it remembers the sun.", "A stubborn bloom. I respect that."], expression: "thinking" },
    },
  },
  // ── Sunset ──
  {
    id: "sunset-musician", sceneId: "sunset", type: "hidden", revealAt: 2,
    position: { x: 10, y: 65, width: 10, height: 14 }, emoji: "🎵", label: "A street musician",
    affinityPerTap: 2, cooldown: 30, reward: { type: "affinity", value: 10 }, aiOnFirstDiscovery: false,
    reactions: {
      arisu: { lines: ["What a beautiful melody~", "Music makes the sunset even better!", "I could listen forever..."], expression: "happy" },
      marin: { lines: ["This song SLAPS!", "Street performers are so talented!", "Main character music right here~"], expression: "excited" },
      nao: { lines: ["Acoustic guitar. Open tuning. Skill level: high.", "The reverb from the buildings creates natural delay.", "...Shazam can't find it. Original composition."], expression: "thinking" },
      kurisu: { lines: ["The frequency harmonics are... pleasant.", "Music and mathematics are deeply connected.", "...one more song. Then we go."], expression: "happy" },
      merrick: { lines: ["Music is the oldest magic.", "The notes linger like golden dust.", "A bard worthy of the twilight stage."], expression: "happy" },
    },
  },
  {
    id: "sunset-firework", sceneId: "sunset", type: "hidden", revealAt: 4,
    position: { x: 78, y: 25, width: 10, height: 10 }, emoji: "🎆", label: "A firework launcher",
    affinityPerTap: 2, cooldown: 30, reward: { type: "scene", value: "festival" }, aiOnFirstDiscovery: true,
    reactions: {
      arisu: { lines: ["Fireworks!! So romantic~!", "The colors are amazing!", "Like a dream come true!"], expression: "excited" },
      marin: { lines: ["FIREWORKS!! BEST. NIGHT. EVER!", "This is literally a festival episode!", "I'M SCREAMING THIS IS SO COOL!"], expression: "excited" },
      nao: { lines: ["Pyrotechnic charge detected. IGNITE.", "Strontium chloride for red, barium for green...", "...okay. THAT was impressive."], expression: "excited" },
      kurisu: { lines: ["Chemical combustion in controlled bursts— BEAUTIFUL!", "The chrysanthemum pattern requires precise timing!", "I'm not crying! It's the sulfur compounds!"], expression: "excited" },
      merrick: { lines: ["Mortal fire reaching for the stars.", "A burst of light against the endless dark.", "For a moment... the night surrenders."], expression: "devoted" },
    },
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function getInteractablesForScene(sceneId: string): Interactable[] {
  return ALL_INTERACTABLES.filter((i) => i.sceneId === sceneId);
}

export function getReactionLine(
  interactable: Interactable,
  characterId: string
): { line: string; expression: string } | null {
  const pool = interactable.reactions[characterId];
  if (!pool || pool.lines.length === 0) return null;
  const line = pool.lines[Math.floor(Math.random() * pool.lines.length)];
  return { line, expression: pool.expression };
}

export function buildDiscoveryContext(interactable: Interactable): string {
  return `The user just discovered a hidden ${interactable.label.toLowerCase()} for the first time. React with genuine surprise and delight in character. This is a special moment — make it memorable.`;
}
