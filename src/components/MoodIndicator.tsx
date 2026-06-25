import React, { useEffect, useRef, useState } from "react";

interface MoodIndicatorProps {
  mood: string;
  accentColor: string;
}

const MOOD_MAP: Record<string, string> = {
  cheerful: "😊",
  neutral: "😐",
  thoughtful: "🤔",
  excited: "⚡",
};

const pulseKeyframes = `
@keyframes moodPulse {
  0%   { transform: scale(1); }
  50%  { transform: scale(1.2); }
  100% { transform: scale(1); }
}
`;

export const MoodIndicator = ({ mood, accentColor }: MoodIndicatorProps) => {
  const emoji = MOOD_MAP[mood] ?? "😐";
  const [isPulsing, setIsPulsing] = useState(false);
  const prevMoodRef = useRef(mood);
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    if (prevMoodRef.current !== mood) {
      prevMoodRef.current = mood;
      setIsPulsing(true);
      const timer = setTimeout(() => setIsPulsing(false), 300);
      return () => clearTimeout(timer);
    }
  }, [mood]);

  return (
    <>
      <style>{pulseKeyframes}</style>
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          position: "relative",
          cursor: "default",
        }}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <span
          style={{
            fontSize: 16,
            lineHeight: 1,
            animation: isPulsing ? "moodPulse 0.3s ease" : "none",
            display: "inline-block",
          }}
        >
          {emoji}
        </span>
        {showTooltip && (
          <span
            style={{
              position: "absolute",
              bottom: "calc(100% + 4px)",
              left: "50%",
              transform: "translateX(-50%)",
              background: "rgba(0,0,0,0.75)",
              color: accentColor,
              fontSize: 10,
              fontWeight: 600,
              padding: "2px 6px",
              borderRadius: 4,
              whiteSpace: "nowrap",
              pointerEvents: "none",
            }}
          >
            {mood}
          </span>
        )}
      </span>
    </>
  );
};
