"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Link2 } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="p-8">
      <motion.h1
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-bold text-white"
      >
        Settings
      </motion.h1>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="mt-1 text-slate-400"
      >
        Configure your AutoBuzz account.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="mt-8 flex flex-wrap gap-4"
      >
        <Link
          href="/settings/integrations"
          className="flex items-center gap-2 rounded-lg border border-amber-500/20 bg-black/40 px-4 py-3 text-amber-500/90 transition-colors hover:border-amber-500/40 hover:bg-amber-500/10"
        >
          <Link2 className="h-5 w-5" />
          Integrations — Connect social accounts
        </Link>
      </motion.div>
    </div>
  );
}
