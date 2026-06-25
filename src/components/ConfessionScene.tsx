"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { ConfessionScript, ConfessionNode, DialogueLine } from "@/lib/confession";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ConfessionSceneProps {
  characterId: string;
  script: ConfessionScript;
  onComplete: (ending: string) => void;
}

// ---------------------------------------------------------------------------
// Accent colours per character
// ---------------------------------------------------------------------------

const ACCENT_COLORS: Record<string, string> = {
  arisu: "#f9a8d4",
  marin: "#fb923c",
  nao: "#a78bfa",
  kurisu: "#e53935",
  merrick: "#7b1fa2",
};

const ENDING_MESSAGES: Record<string, string> = {
  accepted: "A new chapter begins.",
  friends: "Some bonds are worth every kind of love.",
  shy: "Some feelings linger between the lines.",
};

// ---------------------------------------------------------------------------
// ConfessionScene component
// ---------------------------------------------------------------------------

export function ConfessionScene({ characterId, script, onComplete }: ConfessionSceneProps) {
  const [currentNodeId, setCurrentNodeId] = useState<string>(script.startNode);
  const [lineIndex, setLineIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState("");
  const [isTypewriting, setIsTypewriting] = useState(false);
  const [showChoices, setShowChoices] = useState(false);
  const [endingMessage, setEndingMessage] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);

  const charIndexRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  const accent = ACCENT_COLORS[characterId] ?? "#a78bfa";
  const currentNode: ConfessionNode = script.nodes[currentNodeId];
  const currentLine: DialogueLine | undefined = currentNode?.lines[lineIndex];

  // Fade in on mount
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  // Start typewriter whenever line changes
  useEffect(() => {
    if (!currentLine) return;

    clearInterval(intervalRef.current);
    setDisplayedText("");
    setIsTypewriting(true);
    setShowChoices(false);
    charIndexRef.current = 0;

    const text = currentLine.text;

    intervalRef.current = setInterval(() => {
      charIndexRef.current++;
      setDisplayedText(text.slice(0, charIndexRef.current));

      if (charIndexRef.current >= text.length) {
        clearInterval(intervalRef.current);
        setIsTypewriting(false);

        const isLastLine = lineIndex >= currentNode.lines.length - 1;
        if (isLastLine) {
          if (currentNode.choices && currentNode.choices.length > 0) {
            setShowChoices(true);
          }
          // If there are no choices and no ending, we wait for a click to advance
        }
      }
    }, 28);

    return () => clearInterval(intervalRef.current);
  }, [currentNodeId, lineIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  const skipTypewriter = useCallback(() => {
    if (!currentLine) return;
    clearInterval(intervalRef.current);
    setDisplayedText(currentLine.text);
    setIsTypewriting(false);

    const isLastLine = lineIndex >= currentNode.lines.length - 1;
    if (isLastLine && currentNode.choices && currentNode.choices.length > 0) {
      setShowChoices(true);
    }
  }, [currentLine, lineIndex, currentNode]);

  const advanceLine = useCallback(() => {
    if (isTypewriting) {
      skipTypewriter();
      return;
    }

    if (showChoices) return; // wait for choice click

    const isLastLine = lineIndex >= currentNode.lines.length - 1;

    if (!isLastLine) {
      setLineIndex((i) => i + 1);
      return;
    }

    // Last line, no choices
    if (currentNode.ending) {
      const msg = ENDING_MESSAGES[currentNode.ending] ?? "";
      setEndingMessage(msg);
      return;
    }

    if (currentNode.nextNode) {
      setCurrentNodeId(currentNode.nextNode);
      setLineIndex(0);
    }
  }, [isTypewriting, showChoices, lineIndex, currentNode, skipTypewriter]);

  const handleChoice = useCallback(
    (nextBranch: string) => {
      setShowChoices(false);
      setCurrentNodeId(nextBranch);
      setLineIndex(0);
    },
    []
  );

  const handleEndingClose = useCallback(() => {
    if (currentNode.ending) {
      onComplete(currentNode.ending);
    }
  }, [currentNode, onComplete]);

  if (!currentNode) return null;

  const isNarration = currentLine?.speaker === "narration";

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-end pb-12 px-6"
      style={{
        background: "rgba(0,0,0,0.92)",
        opacity: visible ? 1 : 0,
        transition: "opacity 1s ease",
      }}
      onClick={endingMessage ? undefined : advanceLine}
    >
      {/* Decorative top gradient */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(ellipse at 50% 30%, ${accent}18 0%, transparent 70%)`,
        }}
      />

      {/* Ending overlay */}
      {endingMessage && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-6"
          style={{ animation: "confession-fade-in 0.8s ease forwards" }}
        >
          <p
            className="text-2xl font-light tracking-widest text-white/90 text-center px-8"
            style={{ textShadow: `0 0 40px ${accent}` }}
          >
            {endingMessage}
          </p>
          <button
            onClick={handleEndingClose}
            className="mt-4 px-8 py-3 rounded-full text-sm font-semibold tracking-wide transition-opacity hover:opacity-80"
            style={{ background: accent, color: "#0a0a0a" }}
          >
            Continue
          </button>
        </div>
      )}

      {/* Dialogue box */}
      {!endingMessage && (
        <div className="w-full max-w-2xl flex flex-col gap-4">
          {/* Name plate */}
          {!isNarration && (
            <div className="self-start">
              <span
                className="px-4 py-1 rounded-full text-sm font-bold tracking-wide capitalize"
                style={{ background: accent, color: "#0a0a0a" }}
              >
                {characterId}
              </span>
            </div>
          )}

          {/* Text box */}
          <div
            className="rounded-2xl px-6 py-5 min-h-[100px] flex items-center"
            style={{
              background: isNarration ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.07)",
              border: `1px solid ${isNarration ? "rgba(255,255,255,0.08)" : accent + "44"}`,
              boxShadow: isNarration ? "none" : `0 0 24px ${accent}22`,
            }}
            data-expression={currentLine?.expression ?? ""}
          >
            <p
              className="text-base leading-relaxed"
              style={{
                color: isNarration ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.92)",
                fontStyle: isNarration ? "italic" : "normal",
                letterSpacing: isNarration ? "0.02em" : "normal",
              }}
            >
              {displayedText}
              {isTypewriting && (
                <span
                  className="inline-block w-0.5 h-4 ml-0.5 align-middle"
                  style={{ background: accent, animation: "confession-cursor-blink 0.7s step-end infinite" }}
                />
              )}
            </p>
          </div>

          {/* Choices */}
          {showChoices && currentNode.choices && (
            <div
              className="flex flex-col gap-3 mt-2"
              style={{ animation: "confession-fade-in 0.4s ease forwards" }}
            >
              {currentNode.choices.map((choice, i) => (
                <button
                  key={i}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleChoice(choice.nextBranch);
                  }}
                  className="w-full rounded-xl px-5 py-3 text-sm font-medium text-left transition-all hover:brightness-110 active:scale-[0.98]"
                  style={{
                    background: `${accent}22`,
                    border: `1px solid ${accent}66`,
                    color: "rgba(255,255,255,0.88)",
                  }}
                >
                  {choice.text}
                </button>
              ))}
            </div>
          )}

          {/* Click to continue hint */}
          {!isTypewriting && !showChoices && !endingMessage && (
            <div className="flex justify-end">
              <span
                className="text-xs tracking-widest uppercase"
                style={{ color: accent + "99", animation: "confession-pulse 1.8s ease-in-out infinite" }}
              >
                ▶ continue
              </span>
            </div>
          )}
        </div>
      )}

      {/* CSS animations */}
      <style>{`
        @keyframes confession-fade-in {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes confession-cursor-blink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0; }
        }
        @keyframes confession-pulse {
          0%, 100% { opacity: 0.5; }
          50%       { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
