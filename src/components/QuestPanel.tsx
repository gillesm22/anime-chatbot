"use client";

import { useState, useEffect } from "react";
import {
  getDailyQuests,
  claimQuestReward,
  Quest,
  QuestProgress,
} from "@/lib/quests";

export interface QuestPanelProps {
  characterId: string;
  accentColor: string;
  onClose: () => void;
  onClaimReward: (points: number) => void;
}

interface QuestEntry {
  quest: Quest;
  progress: QuestProgress;
}

export function QuestPanel({
  characterId,
  accentColor,
  onClose,
  onClaimReward,
}: QuestPanelProps) {
  const [entries, setEntries] = useState<QuestEntry[]>([]);

  useEffect(() => {
    setEntries(getDailyQuests(characterId));
  }, [characterId]);

  function handleClaim(questId: string) {
    const points = claimQuestReward(characterId, questId);
    if (points > 0) {
      onClaimReward(points);
      setEntries(getDailyQuests(characterId));
    }
  }

  return (
    <>
      <style>{`
        .qp-overlay {
          position: fixed;
          inset: 0;
          z-index: 40;
          display: flex;
          align-items: flex-end;
          justify-content: center;
          background: rgba(0, 0, 0, 0.45);
          animation: qp-fade-in 0.2s ease both;
        }

        @keyframes qp-fade-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        .qp-panel {
          width: 100%;
          max-width: 480px;
          background: rgba(15, 12, 28, 0.82);
          backdrop-filter: blur(20px) saturate(1.4);
          -webkit-backdrop-filter: blur(20px) saturate(1.4);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-bottom: none;
          border-radius: 20px 20px 0 0;
          padding: 24px 20px 36px;
          animation: qp-slide-up 0.3s cubic-bezier(0.34, 1.2, 0.64, 1) both;
        }

        @keyframes qp-slide-up {
          from { transform: translateY(100%); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }

        .qp-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
        }

        .qp-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 1.1rem;
          font-weight: 700;
          color: #f0ecff;
          letter-spacing: 0.02em;
        }

        .qp-title-icon {
          font-size: 1rem;
          line-height: 1;
        }

        .qp-close {
          background: rgba(255, 255, 255, 0.08);
          border: none;
          color: #aaa;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1rem;
          transition: background 0.15s, color 0.15s;
        }

        .qp-close:hover {
          background: rgba(255, 255, 255, 0.15);
          color: #fff;
        }

        .qp-cards {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .qp-card {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.07);
          border-radius: 12px;
          padding: 14px 16px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          transition: opacity 0.2s;
        }

        .qp-card.claimed {
          opacity: 0.45;
        }

        .qp-card-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 10px;
        }

        .qp-card-info {
          flex: 1;
          min-width: 0;
        }

        .qp-card-title {
          font-size: 0.9rem;
          font-weight: 600;
          color: #e8e4ff;
          margin: 0 0 2px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .qp-card-desc {
          font-size: 0.75rem;
          color: #9990bb;
          margin: 0;
        }

        .qp-reward-badge {
          display: flex;
          align-items: center;
          gap: 4px;
          background: rgba(255, 215, 0, 0.12);
          border: 1px solid rgba(255, 215, 0, 0.2);
          border-radius: 20px;
          padding: 3px 9px;
          font-size: 0.75rem;
          font-weight: 700;
          color: #ffd700;
          white-space: nowrap;
          flex-shrink: 0;
        }

        .qp-card-bottom {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .qp-progress-track {
          flex: 1;
          height: 6px;
          background: rgba(255, 255, 255, 0.08);
          border-radius: 99px;
          overflow: hidden;
        }

        .qp-progress-fill {
          height: 100%;
          border-radius: 99px;
          transition: width 0.4s ease;
        }

        .qp-progress-label {
          font-size: 0.72rem;
          color: #7a7299;
          white-space: nowrap;
          min-width: 36px;
          text-align: right;
        }

        .qp-claim-btn {
          border: none;
          border-radius: 8px;
          padding: 5px 14px;
          font-size: 0.78rem;
          font-weight: 700;
          cursor: pointer;
          letter-spacing: 0.03em;
          animation: qp-glow-pulse 1.6s ease-in-out infinite;
          color: #fff;
        }

        @keyframes qp-glow-pulse {
          0%, 100% { box-shadow: 0 0 6px 1px var(--qp-glow, rgba(160,120,255,0.5)); }
          50%       { box-shadow: 0 0 14px 4px var(--qp-glow, rgba(160,120,255,0.8)); }
        }

        .qp-checkmark {
          font-size: 1rem;
          color: #4caf50;
          flex-shrink: 0;
        }
      `}</style>

      <div className="qp-overlay" onClick={onClose}>
        <div className="qp-panel" onClick={(e) => e.stopPropagation()}>
          <div className="qp-header">
            <div className="qp-title">
              <span className="qp-title-icon">⚔️</span>
              Daily Quests
            </div>
            <button className="qp-close" onClick={onClose} aria-label="Close">
              ✕
            </button>
          </div>

          <div className="qp-cards">
            {entries.map(({ quest, progress }) => {
              const pct =
                quest.target > 0
                  ? Math.min((progress.current / quest.target) * 100, 100)
                  : 0;

              return (
                <div
                  key={quest.id}
                  className={`qp-card${progress.claimed ? " claimed" : ""}`}
                >
                  <div className="qp-card-top">
                    <div className="qp-card-info">
                      <p className="qp-card-title">{quest.title}</p>
                      <p className="qp-card-desc">{quest.description}</p>
                    </div>
                    <div className="qp-reward-badge">
                      ★ {quest.reward}
                    </div>
                  </div>

                  <div className="qp-card-bottom">
                    {progress.claimed ? (
                      <>
                        <div className="qp-progress-track">
                          <div
                            className="qp-progress-fill"
                            style={{
                              width: "100%",
                              background: accentColor,
                            }}
                          />
                        </div>
                        <span
                          className="qp-progress-label"
                          style={{ color: accentColor }}
                        >
                          {quest.target}/{quest.target}
                        </span>
                        <span className="qp-checkmark">✓</span>
                      </>
                    ) : progress.completed ? (
                      <>
                        <div className="qp-progress-track">
                          <div
                            className="qp-progress-fill"
                            style={{
                              width: "100%",
                              background: accentColor,
                            }}
                          />
                        </div>
                        <span
                          className="qp-progress-label"
                          style={{ color: accentColor }}
                        >
                          {quest.target}/{quest.target}
                        </span>
                        <button
                          className="qp-claim-btn"
                          style={{
                            background: accentColor,
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            ["--qp-glow" as any]: `${accentColor}99`,
                          }}
                          onClick={() => handleClaim(quest.id)}
                        >
                          Claim
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="qp-progress-track">
                          <div
                            className="qp-progress-fill"
                            style={{
                              width: `${pct}%`,
                              background: accentColor,
                            }}
                          />
                        </div>
                        <span className="qp-progress-label">
                          {progress.current}/{quest.target}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
