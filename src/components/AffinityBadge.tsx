"use client";
import { getNextLevelProgress, type AffinityData } from "@/lib/affinity";

interface AffinityBadgeProps {
  data: AffinityData;
  accentColor: string;
}

export function AffinityBadge({ data, accentColor }: AffinityBadgeProps) {
  const progress = getNextLevelProgress(data);
  const isMaxLevel = data.level >= 5;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
      <span
        style={{
          backgroundColor: accentColor + "25",
          border: `1px solid ${accentColor}40`,
          color: accentColor,
          fontSize: "10px",
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          padding: "2px 8px",
          borderRadius: "9999px",
          whiteSpace: "nowrap",
        }}
      >
        Lv.{data.level} {data.levelName}
      </span>

      {!isMaxLevel && (
        <div
          style={{
            width: "16px",
            height: "4px",
            borderRadius: "9999px",
            backgroundColor: accentColor + "25",
            overflow: "hidden",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: `${progress.percent}%`,
              height: "100%",
              backgroundColor: accentColor,
              borderRadius: "9999px",
            }}
          />
        </div>
      )}
    </div>
  );
}
