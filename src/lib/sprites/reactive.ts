"use client";

import { useRef, useEffect, useCallback } from "react";
import type { Expression } from "@/lib/characters/types";
import type { AnimPersonality } from "./zones";

export interface ReactiveTransforms {
  head?: string;
  torso?: string;
  base?: string;
}

interface ReactiveAnimation {
  duration: number;
  apply: (t: number, scale: number) => ReactiveTransforms;
  hold?: boolean;
}

export type ConversationEvent = "message_sent" | "waiting" | "stream_start" | "speaking" | "headpat";

function easeOut(t: number) { return 1 - (1 - t) * (1 - t); }
function easeInOut(t: number) { return t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2; }
function spring(t: number) { return 1 - Math.cos(t * Math.PI * 2) * Math.exp(-t * 4); }

const EXPRESSION_ANIMS: Partial<Record<Expression, ReactiveAnimation>> = {
  happy:     { duration: 400, apply: (t, s) => { const e = easeOut(t); return { head: `translateY(${-1.5*s*e}px) rotate(${-1*s*e}deg)`, torso: `translateY(${-2*s*e}px)` }; } },
  laugh:     { duration: 400, apply: (t, s) => { const e = easeOut(t); return { head: `translateY(${-2*s*e}px) rotate(${-1.5*s*e}deg)`, torso: `translateY(${-2*s*e}px)` }; } },
  thinking:  { duration: 600, hold: true, apply: (t, s) => { const e = easeOut(Math.min(t*1.5,1)); return { head: `rotate(${5*s*e}deg) translateY(${-1*s*e}px)` }; } },
  surprised: { duration: 300, apply: (t, s) => { const e = spring(t); return { head: `translateY(${3*s*(1-e)}px)`, torso: `translateY(${2*s*(1-e)}px)`, base: `translateY(${1*s*(1-e)}px)` }; } },
  flustered: { duration: 500, apply: (t, s) => { const e = easeOut(t); return { head: `translateY(${3*s*e}px) rotate(${-3*s*e}deg)` }; } },
  shy:       { duration: 500, apply: (t, s) => { const e = easeOut(t); return { head: `translateY(${3*s*e}px) rotate(${-2*s*e}deg)` }; } },
  angry:     { duration: 400, apply: (t, s) => { const e = easeOut(t); return { head: `translateY(${1*s*e}px)`, torso: `translateY(${-2*s*e}px)` }; } },
  sad:       { duration: 800, apply: (t, s) => { const e = easeInOut(t); return { head: `translateY(${2*s*e}px)`, torso: `translateY(${2*s*e}px)`, base: `translateY(${1*s*e}px)` }; } },
  crying:    { duration: 800, apply: (t, s) => { const e = easeInOut(t); return { head: `translateY(${3*s*e}px) rotate(${-2*s*e}deg)`, torso: `translateY(${2*s*e}px)`, base: `translateY(${1*s*e}px)` }; } },
  excited:   { duration: 500, apply: (t, s) => { const e = spring(t); return { head: `translateY(${-3*s*e}px)`, torso: `translateY(${-2*s*e}px)` }; } },
  teasing:   { duration: 400, apply: (t, s) => { const e = easeOut(t); return { head: `rotate(${-3*s*e}deg) translateY(${-1*s*e}px)`, torso: `translateY(${-1*s*e}px)` }; } },
  smirk:     { duration: 400, apply: (t, s) => { const e = easeOut(t); return { head: `rotate(${-2*s*e}deg) translateY(${-1*s*e}px)`, torso: `translateY(${-1*s*e}px)` }; } },
  devoted:   { duration: 600, apply: (t, s) => { const e = easeInOut(t); return { head: `translateY(${1*s*e}px) rotate(${-1*s*e}deg)`, torso: `translateY(${-2*s*e}px)` }; } },
  sleepy:    { duration: 1000, apply: (t, s) => { const e = easeInOut(t); return { head: `translateY(${3*s*e}px) rotate(${4*s*e}deg)`, torso: `translateY(${2*s*e}px)`, base: `translateY(${1*s*e}px)` }; } },
  jealous:   { duration: 500, apply: (t, s) => { const e = easeOut(t); return { head: `rotate(${3*s*e}deg)`, torso: `translateX(${-1*s*e}px)` }; } },
};

const CONVERSATION_ANIMS: Record<ConversationEvent, ReactiveAnimation> = {
  message_sent: { duration: 400, apply: (t, s) => { const e = spring(t); return { head: `translateY(${-2*s*e}px)`, torso: `translateY(${-1*s*e}px)` }; } },
  waiting:      { duration: 2000, hold: true, apply: (t, s) => { const e = Math.sin(t*Math.PI*2)*0.5; return { head: `rotate(${1.5*s*e}deg)` }; } },
  stream_start: { duration: 300, apply: (t, s) => { const e = easeOut(t); return { head: `translateY(${1*s*(1-e)}px)`, torso: `translateY(${0.5*s*(1-e)}px)` }; } },
  speaking:     { duration: 400, hold: true, apply: (t, s) => { const b = Math.sin(t*Math.PI*6)*Math.exp(-t*3); return { head: `translateY(${-1.5*s*b}px)` }; } },
  headpat:      { duration: 600, apply: (t, s) => { const e = easeInOut(t); return { head: `translateY(${2*s*e}px)`, torso: `translateY(${1*s*e}px)` }; } },
};

export function getReactiveAnimation(expression: Expression): ReactiveAnimation | null {
  return EXPRESSION_ANIMS[expression] ?? null;
}

export function getConversationAnimation(event: ConversationEvent): ReactiveAnimation | null {
  return CONVERSATION_ANIMS[event] ?? null;
}

export function useReactiveAnimation(
  expression: Expression,
  chatPhase: "idle" | "waiting" | "speaking" | "user_typing",
  isTalking: boolean,
  personality: AnimPersonality,
  headRef: React.RefObject<HTMLDivElement | null>,
  torsoRef: React.RefObject<HTMLDivElement | null>,
  baseRef: React.RefObject<HTMLDivElement | null>,
): { isPaused: boolean; windIntensity: number } {
  const activeRef = useRef(false);
  const windRef = useRef(1);
  const prevExprRef = useRef(expression);
  const prevPhaseRef = useRef(chatPhase);
  const cooldownRef = useRef(0);

  const applyAnimation = useCallback((anim: ReactiveAnimation, scale: number) => {
    activeRef.current = true;
    const start = performance.now();
    function frame(now: number) {
      const t = Math.min((now - start) / anim.duration, 1);
      const tr = anim.apply(t, scale);
      if (headRef.current && tr.head) headRef.current.style.transform = tr.head;
      if (torsoRef.current && tr.torso) torsoRef.current.style.transform = tr.torso;
      if (baseRef.current && tr.base) baseRef.current.style.transform = tr.base;
      if (t < 1 || anim.hold) { requestAnimationFrame(frame); }
      else { activeRef.current = false; cooldownRef.current = performance.now() + 2000; }
    }
    requestAnimationFrame(frame);
  }, [headRef, torsoRef, baseRef]);

  useEffect(() => {
    if (expression !== prevExprRef.current) {
      prevExprRef.current = expression;
      const anim = getReactiveAnimation(expression);
      if (anim) {
        if (expression === "surprised" || expression === "excited") {
          windRef.current = 2.5;
          setTimeout(() => { windRef.current = 1; }, 800);
        } else if (expression === "sleepy") { windRef.current = 0.3; }
        else { windRef.current = 1; }
        applyAnimation(anim, personality.reactiveScale);
      }
    }
  }, [expression, personality.reactiveScale, applyAnimation]);

  useEffect(() => {
    if (chatPhase !== prevPhaseRef.current) {
      const prev = prevPhaseRef.current;
      prevPhaseRef.current = chatPhase;
      let event: ConversationEvent | null = null;
      if (chatPhase === "waiting" && prev === "idle") event = "message_sent";
      else if (chatPhase === "waiting") event = "waiting";
      else if (chatPhase === "speaking" && prev === "waiting") event = "stream_start";
      if (event) {
        const anim = getConversationAnimation(event);
        if (anim) applyAnimation(anim, personality.reactiveScale);
      }
    }
  }, [chatPhase, personality.reactiveScale, applyAnimation]);

  useEffect(() => {
    if (isTalking) {
      const anim = getConversationAnimation("speaking");
      if (anim) applyAnimation(anim, personality.reactiveScale);
    }
  }, [isTalking, personality.reactiveScale, applyAnimation]);

  return { isPaused: activeRef.current || performance.now() < cooldownRef.current, windIntensity: windRef.current };
}
