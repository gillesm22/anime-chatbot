"use client";

import React, { useEffect, useState } from "react";
import type { Character, Expression } from "@/lib/characters/types";
import type { SceneId } from "@/lib/backgrounds";
import type { ExpressionEffect } from "@/lib/expressionEffects";
import { SceneBackground } from "./SceneBackground";
import { CharacterSprite } from "./CharacterSprite";
import { InteractiveElements } from "./InteractiveElements";

// ─── Props ───────────────────────────────────────────────────────────────────

export interface VNLayoutProps {
  character: Character;
  characterId: string;
  expression: Expression;
  isTalking: boolean;
  outfit: string;
  currentScene: SceneId;
  activeEffect: ExpressionEffect | null;
  level?: number;
  chatPhase?: "idle" | "waiting" | "speaking" | "user_typing";
  onHeadpat: () => void;
  onExpressionChange: (effect: ExpressionEffect) => void;
  onSpriteTap: () => void;
  onDiscoveryReaction: (line: string, expression: string) => void;
  onDiscoveryContext: (ctx: string) => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
  children: React.ReactNode;
  overlays?: React.ReactNode;
  headerLeft?: React.ReactNode;
  headerRight?: React.ReactNode;
}

// ─── Effect overlay component ────────────────────────────────────────────────

function EffectOverlay({ effect }: { effect: ExpressionEffect }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    setVisible(true);
    const timer = setTimeout(() => setVisible(false), effect.durationMs);
    return () => clearTimeout(timer);
  }, [effect, effect.durationMs]);

  if (!visible) return null;

  switch (effect.type) {
    case "dim":
      return <div className="vn-effect vn-effect--dim" />;
    case "shake":
      return (
        <div
          className="vn-effect"
          style={{ animation: `screenShake ${effect.durationMs}ms ease-out` }}
        />
      );
    case "sparkle":
      return (
        <div className="vn-effect">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="expression-sparkle"
              style={{
                position: "absolute",
                left: `${20 + Math.random() * 60}%`,
                top: `${20 + Math.random() * 60}%`,
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "rgba(255, 255, 200, 0.9)",
                animationDelay: `${i * 50}ms`,
              }}
            />
          ))}
        </div>
      );
    case "blush":
      return (
        <div className="vn-effect" style={{ pointerEvents: "none" }}>
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "radial-gradient(ellipse at 50% 60%, rgba(255,100,120,0.15) 0%, transparent 60%)",
              animation: `red-vignette ${effect.durationMs}ms ease-out forwards`,
            }}
          />
        </div>
      );
    case "flash":
      return (
        <div
          className="vn-effect"
          style={{
            background: "rgba(255,255,255,0.6)",
            animation: `sprite-flash ${effect.durationMs}ms ease-out forwards`,
          }}
        />
      );
    default:
      return null;
  }
}

// ─── VNLayout ────────────────────────────────────────────────────────────────

export function VNLayout({
  character,
  characterId,
  expression,
  isTalking,
  outfit,
  currentScene,
  activeEffect,
  level,
  chatPhase,
  onHeadpat,
  onExpressionChange,
  onSpriteTap,
  onDiscoveryReaction,
  onDiscoveryContext,
  containerRef,
  children,
  overlays,
  headerLeft,
  headerRight,
}: VNLayoutProps) {
  // Set --vh to actual visible viewport height (accounts for OS taskbar, browser chrome)
  useEffect(() => {
    function setVH() {
      document.documentElement.style.setProperty("--vh", `${window.innerHeight * 0.01}px`);
    }
    setVH();
    window.addEventListener("resize", setVH);
    return () => window.removeEventListener("resize", setVH);
  }, []);

  return (
    <div className="vn-viewport" ref={containerRef} id="chat-container">
      {/* Layer 1: Scene background */}
      <SceneBackground
        sceneId={currentScene}
        characterAccent={character.theme.accent}
      />

      {/* Layer 2: Interactive scene elements */}
      <InteractiveElements
        sceneId={currentScene}
        accentColor={character.theme.accent}
        characterId={characterId}
        onReaction={onDiscoveryReaction}
        onDiscoveryContext={onDiscoveryContext}
      />

      {/* Layer 3: Expression effects */}
      {activeEffect && <EffectOverlay effect={activeEffect} />}

      {/* Layer 4: Character sprite */}
      <div className="vn-sprite-zone" onClick={onSpriteTap}>
        <CharacterSprite
          character={character}
          expression={expression}
          isTalking={isTalking}
          outfit={outfit as any}
          level={level}
          chatPhase={chatPhase}
          onHeadpat={onHeadpat}
          onExpressionChange={onExpressionChange}
        />
      </div>

      {/* Layer 5: Minimal header */}
      <header className="vn-header">
        <div className="vn-header__left">{headerLeft}</div>
        <div className="vn-header__right">{headerRight}</div>
      </header>

      {/* Layer 6: Overlays — panels, modals, menus */}
      {overlays}

      {/* Layer 7: Bottom zone — dialogue + input (last so clicks work) */}
      <div className="vn-bottom-zone">{children}</div>
    </div>
  );
}
