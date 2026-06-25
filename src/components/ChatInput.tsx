"use client";

import { useState, useRef, useCallback, type FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ChatInputProps {
  accentColor: string;
  visible: boolean;
  onSend: (message: string) => void;
  placeholder?: string;
}

export function ChatInput({
  accentColor,
  visible,
  onSend,
  placeholder = "Type your message...",
}: ChatInputProps) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      const trimmed = value.trim();
      if (!trimmed) return;
      onSend(trimmed);
      setValue("");
    },
    [value, onSend]
  );

  return (
    <AnimatePresence>
      {visible && (
        <motion.form
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 20, opacity: 0 }}
          transition={{ duration: 0.2 }}
          onSubmit={handleSubmit}
          className="flex gap-3 px-6 py-4"
        >
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            autoFocus
            className="flex-1 px-5 py-3 rounded-full bg-surface text-text text-base outline-none transition-colors"
            style={{
              border: `1.5px solid ${accentColor}40`,
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = accentColor;
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = `${accentColor}40`;
            }}
          />
          <button
            type="submit"
            disabled={!value.trim()}
            className="px-6 py-3 rounded-full text-sm font-medium transition-opacity disabled:opacity-30"
            style={{
              backgroundColor: accentColor,
              color: "#0d0d12",
            }}
          >
            Send
          </button>
        </motion.form>
      )}
    </AnimatePresence>
  );
}
