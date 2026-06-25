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

export function GiftShop({ characterId, characterName, accentColor, onGift, onClose }: GiftShopProps) {
  const [visible, setVisible] = useState(false);
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
    onGift(result.gift, result.reaction);
    handleClose();
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center"
      onClick={handleClose}
    >
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
                  "flex flex-col items-center gap-1 rounded-xl p-3 border transition-transform hover:scale-105 active:scale-95 text-left",
                  isLegendary
                    ? "border-yellow-500 bg-yellow-950/40 shadow-[0_0_12px_2px_rgba(234,179,8,0.35)]"
                    : "border-gray-700 bg-gray-800 hover:border-gray-500",
                ].join(" ")}
                style={isLegendary ? { boxShadow: "0 0 14px 3px rgba(234,179,8,0.3)" } : undefined}
              >
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
