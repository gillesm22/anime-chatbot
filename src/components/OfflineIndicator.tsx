"use client";

import { useState, useEffect } from "react";

export function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const goOffline = () => setIsOffline(true);
    const goOnline = () => setIsOffline(false);

    setIsOffline(!navigator.onLine);
    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);
    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 12,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 60,
        background: "rgba(239, 68, 68, 0.9)",
        backdropFilter: "blur(8px)",
        color: "white",
        fontSize: 12,
        fontWeight: 500,
        padding: "4px 16px",
        borderRadius: 99,
        pointerEvents: "none",
      }}
    >
      Offline Mode
    </div>
  );
}
