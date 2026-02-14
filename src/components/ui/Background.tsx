"use client";

import { motion } from "framer-motion";

const SACRED_GEOMETRY_URL =
  "https://images.unsplash.com/photo-1542986130-d0c46350cf30?q=80&w=2500&auto=format&fit=crop";

const GRAIN_SVG =
  "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 256 256'><filter id='g'><feTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(#g)'/></svg>";
const GRAIN_URL = `url("data:image/svg+xml,${encodeURIComponent(GRAIN_SVG)}")`;

export function Background() {
  return (
    <>
      {/* Deep Midnight Blue base */}
      <div className="fixed inset-0 -z-20 bg-slate-950" />

      {/* Sacred Geometry - slow rotation, subtle overlay */}
      <motion.div
        className="fixed inset-0 -z-10 pointer-events-none opacity-10 mix-blend-overlay"
        style={{
          backgroundImage: `url(${SACRED_GEOMETRY_URL})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
        animate={{ rotate: 360 }}
        transition={{
          duration: 120,
          repeat: Infinity,
          ease: "linear",
        }}
      />

      {/* Film grain overlay */}
      <div
        className="fixed inset-0 z-50 pointer-events-none opacity-10 mix-blend-overlay"
        style={{
          backgroundImage: GRAIN_URL,
          backgroundRepeat: "repeat",
        }}
      />
    </>
  );
}
