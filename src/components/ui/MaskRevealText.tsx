"use client";

import { motion } from "framer-motion";

interface MaskRevealTextProps {
  lines: string[];
  className?: string;
  staggerDelay?: number;
}

export function MaskRevealText({
  lines,
  className = "",
  staggerDelay = 0.05,
}: MaskRevealTextProps) {
  return (
    <span className={className}>
      {lines.map((line, i) => (
        <span key={i} className="block overflow-hidden">
          <motion.span
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            transition={{
              duration: 0.6,
              delay: i * staggerDelay,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="block"
          >
            {line}
          </motion.span>
        </span>
      ))}
    </span>
  );
}
