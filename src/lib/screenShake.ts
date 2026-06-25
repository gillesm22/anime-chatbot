"use client";

export function triggerScreenShake(intensity: "light" | "medium" | "heavy" = "medium") {
  if (typeof document === "undefined") return;

  const el = document.getElementById("chat-container");
  if (!el) return;

  const durations = { light: "0.2s", medium: "0.35s", heavy: "0.5s" };

  el.style.animation = `screenShake ${durations[intensity]} ease-in-out`;
  el.addEventListener("animationend", () => {
    el.style.animation = "";
  }, { once: true });
}
