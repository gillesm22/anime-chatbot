import React from "react";

interface NotificationBadgeProps {
  count?: number;
  show: boolean;
}

const entranceKeyframes = `
@keyframes badgeEntrance {
  from { transform: scale(0); opacity: 0; }
  to   { transform: scale(1); opacity: 1; }
}
`;

export const NotificationBadge = ({ count, show }: NotificationBadgeProps) => {
  if (!show) return null;

  const hasCount = typeof count === "number" && count > 0;
  const label = hasCount ? (count > 9 ? "9+" : String(count)) : null;

  return (
    <>
      <style>{entranceKeyframes}</style>
      <span
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          transform: "translate(40%, -40%)",
          background: "#ef4444",
          color: "#fff",
          fontWeight: "bold",
          fontSize: 8,
          lineHeight: 1,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minWidth: hasCount ? 14 : 6,
          height: hasCount ? 14 : 6,
          padding: hasCount ? "0 2px" : 0,
          boxSizing: "border-box",
          animation: "badgeEntrance 0.2s ease forwards",
          pointerEvents: "none",
        }}
      >
        {label}
      </span>
    </>
  );
};
