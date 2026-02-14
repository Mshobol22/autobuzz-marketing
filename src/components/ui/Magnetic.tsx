"use client";

import { motion, useMotionValue, useSpring } from "framer-motion";
import { useRef, useEffect, type ReactNode } from "react";

const MAGNETIC_RADIUS = 120;
const MAGNETIC_STRENGTH = 0.35;

interface MagneticProps {
  children: ReactNode;
  className?: string;
}

export function Magnetic({ children, className = "" }: MagneticProps) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springConfig = { damping: 20, stiffness: 200 };
  const springX = useSpring(x, springConfig);
  const springY = useSpring(y, springConfig);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const handleMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const mouseX = e.clientX;
      const mouseY = e.clientY;

      const dx = mouseX - centerX;
      const dy = mouseY - centerY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < MAGNETIC_RADIUS) {
        const pull = (1 - distance / MAGNETIC_RADIUS) * MAGNETIC_STRENGTH;
        x.set(dx * pull);
        y.set(dy * pull);
      } else {
        x.set(0);
        y.set(0);
      }
    };

    const handleLeave = () => {
      x.set(0);
      y.set(0);
    };

    window.addEventListener("mousemove", handleMove);
    el.addEventListener("mouseleave", handleLeave);

    return () => {
      window.removeEventListener("mousemove", handleMove);
      el.removeEventListener("mouseleave", handleLeave);
    };
  }, [x, y]);

  return (
    <motion.div
      ref={ref}
      style={{ x: springX, y: springY }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
