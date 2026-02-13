"use client";

import { motion } from "framer-motion";

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
    </div>
  );
}
