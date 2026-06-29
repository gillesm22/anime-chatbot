"use client";
import { useState, useEffect } from "react";

interface SaveToastProps {
  message: string;
  type: "save" | "restore";
  onDone: () => void;
}

export function SaveToast({ message, type, onDone }: SaveToastProps) {
  const [visible, setVisible] = useState(false);

  const color = type === "save" ? "#4ade80" : "#f59e0b";
  const icon = type === "save" ? "\u2713" : "\u21BA";

  useEffect(() => {
    const showTimer = requestAnimationFrame(() => setVisible(true));
    const hideTimer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDone, 500);
    }, 3000);

    return () => {
      cancelAnimationFrame(showTimer);
      clearTimeout(hideTimer);
    };
  }, [onDone]);

  return (
    <div style={{
      position: "fixed",
      bottom: "80px",
      left: "50%",
      transform: visible ? "translateX(-50%) translateY(0)" : "translateX(-50%) translateY(10px)",
      opacity: visible ? 1 : 0,
      transition: "opacity 400ms ease, transform 400ms ease",
      zIndex: 55,
      pointerEvents: "none",
      backdropFilter: "blur(12px)",
      WebkitBackdropFilter: "blur(12px)",
      background: `linear-gradient(135deg, ${color}30 0%, ${color}15 100%)`,
      border: `1px solid ${color}50`,
      boxShadow: `0 8px 32px ${color}20, 0 2px 8px rgba(0,0,0,0.3)`,
      borderRadius: "12px",
      padding: "12px 20px",
      color: "#fff",
      fontSize: "14px",
      whiteSpace: "nowrap",
      display: "flex",
      flexDirection: "row",
      alignItems: "center",
      gap: "8px",
    }}>
      <span>{icon}</span>
      <span>{message}</span>
    </div>
  );
}
