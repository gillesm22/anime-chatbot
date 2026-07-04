"use client";

import { use, useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { ChatProvider, useChat } from "@/lib/chat/context";
import { receiveResponse, setExpression } from "@/lib/chat/actions";
import { useCharacterSession } from "@/hooks/useCharacterSession";
import { useMessageHandler } from "@/hooks/useMessageHandler";
import { usePanels } from "@/hooks/usePanels";
import { useVNControls } from "@/hooks/useVNControls";
import { useExpressionEffects } from "@/hooks/useExpressionEffects";
import { VNLayout } from "@/components/VNLayout";
import { VNMenu } from "@/components/VNMenu";
import { VNTransition } from "@/components/VNTransition";
import { SceneObjects } from "@/components/SceneObjects";
import { DialogueBox } from "@/components/DialogueBox";
import { ChatHistory } from "@/components/ChatHistory";
import { CharacterInfo } from "@/components/CharacterInfo";
import { OutfitCarousel } from "@/components/OutfitCarousel";
import { ConfessionScene } from "@/components/ConfessionScene";
import { MilestoneScene } from "@/components/MilestoneScene";
import { MilestoneToast } from "@/components/MilestoneToast";
import { SaveToast } from "@/components/SaveToast";
import { DiaryView } from "@/components/DiaryView";
import { GiftShop } from "@/components/GiftShop";
import { QuestPanel } from "@/components/QuestPanel";
import { BloodBat } from "@/components/BloodBat";
import { ScreenshotMode } from "@/components/ScreenshotMode";
import { VoiceToggle } from "@/components/VoiceToggle";
import { ThemeToggle } from "@/components/ThemeToggle";

import { getStarters } from "@/lib/conversationStarters";
import { getEngagementGreeting, getStreakMessage } from "@/lib/engagement";
import { getSessionStartMood } from "@/lib/mood";
import { getAffinity, getNextLevelProgress, recordVisit } from "@/lib/affinity";
import { canConfess, getConfessionScript, markConfessed } from "@/lib/confession";
import { addDiaryEntry } from "@/lib/diary";
import { SCENES, type SceneId } from "@/lib/backgrounds";
import type { Gift, CharacterReaction } from "@/lib/gifts";

// ─── ChatContent ────────────────────────────────────────────────────────────

function ChatContent({ characterId }: { characterId: string }) {
  const router = useRouter();
  const { state, dispatch } = useChat();
  const containerRef = useRef<HTMLDivElement>(null);
  const greetingShownRef = useRef(false);

  // ── Hooks ────────────────────────────────────────────────────────────────
  const session = useCharacterSession(characterId);
  const panels = usePanels();

  // Local UI state
  const [showConfession, setShowConfession] = useState(false);
  const [giftReaction, setGiftReaction] = useState<{ gift: Gift; reaction: CharacterReaction } | null>(null);
  const [starters, setStarters] = useState<string[]>([]);
  const [hexxPhrase, setHexxPhrase] = useState<string | null>(null);
  const [pendingDiscoveryContext, setPendingDiscoveryContext] = useState<string | null>(null);
  const [discoveryToast, setDiscoveryToast] = useState<{ line: string; expression: string } | null>(null);
  const [currentMilestone, setCurrentMilestone] = useState<string | null>(null);
  const [sceneTransition, setSceneTransition] = useState(false);

  const { handleSend, handleGift, typingTracker } = useMessageHandler({
    characterId,
    userName: session.userName,
    setUserName: session.setUserName,
    responseLength: session.responseLength,
    aiProvider: session.aiProvider,
    addAffinity: session.addAffinity,
    updateMoodFromExpressions: session.updateMoodFromExpressions,
    resetIdle: session.resetIdle,
    currentMood: session.currentMood,
    pendingDiscoveryContext,
    clearDiscoveryContext: () => setPendingDiscoveryContext(null),
    onSceneChange: (sceneId) => {
      setSceneTransition(true);
      setTimeout(() => session.setCurrentScene(sceneId), 300);
    },
    onHexxPhrase: setHexxPhrase,
    onConfessionCheck: () => {
      if (canConfess(characterId) && Math.random() < 0.2) {
        setShowConfession(true);
      }
    },
  });

  const vnControls = useVNControls({
    characterId,
    containerRef,
    activePanel: panels.activePanel,
    openPanel: panels.openPanel,
    closePanel: panels.closePanel,
  });

  const effects = useExpressionEffects({ currentMood: session.currentMood });

  // ── Effects ──────────────────────────────────────────────────────────────

  // Greeting on first visit
  useEffect(() => {
    if (!greetingShownRef.current && state.historyLoaded && state.messages.length === 0 && session.character) {
      greetingShownRef.current = true;
      const { daysAbsent, newMilestones } = recordVisit(characterId);
      if (newMilestones.length > 0) {
        session.setMilestoneQueue((prev) => [...prev, ...newMilestones]);
      }
      const affinityData = getAffinity(characterId);
      const { mood: startMood } = getSessionStartMood(characterId, daysAbsent, affinityData.streak);
      if (startMood === "cheerful") dispatch(setExpression("happy"));
      else if (startMood === "thoughtful") dispatch(setExpression("thinking"));
      const greeting = getEngagementGreeting(characterId, daysAbsent);
      const streakMsg = getStreakMessage(affinityData.streak, characterId);
      const fullGreeting = streakMsg ? `${greeting} ${streakMsg}` : greeting;
      dispatch(receiveResponse(fullGreeting, daysAbsent >= 4 ? "sad" : "happy"));
    }
  }, [session.character, state.historyLoaded, state.messages.length, dispatch, characterId, session.setMilestoneQueue]);

  // Conversation starters
  useEffect(() => {
    if (state.historyLoaded && state.messages.length === 0) {
      setStarters(getStarters(characterId));
    } else {
      setStarters([]);
    }
  }, [state.historyLoaded, state.messages.length, characterId]);

  // Milestone queue consumer
  useEffect(() => {
    if (session.milestoneQueue.length > 0 && !currentMilestone) {
      setCurrentMilestone(session.milestoneQueue[0]);
      session.setMilestoneQueue((prev) => prev.slice(1));
    }
  }, [session.milestoneQueue, currentMilestone, session.setMilestoneQueue]);

  // Diary auto-entry every 5 user messages
  useEffect(() => {
    const msgCount = state.messages.filter((m) => m.role === "user").length;
    if (msgCount > 0 && msgCount % 5 === 0 && state.phase === "idle" && session.character) {
      const lastAssistant = state.messages.slice(-10).filter((m) => m.role === "assistant").map((m) => m.content);
      const lastUser = state.messages.slice(-10).filter((m) => m.role === "user").map((m) => m.content);
      const topics = lastUser.map((m) => m.split(" ").slice(0, 3).join(" ")).slice(-3);
      const entry = lastAssistant.length > 0
        ? `We talked about many things today. ${lastAssistant[lastAssistant.length - 1]?.slice(0, 100)}... It was a good conversation.`
        : "Had a nice chat today.";
      addDiaryEntry(characterId, entry, session.currentMood, topics);
    }
  }, [state.messages.length, state.phase, characterId, session.character, session.currentMood, state.messages]);

  // Discovery reaction handler
  const handleDiscoveryReaction = useCallback((line: string, expression: string) => {
    dispatch(setExpression(expression as any));
    setDiscoveryToast({ line, expression });
    setTimeout(() => setDiscoveryToast(null), 3500);
  }, [dispatch]);

  // Gift handler wrapper
  const onGift = useCallback((gift: Gift, reaction: CharacterReaction) => {
    const result = handleGift(gift, reaction);
    setGiftReaction(result);
    panels.closePanel();
    setTimeout(() => setGiftReaction(null), 5000);
  }, [handleGift, panels]);

  // ── Guard ────────────────────────────────────────────────────────────────

  if (!session.character) {
    return null;
  }

  const character = session.character;
  const accent = character.theme.accent;

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <VNLayout
      character={character}
      characterId={characterId}
      expression={state.currentExpression}
      isTalking={vnControls.isTalking}
      outfit={session.outfit}
      currentScene={session.currentScene}
      activeEffect={effects.activeEffect}
      onHeadpat={() => session.addAffinity("headpat")}
      onExpressionChange={effects.handleExpressionChange}
      onSpriteTap={effects.handleSpriteTap}
      onDiscoveryReaction={handleDiscoveryReaction}
      onDiscoveryContext={(ctx) => setPendingDiscoveryContext(ctx)}
      containerRef={containerRef}
      headerLeft={
        <>
          <button
            onClick={() => router.push("/")}
            className="touch-target flex items-center gap-1 text-text-secondary hover:text-text transition-colors text-xs"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div className="flex flex-col gap-1">
            <span className="text-sm font-semibold leading-none" style={{ color: accent }}>{character.name}</span>
            {(() => {
              const aff = getAffinity(characterId);
              const progress = getNextLevelProgress(aff);
              return (
                <div className="flex items-center gap-2">
                  <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.6)", lineHeight: 1, fontWeight: 500 }}>
                    Lv.{aff.level} {aff.levelName}
                  </span>
                  <div style={{
                    width: 80, height: 5, borderRadius: 3,
                    background: "rgba(255,255,255,0.15)",
                    overflow: "hidden",
                  }}>
                    <div style={{
                      width: `${progress.percent}%`, height: "100%",
                      background: accent, borderRadius: 3,
                      transition: "width 0.5s ease",
                    }} />
                  </div>
                  <span style={{ fontSize: "9px", color: "rgba(255,255,255,0.4)", lineHeight: 1 }}>
                    {Math.round(progress.percent)}%
                  </span>
                </div>
              );
            })()}
          </div>
          <VoiceToggle />
          <ThemeToggle />
        </>
      }
      headerRight={
        <button
          onClick={vnControls.handleToggleAutoAdvance}
          className="flex items-center gap-1 text-xs transition-colors"
          style={{ color: state.autoAdvance ? accent : "var(--color-text-secondary)" }}
        >
          <div
            className="w-8 h-4 rounded-full relative transition-colors"
            style={{ backgroundColor: state.autoAdvance ? `${accent}40` : "var(--color-toggle-bg)" }}
          >
            <div
              className="absolute top-0.5 w-3 h-3 rounded-full transition-all"
              style={{
                backgroundColor: state.autoAdvance ? accent : "var(--color-toggle-knob)",
                left: state.autoAdvance ? "calc(100% - 14px)" : "2px",
              }}
            />
          </div>
          Auto
        </button>
      }
      overlays={
        <>
          <SceneObjects
            sceneId={session.currentScene}
            accentColor={accent}
            onObjectTap={(action) => {/* scene object actions handled by InteractiveElements */}}
          />
          <VNMenu
            accentColor={accent}
            onSelect={panels.openPanel}
            onSave={session.handleSave}
          />

          {currentMilestone && (
            <MilestoneToast milestone={currentMilestone} accentColor={accent} onDone={() => setCurrentMilestone(null)} />
          )}
          {session.saveToast && (
            <SaveToast message={session.saveToast.message} type={session.saveToast.type} onDone={() => session.setSaveToast(null)} />
          )}

          {/* Discovery reaction toast */}
          {discoveryToast && (
            <div
              style={{
                position: "absolute", bottom: 140, left: "50%", transform: "translateX(-50%)",
                zIndex: 25, maxWidth: "85%", padding: "10px 20px", borderRadius: 16,
                background: "var(--color-surface-alpha, rgba(10,10,16,0.88))", backdropFilter: "blur(10px)",
                border: `1px solid ${accent}30`, color: "var(--color-dialogue-text, #e8e0e8)",
                fontSize: "14px", fontFamily: "var(--font-dialogue, 'Zen Maru Gothic', sans-serif)",
                textAlign: "center", animation: "fadeIn 0.3s ease-out, fadeIn 0.3s ease-in 3s reverse forwards",
                pointerEvents: "none",
              }}
            >
              <span style={{ color: accent, fontWeight: 600, fontSize: "11px", letterSpacing: "0.05em", marginRight: 6 }}>
                {character.name}:
              </span>
              {discoveryToast.line}
            </div>
          )}

          {/* Panels */}
          <ChatHistory
            messages={state.messages}
            characterName={character.name}
            accentColor={accent}
            visible={panels.isOpen("history")}
            onClose={panels.closePanel}
          />
          <CharacterInfo
            character={character}
            visible={panels.isOpen("charInfo")}
            onClose={panels.closePanel}
          />
          <OutfitCarousel
            characterId={characterId}
            basePath={character.sprite.basePath}
            accentColor={accent}
            currentOutfit={session.outfit}
            onSelectOutfit={session.setOutfit}
            isOpen={panels.isOpen("outfits")}
            onClose={panels.closePanel}
          />
          {panels.isOpen("diary") && (
            <DiaryView characterId={characterId} characterName={character.name} accentColor={accent} onClose={panels.closePanel} />
          )}
          {panels.isOpen("gifts") && (
            <GiftShop characterId={characterId} characterName={character.name} accentColor={accent} onGift={onGift} onClose={panels.closePanel} />
          )}
          {panels.isOpen("quests") && (
            <QuestPanel
              characterId={characterId}
              accentColor={accent}
              onClose={panels.closePanel}
              onClaimReward={() => session.addAffinity("message_sent")}
            />
          )}

          {/* Scene picker */}
          <div
            style={{
              position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 35,
              background: "rgba(10,10,16,0.95)", backdropFilter: "blur(14px)",
              borderTop: "1px solid rgba(255,255,255,0.08)", padding: "12px 12px 20px",
              transform: panels.isOpen("scenes") ? "translateY(0)" : "translateY(110%)",
              transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              pointerEvents: panels.isOpen("scenes") ? "auto" : "none",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
              <span style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-text-secondary)" }}>
                Scenes
              </span>
              <button
                onClick={panels.closePanel}
                style={{ background: "var(--color-border)", border: "none", borderRadius: "50%", width: "24px", height: "24px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--color-text-secondary)", fontSize: "14px", lineHeight: 1, padding: 0 }}
                aria-label="Close scene picker"
              >
                ✕
              </button>
            </div>
            <div style={{ display: "flex", gap: "8px", overflowX: "auto", overflowY: "hidden", paddingBottom: "2px" }}>
              {(Object.values(SCENES) as { id: SceneId; name: string; gradient: string }[]).map((scene) => {
                const isActive = scene.id === session.currentScene;
                return (
                  <button
                    key={scene.id}
                    onClick={() => { session.setCurrentScene(scene.id); panels.closePanel(); }}
                    style={{
                      flex: "0 0 auto", width: "60px", display: "flex", flexDirection: "column",
                      alignItems: "center", gap: "5px", background: "transparent", border: "none", cursor: "pointer", padding: 0,
                    }}
                    title={scene.name}
                  >
                    <div style={{
                      width: "60px", height: "40px", borderRadius: "8px", overflow: "hidden",
                      border: isActive ? `2px solid ${accent}` : "2px solid var(--color-toggle-bg)",
                      boxShadow: isActive ? `0 0 10px ${accent}66` : "none",
                      background: scene.gradient,
                    }} />
                    <span style={{ fontSize: "8px", color: isActive ? accent : "var(--color-inactive-nav)", fontWeight: isActive ? 600 : 400, textAlign: "center", maxWidth: "60px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {scene.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {showConfession && (
            <ConfessionScene
              characterId={characterId}
              script={getConfessionScript(characterId)}
              onComplete={() => { markConfessed(characterId); setShowConfession(false); }}
            />
          )}
          {session.levelUpMilestone && (
            <MilestoneScene
              characterId={characterId}
              characterName={character.name}
              accentColor={accent}
              level={session.levelUpMilestone.level}
              levelName={session.levelUpMilestone.levelName}
              onComplete={() => session.setLevelUpMilestone(null)}
            />
          )}
          <ScreenshotMode
            character={character}
            expression={state.currentExpression}
            lastLine={[...state.messages].reverse().find((m) => m.role === "assistant")?.content || ""}
            visible={panels.isOpen("screenshot")}
            onClose={panels.closePanel}
          />

          <BloodBat
            expression={state.currentExpression}
            accentColor={accent}
            isIdle={state.phase === "idle" && state.messages.length > 0}
            chatPhrase={hexxPhrase}
            onChatPhraseDone={() => setHexxPhrase(null)}
          />

          <VNTransition active={sceneTransition} onComplete={() => setSceneTransition(false)} />
        </>
      }
    >
      {/* Bottom zone: dialogue + starters + input */}
      {vnControls.showDialogue && (
        <DialogueBox
          characterName={character.name}
          characterId={characterId}
          accentColor={accent}
          line={vnControls.isWaiting ? "..." : (vnControls.currentLine || "")}
          isTyping={state.isTyping}
          onAdvance={vnControls.handleAdvance}
          onTypeComplete={vnControls.handleTypeComplete}
          showAdvance={vnControls.showAdvanceIndicator}
          typeSpeed={session.textSpeed}
          expression={state.currentExpression}
        />
      )}

      {starters.length > 0 && vnControls.showInput && (
        <div className="flex flex-wrap gap-2 px-4 mb-2 relative z-20 animate-[fadeIn_0.4s_ease-out]">
          {starters.map((text) => (
            <button
              key={text}
              onClick={() => { handleSend(text); setStarters([]); }}
              className="px-3 py-1.5 rounded-full text-xs transition-all hover:scale-105"
              style={{ background: `${accent}15`, border: `1px solid ${accent}30`, color: accent }}
            >
              {text}
            </button>
          ))}
        </div>
      )}

      {vnControls.showInput && (
        <div className="vn-input-zone">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const input = e.currentTarget.querySelector("input") as HTMLInputElement;
              if (input.value.trim()) {
                handleSend(input.value.trim());
                input.value = "";
              }
            }}
            className="flex gap-2 items-center"
          >
            <input
              type="text"
              placeholder={`Talk to ${character.name}...`}
              autoFocus
              className="vn-input flex-1"
              style={{ borderColor: `${accent}30` }}
              onFocus={(e) => { e.currentTarget.style.borderColor = `${accent}80`; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = `${accent}30`; }}
            />
            <button
              type="submit"
              className="flex-shrink-0 flex items-center justify-center transition-transform active:scale-90"
              style={{
                width: 36, height: 36,
                borderRadius: 12,
                background: `${accent}`,
                color: "#fff",
                border: "none",
                cursor: "pointer",
              }}
              aria-label="Send"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94l18.04-8.01a.75.75 0 000-1.36L3.478 2.405z" />
              </svg>
            </button>
          </form>
        </div>
      )}
    </VNLayout>
  );
}

// ─── Loading skeleton ───────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="h-screen bg-bg flex flex-col items-center justify-center overflow-hidden relative">
      <style>{`
        @keyframes skeleton-shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        @keyframes skeleton-pulse-outline { 0%, 100% { opacity: 0.15; } 50% { opacity: 0.4; } }
        .skeleton-silhouette { width: 180px; height: 320px; border-radius: 24px; background: linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.03) 75%); background-size: 200% 100%; animation: skeleton-shimmer 1.8s ease-in-out infinite; position: relative; }
        .skeleton-silhouette::after { content: ''; position: absolute; inset: -2px; border-radius: 26px; border: 2px solid rgba(255,255,255,0.2); animation: skeleton-pulse-outline 2s ease-in-out infinite; pointer-events: none; }
        .skeleton-bar { height: 12px; border-radius: 6px; background: linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%); background-size: 200% 100%; animation: skeleton-shimmer 1.8s ease-in-out infinite; }
      `}</style>
      <div className="skeleton-silhouette" />
      <div style={{ marginTop: 32, width: 220, display: "flex", flexDirection: "column", gap: 8 }}>
        <div className="skeleton-bar" style={{ width: "60%" }} />
        <div className="skeleton-bar" style={{ width: "90%" }} />
        <div className="skeleton-bar" style={{ width: "40%" }} />
      </div>
    </div>
  );
}

function ClientOnly({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <LoadingSkeleton />;
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
