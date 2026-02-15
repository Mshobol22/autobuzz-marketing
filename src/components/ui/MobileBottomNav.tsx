"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Sparkles,
  Calendar,
  BarChart3,
  MoreHorizontal,
} from "lucide-react";
import { useNav } from "@/components/providers/NavContext";

const MAIN_NAV: Array<{
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { href: "/", label: "Home", icon: LayoutDashboard },
  { href: "/generator", label: "Create", icon: Sparkles },
  { href: "/schedule", label: "Schedule", icon: Calendar },
  { href: "/analytics", label: "Stats", icon: BarChart3 },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const { openMenu } = useNav() ?? { openMenu: () => {} };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-[#0a0a0a]/95 backdrop-blur-xl border-t border-white/10"
      aria-label="Mobile navigation"
    >
      <div className="flex items-center justify-around h-14 px-2">
        {MAIN_NAV.map(({ href, label, icon: Icon }) => {
          const isActive =
            pathname === href ||
            (href !== "/" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center justify-center gap-0.5 min-w-0 flex-1 py-2 px-1 rounded-lg transition-colors ${
                isActive
                  ? "text-amber-400"
                  : "text-white/50 hover:text-white/80"
              }`}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon className="h-5 w-5 shrink-0" aria-hidden />
              <span className="text-[10px] font-mono truncate max-w-full">
                {label}
              </span>
            </Link>
          );
        })}
        <button
          onClick={openMenu}
          className="flex flex-col items-center justify-center gap-0.5 min-w-0 flex-1 py-2 px-1 rounded-lg transition-colors text-white/50 hover:text-white/80"
          aria-label="Open full menu"
        >
          <MoreHorizontal className="h-5 w-5 shrink-0" aria-hidden />
          <span className="text-[10px] font-mono truncate max-w-full">
            More
          </span>
        </button>
      </div>
    </nav>
  );
}
