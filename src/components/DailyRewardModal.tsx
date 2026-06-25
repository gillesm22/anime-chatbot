"use client";

import { DailyReward } from "@/lib/dailyRewards";

interface DailyRewardModalProps {
  reward: DailyReward;
  streak: number;
  onClaim: () => void;
  accentColor?: string;
}

const modalStyles = `
@keyframes rewardModalIn {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.reward-modal-card {
  animation: rewardModalIn 300ms ease-out forwards;
}
`;

export function DailyRewardModal({
  reward,
  streak,
  onClaim,
  accentColor = "#a78bfa",
}: DailyRewardModalProps) {
  const currentDay = streak % 7 === 0 ? 7 : streak % 7;

  return (
    <>
      <style>{modalStyles}</style>

      {/* Backdrop */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(0,0,0,0.7)",
          zIndex: 40,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1rem",
        }}
      >
        {/* Modal card */}
        <div
          className="reward-modal-card"
          style={{
            background:
              "linear-gradient(135deg, rgba(30,20,60,0.95) 0%, rgba(20,10,40,0.98) 100%)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            border: `1px solid ${accentColor}40`,
            borderRadius: "1.25rem",
            padding: "2rem",
            maxWidth: "360px",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "1rem",
            boxShadow: `0 0 40px ${accentColor}30, 0 20px 60px rgba(0,0,0,0.6)`,
          }}
        >
          {/* Icon */}
          <div
            style={{
              fontSize: "48px",
              lineHeight: 1,
              filter: "drop-shadow(0 0 12px rgba(255,255,255,0.3))",
            }}
            role="img"
            aria-label={reward.name}
          >
            {reward.icon}
          </div>

          {/* Title */}
          <h2
            style={{
              margin: 0,
              fontSize: "1.4rem",
              fontWeight: 700,
              color: "#ffffff",
              textAlign: "center",
              letterSpacing: "0.02em",
            }}
          >
            Day {streak} Reward!
          </h2>

          {/* Reward name */}
          <p
            style={{
              margin: 0,
              fontSize: "1.1rem",
              fontWeight: 600,
              color: accentColor,
              textAlign: "center",
            }}
          >
            {reward.name}
          </p>

          {/* Description */}
          <p
            style={{
              margin: 0,
              fontSize: "0.9rem",
              color: "rgba(255,255,255,0.7)",
              textAlign: "center",
              lineHeight: 1.5,
            }}
          >
            {reward.description}
          </p>

          {/* Affinity bonus */}
          <div
            style={{
              background: `${accentColor}20`,
              border: `1px solid ${accentColor}50`,
              borderRadius: "0.5rem",
              padding: "0.5rem 1.25rem",
              fontSize: "1rem",
              fontWeight: 700,
              color: accentColor,
            }}
          >
            +{reward.affinityBonus} Affinity
          </div>

          {/* Special unlock message */}
          {reward.special && (
            <p
              style={{
                margin: 0,
                fontSize: "0.85rem",
                fontWeight: 600,
                color: accentColor,
                textAlign: "center",
                padding: "0.5rem 0.75rem",
                background: `${accentColor}15`,
                borderRadius: "0.5rem",
                border: `1px solid ${accentColor}30`,
              }}
            >
              {reward.special}
            </p>
          )}

          {/* Claim button */}
          <button
            onClick={onClaim}
            style={{
              marginTop: "0.25rem",
              width: "100%",
              padding: "0.75rem",
              background: `linear-gradient(135deg, ${accentColor} 0%, ${accentColor}cc 100%)`,
              border: "none",
              borderRadius: "0.75rem",
              color: "#ffffff",
              fontSize: "1rem",
              fontWeight: 700,
              cursor: "pointer",
              letterSpacing: "0.04em",
              boxShadow: `0 4px 20px ${accentColor}50`,
              transition: "opacity 150ms ease",
            }}
            onMouseEnter={(e) =>
              ((e.target as HTMLButtonElement).style.opacity = "0.85")
            }
            onMouseLeave={(e) =>
              ((e.target as HTMLButtonElement).style.opacity = "1")
            }
          >
            Claim
          </button>

          {/* 7-day progress dots */}
          <div
            style={{
              display: "flex",
              gap: "0.5rem",
              alignItems: "center",
              marginTop: "0.25rem",
            }}
            role="progressbar"
            aria-valuenow={currentDay}
            aria-valuemin={1}
            aria-valuemax={7}
            aria-label={`Day ${currentDay} of 7`}
          >
            {Array.from({ length: 7 }, (_, i) => {
              const dayNum = i + 1;
              const isCurrent = dayNum === currentDay;
              const isFilled = dayNum < currentDay;

              return (
                <div
                  key={dayNum}
                  title={`Day ${dayNum}`}
                  style={{
                    width: isCurrent ? "14px" : "10px",
                    height: isCurrent ? "14px" : "10px",
                    borderRadius: "50%",
                    backgroundColor: isFilled || isCurrent ? accentColor : "rgba(255,255,255,0.2)",
                    border: isCurrent ? `2px solid #ffffff` : "none",
                    boxShadow: isCurrent ? `0 0 8px ${accentColor}` : "none",
                    transition: "all 200ms ease",
                    flexShrink: 0,
                  }}
                />
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
