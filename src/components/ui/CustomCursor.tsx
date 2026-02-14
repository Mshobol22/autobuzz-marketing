"use client";

import { motion, useSpring } from "framer-motion";
import { useEffect, useState } from "react";

const CLICKABLE_SELECTOR =
  'a[href], button, [role="button"], [role="link"], input[type="submit"], input[type="button"], [data-cursor-hover]';

export function CustomCursor() {
  const [isHovering, setIsHovering] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(true);

  const springConfig = { damping: 25, stiffness: 300 };
  const x = useSpring(0, springConfig);
  const y = useSpring(0, springConfig);
  const scale = useSpring(1, springConfig);

  useEffect(() => {
    const touch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
    setIsTouchDevice(touch);
    if (touch) return;

    document.body.style.cursor = "none";
    return () => {
      document.body.style.cursor = "";
    };
  }, []);

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
      setIsVisible(true);
    };

    const handleOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target?.closest?.(CLICKABLE_SELECTOR)) {
        setIsHovering(true);
      }
    };

    const handleOut = (e: MouseEvent) => {
      const related = e.relatedTarget as HTMLElement;
      if (!related?.closest?.(CLICKABLE_SELECTOR)) {
        setIsHovering(false);
      }
    };

    const handleLeave = () => setIsVisible(false);

    window.addEventListener("mousemove", handleMove);
    document.addEventListener("mouseover", handleOver);
    document.addEventListener("mouseout", handleOut);
    document.addEventListener("mouseleave", handleLeave);

    return () => {
      window.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseover", handleOver);
      document.removeEventListener("mouseout", handleOut);
      document.removeEventListener("mouseleave", handleLeave);
    };
  }, [x, y]);

  useEffect(() => {
    scale.set(isHovering ? 3 : 1);
  }, [isHovering, scale]);

  if (isTouchDevice || !isVisible) return null;

  return (
    <motion.div
      className="fixed top-0 left-0 pointer-events-none z-[9999]"
      style={{
        x,
        y,
        translateX: "-50%",
        translateY: "-50%",
      }}
    >
      <motion.div
        className={`rounded-full ${
          isHovering
            ? "bg-white mix-blend-exclusion"
            : "border-2 border-white bg-transparent"
        }`}
        style={{
          width: 16,
          height: 16,
          scale,
        }}
      />
    </motion.div>
  );
}
