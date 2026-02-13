"use client";

import { useSidebar } from "@/components/context/SidebarContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Sparkles,
  Calendar,
  Megaphone,
  BarChart3,
  Menu,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/generator", icon: Sparkles, label: "Generator" },
  { href: "/schedule", icon: Calendar, label: "Schedule" },
  { href: "/brand-voice", icon: Megaphone, label: "Brand Voice" },
  { href: "/analytics", icon: BarChart3, label: "Analytics" },
];

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { mobileOpen, setMobileOpen } = useSidebar();

  return (
    <div className="group/sidebar min-h-screen bg-zinc-950">
      {/* Desktop Sidebar */}
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-[72px] flex-col overflow-hidden border-r border-white/10 bg-zinc-900/60 backdrop-blur-md transition-[width] duration-300 hover:w-56 lg:flex">
        <div className="flex flex-col h-full p-4">
          <Link
            href="/"
            className="group/logo flex items-center gap-3 px-3 py-4 mb-6"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-600/40 border border-white/10">
              <LayoutDashboard className="h-5 w-5 text-zinc-300" />
            </div>
            <span className="whitespace-nowrap text-lg font-semibold text-zinc-100 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              AutoBuzz
            </span>
          </Link>

          <nav className="flex-1 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href}>
                  <div
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors ${
                      isActive
                        ? "bg-zinc-500/20 text-zinc-100 border border-white/10"
                        : "text-zinc-400 hover:bg-zinc-500/10 hover:text-zinc-200"
                    }`}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    <span className="whitespace-nowrap text-sm font-medium opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                      {item.label}
                    </span>
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-white/10 bg-zinc-900/60 backdrop-blur-md px-4 lg:hidden">
        <button
          onClick={() => setMobileOpen(true)}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-zinc-800/60 text-zinc-300 hover:bg-zinc-700/60"
        >
          <Menu className="h-5 w-5" />
        </button>
        <span className="text-lg font-semibold text-zinc-100">AutoBuzz</span>
        <div className="w-10" />
      </header>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 z-50 h-full w-72 border-r border-white/10 bg-zinc-900/95 backdrop-blur-xl lg:hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <span className="text-lg font-semibold text-zinc-100">
                  Menu
                </span>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-zinc-800/60 text-zinc-300 hover:bg-zinc-700/60"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <nav className="flex flex-col gap-1 p-4">
                {navItems.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                    >
                      <div
                        className={`flex items-center gap-3 rounded-xl px-4 py-3 transition-colors ${
                          isActive
                            ? "bg-zinc-500/20 text-zinc-100 border border-white/10"
                            : "text-zinc-400 hover:bg-zinc-500/10 hover:text-zinc-200"
                        }`}
                      >
                        <Icon className="h-5 w-5 shrink-0" />
                        <span className="text-sm font-medium">{item.label}</span>
                      </div>
                    </Link>
                  );
                })}
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <main className="min-h-screen pt-14 lg:pt-0 lg:pl-[72px] lg:group-hover:pl-56 transition-[padding] duration-300">
        {children}
      </main>
    </div>
  );
}
