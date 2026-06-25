"use client";

import { useState } from "react";
import {
  HERO_CLASSES,
  saveHeroConfig,
  selectHeroClass,
  type HeroClassId,
} from "@/lib/heroAvatar";

interface OnboardingOverlayProps {
  onComplete: () => void;
}

export function OnboardingOverlay({ onComplete }: OnboardingOverlayProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState("");
  const [selectedClass, setSelectedClass] = useState<HeroClassId | null>(null);

  const handleNext = () => {
    if (!name.trim()) return;
    setStep(2);
  };

  const handleBegin = () => {
    if (!selectedClass) return;
    saveHeroConfig({ name: name.trim() });
    selectHeroClass(selectedClass);
    onComplete();
  };

  return (
    <>
      <style>{`
        @keyframes onb-fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes onb-slideUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes onb-slideLeft {
          from { opacity: 0; transform: translateX(40px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .onb-overlay {
          animation: onb-fadeIn 0.4s ease-out forwards;
        }
        .onb-content {
          animation: onb-slideUp 0.5s ease-out 0.15s both;
        }
        .onb-step2-enter {
          animation: onb-slideLeft 0.4s ease-out forwards;
        }
      `}</style>

      <div
        className="onb-overlay fixed inset-0 z-[9999] flex items-center justify-center px-4"
        style={{
          background: "rgba(6, 6, 12, 0.92)",
          backdropFilter: "blur(16px)",
        }}
      >
        <div className="onb-content w-full max-w-md flex flex-col items-center gap-6">
          {step === 1 && (
            <>
              <h1
                className="text-3xl sm:text-4xl font-light tracking-widest uppercase bg-clip-text text-transparent text-center"
                style={{
                  backgroundImage:
                    "linear-gradient(to right, #f472b6, #e53935, #fb923c, #a78bfa, #7b1fa2)",
                }}
              >
                Welcome
              </h1>

              <p className="text-sm tracking-wide" style={{ color: "rgba(255,255,255,0.5)" }}>
                Enter your name to begin
              </p>

              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleNext()}
                placeholder="Your name..."
                autoFocus
                className="w-full max-w-xs text-sm text-white placeholder:text-white/30 rounded-xl px-4 py-3 outline-none focus:ring-1 focus:ring-white/20 transition-all"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              />

              <button
                onClick={handleNext}
                disabled={!name.trim()}
                className="px-8 py-2.5 rounded-xl text-sm font-medium tracking-wide uppercase transition-all duration-200"
                style={{
                  background: name.trim()
                    ? "linear-gradient(135deg, #e53935, #7b1fa2)"
                    : "rgba(255,255,255,0.06)",
                  color: name.trim() ? "#fff" : "rgba(255,255,255,0.25)",
                  cursor: name.trim() ? "pointer" : "not-allowed",
                }}
              >
                Next
              </button>
            </>
          )}

          {step === 2 && (
            <div className="onb-step2-enter w-full flex flex-col items-center gap-6">
              <h2
                className="text-xl sm:text-2xl font-light tracking-widest uppercase bg-clip-text text-transparent text-center"
                style={{
                  backgroundImage:
                    "linear-gradient(to right, #f472b6, #e53935, #fb923c, #a78bfa, #7b1fa2)",
                }}
              >
                Choose Your Class
              </h2>

              <p className="text-sm tracking-wide" style={{ color: "rgba(255,255,255,0.5)" }}>
                How will the world see you?
              </p>

              <div className="grid grid-cols-3 gap-2 w-full max-w-sm">
                {HERO_CLASSES.map((cls) => {
                  const selected = selectedClass === cls.id;
                  return (
                    <button
                      key={cls.id}
                      onClick={() => setSelectedClass(cls.id)}
                      className="relative flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl transition-all duration-200"
                      style={{
                        background: selected
                          ? `${cls.theme.accent}25`
                          : "rgba(255,255,255,0.04)",
                        border: `1.5px solid ${
                          selected ? `${cls.theme.accent}60` : "rgba(255,255,255,0.06)"
                        }`,
                        boxShadow: selected ? `0 0 20px ${cls.theme.glow}` : "none",
                      }}
                    >
                      <span className="text-xl">{cls.icon}</span>
                      <span
                        className="text-xs font-medium"
                        style={{
                          color: selected ? cls.theme.accent : "rgba(255,255,255,0.5)",
                        }}
                      >
                        {cls.label}
                      </span>
                      <span
                        className="text-[9px] opacity-60"
                        style={{
                          color: selected ? cls.theme.accent : "rgba(255,255,255,0.35)",
                        }}
                      >
                        {cls.title}
                      </span>
                    </button>
                  );
                })}
              </div>

              <button
                onClick={handleBegin}
                disabled={!selectedClass}
                className="px-8 py-2.5 rounded-xl text-sm font-medium tracking-wide uppercase transition-all duration-200"
                style={{
                  background: selectedClass
                    ? `linear-gradient(135deg, ${
                        HERO_CLASSES.find((c) => c.id === selectedClass)?.theme.accent ?? "#e53935"
                      }, #7b1fa2)`
                    : "rgba(255,255,255,0.06)",
                  color: selectedClass ? "#fff" : "rgba(255,255,255,0.25)",
                  cursor: selectedClass ? "pointer" : "not-allowed",
                }}
              >
                Begin
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
