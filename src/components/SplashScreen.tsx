"use client";

import { useEffect, useState } from "react";

export function SplashScreen() {
  const [visible, setVisible] = useState(() => {
    if (typeof window === "undefined") return false;
    return !sessionStorage.getItem("hexxii-splash-seen");
  });
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(() => {
      setFadeOut(true);
      setTimeout(() => {
        sessionStorage.setItem("hexxii-splash-seen", "1");
        setVisible(false);
      }, 500);
    }, 1500);
    return () => clearTimeout(timer);
  }, [visible]);

  if (!visible) return null;

  return (
    <>
      <style>{`
        @keyframes splashBounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes splashFadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
      `}</style>
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
          background: "#0d0d12",
          animation: fadeOut ? "splashFadeOut 0.5s ease-out forwards" : undefined,
        }}
      >
        <h1
          style={{
            fontSize: "clamp(2.5rem, 8vw, 5rem)",
            fontWeight: 300,
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            backgroundImage: "linear-gradient(to right, #f472b6, #e53935, #fb923c, #a78bfa, #7b1fa2)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
            margin: 0,
            lineHeight: 1.2,
          }}
        >
          HEXXII
        </h1>
        <img
          src="/sprites/hexx/neutral.png"
          alt="Hexx"
          draggable={false}
          style={{
            width: 60,
            height: 60,
            objectFit: "cover",
            borderRadius: "50%",
            animation: "splashBounce 1.2s ease-in-out infinite",
            filter: "drop-shadow(0 0 10px rgba(229,57,53,0.5))",
          }}
        />
        <p
          style={{
            fontSize: "0.7rem",
            letterSpacing: "0.25em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.4)",
            margin: 0,
          }}
        >
          Visual Novel Chatbot
        </p>
      </div>
    </>
  );
}
