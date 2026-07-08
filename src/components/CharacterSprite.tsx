"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { Character, Expression, BodyPose } from "@/lib/characters/types";
import type { Outfit } from "./OutfitSelector";
import { CharacterGlow } from "./CharacterGlow";
import { useParallax } from "@/lib/parallax";
import { getExpressionEffect, type ExpressionEffect } from "@/lib/expressionEffects";
import { SpriteZone } from "./SpriteZone";
import { HairSwayCanvas } from "./HairSwayCanvas";
import { getZoneConfig } from "@/lib/sprites/zones";
import { useIdleBehavior } from "@/lib/sprites/idle";
import { useReactiveAnimation } from "@/lib/sprites/reactive";
import { useBlink } from "@/lib/sprites/engine";

function getGlowIntensity(level: number, isTalking: boolean): "low" | "medium" | "high" | "radiant" {
  if (level >= 10) return "radiant";
  if (level >= 8 || isTalking) return "high";
  if (level >= 4) return "medium";
  return "low";
}

interface CharacterSpriteProps {
  character: Character;
  expression: Expression;
  isTalking: boolean;
  pose?: BodyPose;
  outfit?: Outfit;
  level?: number;
  chatPhase?: "idle" | "waiting" | "speaking" | "user_typing";
  onHeadpat?: () => void;
  onExpressionChange?: (effect: ExpressionEffect) => void;
}

export function CharacterSprite({
  character,
  expression,
  isTalking,
  pose,
  outfit = "default",
  level = 1,
  chatPhase = "idle",
  onHeadpat,
  onExpressionChange,
}: CharacterSpriteProps) {
  const parallax = useParallax();
  const config = getZoneConfig(character.id);
  const idle = useIdleBehavior(config.personality, false);
  const reactive = useReactiveAnimation(expression, chatPhase, isTalking, config.personality, idle.headRef, idle.torsoRef, idle.baseRef);
  const isBlinking = useBlink(config.personality.blinkInterval[0] * 1000, config.personality.blinkInterval[1] * 1000);
  const showBack = outfit === "back" || outfit === "bikini-back";
  const showBikini = outfit === "bikini-back";
  const showFrontBikini = outfit === "bikini-front";
  const basePath = character.sprite.basePath;
  const hasRealArt = character.id === "arisu" || character.id === "marin" || character.id === "nao" || character.id === "kurisu" || character.id === "merrick" || character.id === "ticia";
  const hasOutfitAssets = character.id === "arisu" || character.id === "marin" || character.id === "nao" || character.id === "kurisu" || character.id === "merrick" || character.id === "ticia";
  const isGenericOutfit = outfit !== "default" && outfit !== "back" && outfit !== "bikini-back" && outfit !== "bikini-front";
  const [outfitError, setOutfitError] = useState(false);
  const [visibleExpr, setVisibleExpr] = useState<Expression>(expression);
  const [fadeIn, setFadeIn] = useState(false);
  const fadeTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [hearts, setHearts] = useState<number[]>([]);
  const headpatActive = useRef(false);
  const heartIdRef = useRef(0);

  const triggerHeadpat = useCallback(() => {
    const newHearts = [heartIdRef.current++, heartIdRef.current++, heartIdRef.current++];
    setHearts((prev) => [...prev, ...newHearts]);
    setTimeout(() => {
      setHearts((prev) => prev.filter((id) => !newHearts.includes(id)));
    }, 1200);
    onHeadpat?.();
  }, [onHeadpat]);

  const handleHeadPointerDown = useCallback((e: React.PointerEvent) => {
    headpatActive.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const handleHeadPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (headpatActive.current && Math.abs(e.movementX) > 2) {
        headpatActive.current = false;
        triggerHeadpat();
      }
    },
    [triggerHeadpat]
  );

  const handleHeadPointerUp = useCallback(() => {
    headpatActive.current = false;
  }, []);

  useEffect(() => {
    setOutfitError(false);
  }, [outfit]);

  useEffect(() => {
    if (expression !== visibleExpr) {
      setFadeIn(false);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setFadeIn(true);
          const effect = getExpressionEffect(visibleExpr, expression);
          if (effect) {
            onExpressionChange?.(effect);
          }
        });
      });
      if (fadeTimer.current) clearTimeout(fadeTimer.current);
      fadeTimer.current = setTimeout(() => {
        setVisibleExpr(expression);
        setFadeIn(false);
      }, 350);
    }
    return () => { if (fadeTimer.current) clearTimeout(fadeTimer.current); };
  }, [expression, visibleExpr]);

  if (!hasRealArt) {
    return <PlaceholderSprite character={character} expression={expression} isTalking={isTalking} />;
  }

  function getSrc(expr: Expression) {
    return expr === "neutral"
      ? `${basePath}/body-neutral.png`
      : `${basePath}/face-${expr}.png`;
  }

  return (
    <div
      className="w-full h-full flex items-end justify-center animate-[slideIn_0.6s_ease-out]"
    >
      <div
        className="relative h-full w-full max-w-[700px]"
        style={{
          maxHeight: "100%",
          transform: `translate(${parallax.x * 3}px, ${parallax.y * 2}px)`,
        }}
      >
        <CharacterGlow accentColor={character.theme.accent} intensity={getGlowIntensity(level, isTalking)} />
        {level >= 4 && (
          <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 0 }}>
            {Array.from({ length: Math.min(level - 1, 15) }).map((_, i) => (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: `${20 + Math.sin(i * 2.3) * 30}%`,
                  top: `${15 + Math.cos(i * 1.7) * 35}%`,
                  width: 3,
                  height: 3,
                  borderRadius: "50%",
                  background: character.theme.accent,
                  opacity: 0.3,
                  animation: `floatParticle ${5 + (i % 4)}s ease-in-out ${i * 0.6}s infinite`,
                }}
              />
            ))}
          </div>
        )}
        {/* Zone-based sprite layers */}
        {(["head", "torso", "base"] as const).map((zone) => {
          const zoneRef = zone === "head" ? idle.headRef : zone === "torso" ? idle.torsoRef : idle.baseRef;
          const hideBase = ((showBack || showFrontBikini) && hasOutfitAssets) || (isGenericOutfit && !outfitError);
          return (
            <SpriteZone
              key={zone}
              ref={zoneRef}
              src={getSrc(visibleExpr)}
              alt={character.name}
              zone={config[zone]}
              style={{ zIndex: 1, opacity: hideBase ? 0 : 1, transition: "opacity 300ms ease" }}
            />
          );
        })}
        {/* Expression transition zones */}
        {expression !== visibleExpr && (["head", "torso", "base"] as const).map((zone) => {
          const hideBase = ((showBack || showFrontBikini) && hasOutfitAssets) || (isGenericOutfit && !outfitError);
          return (
            <SpriteZone
              key={`transition-${zone}`}
              src={getSrc(expression)}
              alt={`${character.name} ${expression}`}
              zone={config[zone]}
              style={{
                zIndex: 2,
                opacity: fadeIn && !hideBase ? 1 : 0,
                transition: "opacity 300ms ease",
              }}
            />
          );
        })}
        {/* Hair sway canvas overlay */}
        <HairSwayCanvas
          spriteSrc={getSrc(visibleExpr)}
          heightPercent={config.hairCanvasHeight}
          speed={config.personality.hairSwaySpeed}
          amount={config.personality.hairSwayAmount}
          windIntensity={reactive.windIntensity}
        />
        {/* Blink overlay */}
        <div
          className="absolute pointer-events-none"
          style={{
            top: `${config.head.clipTop + 8}%`,
            left: "25%",
            right: "25%",
            height: "6%",
            background: "rgba(0,0,0,0.15)",
            opacity: isBlinking ? 1 : 0,
            transition: isBlinking ? "opacity 50ms ease-in" : "opacity 100ms ease-out",
            zIndex: 12,
            borderRadius: "40%",
          }}
        />
        {/* Back view - only for characters with outfit assets */}
        {hasOutfitAssets && (
          <img
            src={`${basePath}/body-back.png`}
            alt={`${character.name} back`}
            className="h-full object-contain object-bottom absolute inset-0"
            style={{ zIndex: 3, opacity: showBack && !showBikini ? 1 : 0, transition: "opacity 300ms ease" }}
          />
        )}
        {/* Bikini back - only for characters with outfit assets */}
        {hasOutfitAssets && (
          <img
            src={`${basePath}/body-back-bikini.png`}
            alt={`${character.name} bikini back`}
            className="h-full object-contain object-bottom absolute inset-0"
            style={{ zIndex: 4, opacity: showBikini ? 1 : 0, transition: "opacity 300ms ease" }}
          />
        )}
        {/* Front bikini - only for characters with outfit assets */}
        {hasOutfitAssets && (
          <img
            src={`${basePath}/body-front-bikini.png`}
            alt={`${character.name} bikini front`}
            className="h-full object-contain object-bottom absolute inset-0"
            style={{ zIndex: 5, opacity: showFrontBikini ? 1 : 0, transition: "opacity 300ms ease" }}
          />
        )}
        {/* Generic outfit layer (casual, formal, school, etc.) */}
        {isGenericOutfit && !outfitError && (
          <img
            src={`${basePath}/body-${outfit}.png`}
            alt={`${character.name} ${outfit}`}
            className="h-full object-contain object-bottom absolute inset-0"
            style={{ zIndex: 6, opacity: 1, transition: "opacity 300ms ease" }}
            onError={() => setOutfitError(true)}
          />
        )}
        {/* Headpat zone */}
        <div
          className="absolute inset-x-0 top-0"
          style={{ height: "25%", zIndex: 10, touchAction: "none" }}
          onPointerDown={handleHeadPointerDown}
          onPointerMove={handleHeadPointerMove}
          onPointerUp={handleHeadPointerUp}
          onPointerCancel={handleHeadPointerUp}
        />
        {/* Hearts */}
        {hearts.map((id) => (
          <span
            key={id}
            className="headpat-heart"
            style={{
              position: "absolute",
              left: `${35 + Math.random() * 30}%`,
              top: "15%",
              zIndex: 20,
              pointerEvents: "none",
              fontSize: "1.5rem",
            }}
          >
            ❤
          </span>
        ))}
      </div>
    </div>
  );
}

function PlaceholderSprite({
  character,
  expression,
  isTalking,
}: {
  character: Character;
  expression: Expression;
  isTalking: boolean;
}) {
  const c = character.theme.accent;

  return (
    <div className="w-full flex items-end justify-center" style={{ height: "60vh" }}>
      <div style={{ animation: "breathe 3s ease-in-out infinite" }}>
        <svg width="220" height="380" viewBox="0 0 220 380" fill="none" xmlns="http://www.w3.org/2000/svg">
          <ellipse cx="110" cy="85" rx="65" ry="70" fill={`${c}18`} stroke={`${c}40`} strokeWidth="1.5" />
          <ellipse cx="110" cy="75" rx="58" ry="55" fill={`${c}10`} />
          <ellipse cx="110" cy="135" rx="45" ry="55" fill={`${c}12`} stroke={`${c}35`} strokeWidth="1.5" />
          <path
            d="M55 185 Q60 175 110 178 Q160 175 165 185 L175 260 Q175 380 110 380 Q45 380 45 260 Z"
            fill={`${c}10`}
            stroke={`${c}30`}
            strokeWidth="1.5"
          />
          <text x="110" y="310" textAnchor="middle" fill={c} fontSize="16" fontFamily="sans-serif" fontWeight="500">
            {character.name}
          </text>
        </svg>
      </div>
    </div>
  );
}
