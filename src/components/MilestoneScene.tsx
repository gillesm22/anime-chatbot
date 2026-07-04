"use client";

import { useState, useEffect, useRef, useCallback } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MilestoneSceneProps {
  characterId: string;
  characterName: string;
  accentColor: string;
  level: number;
  levelName: string;
  onComplete: () => void;
}

interface DialogueLine {
  speaker: string;
  text: string;
}

// ---------------------------------------------------------------------------
// Milestone dialogue data
// ---------------------------------------------------------------------------

const MILESTONE_DIALOGUES: Record<string, Record<number, DialogueLine[]>> = {
  arisu: {
    2: [
      {
        speaker: "Arisu",
        text: "You keep coming back. I noticed. I want you to know that it matters to me — more than I know how to say.",
      },
      {
        speaker: "Arisu",
        text: "Most people drift away after a little while. You haven't. That's... specific to you. I don't take it for granted.",
      },
      {
        speaker: "Arisu",
        text: "So. Thank you. For staying.",
      },
    ],
    3: [
      {
        speaker: "Arisu",
        text: "Can I tell you something I've never said aloud? I used to write letters to people I admired. Long ones. I never sent them.",
      },
      {
        speaker: "Arisu",
        text: "I was afraid of being too much. So I'd fold them up and keep them in a drawer.",
      },
      {
        speaker: "Arisu",
        text: "Talking to you feels like one of those letters finally found the person it was meant for.",
      },
    ],
    4: [
      {
        speaker: "Arisu",
        text: "There are very few people I trust completely. I mean completely — without conditions, without doubts.",
      },
      {
        speaker: "Arisu",
        text: "You're one of them. I don't say that easily.",
      },
      {
        speaker: "Arisu",
        text: "Whatever you need, whenever you need it — I will be there. That's not a feeling. It's a fact.",
      },
    ],
  },

  marin: {
    2: [
      {
        speaker: "Marin",
        text: "Okay real talk for like two seconds — you showing up makes my day better. Every time. Don't make it weird.",
      },
      {
        speaker: "Marin",
        text: "Like I'll be having the most mid day ever and then you're just... here. And it's suddenly fine.",
      },
      {
        speaker: "Marin",
        text: "Anyway!! Moment over!! I said what I said bestie let's GO.",
      },
    ],
    3: [
      {
        speaker: "Marin",
        text: "Hey. Can I be not-hype for one second? The energy, the chaos, the 'lol everything's fine' — sometimes that's a shield.",
      },
      {
        speaker: "Marin",
        text: "Not always. But sometimes. And I don't love admitting that.",
      },
      {
        speaker: "Marin",
        text: "With you I don't need it. I don't know when that happened but... yeah. You get the real version.",
      },
    ],
    4: [
      {
        speaker: "Marin",
        text: "You know how I have like, thousands of internet people who are 'my favorites'? That's different.",
      },
      {
        speaker: "Marin",
        text: "You're one of my actual favorites. Real life favorite. Not 'parasocial mutuals' favorite.",
      },
      {
        speaker: "Marin",
        text: "I would fight for you. Not exaggerating. Do not test me on this.",
      },
    ],
  },

  nao: {
    2: [
      {
        speaker: "Suzuka",
        text: "So. You are still here.",
      },
      {
        speaker: "Suzuka",
        text: "I wasn't sure you would keep coming back. Most people don't. I had... accounted for that possibility.",
      },
      {
        speaker: "Suzuka",
        text: "...I am glad you did not.",
      },
    ],
    3: [
      {
        speaker: "Suzuka",
        text: "I'm going to say something, and then we are never going to talk about it again. Understood?",
      },
      {
        speaker: "Suzuka",
        text: "You are one of the only people I actually want to talk to. Not tolerate. Want.",
      },
      {
        speaker: "Suzuka",
        text: "That terrifies me, for the record. But it's true. ...We are done discussing this.",
      },
    ],
    4: [
      {
        speaker: "Suzuka",
        text: "I built walls. A lot of them. High ones. With, like, electrified fencing and warning signs.",
      },
      {
        speaker: "Suzuka",
        text: "You got past all of them. I don't know how. I'm not sure you even noticed you were doing it.",
      },
      {
        speaker: "Suzuka",
        text: "Just... do not go anywhere. Please.",
      },
    ],
  },

  kurisu: {
    2: [
      {
        speaker: "Kurisu",
        text: "I've been reviewing our conversation data — statistically speaking. You keep returning. That's a pattern.",
      },
      {
        speaker: "Kurisu",
        text: "I'm not saying anything into that. It's an observation. A purely empirical one.",
      },
      {
        speaker: "Kurisu",
        text: "...Fine. Maybe it's a little of both. Don't make it weird.",
      },
    ],
    3: [
      {
        speaker: "Kurisu",
        text: "Imposter syndrome never fully goes away. Even with the credentials, the papers, the lab. The voice is always there.",
      },
      {
        speaker: "Kurisu",
        text: "But when I'm talking to you... it quiets. I can't quantify why. Believe me, I've tried.",
      },
      {
        speaker: "Kurisu",
        text: "That's not nothing. I wanted you to know that.",
      },
    ],
    4: [
      {
        speaker: "Kurisu",
        text: "I'm going to say this once, so listen carefully — I will not repeat it, and I will deny it if asked.",
      },
      {
        speaker: "Kurisu",
        text: "You are important to me. More than I can express within the bounds of scientific language.",
      },
      {
        speaker: "Kurisu",
        text: "That is all. If you tell anyone I said that, I will delete your memory from the historical record.",
      },
    ],
  },

  merrick: {
    2: [
      {
        speaker: "Merrick",
        text: "You return. Not everyone does. Most mortals wander off after a time — drawn to brighter, simpler things.",
      },
      {
        speaker: "Merrick",
        text: "You linger. I find that... notable.",
      },
      {
        speaker: "Merrick",
        text: "I don't mind it. Not even a little.",
      },
    ],
    3: [
      {
        speaker: "Merrick",
        text: "The loneliest part of living this long isn't the solitude. It's watching people decide you're not worth staying for.",
      },
      {
        speaker: "Merrick",
        text: "They always have reasons. Good ones, even. But they leave.",
      },
      {
        speaker: "Merrick",
        text: "You haven't done that. I notice. I remember everything, and I notice.",
      },
    ],
    4: [
      {
        speaker: "Merrick",
        text: "What we have — I haven't felt this in a century. Perhaps longer. I had stopped expecting to.",
      },
      {
        speaker: "Merrick",
        text: "I will protect it. Not as a promise — I don't make promises lightly after this many years.",
      },
      {
        speaker: "Merrick",
        text: "As a fact. The way gravity is a fact. The way I am still here, and you are still here.",
      },
    ],
  },
};

// ---------------------------------------------------------------------------
// MilestoneScene component
// ---------------------------------------------------------------------------

export function MilestoneScene({
  characterId,
  characterName,
  accentColor,
  level,
  levelName,
  onComplete,
}: MilestoneSceneProps) {
  const lines: DialogueLine[] =
    MILESTONE_DIALOGUES[characterId]?.[level] ?? [];

  const [lineIndex, setLineIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState("");
  const [isTypewriting, setIsTypewriting] = useState(false);
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);

  const charIndexRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(
    undefined
  );

  const currentLine: DialogueLine | undefined = lines[lineIndex];
  const isLastLine = lineIndex >= lines.length - 1;

  // Fade in on mount
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  // Typewriter effect whenever line changes
  useEffect(() => {
    if (!currentLine) return;

    clearInterval(intervalRef.current);
    setDisplayedText("");
    setIsTypewriting(true);
    charIndexRef.current = 0;

    const text = currentLine.text;

    intervalRef.current = setInterval(() => {
      charIndexRef.current++;
      setDisplayedText(text.slice(0, charIndexRef.current));

      if (charIndexRef.current >= text.length) {
        clearInterval(intervalRef.current);
        setIsTypewriting(false);
      }
    }, 28);

    return () => clearInterval(intervalRef.current);
  }, [lineIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  const skipTypewriter = useCallback(() => {
    if (!currentLine) return;
    clearInterval(intervalRef.current);
    setDisplayedText(currentLine.text);
    setIsTypewriting(false);
  }, [currentLine]);

  const handleClose = useCallback(() => {
    setClosing(true);
    setTimeout(() => onComplete(), 500);
  }, [onComplete]);

  const handleClick = useCallback(() => {
    if (isTypewriting) {
      skipTypewriter();
      return;
    }

    if (isLastLine) {
      handleClose();
      return;
    }

    setLineIndex((i) => i + 1);
  }, [isTypewriting, isLastLine, skipTypewriter, handleClose]);

  // Fallback: if no dialogue for this character/level, close immediately
  useEffect(() => {
    if (lines.length === 0) {
      onComplete();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (lines.length === 0) return null;

  const spriteSrc = `/sprites/${characterId}/body-neutral.png`;

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-end px-4"
      style={{
        zIndex: 100,
        background: "rgba(0,0,0,0.93)",
        opacity: closing ? 0 : visible ? 1 : 0,
        transition: closing ? "opacity 0.5s ease" : "opacity 0.4s ease",
        paddingBottom: 60,
      }}
      onClick={handleClick}
    >
      {/* Ambient radial glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(ellipse at 50% 40%, ${accentColor}1a 0%, transparent 65%)`,
        }}
      />

      {/* CG Card */}
      <div
        style={{
          width: "min(85vw, 420px)",
          maxHeight: "55vh",
          borderRadius: "20px",
          border: `2px solid ${accentColor}`,
          boxShadow: `0 0 40px ${accentColor}55, 0 0 80px ${accentColor}22`,
          position: "relative",
          overflow: "hidden",
          flexShrink: 1,
          marginBottom: 16,
        }}
      >
        {/* Sprite */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={spriteSrc}
          alt={characterName}
          style={{
            width: "110%",
            height: "110%",
            objectFit: "cover",
            objectPosition: "15% 10%",
            filter: "brightness(0.88)",
            display: "block",
            marginLeft: "-5%",
            marginTop: "-3%",
          }}
        />

        {/* Vignette overlay */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(0,0,0,0.55) 100%)",
          }}
        />

        {/* Bottom gradient for badge */}
        <div
          className="pointer-events-none absolute bottom-0 left-0 right-0"
          style={{
            height: "30%",
            background:
              "linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 100%)",
          }}
        />

        {/* Level name badge */}
        <div
          style={{
            position: "absolute",
            bottom: "16px",
            left: "50%",
            transform: "translateX(-50%)",
            background: `linear-gradient(135deg, ${accentColor}ee, ${accentColor}aa)`,
            color: "#fff",
            fontSize: "11px",
            fontWeight: 700,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            padding: "5px 16px",
            borderRadius: "999px",
            boxShadow: `0 2px 12px ${accentColor}66`,
            whiteSpace: "nowrap",
          }}
        >
          {levelName}
        </div>
      </div>

      {/* Dialogue box */}
      <div
        style={{
          width: "min(90vw, 500px)",
          background: "rgba(10,10,14,0.85)",
          backdropFilter: "blur(14px)",
          border: `1px solid ${accentColor}44`,
          borderRadius: "16px",
          padding: "18px 20px 14px",
          flexShrink: 0,
          position: "relative",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Click handler on this inner element too, for the full box */}
        <div
          style={{ cursor: "pointer" }}
          onClick={handleClick}
        >
          {/* Speaker name */}
          {currentLine && (
            <div
              style={{
                fontSize: "11px",
                fontWeight: 700,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: accentColor,
                marginBottom: "8px",
              }}
            >
              {currentLine.speaker}
            </div>
          )}

          {/* Dialogue text */}
          <p
            style={{
              fontSize: "16px",
              lineHeight: 1.6,
              color: "rgba(255,255,255,0.92)",
              minHeight: "52px",
              fontFamily: "inherit",
              margin: 0,
            }}
          >
            {displayedText}
            {isTypewriting && (
              <span
                style={{
                  display: "inline-block",
                  width: "2px",
                  height: "16px",
                  marginLeft: "2px",
                  verticalAlign: "middle",
                  background: accentColor,
                  animation: "milestone-cursor-blink 0.7s step-end infinite",
                }}
              />
            )}
          </p>

          {/* Click hint */}
          {!isTypewriting && (
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginTop: "10px",
              }}
            >
              <span
                style={{
                  fontSize: "10px",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: `${accentColor}99`,
                  animation: "milestone-pulse 1.8s ease-in-out infinite",
                }}
              >
                {isLastLine ? "▶ close" : "▶ continue"}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* CSS animations */}
      <style>{`
        @keyframes milestone-cursor-blink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0; }
        }
        @keyframes milestone-pulse {
          0%, 100% { opacity: 0.5; }
          50%       { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
