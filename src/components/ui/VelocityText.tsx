"use client";

import { motion, useScroll, useTransform, useVelocity } from "framer-motion";

interface VelocityTextProps {
  children: React.ReactNode;
  className?: string;
}

export function VelocityText({ children, className = "" }: VelocityTextProps) {
  const { scrollY } = useScroll();
  const scrollVelocity = useVelocity(scrollY);
  const skewX = useTransform(
    scrollVelocity,
    [-1200, -400, 0, 400, 1200],
    [8, 3, 0, -3, -8]
  );

  return (
    <motion.span style={{ skewX }} className={`inline-block ${className}`}>
      {children}
    </motion.span>
  );
}
