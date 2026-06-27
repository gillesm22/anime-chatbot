"use client";

import { useEffect, useState } from "react";
import { type Gift, type CharacterReaction, getGiftCatalog, giveGift } from "@/lib/gifts";

interface GiftShopProps {
  characterId: string;
  characterName: string;
  accentColor: string;
  onGift: (gift: Gift, reaction: CharacterReaction) => void;
  onClose: () => void;
}

const RARITY_STYLES: Record<Gift["rarity"], { badge: string; label: string }> = {
  common: { badge: "bg-gray-500 text-white", label: "Common" },
  rare: { badge: "bg-purple-600 text-white", label: "Rare" },
  legendary: { badge: "bg-yellow-500 text-black", label: "Legendary" },
};

function GiftConfetti({ accentColor }: { accentColor: string }) {
  const particles = Array.from({ length: 18 }, (_, i) => {
    const angle = (i / 18) * 360;
    const dist = 40 + Math.random() * 60;
    const size = 3 + Math.random() * 4;
    const dur = 0.5 + Math.random() * 0.3;
    const colors = [accentColor, "#FFD700", "#FF6B9D", "#7C4DFF", "#00E5FF"];
    const color = colors[i % colors.length];
    const x = Math.cos((angle * Math.PI) / 180) * dist;
    const y = Math.sin((angle * Math.PI) / 180) * dist;
    const isRound = i % 2 === 0;
    return { x, y, size, dur, color, delay: Math.random() * 0.15, isRound };
  });

  const keyframes = particles.map((p, i) =>
    `@keyframes cb${i}{0%{transform:translate(0,0) scale(0);opacity:1}70%{opacity:1}100%{transform:translate(${p.x}px,${p.y}px) scale(1);opacity:0}}`
  ).join("\n");

  return (
    <div style={{ position: "fixed", top: "40%", left: "50%", zIndex: 60, pointerEvents: "none" }}>
      <style>{keyframes}</style>
      {particles.map((p, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            width: p.size,
            height: p.size,
            borderRadius: p.isRound ? "50%" : "1px",
            background: p.color,
            left: 0,
            top: 0,
            animation: `cb${i} ${p.dur}s ease-out ${p.delay}s forwards`,
          }}
        />
      ))}
    </div>
  );
}

export function GiftShop({ characterId, characterName, accentColor, onGift, onClose }: GiftShopProps) {
  const [visible, setVisible] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const catalog = getGiftCatalog();

  useEffect(() => {
    // Trigger slide-up animation after mount
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);

  function handleClose() {
    setVisible(false);
    setTimeout(onClose, 300);
  }

  function handleGive(gift: Gift) {
    const result = giveGift(characterId, gift.id);
    if (!result) return;
    setShowConfetti(true);
    setTimeout(() => {
      onGift(result.gift, result.reaction);
      handleClose();
    }, 600);
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center"
      onClick={handleClose}
    >
      <style>{`
        @keyframes gift-sparkle {
          0% { opacity: 0; transform: scale(0) rotate(0deg); }
          50% { opacity: 1; transform: scale(1) rotate(180deg); }
          100% { opacity: 0; transform: scale(0) rotate(360deg); }
        }
        .gift-item-hover:hover .gift-sparkle-1,
        .gift-item-hover:hover .gift-sparkle-2 {
          animation: gift-sparkle 0.7s ease-in-out;
        }
        .gift-item-hover:hover .gift-sparkle-2 {
          animation-delay: 0.2s;
        }
      `}</style>
      {showConfetti && <GiftConfetti accentColor={accentColor} />}
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 transition-opacity duration-300"
        style={{ opacity: visible ? 1 : 0 }}
      />

      {/* Panel */}
      <div
        className="relative w-full max-w-lg bg-gray-900 rounded-t-2xl p-5 shadow-2xl transition-transform duration-300 ease-out"
        style={{ transform: visible ? "translateY(0)" : "translateY(100%)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span>🎁</span>
            <span>Gift Shop</span>
          </h2>
          <p className="text-sm text-gray-400">for {characterName}</p>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors text-xl leading-none"
            aria-label="Close gift shop"
          >
            ✕
          </button>
        </div>

        {/* Gift grid */}
        <div className="grid grid-cols-3 gap-3 max-h-72 overflow-y-auto pr-1">
          {catalog.map((gift) => {
            const isLegendary = gift.rarity === "legendary";
            const rarityStyle = RARITY_STYLES[gift.rarity];

            return (
              <button
                key={gift.id}
                onClick={() => handleGive(gift)}
                className={[
                  "gift-item-hover flex flex-col items-center gap-1 rounded-xl p-3 border transition-transform hover:scale-105 active:scale-95 text-left relative overflow-hidden",
                  isLegendary
                    ? "border-yellow-500 bg-yellow-950/40 shadow-[0_0_12px_2px_rgba(234,179,8,0.35)]"
                    : "border-gray-700 bg-gray-800 hover:border-gray-500",
                ].join(" ")}
                style={isLegendary ? { boxShadow: "0 0 14px 3px rgba(234,179,8,0.3)" } : undefined}
              >
                {/* Sparkle decorations on hover */}
                <span className="gift-sparkle-1 absolute top-1 right-1 w-2 h-2 opacity-0 pointer-events-none" style={{ background: accentColor, borderRadius: "50%", filter: "blur(1px)" }} />
                <span className="gift-sparkle-2 absolute bottom-2 left-1 w-1.5 h-1.5 opacity-0 pointer-events-none" style={{ background: "#FFD700", borderRadius: "50%", filter: "blur(1px)" }} />
                <span className="text-3xl">{gift.emoji}</span>
                <span className="text-white text-xs font-semibold text-center leading-tight">
                  {gift.name}
                </span>
                <span className="text-gray-400 text-[10px] text-center leading-tight">
                  {gift.description}
                </span>
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full mt-0.5 ${rarityStyle.badge}`}
                >
                  {rarityStyle.label}
                </span>
                <span
                  className="text-xs font-bold mt-0.5"
                  style={{ color: accentColor }}
                >
                  +{gift.affinityBonus}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
