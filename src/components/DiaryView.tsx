"use client";

import React, { useEffect, useState } from "react";
import { getDiaryEntries, DiaryEntry } from "@/lib/diary";

interface DiaryViewProps {
  characterId: string;
  characterName: string;
  accentColor: string;
  onClose: () => void;
}

const moodEmoji: Record<string, string> = {
  happy: "😊",
  sad: "😢",
  excited: "✨",
  nervous: "😰",
  calm: "🌸",
  angry: "😤",
  embarrassed: "🥺",
  thoughtful: "🤔",
  lonely: "💭",
  content: "☁️",
};

function getMoodEmoji(mood: string): string {
  return moodEmoji[mood.toLowerCase()] ?? "📖";
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-CA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function DiaryView({
  characterId,
  characterName,
  accentColor,
  onClose,
}: DiaryViewProps) {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setEntries(getDiaryEntries(characterId));
    // Trigger fade-in on mount
    const t = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(t);
  }, [characterId]);

  function handleClose() {
    setVisible(false);
    setTimeout(onClose, 250);
  }

  return (
    <div
      onClick={handleClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 40,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(0,0,0,0.65)",
        opacity: visible ? 1 : 0,
        transition: "opacity 0.25s ease",
      }}
    >
      {/* Journal panel */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "relative",
          width: "min(640px, 92vw)",
          maxHeight: "80vh",
          backgroundColor: "rgba(30, 25, 20, 0.95)",
          borderRadius: "8px",
          border: `1px solid ${accentColor}55`,
          boxShadow: `0 8px 40px rgba(0,0,0,0.6), inset 0 0 60px rgba(0,0,0,0.3)`,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(16px)",
          transition: "opacity 0.25s ease, transform 0.25s ease",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px 24px 14px",
            borderBottom: `1px solid ${accentColor}33`,
            flexShrink: 0,
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
          }}
        >
          <h2
            style={{
              margin: 0,
              fontFamily: "'Georgia', 'Times New Roman', serif",
              fontStyle: "italic",
              fontWeight: 400,
              fontSize: "1.5rem",
              color: accentColor,
              letterSpacing: "0.02em",
            }}
          >
            {characterName}&apos;s Diary
          </h2>

          {/* Close button */}
          <button
            onClick={handleClose}
            aria-label="Close diary"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#aaa",
              fontSize: "1.25rem",
              lineHeight: 1,
              padding: "4px 6px",
              borderRadius: "4px",
              transition: "color 0.15s",
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.color = accentColor)
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.color = "#aaa")
            }
          >
            ✕
          </button>
        </div>

        {/* Scrollable entries */}
        <div
          style={{
            overflowY: "auto",
            padding: "16px 24px 24px",
            flexGrow: 1,
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          } as React.CSSProperties}
        >
          {entries.length === 0 ? (
            <p
              style={{
                fontFamily: "'Georgia', serif",
                fontStyle: "italic",
                color: "#888",
                textAlign: "center",
                marginTop: "40px",
                lineHeight: 1.7,
              }}
            >
              No diary entries yet&hellip;
              <br />
              Talk more and check back later!
            </p>
          ) : (
            entries.map((entry, index) => (
              <article
                key={entry.id}
                style={{
                  animation: "diaryFadeIn 0.4s ease both",
                  animationDelay: `${index * 60}ms`,
                }}
              >
                {index > 0 && (
                  <hr
                    style={{
                      border: "none",
                      borderTop: `1px solid ${accentColor}22`,
                      margin: "20px 0",
                    }}
                  />
                )}

                {/* Date + mood */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginBottom: "8px",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'Georgia', serif",
                      fontSize: "0.78rem",
                      fontWeight: 600,
                      color: accentColor,
                      letterSpacing: "0.05em",
                      textTransform: "uppercase",
                    }}
                  >
                    {formatDate(entry.date)}
                  </span>
                  <span
                    title={entry.mood}
                    style={{ fontSize: "0.9rem", lineHeight: 1 }}
                  >
                    {getMoodEmoji(entry.mood)}
                  </span>
                </div>

                {/* Entry content */}
                <p
                  style={{
                    margin: "0 0 10px",
                    fontFamily: "'Georgia', 'Times New Roman', serif",
                    fontStyle: "italic",
                    fontSize: "0.95rem",
                    color: "#e8ddd0",
                    lineHeight: 1.75,
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {entry.content}
                </p>

                {/* Topics */}
                {entry.topics.length > 0 && (
                  <div
                    style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}
                  >
                    {entry.topics.map((topic) => (
                      <span
                        key={topic}
                        style={{
                          fontSize: "0.7rem",
                          padding: "2px 8px",
                          borderRadius: "999px",
                          border: `1px solid ${accentColor}44`,
                          color: accentColor,
                          fontFamily: "system-ui, sans-serif",
                          letterSpacing: "0.03em",
                        }}
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                )}
              </article>
            ))
          )}
        </div>
      </div>

      {/* CSS-only fade-in keyframes */}
      <style>{`
        @keyframes diaryFadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        /* Hide scrollbar for WebKit */
        div::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}
