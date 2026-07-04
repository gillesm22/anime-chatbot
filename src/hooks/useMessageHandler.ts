"use client";

import { useCallback, useRef } from "react";
import { useChat, saveUserName } from "@/lib/chat/context";
import {
  sendMessage,
  receiveResponse,
  setExpression,
} from "@/lib/chat/actions";
import { streamChat } from "@/lib/api";
import { formatMemoriesForPrompt, saveMemory } from "@/lib/memory";
import type { Expression } from "@/lib/characters/types";
import {
  formatAffinityForPrompt,
  getAffinity,
} from "@/lib/affinity";
import type { AffinityEvent } from "@/lib/affinity";
import { getCrossCharacterContext } from "@/lib/crosschar";
import { detectMiniGame, getMiniGamePrompt } from "@/lib/minigames";
import { formatGiftContextForPrompt } from "@/lib/gifts";
import type { Gift, CharacterReaction } from "@/lib/gifts";
import { getHeroAppearanceForPrompt, getHeroClassReactionForPrompt } from "@/lib/heroAvatar";
import { buildGreetingContext } from "@/lib/greetingContext";
import { getPersonalityContext, updateUserStyle } from "@/lib/personality";
import { TypingTracker } from "@/lib/typingReactions";
import { playSendSwoosh, playExpressionChange, playMessageReceived } from "@/lib/sounds";
import { triggerScreenShake } from "@/lib/screenShake";
import { haptic } from "@/lib/haptics";
import type { SceneId } from "@/lib/backgrounds";

// --- Memory extraction patterns ---
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
  const ignore = new Set(["a", "the", "an", "not", "just", "very", "so", "really", "here", "there", "fine", "good", "okay", "ok", "well", "sure", "sorry", "glad", "happy", "sad", "tired", "busy", "new", "back", "done", "ready"]);
  for (const pattern of NAME_PATTERNS) {
    const match = message.match(pattern);
    if (match) {
      const name = match[match.length - 1];
      if (name && !ignore.has(name.toLowerCase())) {
        return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
      }
    }
  }
  return null;
}

// --- Exports for testing ---
export { extractMemoriesFromMessage, extractNameFromIntroduction };

interface UseMessageHandlerArgs {
  characterId: string;
  userName: string | null;
  setUserName: (name: string) => void;
  responseLength: "short" | "medium" | "long";
  aiProvider: string;
  addAffinity: (event: AffinityEvent, bonus?: number) => {
    newMilestones: string[];
    leveledUp: boolean;
    data: ReturnType<typeof getAffinity>;
  };
  updateMoodFromExpressions: (expressions: string[]) => string;
  resetIdle: () => void;
  currentMood: string;
  pendingDiscoveryContext: string | null;
  clearDiscoveryContext: () => void;
  onSceneChange: (sceneId: SceneId) => void;
  onHexxPhrase: (phrase: string) => void;
  onConfessionCheck: () => void;
}

export function useMessageHandler({
  characterId,
  userName,
  setUserName,
  responseLength,
  aiProvider,
  addAffinity,
  updateMoodFromExpressions,
  resetIdle,
  currentMood,
  pendingDiscoveryContext,
  clearDiscoveryContext,
  onSceneChange,
  onHexxPhrase,
  onConfessionCheck,
}: UseMessageHandlerArgs) {
  const { state, dispatch } = useChat();
  const recentExpressionsRef = useRef<string[]>([]);
  const typingTrackerRef = useRef(new TypingTracker());

  const handleSend = useCallback(
    async (message: string) => {
      if (state.phase === "waiting" || state.phase === "speaking") return;

      resetIdle();
      playSendSwoosh();
      haptic.pulse();
      dispatch(sendMessage(message));

      const msgEvent: AffinityEvent = message.length > 50 ? "long_message" : "message_sent";
      addAffinity(msgEvent);

      const history = state.messages.map((m) => ({ role: m.role, content: m.content }));
      const memories = formatMemoriesForPrompt(characterId);

      let fullText = "";
      let expression = "neutral" as Expression;

      const affinityPrompt = formatAffinityForPrompt(characterId);
      const giftContext = formatGiftContextForPrompt(characterId);
      const heroAppearance = getHeroAppearanceForPrompt();
      const heroClassReaction = getHeroClassReactionForPrompt(characterId);
      const crossChar = getCrossCharacterContext(characterId);
      const miniGame = detectMiniGame(message);
      const miniGamePrompt = miniGame ? getMiniGamePrompt(miniGame, getAffinity(characterId).level) : undefined;
      const typingHint = typingTrackerRef.current.getReactionHint();
      const greetingCtx = state.messages.length === 0
        ? buildGreetingContext(characterId, 0, getAffinity(characterId).streak)
        : undefined;
      const personalityCtx = getPersonalityContext(characterId) || undefined;
      const hexxMentioned = message.toLowerCase().includes("hexx");
      const discoveryCtx = pendingDiscoveryContext;
      if (discoveryCtx) clearDiscoveryContext();

      try {
        await streamChat(
          {
            message, characterId, history, userName, memories, responseLength,
            provider: aiProvider, affinityPrompt, giftContext, heroAppearance,
            heroClassReaction, crossCharPrompt: crossChar.prompt, miniGamePrompt,
            typingHint,
            language: (typeof window !== "undefined" ? localStorage.getItem("anime-chatbot-language") : null) ?? "en",
            greetingContext: greetingCtx, personalityContext: personalityCtx,
            hexxMentioned, discoveryContext: discoveryCtx || undefined,
          },
          (event) => {
            switch (event.type) {
              case "expression":
                expression = event.expression;
                dispatch(setExpression(expression));
                playExpressionChange();
                haptic.expression(expression);
                playMessageReceived();
                if (expression === "angry" || expression === "surprised") {
                  triggerScreenShake(expression === "angry" ? "heavy" : "medium");
                }
                break;
              case "text":
                fullText += event.content;
                break;
              case "scene":
                if (event.sceneId) onSceneChange(event.sceneId as SceneId);
                break;
              case "hexx":
                onHexxPhrase(event.content);
                break;
              case "error":
                console.error("[chat] SSE error:", event.message);
                fullText = "I'm sorry, something went wrong. Please try again.";
                break;
            }
          }
        );
      } catch {
        fullText = fullText || "Connection lost. Please try again.";
      }

      // Name extraction
      if (!userName) {
        const nameFromUser = extractNameFromIntroduction(message);
        if (nameFromUser && fullText.toLowerCase().includes(nameFromUser.toLowerCase())) {
          saveUserName(characterId, nameFromUser);
          setUserName(nameFromUser);
        }
      }

      // Memory extraction
      const newMemories = extractMemoriesFromMessage(message);
      for (const mem of newMemories) {
        const category = ["likes", "loves", "dislikes", "favorite"].includes(mem.topic.split(":")[0])
          ? "preference" as const
          : "fact" as const;
        saveMemory(characterId, category, mem.detail, message);
      }

      // Mood tracking
      recentExpressionsRef.current.push(expression);
      if (recentExpressionsRef.current.length > 10) {
        recentExpressionsRef.current = recentExpressionsRef.current.slice(-10);
      }
      updateMoodFromExpressions(recentExpressionsRef.current);

      // Personality tracking
      updateUserStyle(characterId, { expressionTriggered: expression, messageLength: message.length });

      // Expression-based affinity bonuses
      if (expression === "laugh") addAffinity("made_her_laugh");
      if (expression === "flustered") addAffinity("made_her_flustered");

      dispatch(receiveResponse(fullText || "...", expression));

      // Check confession eligibility after response
      onConfessionCheck();
    },
    [dispatch, state.messages, state.phase, characterId, userName, responseLength, aiProvider,
     addAffinity, updateMoodFromExpressions, resetIdle, pendingDiscoveryContext, clearDiscoveryContext,
     onSceneChange, onHexxPhrase, onConfessionCheck, setUserName]
  );

  const handleGift = useCallback((gift: Gift, reaction: CharacterReaction) => {
    haptic.success();
    const exprParts = reaction.expression.split("/");
    const validExpr = (exprParts[0] || "happy") as Expression;
    dispatch(receiveResponse(reaction.dialogue, validExpr));
    addAffinity("message_sent", gift.affinityBonus);
    return { gift, reaction };
  }, [dispatch, addAffinity]);

  return {
    handleSend,
    handleGift,
    typingTracker: typingTrackerRef.current,
  };
}
