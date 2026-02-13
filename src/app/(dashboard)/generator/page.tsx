"use client";

import { motion } from "framer-motion";
import { PostPreviewCard } from "@/components/PostPreviewCard";

export default function GeneratorPage() {
  return (
    <div className="p-6 lg:p-8">
      <motion.h1
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-bold text-zinc-100"
      >
        Generator
      </motion.h1>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="mt-1 text-zinc-400 mb-8"
      >
        Generate posts and AI images for your social media.
      </motion.p>
      <PostPreviewCard />
    </div>
  );
}
