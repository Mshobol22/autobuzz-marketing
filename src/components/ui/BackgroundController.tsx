"use client";

import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

const SACRED_GEOMETRY_URL =
  "https://images.unsplash.com/photo-1542986130-d0c46350cf30?q=80&w=2500&auto=format&fit=crop";

const GRAIN_SVG =
  "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 256 256'><filter id='g'><feTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(#g)'/></svg>";
const GRAIN_URL = `url("data:image/svg+xml,${encodeURIComponent(GRAIN_SVG)}")`;

export function BackgroundController() {
  const pathname = usePathname();
  const path = pathname ?? "/";

  return (
    <>
      {/* Base layer - transitions smoothly */}
      <motion.div
        className="fixed inset-0 -z-20 transition-colors duration-700"
        initial={false}
        animate={{
          backgroundColor:
            path.startsWith("/generator")
              ? "#0f0a1e"
              : path.startsWith("/schedule")
                ? "#0c0a1f"
                : path.startsWith("/analytics")
                  ? "#1e1b4b"
                  : "#020617",
        }}
        transition={{ duration: 0.7 }}
      />

      {/* Generator: Spotlight effect - large soft radial gradient at top center */}
      {path.startsWith("/generator") && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7 }}
          className="fixed inset-0 -z-[18] pointer-events-none"
          style={{
            background: `radial-gradient(ellipse 80% 50% at 50% 0%, rgba(129, 140, 248, 0.15) 0%, rgba(99, 102, 241, 0.08) 40%, transparent 70%)`,
          }}
        />
      )}

      {/* Schedule: Royal Grid - indigo dot grid */}
      {path.startsWith("/schedule") && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7 }}
          className="fixed inset-0 -z-[18] pointer-events-none opacity-10"
          style={{
            backgroundImage: "radial-gradient(#6366f1 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
      )}

      {/* Analytics: Mesh gradient - subtle blobs of deep amber and indigo */}
      {path.startsWith("/analytics") && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7 }}
            className="fixed inset-0 -z-[18] pointer-events-none"
            style={{
              background: `
                radial-gradient(ellipse 60% 40% at 20% 80%, rgba(245, 158, 11, 0.08) 0%, transparent 50%),
                radial-gradient(ellipse 50% 50% at 80% 20%, rgba(79, 70, 229, 0.1) 0%, transparent 50%),
                radial-gradient(ellipse 40% 60% at 50% 50%, rgba(129, 140, 248, 0.06) 0%, transparent 60%)
              `,
            }}
          />
        </>
      )}

      {/* Sacred Geometry - slow rotation, subtle overlay (default) */}
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
