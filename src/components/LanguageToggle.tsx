"use client";

import { useState, useEffect } from "react";
import { getLanguage, setLanguage, type Language } from "@/lib/i18n";

export function LanguageToggle() {
  const [lang, setLang] = useState<Language>("en");

  useEffect(() => {
    setLang(getLanguage());
  }, []);

  const toggle = () => {
    const next: Language = lang === "en" ? "ja" : "en";
    setLanguage(next);
    window.location.reload();
  };

  // Show the label of the language you'd switch TO
  const label = lang === "en" ? "JP" : "EN";

  return (
    <button
      onClick={toggle}
      title={lang === "en" ? "Switch to Japanese" : "Switch to English"}
      style={{
        width: "32px",
        height: "20px",
        borderRadius: "9999px",
        backgroundColor: "var(--color-toggle-bg)",
        border: "1px solid var(--color-progress-track)",
        color: "var(--color-text-bright)",
        fontSize: "10px",
        fontWeight: 600,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        padding: 0,
        lineHeight: 1,
        letterSpacing: "0.02em",
        transition: "background-color 200ms, border-color 200ms",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.backgroundColor =
          "var(--color-progress-track)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.backgroundColor =
          "var(--color-toggle-bg)";
      }}
    >
      {label}
    </button>
  );
}
