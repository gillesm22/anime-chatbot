"use client";

interface StreakBadgeProps {
  streak: number;
  accentColor: string;
}

export function StreakBadge({ streak, accentColor }: StreakBadgeProps) {
  if (streak < 2) return null;

  return (
    <span
      style={{
        backgroundColor: accentColor + "25",
        border: `1px solid ${accentColor}40`,
        color: accentColor,
        fontSize: "10px",
        fontWeight: 600,
        padding: "2px 8px",
        borderRadius: "9999px",
        whiteSpace: "nowrap",
      }}
    >
      🔥 {streak}
    </span>
  );
}
