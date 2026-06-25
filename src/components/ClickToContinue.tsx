"use client";

import { motion } from "framer-motion";

interface ClickToContinueProps {
  color: string;
}

export function ClickToContinue({ color }: ClickToContinueProps) {
  return (
    <motion.div
      data-testid="click-to-continue"
      className="absolute bottom-3 right-4"
      animate={{ y: [0, 4, 0] }}
      transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
    >
      <svg width="16" height="10" viewBox="0 0 16 10" fill="none">
        <path d="M1 1L8 8L15 1" stroke={color} strokeWidth="2" strokeLinecap="round" />
      </svg>
    </motion.div>
  );
}
