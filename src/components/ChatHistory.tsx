"use client";

import { useRef, useEffect } from "react";
import { motion } from "framer-motion";
import type { ChatMessage } from "@/lib/chat/types";
import { getHeroConfig } from "@/lib/heroAvatar";

interface ChatHistoryProps {
  messages: ChatMessage[];
  characterName: string;
  accentColor: string;
  visible: boolean;
  onClose: () => void;
}

export function ChatHistory({
  messages,
  characterName,
  accentColor,
  visible,
  onClose,
}: ChatHistoryProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (visible && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [visible, messages.length]);

  if (!visible) return null;

  return (
    <motion.div
      initial={{ x: -320, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -320, opacity: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="absolute left-0 top-0 bottom-0 z-20 flex flex-col w-full sm:w-[340px]"
    >
      {/* Panel background */}
      <div
        className="flex-1 flex flex-col"
        style={{
          background: "rgba(13, 13, 18, 0.92)",
          backdropFilter: "blur(12px)",
          borderRight: `1px solid ${accentColor}20`,
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{ borderBottom: `1px solid ${accentColor}15` }}
        >
          <span
            className="text-sm font-medium tracking-wide"
            style={{ color: accentColor }}
          >
            Chat History
          </span>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-text transition-colors text-lg px-2"
          >
            &times;
          </button>
        </div>

        {/* Messages */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-4 py-3 space-y-3"
          style={{ scrollbarWidth: "thin", scrollbarColor: `${accentColor}30 transparent` }}
        >
          {messages.length === 0 && (
            <p className="text-text-secondary text-xs text-center mt-8 opacity-50">
              No messages yet
            </p>
          )}
          {messages.map((msg) => {
            const hero = msg.role === "user" ? getHeroConfig() : null;
            return (
              <div
                key={msg.id}
                className={`flex items-end gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "user" && (
                  <>
                    <div
                      className="max-w-[75%] rounded-2xl px-4 py-2.5"
                      style={{
                        background: `${hero!.theme.accent}20`,
                        borderBottomRightRadius: 4,
                        border: `1px solid ${hero!.theme.accent}15`,
                      }}
                    >
                      <p className="text-sm leading-relaxed" style={{ color: "#e0e0e8" }}>
                        {msg.content}
                      </p>
                    </div>
                    <div
                      className="w-7 h-7 rounded-full flex-shrink-0 overflow-hidden"
                      style={{
                        border: `1.5px solid ${hero!.theme.accent}50`,
                        boxShadow: `0 0 8px ${hero!.theme.glow}`,
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={hero!.avatarPath}
                        alt="You"
                        width={28}
                        height={28}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    </div>
                  </>
                )}
                {msg.role === "assistant" && (
                  <div
                    className="max-w-[85%] rounded-2xl px-4 py-2.5"
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      borderBottomLeftRadius: 4,
                      borderLeft: `2px solid ${accentColor}40`,
                    }}
                  >
                    <span
                      className="text-xs font-medium block mb-1"
                      style={{ color: accentColor }}
                    >
                      {characterName}
                    </span>
                    <p
                      className="text-sm leading-relaxed"
                      style={{
                        color: "rgba(224,224,232,0.85)",
                        fontFamily: "var(--font-dialogue, 'Zen Maru Gothic', sans-serif)",
                      }}
                    >
                      {msg.content}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
