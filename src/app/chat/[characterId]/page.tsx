"use client";

import { use, useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getCharacter } from "@/lib/characters";
import { ChatProvider, useChat, getSavedUserName, saveUserName } from "@/lib/chat/context";
import {
  sendMessage,
  receiveResponse,
  lineTyped,
  advanceLine,
  toggleAutoAdvance,
  setExpression,
} from "@/lib/chat/actions";
import { streamChat } from "@/lib/api";
import { formatMemoriesForPrompt, saveMemory } from "@/lib/memory";
import { getMood, updateMood, moodToExpression } from "@/lib/mood";
import type { Expression } from "@/lib/characters/types";
import { useTimeTheme } from "@/lib/useTimeTheme";
import { CharacterSprite } from "@/components/CharacterSprite";
import { DialogueBox } from "@/components/DialogueBox";
import { ControlBar } from "@/components/ControlBar";
import { PageTransition } from "@/components/PageTransition";
import { ChatHistory } from "@/components/ChatHistory";
import { CharacterInfo } from "@/components/CharacterInfo";
import { OutfitSelector, type Outfit } from "@/components/OutfitSelector";
import { playSendSwoosh, playExpressionChange, playMessageReceived } from "@/lib/sounds";
import { startAmbientMusic, stopAmbientMusic } from "@/lib/ambient";
import { exportAsText } from "@/lib/exportChat";
import { ScreenshotMode } from "@/components/ScreenshotMode";
import { getAffinity, addAffinityPoints, recordVisit, formatAffinityForPrompt, getNextLevelProgress } from "@/lib/affinity";
import { getEngagementGreeting, getStreakMessage } from "@/lib/engagement";
import { getCrossCharacterContext } from "@/lib/crosschar";
import { detectMiniGame, getMiniGamePrompt } from "@/lib/minigames";
import { MilestoneToast } from "@/components/MilestoneToast";
import { SceneBackground } from "@/components/SceneBackground";
import { getCharacterDefaultScene, SCENES, type SceneId } from "@/lib/backgrounds";
import { ThemeToggle } from "@/components/ThemeToggle";
import { startSceneAudio, stopSceneAudio } from "@/lib/sceneSounds";
import { triggerScreenShake } from "@/lib/screenShake";
import { TypingTracker } from "@/lib/typingReactions";
import { startIdleTimer, resetIdleTimer, stopHumming } from "@/lib/humming";
import { canConfess, getConfessionScript, markConfessed } from "@/lib/confession";
import { ConfessionScene } from "@/components/ConfessionScene";
import { LanguageToggle } from "@/components/LanguageToggle";
import { VoiceToggle } from "@/components/VoiceToggle";
import { addDiaryEntry } from "@/lib/diary";
import { DiaryView } from "@/components/DiaryView";
import { GiftShop } from "@/components/GiftShop";
import type { Gift, CharacterReaction } from "@/lib/gifts";
import { formatGiftContextForPrompt } from "@/lib/gifts";
import { BottomNav } from "@/components/BottomNav";
import { InteractiveElements } from "@/components/InteractiveElements";
import { QuestPanel } from "@/components/QuestPanel";
import { OutfitCarousel } from "@/components/OutfitCarousel";
import { AffinityProgressBar } from "@/components/AffinityProgressBar";
import { MoodIndicator } from "@/components/MoodIndicator";
import { getHeroAppearanceForPrompt, getHeroClassReactionForPrompt } from "@/lib/heroAvatar";
import { BloodBat } from "@/components/BloodBat";

const MEMORY_PATTERNS: Array<{ pattern: RegExp; topic: string; group: number }> = [
  { pattern: /i (?:really )?like (\w[\w\s]{0,30}?\w)/i, topic: "likes", group: 1 },
  { pattern: /i love (\w[\w\s]{0,30}?\w)/i, topic: "loves", group: 1 },
  { pattern: /i hate (\w[\w\s]{0,30}?\w)/i, topic: "dislikes", group: 1 },
  { pattern: /i(?:'m| am) (?:a |an )?(\w[\w\s]{0,30}?\w)/i, topic: "identity", group: 1 },
  { pattern: /i work (?:at|for|in) (\w[\w\s]{0,30}?\w)/i, topic: "work", group: 1 },
  { pattern: /my favorite (\w+) is (\w[\w\s]{0,30}?\w)/i, topic: "favorite", group: 0 },
  { pattern: /i have (?:a |an )?(\w[\w\s]{0,30}?\w)/i, topic: "has", group: 1 },
  { pattern: /i(?:'m| am) from (\w[\w\s]{0,30}?\w)/i, topic: "origin", group: 1 },
  { pattern: /i live in (\w[\w\s]{0,30}?\w)/i, topic: "location", group: 1 },
  { pattern: /i(?:'m| am) (\d+) years old/i, topic: "age", group: 1 },
  { pattern: /i study (\w[\w\s]{0,30}?\w)/i, topic: "studies", group: 1 },
  { pattern: /i play (\w[\w\s]{0,30}?\w)/i, topic: "plays", group: 1 },
];

function extractMemoriesFromMessage(message: string): Array<{ topic: string; detail: string }> {
  const results: Array<{ topic: string; detail: string }> = [];
  for (const { pattern, topic, group } of MEMORY_PATTERNS) {
    const match = message.match(pattern);
    if (match) {
      const detail = group === 0 ? match[0] : match[group];
      if (detail && detail.length > 1) {
        results.push({ topic: `${topic}:${detail.toLowerCase().trim()}`, detail: match[0].trim() });
      }
    }
  }
  return results;
}

const NAME_PATTERNS = [
  /my name(?:'s| is) (\w+)/i,
  /i'm (\w+)/i,
  /i am (\w+)/i,
  /call me (\w+)/i,
  /they call me (\w+)/i,
  /the name(?:'s| is) (\w+)/i,
  /^(\w+)[.,!]? (?:here|nice to meet you|pleased to meet you)/i,
];

function extractNameFromIntroduction(message: string): string | null {
  for (const pattern of NAME_PATTERNS) {
    const match = message.match(pattern);
    if (match) {
      const name = match[match.length - 1];
      const ignore = new Set(["a", "the", "an", "not", "just", "very", "so", "really", "here", "there", "fine", "good", "okay", "ok", "well", "sure", "sorry", "glad", "happy", "sad", "tired", "busy", "new", "back", "done", "ready"]);
      if (name && !ignore.has(name.toLowerCase())) {
        return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
      }
    }
  }
  return null;
}

function ChatContent({ characterId }: { characterId: string }) {
  const character = getCharacter(characterId);
  const router = useRouter();
  const { state, dispatch } = useChat();
  const timeTheme = useTimeTheme();
  const autoAdvanceTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const recentExpressionsRef = useRef<string[]>([]);
  const currentMoodRef = useRef<ReturnType<typeof getMood>>("neutral");
  const [outfit, setOutfit] = useState<Outfit>("default");
  const [showHistory, setShowHistory] = useState(false);
  const [showCharInfo, setShowCharInfo] = useState(false);
  const [showScreenshot, setShowScreenshot] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [textSpeed, setTextSpeed] = useState(12);
  const [responseLength, setResponseLength] = useState<"short" | "medium" | "long">("medium");
  const [aiProvider, setAiProvider] = useState("gpt-4o");
  const greetingShownRef = useRef(false);
  const [milestoneQueue, setMilestoneQueue] = useState<string[]>([]);
  const [currentMilestone, setCurrentMilestone] = useState<string | null>(null);
  const [currentScene, setCurrentScene] = useState(() => getCharacterDefaultScene(characterId));
  const [showScenePicker, setShowScenePicker] = useState(false);
  const typingTrackerRef = useRef(new TypingTracker());
  const [showConfession, setShowConfession] = useState(false);
  const [showDiary, setShowDiary] = useState(false);
  const [showGiftShop, setShowGiftShop] = useState(false);
  const [showOutfitCarousel, setShowOutfitCarousel] = useState(false);
  const [showQuestPanel, setShowQuestPanel] = useState(false);
  const [giftReaction, setGiftReaction] = useState<{ gift: Gift; reaction: CharacterReaction } | null>(null);

  useEffect(() => {
    currentMoodRef.current = getMood(characterId);
    setUserName(getSavedUserName(characterId));
    const savedSpeed = localStorage.getItem("anime-chatbot-text-speed");
    if (savedSpeed) setTextSpeed(Number(savedSpeed));
    const savedLength = localStorage.getItem("anime-chatbot-response-length");
    if (savedLength) setResponseLength(savedLength as "short" | "medium" | "long");
    const savedProvider = localStorage.getItem("anime-chatbot-ai-provider");
    if (savedProvider) setAiProvider(savedProvider);

    const startMusic = () => {
      startAmbientMusic();
      document.removeEventListener("click", startMusic);
      document.removeEventListener("keydown", startMusic);
    };
    document.addEventListener("click", startMusic);
    document.addEventListener("keydown", startMusic);

    return () => {
      stopAmbientMusic();
      document.removeEventListener("click", startMusic);
      document.removeEventListener("keydown", startMusic);
    };
  }, [characterId]);

  // Scene audio lifecycle (separate so scene changes don't kill ambient music)
  useEffect(() => {
    startSceneAudio(currentScene, characterId);
    return () => { stopSceneAudio(); };
  }, [characterId, currentScene]);

  // Humming: separate effect so cleanup doesn't interfere
  useEffect(() => {
    const timer = setTimeout(() => {
      startIdleTimer(characterId);
    }, 2000); // small delay to let page settle
    return () => {
      clearTimeout(timer);
      stopHumming();
    };
  }, [characterId]);

  useEffect(() => {
    if (!greetingShownRef.current && state.historyLoaded && state.messages.length === 0 && character) {
      greetingShownRef.current = true;
      const { daysAbsent, newMilestones } = recordVisit(characterId);
      if (newMilestones.length > 0) {
        setMilestoneQueue((prev) => [...prev, ...newMilestones]);
      }
      const greeting = getEngagementGreeting(characterId, daysAbsent);
      const affinityData = getAffinity(characterId);
      const streakMsg = getStreakMessage(affinityData.streak, characterId);
      const fullGreeting = streakMsg ? `${greeting} ${streakMsg}` : greeting;
      dispatch(receiveResponse(fullGreeting, daysAbsent >= 4 ? "sad" : "happy"));
    }
  }, [character, state.historyLoaded, state.messages.length, dispatch, characterId]);

  useEffect(() => {
    if (milestoneQueue.length > 0 && !currentMilestone) {
      setCurrentMilestone(milestoneQueue[0]);
      setMilestoneQueue((prev) => prev.slice(1));
    }
  }, [milestoneQueue, currentMilestone]);

  useEffect(() => {
    if (state.phase === "idle" && state.messages.length > 0 && canConfess(characterId)) {
      // 20% chance to trigger after each conversation exchange
      if (Math.random() < 0.2) {
        setShowConfession(true);
      }
    }
  }, [state.phase, state.messages.length, characterId]);

  useEffect(() => {
    const msgCount = state.messages.filter(m => m.role === "user").length;
    if (msgCount > 0 && msgCount % 5 === 0 && state.phase === "idle" && character) {
      const lastUserMsgs = state.messages.slice(-10).filter(m => m.role === "user").map(m => m.content);
      const lastAssistantMsgs = state.messages.slice(-10).filter(m => m.role === "assistant").map(m => m.content);
      const topics = lastUserMsgs.map(m => m.split(" ").slice(0, 3).join(" ")).slice(-3);
      const mood = currentMoodRef.current;
      const entry = lastAssistantMsgs.length > 0
        ? `We talked about many things today. ${lastAssistantMsgs[lastAssistantMsgs.length - 1]?.slice(0, 100)}... It was a good conversation.`
        : "Had a nice chat today.";
      addDiaryEntry(characterId, entry, mood, topics);
    }
  }, [state.messages.length, state.phase]);

  if (!character) {
    router.replace("/");
    return null;
  }

  const handleSend = useCallback(
    async (message: string) => {
      resetIdleTimer();
      playSendSwoosh();
      dispatch(sendMessage(message));

      const msgEvent = message.length > 50
        ? { type: "long_message" as const }
        : { type: "message_sent" as const };
      const affinityResult = addAffinityPoints(characterId, msgEvent);
      if (affinityResult.newMilestones.length > 0) {
        setMilestoneQueue((prev) => [...prev, ...affinityResult.newMilestones]);
      }

      const history = state.messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const memories = formatMemoriesForPrompt(characterId);

      let fullText = "";
      // eslint-disable-next-line prefer-const -- mutated inside streamChat callback
      let expression = "neutral" as Expression;

      const affinityPrompt = formatAffinityForPrompt(characterId);
      const giftContext = formatGiftContextForPrompt(characterId);
      const heroAppearance = getHeroAppearanceForPrompt();
      const heroClassReaction = getHeroClassReactionForPrompt(characterId);
      const crossChar = getCrossCharacterContext(characterId);
      const miniGame = detectMiniGame(message);
      const miniGamePrompt = miniGame ? getMiniGamePrompt(miniGame, getAffinity(characterId).level) : undefined;

      const typingHint = typingTrackerRef.current.getReactionHint();

      await streamChat(
        { message, characterId, history, userName, memories, responseLength, provider: aiProvider, affinityPrompt, giftContext, heroAppearance, heroClassReaction, crossCharPrompt: crossChar.prompt, miniGamePrompt, typingHint, language: (typeof window !== "undefined" ? localStorage.getItem("anime-chatbot-language") : null) ?? "en" },
        (event) => {
          switch (event.type) {
            case "expression":
              expression = event.expression;
              // Apply expression to sprite immediately during streaming
              dispatch(setExpression(expression));
              playExpressionChange();
              playMessageReceived();
              if (expression === "angry" || expression === "surprised") {
                triggerScreenShake(expression === "angry" ? "heavy" : "medium");
              }
              break;
            case "text":
              fullText += event.content;
              break;
            case "error":
              fullText = "I'm sorry, something went wrong. Please try again.";
              break;
          }
        }
      );

      if (!userName) {
        const nameFromUser = extractNameFromIntroduction(message);
        if (nameFromUser) {
          const nameLower = nameFromUser.toLowerCase();
          const responseLower = fullText.toLowerCase();
          if (responseLower.includes(nameLower)) {
            saveUserName(characterId, nameFromUser);
            setUserName(nameFromUser);
          }
        }
      }

      const newMemories = extractMemoriesFromMessage(message);
      for (const mem of newMemories) {
        const category = ["likes", "loves", "dislikes", "favorite"].includes(mem.topic.split(":")[0])
          ? "preference" as const
          : "fact" as const;
        saveMemory(characterId, category, mem.detail, message);
      }

      recentExpressionsRef.current.push(expression);
      if (recentExpressionsRef.current.length > 10) {
        recentExpressionsRef.current = recentExpressionsRef.current.slice(-10);
      }
      currentMoodRef.current = updateMood(characterId, recentExpressionsRef.current);

      if (expression === "laugh") {
        const r = addAffinityPoints(characterId, { type: "made_her_laugh" });
        if (r.newMilestones.length > 0) setMilestoneQueue((prev) => [...prev, ...r.newMilestones]);
      }
      if (expression === "flustered") {
        const r = addAffinityPoints(characterId, { type: "made_her_flustered" });
        if (r.newMilestones.length > 0) setMilestoneQueue((prev) => [...prev, ...r.newMilestones]);
      }
      dispatch(receiveResponse(fullText || "...", expression));
    },
    [dispatch, state.messages, characterId, userName]
  );

  const handleGift = useCallback((gift: Gift, reaction: CharacterReaction) => {
    setGiftReaction({ gift, reaction });
    setShowGiftShop(false);
    dispatch(receiveResponse(reaction.dialogue, reaction.expression as any));
    const result = addAffinityPoints(characterId, { type: "message_sent" });
    if (result.newMilestones.length > 0) {
      setMilestoneQueue(prev => [...prev, ...result.newMilestones]);
    }
    setTimeout(() => setGiftReaction(null), 5000);
  }, [characterId, dispatch]);

  const handleTypeComplete = useCallback(() => {
    dispatch(lineTyped());
  }, [dispatch]);

  const handleAdvance = useCallback(() => {
    dispatch(advanceLine());
  }, [dispatch]);

  const prevPhaseRef = useRef(state.phase);
  useEffect(() => {
    if (prevPhaseRef.current !== "idle" && state.phase === "idle") {
      dispatch(setExpression(moodToExpression(currentMoodRef.current)));
    }
    prevPhaseRef.current = state.phase;
  }, [state.phase, dispatch]);

  useEffect(() => {
    if (state.autoAdvance && state.phase === "speaking" && !state.isTyping) {
      autoAdvanceTimerRef.current = setTimeout(() => {
        dispatch(advanceLine());
      }, 1500);
      return () => {
        if (autoAdvanceTimerRef.current) clearTimeout(autoAdvanceTimerRef.current);
      };
    }
  }, [state.autoAdvance, state.phase, state.isTyping, state.currentLineIndex, dispatch]);

  const currentLine = state.currentLines[state.currentLineIndex] || "";
  const showInput = state.phase === "idle";
  const showDialogue = state.phase === "speaking" || state.phase === "waiting";
  const isTalking = state.phase === "speaking" && state.isTyping;
  const showAdvanceIndicator =
    state.phase === "speaking" &&
    !state.isTyping;

  return (
    <PageTransition>
      <div
        id="chat-container"
        className="h-screen flex flex-col overflow-hidden"
        style={{ position: "relative" }}
        suppressHydrationWarning
      >
        <SceneBackground sceneId={currentScene} characterAccent={character.theme.accent} />
        <InteractiveElements sceneId={currentScene} accentColor={character.theme.accent} />
        {currentMilestone && character && (
          <MilestoneToast
            milestone={currentMilestone}
            accentColor={character.theme.accent}
            onDone={() => setCurrentMilestone(null)}
          />
        )}
        {/* Control bar */}
        <div className="flex items-center justify-between px-3 py-2 md:px-6 md:py-3 relative z-20" style={{ background: "rgba(13,13,18,0.4)", backdropFilter: "blur(8px)" }}>
          {/* Left - back + history toggle + theme */}
          <div className="flex items-center gap-2 md:gap-4">
            <VoiceToggle />
            <ThemeToggle />
            <LanguageToggle />
            <button
              onClick={() => router.push("/")}
              className="flex items-center gap-1 md:gap-2 text-text-secondary hover:text-text transition-colors text-xs md:text-sm"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="hidden sm:inline">Back</span>
            </button>
            <Link
              href="/settings"
              className="flex items-center text-text-secondary hover:text-text transition-colors"
              title="Settings"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M6.86 1.45a1.2 1.2 0 0 1 2.28 0l.27.82a1.2 1.2 0 0 0 1.52.74l.82-.27a1.2 1.2 0 0 1 1.61 1.61l-.27.82a1.2 1.2 0 0 0 .74 1.52l.82.27a1.2 1.2 0 0 1 0 2.28l-.82.27a1.2 1.2 0 0 0-.74 1.52l.27.82a1.2 1.2 0 0 1-1.61 1.61l-.82-.27a1.2 1.2 0 0 0-1.52.74l-.27.82a1.2 1.2 0 0 1-2.28 0l-.27-.82a1.2 1.2 0 0 0-1.52-.74l-.82.27a1.2 1.2 0 0 1-1.61-1.61l.27-.82a1.2 1.2 0 0 0-.74-1.52l-.82-.27a1.2 1.2 0 0 1 0-2.28l.82-.27a1.2 1.2 0 0 0 .74-1.52l-.27-.82A1.2 1.2 0 0 1 4.25 1.9l.82.27a1.2 1.2 0 0 0 1.52-.74l.27-.82Z" stroke="currentColor" strokeWidth="1.2" />
                <circle cx="8" cy="8" r="2.2" stroke="currentColor" strokeWidth="1.2" />
              </svg>
            </Link>
            <button
              onClick={() => setShowHistory((prev) => !prev)}
              className="flex items-center gap-1 md:gap-1.5 text-xs md:text-sm transition-colors"
              style={{ color: showHistory ? character.theme.accent : "rgba(255,255,255,0.5)" }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M2 4h12M2 8h8M2 12h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              Log
            </button>
            {state.messages.length > 0 && (
              <>
                <button
                  onClick={() => exportAsText(state.messages, character.name)}
                  className="flex items-center gap-1 md:gap-1.5 text-xs md:text-sm text-text-secondary hover:text-text transition-colors"
                  title="Export chat"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M8 2v8M5 7l3 3 3-3M3 12h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <button
                  onClick={() => setShowScreenshot(true)}
                  className="flex items-center gap-1 md:gap-1.5 text-xs md:text-sm text-text-secondary hover:text-text transition-colors"
                  title="Screenshot mode"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <rect x="1.5" y="3.5" width="13" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
                    <circle cx="8" cy="8.5" r="2.5" stroke="currentColor" strokeWidth="1.3" />
                    <path d="M5.5 3.5L6.5 1.5h3l1 2" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
                  </svg>
                </button>
              </>
            )}
            <button
              onClick={() => setShowDiary(true)}
              className="flex items-center gap-1.5 text-xs md:text-sm transition-all duration-200 hover:scale-110"
              style={{ color: character.theme.accent, opacity: 0.7 }}
              title="Diary"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <rect x="2" y="1" width="12" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
                <path d="M5 4.5h6M5 7h6M5 9.5h4" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.6"/>
                <path d="M4 1v14" stroke="currentColor" strokeWidth="1.3"/>
              </svg>
              <span className="hidden sm:inline">Diary</span>
            </button>
            <button
              onClick={() => setShowGiftShop(true)}
              className="flex items-center gap-1.5 text-xs md:text-sm transition-all duration-200 hover:scale-110"
              style={{ color: character.theme.accent, opacity: 0.7 }}
              title="Gifts"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <rect x="1" y="7" width="14" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
                <path d="M8 7v8" stroke="currentColor" strokeWidth="1.3"/>
                <path d="M1 10h14" stroke="currentColor" strokeWidth="1" opacity="0.4"/>
                <path d="M8 7C8 7 6 5.5 4.5 4.5C3 3.5 3 1.5 5 1.5C7 1.5 8 4 8 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                <path d="M8 7C8 7 10 5.5 11.5 4.5C13 3.5 13 1.5 11 1.5C9 1.5 8 4 8 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
              <span className="hidden sm:inline">Gifts</span>
            </button>
            <button
              onClick={() => setShowScenePicker((prev) => !prev)}
              className="flex items-center gap-1.5 text-xs md:text-sm transition-all duration-200 hover:scale-110"
              style={{ color: showScenePicker ? character.theme.accent : "rgba(255,255,255,0.5)" }}
              title="Change scene"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <rect x="1" y="2" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="1.3"/>
                <path d="M1 10l4-3 3 2 4-4 3 3" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" strokeLinecap="round"/>
                <circle cx="11" cy="5.5" r="1.5" stroke="currentColor" strokeWidth="1"/>
              </svg>
            </button>
          </div>

          {/* Center - name + info */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs md:text-sm font-medium" style={{ color: character.theme.accent }}>
              {character.name}
            </span>
            <MoodIndicator mood={currentMoodRef.current} accentColor={character.theme.accent} />
            <button
              onClick={() => setShowCharInfo(true)}
              className="w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold transition-colors"
              style={{
                color: character.theme.accent,
                border: `1.5px solid ${character.theme.accent}60`,
              }}
            >
              i
            </button>
          </div>

          {/* Right - auto toggle */}
          <button
            onClick={() => dispatch(toggleAutoAdvance())}
            className="flex items-center gap-1 md:gap-2 text-xs md:text-sm transition-colors"
            style={{ color: state.autoAdvance ? character.theme.accent : "rgba(255,255,255,0.5)" }}
          >
            <div
              className="w-8 h-4 rounded-full relative transition-colors"
              style={{ backgroundColor: state.autoAdvance ? `${character.theme.accent}40` : "rgba(255,255,255,0.1)" }}
            >
              <div
                className="absolute top-0.5 w-3 h-3 rounded-full transition-all"
                style={{
                  backgroundColor: state.autoAdvance ? character.theme.accent : "rgba(255,255,255,0.3)",
                  left: state.autoAdvance ? "calc(100% - 14px)" : "2px",
                }}
              />
            </div>
            Auto
          </button>
        </div>

        <div className="px-4 relative z-10">
          <AffinityProgressBar
            level={getAffinity(characterId).level}
            levelName={getAffinity(characterId).levelName}
            progress={getNextLevelProgress(getAffinity(characterId)).percent}
            accentColor={character.theme.accent}
          />
        </div>

        {/* Chat history panel */}
        <ChatHistory
          messages={state.messages}
          characterName={character.name}
          accentColor={character.theme.accent}
          visible={showHistory}
          onClose={() => setShowHistory(false)}
        />

        {/* Character info panel */}
        <CharacterInfo
          character={character}
          visible={showCharInfo}
          onClose={() => setShowCharInfo(false)}
        />

        {/* Sprite area - single click for flustered reaction */}
        <div
          className="flex-1 min-h-0 relative overflow-hidden cursor-pointer z-10"
          onClick={(e) => {
            if (e.detail === 1 && state.phase === "idle") {
              dispatch(setExpression("flustered"));
              setTimeout(() => dispatch(setExpression(moodToExpression(currentMoodRef.current))), 2000);
            }
          }}
        >
          <CharacterSprite
            character={character}
            expression={state.currentExpression}
            isTalking={isTalking}
            outfit={outfit}
            onHeadpat={() => {
              const r = addAffinityPoints(characterId, { type: "headpat" });
              if (r.newMilestones.length > 0) setMilestoneQueue((prev) => [...prev, ...r.newMilestones]);
            }}
          />
          <OutfitSelector
            accentColor={character.theme.accent}
            characterId={characterId}
            currentOutfit={outfit}
            onSelectOutfit={setOutfit}
          />
        </div>

        {/* Dialogue / input area - always visible at bottom */}
        <div className="flex-shrink-0 relative z-10 pb-20">
          {showDialogue && (
            <DialogueBox
              characterName={character.name}
              characterId={characterId}
              accentColor={character.theme.accent}
              line={state.phase === "waiting" ? "..." : currentLine}
              isTyping={state.isTyping}
              onAdvance={handleAdvance}
              onTypeComplete={handleTypeComplete}
              showAdvance={showAdvanceIndicator}
              typeSpeed={textSpeed}
            />
          )}
          <div className="px-3 py-3 md:px-6 md:py-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const input = e.currentTarget.querySelector("input") as HTMLInputElement;
                if (input.value.trim()) {
                  handleSend(input.value.trim());
                  input.value = "";
                }
              }}
              className="flex gap-3"
            >
              <input
                type="text"
                placeholder="Type your message..."
                autoFocus
                className="flex-1 min-w-0 px-3 py-2.5 md:px-5 md:py-3 rounded-full bg-surface text-text text-sm md:text-base outline-none"
                style={{ border: `1.5px solid ${character.theme.accent}40` }}
                onFocus={(e) => { e.currentTarget.style.borderColor = character.theme.accent; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = `${character.theme.accent}40`; }}
              />
              <button
                type="submit"
                className="px-4 py-2.5 md:px-6 md:py-3 rounded-full text-sm font-medium flex-shrink-0"
                style={{ backgroundColor: character.theme.accent, color: "#0d0d12" }}
              >
                Send
              </button>
            </form>
          </div>
        </div>

        <OutfitCarousel
          characterId={characterId}
          basePath={character.sprite.basePath}
          accentColor={character.theme.accent}
          currentOutfit={outfit}
          onSelectOutfit={setOutfit}
          isOpen={showOutfitCarousel}
          onClose={() => setShowOutfitCarousel(false)}
        />

        {/* Scene picker panel */}
        <div
          style={{
            position: "fixed",
            bottom: "65px",
            left: 0,
            right: 0,
            zIndex: 35,
            background: "rgba(13,13,18,0.9)",
            backdropFilter: "blur(14px)",
            borderTop: "1px solid rgba(255,255,255,0.08)",
            padding: "12px 12px 16px",
            transform: showScenePicker ? "translateY(0)" : "translateY(110%)",
            transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            pointerEvents: showScenePicker ? "auto" : "none",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
            <span style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(255,255,255,0.5)" }}>
              Scenes
            </span>
            <button
              onClick={() => setShowScenePicker(false)}
              style={{ background: "rgba(255,255,255,0.08)", border: "none", borderRadius: "50%", width: "24px", height: "24px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "rgba(255,255,255,0.6)", fontSize: "14px", lineHeight: 1, padding: 0 }}
              aria-label="Close scene picker"
            >
              ✕
            </button>
          </div>
          <div style={{ display: "flex", gap: "8px", overflowX: "auto", overflowY: "hidden", paddingBottom: "2px" }}>
            {(Object.values(SCENES) as { id: SceneId; name: string; gradient: string }[]).map((scene) => {
              const isActive = scene.id === currentScene;
              return (
                <button
                  key={scene.id}
                  onClick={() => { setCurrentScene(scene.id); setShowScenePicker(false); }}
                  style={{
                    flex: "0 0 auto",
                    width: "60px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "5px",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                  }}
                  title={scene.name}
                >
                  <div
                    style={{
                      width: "60px",
                      height: "40px",
                      borderRadius: "8px",
                      overflow: "hidden",
                      border: isActive ? `2px solid ${character.theme.accent}` : "2px solid rgba(255,255,255,0.1)",
                      boxShadow: isActive ? `0 0 10px ${character.theme.accent}66` : "none",
                      background: scene.gradient,
                    }}
                  />
                  <span style={{ fontSize: "8px", color: isActive ? character.theme.accent : "rgba(255,255,255,0.45)", fontWeight: isActive ? 600 : 400, textAlign: "center", maxWidth: "60px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {scene.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <BottomNav
          characterId={characterId}
          accentColor={character.theme.accent}
          onShowDiary={() => setShowDiary(true)}
          onShowGifts={() => setShowGiftShop(true)}
          onShowHistory={() => setShowHistory(prev => !prev)}
          onShowScreenshot={() => setShowScreenshot(true)}
          onShowOutfits={() => setShowOutfitCarousel(prev => !prev)}
          onShowQuests={() => setShowQuestPanel(true)}
        />
        <BloodBat
          expression={state.currentExpression}
          accentColor={character.theme.accent}
          isIdle={state.phase === "idle" && state.messages.length > 0}
        />
      </div>

      {showConfession && character && (
        <ConfessionScene
          characterId={characterId}
          script={getConfessionScript(characterId)}
          onComplete={(ending) => {
            markConfessed(characterId);
            setShowConfession(false);
          }}
        />
      )}

      {showDiary && character && (
        <DiaryView
          characterId={characterId}
          characterName={character.name}
          accentColor={character.theme.accent}
          onClose={() => setShowDiary(false)}
        />
      )}
      {showGiftShop && character && (
        <GiftShop
          characterId={characterId}
          characterName={character.name}
          accentColor={character.theme.accent}
          onGift={handleGift}
          onClose={() => setShowGiftShop(false)}
        />
      )}
      {showQuestPanel && character && (
        <QuestPanel
          characterId={characterId}
          accentColor={character.theme.accent}
          onClose={() => setShowQuestPanel(false)}
          onClaimReward={(points) => {
            const result = addAffinityPoints(characterId, { type: "message_sent" });
            if (result.newMilestones.length > 0) {
              setMilestoneQueue(prev => [...prev, ...result.newMilestones]);
            }
          }}
        />
      )}

      {/* Screenshot mode overlay */}
      <ScreenshotMode
        character={character}
        expression={state.currentExpression}
        lastLine={
          [...state.messages].reverse().find((m) => m.role === "assistant")?.content || ""
        }
        visible={showScreenshot}
        onClose={() => setShowScreenshot(false)}
      />
    </PageTransition>
  );
}

function ClientOnly({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="h-screen bg-bg" />;
  return <>{children}</>;
}

export default function ChatPage({
  params,
}: {
  params: Promise<{ characterId: string }>;
}) {
  const { characterId } = use(params);

  return (
    <ClientOnly>
      <ChatProvider characterId={characterId}>
        <ChatContent characterId={characterId} />
      </ChatProvider>
    </ClientOnly>
  );
}
