"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAwayNotifications, type AwayNotification } from "@/lib/awayNotifications";

export function AwayNotificationStack() {
  const [notifications, setNotifications] = useState<AwayNotification[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const router = useRouter();

  useEffect(() => {
    const notes = getAwayNotifications();
    setNotifications(notes);
    if (notes.length > 0) {
      const timer = setTimeout(() => setNotifications([]), 8000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = (charId: string) => {
    setDismissed((prev) => new Set(prev).add(charId));
  };

  const handleTap = (charId: string) => {
    router.push(`/chat/${charId}`);
  };

  const visible = notifications.filter((n) => !dismissed.has(n.characterId));
  if (visible.length === 0) return null;

  return (
    <div style={{
      position: "fixed",
      top: "calc(env(safe-area-inset-top, 0px) + 12px)",
      left: "50%",
      transform: "translateX(-50%)",
      zIndex: 55,
      display: "flex",
      flexDirection: "column",
      gap: 8,
      width: "min(92vw, 400px)",
      pointerEvents: "auto",
    }}>
      {visible.map((note, i) => (
        <div
          key={note.characterId}
          onClick={() => handleTap(note.characterId)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === "Enter") handleTap(note.characterId); }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "12px 16px",
            borderRadius: 14,
            background: "var(--color-panel)",
            backdropFilter: "blur(14px)",
            WebkitBackdropFilter: "blur(14px)",
            borderLeft: `3px solid ${note.accentColor}`,
            border: `1px solid ${note.accentColor}25`,
            boxShadow: `0 4px 20px rgba(0,0,0,0.3), 0 0 8px ${note.accentColor}15`,
            cursor: "pointer",
            opacity: 0,
            animation: `notifSlideIn 0.4s ease-out ${i * 0.2}s forwards`,
          }}
        >
          <img
            src={`/sprites/${note.characterId}/body-neutral.png`}
            alt={note.characterName}
            style={{
              width: 40, height: 40, borderRadius: "50%",
              objectFit: "cover", objectPosition: "center top",
              border: `2px solid ${note.accentColor}50`, flexShrink: 0,
            }}
            draggable={false}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 11, fontWeight: 600, color: note.accentColor,
              letterSpacing: "0.04em", marginBottom: 2,
            }}>
              {note.characterName}
            </div>
            <div style={{
              fontSize: 13, color: "var(--color-text)", lineHeight: 1.4,
              fontFamily: "var(--font-dialogue, 'Zen Maru Gothic', sans-serif)",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {note.message}
            </div>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); handleDismiss(note.characterId); }}
            style={{
              background: "transparent", border: "none",
              color: "var(--color-text-secondary)", fontSize: 16,
              cursor: "pointer", padding: 4, flexShrink: 0, lineHeight: 1,
            }}
            aria-label={`Dismiss ${note.characterName} notification`}
          >&times;</button>
        </div>
      ))}
      <style>{`
        @keyframes notifSlideIn {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
