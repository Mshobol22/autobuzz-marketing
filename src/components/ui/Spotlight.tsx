"use client";

import { useMousePosition } from "@/hooks/useMousePosition";
import { useEffect } from "react";

export function Spotlight() {
  const { x, y } = useMousePosition();

  useEffect(() => {
    document.documentElement.style.setProperty("--spotlight-x", `${x}px`);
    document.documentElement.style.setProperty("--spotlight-y", `${y}px`);
  }, [x, y]);

  return (
    <div
      className="fixed inset-0 z-10 pointer-events-none"
      style={{
        background: `radial-gradient(600px circle at var(--spotlight-x, 50%) var(--spotlight-y, 50%), rgba(255,255,255,0.06), transparent 40%)`,
      }}
    />
  );
}
