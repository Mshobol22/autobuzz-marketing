"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Settings } from "lucide-react";
import { Magnetic } from "@/components/ui/Magnetic";
import { useNav } from "@/components/providers/NavContext";

const NAV_LINKS: Array<{ href: string; label: string; icon?: React.ComponentType<{ className?: string }> }> = [
  { href: "/", label: "DASHBOARD" },
  { href: "/generator", label: "GENERATOR" },
  { href: "/gallery", label: "GALLERY" },
  { href: "/vault", label: "VAULT" },
  { href: "/schedule", label: "SCHEDULE" },
  { href: "/analytics", label: "ANALYTICS" },
  { href: "/settings/integrations", label: "SETTINGS", icon: Settings },
];

export function CornerNav() {
  const nav = useNav();
  const menuOpen = nav?.menuOpen ?? false;
  const setMenuOpen = nav?.setMenuOpen ?? (() => {});
  const [time, setTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
      setTime(
        new Date().toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        })
      );
    };
    updateTime();
    const id = setInterval(updateTime, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <>
      {/* Top Left */}
      <div className="fixed top-6 left-6 z-40 font-mono text-[10px] tracking-widest text-amber-500/80 uppercase">
        AUTOBUZZ [BETA]
      </div>

      {/* Top Right */}
      <div className="fixed top-6 right-6 z-40 font-mono text-[10px] tracking-widest text-amber-500/80 flex items-center gap-4">
        <span>{time}</span>
        <span>CHICAGO, IL</span>
      </div>

      {/* Bottom Left - hidden on mobile (bottom tab bar shown instead) */}
      <div className="fixed bottom-6 left-6 z-40 font-mono text-[10px] tracking-widest text-white/60 flex items-center gap-2 hidden md:flex">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
        SYSTEM STATUS: ONLINE
      </div>

      {/* Bottom Right - Menu trigger; hidden on mobile (More in bottom bar) */}
      <Magnetic className="fixed bottom-6 right-6 z-40 hidden md:block">
        <button
          onClick={() => setMenuOpen(true)}
          className="w-12 h-12 flex items-center justify-center font-mono text-2xl text-amber-500/90 hover:text-amber-500 transition-colors border border-amber-500/30 hover:border-amber-500/50"
          aria-label="Open menu"
        >
          +
        </button>
      </Magnetic>

      {/* Full-screen menu overlay */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMenuOpen(false)}
              className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl"
            />
            <motion.nav
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-8"
            >
              <button
                onClick={() => setMenuOpen(false)}
                className="absolute top-6 right-6 font-mono text-white/60 hover:text-white text-2xl"
                aria-label="Close menu"
              >
                ×
              </button>
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="font-serif text-4xl md:text-6xl tracking-[0.3em] text-amber-500/90 hover:text-amber-500 transition-colors flex items-center justify-center gap-3"
                >
                  {link.icon && <link.icon className="h-8 w-8 md:h-10 md:w-10" />}
                  {link.label}
                </Link>
              ))}
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
