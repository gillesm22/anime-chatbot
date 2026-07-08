"use client";

import { useRef, useEffect, useCallback } from "react";
import type { AnimPersonality, IdleAction } from "./zones";

interface IdleState {
  breathePhase: number;
  swayPhase: number;
  currentAction: IdleAction | null;
  actionStartTime: number;
  actionDuration: number;
  nextActionTime: number;
}

const IDLE_ACTIONS: Record<IdleAction, {
  duration: number;
  apply: (t: number, s: number) => { head?: string; torso?: string; base?: string };
}> = {
  glance: {
    duration: 1500,
    apply: (t, s) => {
      const p = t < 0.3 ? t / 0.3 : t > 0.7 ? (1 - t) / 0.3 : 1;
      const ease = p * p * (3 - 2 * p);
      return { head: `rotate(${2.5 * s * ease}deg)` };
    },
  },
  weightShift: {
    duration: 2000,
    apply: (t, s) => {
      const ease = Math.sin(t * Math.PI);
      return { base: `translateX(${3 * s * ease}px)`, torso: `translateX(${2 * s * ease}px)` };
    },
  },
  headTilt: {
    duration: 2000,
    apply: (t, s) => {
      const ease = Math.sin(t * Math.PI);
      return { head: `rotate(${2 * s * ease}deg) translateY(${-1 * s * ease}px)` };
    },
  },
  settle: {
    duration: 1500,
    apply: (t, s) => {
      const ease = Math.sin(t * Math.PI);
      const y = 2 * s * ease;
      return { head: `translateY(${y}px)`, torso: `translateY(${y * 0.8}px)`, base: `translateY(${y * 0.5}px)` };
    },
  },
  deepBreath: {
    duration: 3000,
    apply: (t, s) => {
      const ease = Math.sin(t * Math.PI);
      return { torso: `scaleY(${1 + 0.008 * s * ease})` };
    },
  },
};

function pickAction(weights: Record<IdleAction, number>): IdleAction {
  const entries = Object.entries(weights) as [IdleAction, number][];
  const total = entries.reduce((sum, [, w]) => sum + w, 0);
  let r = Math.random() * total;
  for (const [action, weight] of entries) {
    r -= weight;
    if (r <= 0) return action;
  }
  return entries[0][0];
}

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

export function useIdleBehavior(personality: AnimPersonality, paused: boolean) {
  const headRef = useRef<HTMLDivElement>(null);
  const torsoRef = useRef<HTMLDivElement>(null);
  const baseRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef<IdleState>({
    breathePhase: 0, swayPhase: 0,
    currentAction: null, actionStartTime: 0, actionDuration: 0,
    nextActionTime: Date.now() + rand(personality.idleInterval[0], personality.idleInterval[1]) * 1000,
  });
  const rafRef = useRef(0);
  const pausedRef = useRef(paused);
  pausedRef.current = paused;
  const pRef = useRef(personality);
  pRef.current = personality;

  const tick = useCallback((now: number) => {
    const p = pRef.current;
    const s = stateRef.current;
    const head = headRef.current;
    const torso = torsoRef.current;
    const base = baseRef.current;

    if (!head || !torso || !base || pausedRef.current) {
      rafRef.current = requestAnimationFrame(tick);
      return;
    }

    s.breathePhase = (now / 1000 / p.breatheDuration) * Math.PI * 2;
    let torsoT = `scaleY(${1 + Math.sin(s.breathePhase) * (p.breatheScale - 1)})`;

    s.swayPhase = (now / 1000 / p.swayDuration) * Math.PI * 2;
    let baseT = `translateX(${Math.sin(s.swayPhase) * p.swayAmount}px)`;
    let headT = "";

    if (s.currentAction) {
      const t = Math.min((now - s.actionStartTime) / s.actionDuration, 1);
      const transforms = IDLE_ACTIONS[s.currentAction].apply(t, p.reactiveScale);
      if (transforms.head) headT = transforms.head;
      if (transforms.torso) torsoT += ` ${transforms.torso}`;
      if (transforms.base) baseT += ` ${transforms.base}`;
      if (t >= 1) {
        s.currentAction = null;
        s.nextActionTime = now + rand(p.idleInterval[0], p.idleInterval[1]) * 1000;
      }
    } else if (now >= s.nextActionTime) {
      s.currentAction = pickAction(p.idleWeights);
      s.actionStartTime = now;
      s.actionDuration = IDLE_ACTIONS[s.currentAction].duration;
    }

    head.style.transform = headT;
    torso.style.transform = torsoT;
    base.style.transform = baseT;
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [tick]);

  return { headRef, torsoRef, baseRef };
}
