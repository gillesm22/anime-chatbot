"use client";

import { useState, useEffect } from "react";
import { isVoiceEnabled, toggleVoice } from "@/lib/speech";

export function VoiceToggle() {
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    setEnabled(isVoiceEnabled());
  }, []);

  const handleToggle = () => {
    const next = toggleVoice();
    setEnabled(next);
  };

  return (
    <button
      onClick={handleToggle}
      title={enabled ? "Voice on (click to mute)" : "Voice off (click to enable)"}
      className="flex items-center justify-center transition-all duration-200 hover:scale-110"
      style={{
        width: 28,
        height: 20,
        borderRadius: 99,
        backgroundColor: enabled ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.05)",
        border: `1px solid ${enabled ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.08)"}`,
        color: enabled ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.3)",
      }}
    >
      <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
        {enabled ? (
          <>
            <path d="M2 5.5h2.5L8 2v12L4.5 10.5H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1z" fill="currentColor" />
            <path d="M10.5 4.5c1 1 1.5 2.2 1.5 3.5s-.5 2.5-1.5 3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            <path d="M12.5 2.5c1.8 1.8 2.5 3.5 2.5 5.5s-.7 3.7-2.5 5.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </>
        ) : (
          <>
            <path d="M2 5.5h2.5L8 2v12L4.5 10.5H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1z" fill="currentColor" opacity="0.4" />
            <path d="M11 5l4 6M15 5l-4 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </>
        )}
      </svg>
    </button>
  );
}
