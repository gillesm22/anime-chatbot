"use client";

import { useState, useEffect, useRef } from "react";
import type { MouthVariant } from "@/lib/characters/types";

/**
 * Hook that triggers a blink at random intervals.
 * Returns true when the character should be blinking (eyes closed).
 */
export function useBlink(): boolean {
  const [isBlinking, setIsBlinking] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    function scheduleBlink() {
      const delay = 3000 + Math.random() * 3000; // 3-6 seconds
      timeoutRef.current = setTimeout(() => {
        setIsBlinking(true);
        setTimeout(() => {
          setIsBlinking(false);
          scheduleBlink();
        }, 150); // blink duration
      }, delay);
    }
    scheduleBlink();
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return isBlinking;
}

/**
 * Hook that cycles through mouth frames while isTalking is true.
 * Returns the current mouth variant to display.
 */
export function useTalkAnimation(
  isTalking: boolean,
  baseMouth: MouthVariant
): MouthVariant {
  const [mouthFrame, setMouthFrame] = useState<MouthVariant>(baseMouth);
  const frameIndexRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);

  useEffect(() => {
    if (isTalking) {
      const frames: MouthVariant[] = ["closed", "talk-1", "talk-2", "closed"];
      frameIndexRef.current = 0;
      intervalRef.current = setInterval(() => {
        frameIndexRef.current = (frameIndexRef.current + 1) % frames.length;
        setMouthFrame(frames[frameIndexRef.current]);
      }, 120);
    } else {
      setMouthFrame(baseMouth);
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isTalking, baseMouth]);

  return mouthFrame;
}
