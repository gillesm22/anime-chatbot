"use client";
import { useState, useEffect } from "react";

interface MilestoneToastProps {
  milestone: string;
  accentColor: string;
  onDone: () => void;
}

export function MilestoneToast({ milestone, accentColor, onDone }: MilestoneToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Trigger fade-in on next frame
    const showTimer = requestAnimationFrame(() => setVisible(true));

    // Begin fade-out after 3.5s
    const hideTimer = setTimeout(() => {
      setVisible(false);
      // Call onDone after fade-out transition (500ms)
      setTimeout(onDone, 500);
    }, 3500);

    return () => {
      cancelAnimationFrame(showTimer);
      clearTimeout(hideTimer);
    };
  }, [onDone]);

  return (
    <div
      style={{
        position: "fixed",
        top: "24px",
        left: "50%",
        transform: visible
          ? "translateX(-50%) translateY(0)"
          : "translateX(-50%) translateY(-20px)",
        opacity: visible ? 1 : 0,
        transition: "opacity 400ms ease, transform 400ms ease",
        zIndex: 50,
        pointerEvents: "none",
        // Glassmorphism
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        background: `linear-gradient(135deg, ${accentColor}30 0%, ${accentColor}15 100%)`,
        border: `1px solid ${accentColor}50`,
        boxShadow: `0 8px 32px ${accentColor}20, 0 2px 8px rgba(0,0,0,0.3)`,
        borderRadius: "12px",
        padding: "12px 20px",
        color: "#fff",
        fontSize: "14px",
        whiteSpace: "nowrap",
      }}
    >
      ✨ Milestone unlocked: <strong>{milestone}</strong>
    </div>
  );
}
