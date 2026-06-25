"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { PageTransition } from "@/components/PageTransition";

const CHARACTERS = [
  { id: "arisu", name: "Arisu", color: "#f472b6" },
  { id: "marin", name: "Marin", color: "#fb923c" },
  { id: "nao", name: "Nao", color: "#a78bfa" },
  { id: "kurisu", name: "Kurisu", color: "#e53935" },
  { id: "merrick", name: "Merrick", color: "#7b1fa2" },
] as const;

type CharacterId = (typeof CHARACTERS)[number]["id"];

interface SpriteEntry {
  file: string;
  label: string;
  category: "expression" | "body" | "bikini";
}

const SPRITES: SpriteEntry[] = [
  { file: "body-neutral.png", label: "Body Neutral", category: "body" },
  { file: "body-back.png", label: "Body Back", category: "body" },
  { file: "body-front-bikini.png", label: "Front Bikini", category: "bikini" },
  { file: "body-back-bikini.png", label: "Back Bikini", category: "bikini" },
  { file: "face-happy.png", label: "Happy", category: "expression" },
  { file: "face-thinking.png", label: "Thinking", category: "expression" },
  { file: "face-surprised.png", label: "Surprised", category: "expression" },
  { file: "face-sad.png", label: "Sad", category: "expression" },
  { file: "face-smirk.png", label: "Smirk", category: "expression" },
  { file: "face-laugh.png", label: "Laugh", category: "expression" },
  { file: "face-angry.png", label: "Angry", category: "expression" },
  { file: "face-flustered.png", label: "Flustered", category: "expression" },
];

const CATEGORY_LABELS: Record<SpriteEntry["category"], string> = {
  expression: "Expressions",
  body: "Body Poses",
  bikini: "Bikini Views",
};

const CATEGORY_ORDER: SpriteEntry["category"][] = ["expression", "body", "bikini"];

export default function GalleryPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<CharacterId>("arisu");
  const [lightbox, setLightbox] = useState<{ src: string; label: string } | null>(null);

  const activeChar = CHARACTERS.find((c) => c.id === activeTab)!;

  return (
    <PageTransition>
      <div
        className="min-h-screen flex flex-col"
        style={{ background: "linear-gradient(180deg, #16161e 0%, #0d0d12 100%)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-text-secondary hover:text-text transition-colors text-sm"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M10 12L6 8L10 4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Back
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 px-4 sm:px-6 pb-12 max-w-4xl mx-auto w-full">
          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="text-2xl font-light tracking-widest uppercase text-text mb-6"
          >
            Sprite Gallery
          </motion.h1>

          {/* Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="flex gap-2 mb-8"
          >
            {CHARACTERS.map((char) => {
              const isActive = activeTab === char.id;
              return (
                <button
                  key={char.id}
                  onClick={() => setActiveTab(char.id)}
                  className="relative px-5 py-2 rounded-full text-sm font-medium transition-colors"
                  style={{
                    background: isActive
                      ? `${char.color}25`
                      : "rgba(255,255,255,0.06)",
                    color: isActive ? char.color : "rgba(255,255,255,0.5)",
                    border: `1.5px solid ${isActive ? `${char.color}60` : "transparent"}`,
                  }}
                >
                  {char.name}
                  {isActive && (
                    <motion.div
                      layoutId="activeTabGlow"
                      className="absolute inset-0 rounded-full"
                      style={{
                        boxShadow: `0 0 20px ${char.color}20`,
                      }}
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                </button>
              );
            })}
          </motion.div>

          {/* Sprite grid by category */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3 }}
            >
              {CATEGORY_ORDER.map((category) => {
                const sprites = SPRITES.filter((s) => s.category === category);
                if (sprites.length === 0) return null;
                return (
                  <section key={category} className="mb-8">
                    <h2
                      className="text-sm font-medium tracking-wide uppercase mb-4"
                      style={{ color: activeChar.color }}
                    >
                      {CATEGORY_LABELS[category]}
                    </h2>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                      {sprites.map((sprite, i) => {
                        const src = `/sprites/${activeTab}/${sprite.file}`;
                        return (
                          <motion.button
                            key={sprite.file}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.25, delay: i * 0.04 }}
                            onClick={() => setLightbox({ src, label: sprite.label })}
                            className="group rounded-xl overflow-hidden aspect-square flex items-center justify-center cursor-pointer transition-all hover:scale-[1.03]"
                            style={{
                              background: "rgba(255,255,255,0.03)",
                              border: "1px solid rgba(255,255,255,0.06)",
                            }}
                            whileHover={{
                              borderColor: `${activeChar.color}40`,
                              boxShadow: `0 0 16px ${activeChar.color}15`,
                            }}
                          >
                            <div className="relative w-full h-full p-2">
                              <Image
                                src={src}
                                alt={`${activeChar.name} - ${sprite.label}`}
                                fill
                                className="object-contain"
                                sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, 20vw"
                              />
                            </div>
                            <div
                              className="absolute bottom-0 left-0 right-0 py-1.5 text-xs text-center opacity-0 group-hover:opacity-100 transition-opacity"
                              style={{
                                background: "linear-gradient(transparent, rgba(0,0,0,0.8))",
                                color: activeChar.color,
                              }}
                            >
                              {sprite.label}
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>
                  </section>
                );
              })}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Lightbox overlay */}
        <AnimatePresence>
          {lightbox && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 flex flex-col items-center justify-center"
              style={{ background: "rgba(0,0,0,0.9)" }}
              onClick={() => setLightbox(null)}
            >
              {/* Close button */}
              <button
                className="absolute top-5 right-5 text-text-secondary hover:text-text transition-colors"
                onClick={() => setLightbox(null)}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>

              {/* Image */}
              <motion.div
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.85, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className="relative w-[80vw] h-[70vh] max-w-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <Image
                  src={lightbox.src}
                  alt={lightbox.label}
                  fill
                  className="object-contain"
                  sizes="80vw"
                  priority
                />
              </motion.div>

              {/* Label */}
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="mt-4 text-sm tracking-wide"
                style={{ color: activeChar.color }}
              >
                {activeChar.name} — {lightbox.label}
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
}
