"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Brain } from "lucide-react";
import { PostPreviewCard } from "@/components/PostPreviewCard";
import { getKnowledgeAssetsCount } from "@/app/actions/knowledgeAssets";

export default function GeneratorPage() {
  const [assetCount, setAssetCount] = useState<number | null>(null);

  useEffect(() => {
    getKnowledgeAssetsCount().then(setAssetCount);
  }, []);

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-bold text-white font-serif"
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
        </div>
        {assetCount !== null && assetCount > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-500/20 border border-amber-500/30 text-amber-400 font-mono text-xs"
          >
            <Brain className="h-4 w-4" />
            <span>Using {assetCount} Knowledge Asset{assetCount !== 1 ? "s" : ""}</span>
          </motion.div>
        )}
      </div>
      <PostPreviewCard />
    </div>
  );
}
