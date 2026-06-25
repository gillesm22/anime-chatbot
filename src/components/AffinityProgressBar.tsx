import React from "react";

interface AffinityProgressBarProps {
  level: number;
  levelName: string;
  progress: number;
  accentColor: string;
}

export const AffinityProgressBar = ({
  level,
  levelName,
  progress,
  accentColor,
}: AffinityProgressBarProps) => {
  const clampedProgress = Math.min(100, Math.max(0, progress));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, width: 200 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span
          style={{
            fontSize: 10,
            color: accentColor,
            fontWeight: 600,
            lineHeight: 1,
          }}
        >
          Lv.{level} {levelName}
        </span>
        <span
          style={{
            fontSize: 10,
            color: "rgba(255,255,255,0.4)",
            lineHeight: 1,
          }}
        >
          {clampedProgress}%
        </span>
      </div>
      <div
        style={{
          width: 200,
          height: 4,
          borderRadius: 2,
          background: "rgba(255,255,255,0.08)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${clampedProgress}%`,
            background: accentColor,
            borderRadius: 2,
            transition: "width 0.5s ease",
          }}
        />
      </div>
    </div>
  );
};
