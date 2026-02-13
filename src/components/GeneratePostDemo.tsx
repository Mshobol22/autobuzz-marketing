"use client";

import { readStreamableValue } from "@ai-sdk/rsc";
import { motion } from "framer-motion";
import { Loader2, Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { generatePost } from "@/app/actions/generatePost";
import { publishPost } from "@/app/actions/publishPost";

export function GeneratePostDemo() {
  const [topic, setTopic] = useState("");
  const [platform, setPlatform] = useState("Twitter");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);

  async function handleGenerate() {
    if (!topic.trim()) return;

    setLoading(true);
    setOutput("");

    try {
      const { value } = await generatePost(topic.trim(), platform);

      for await (const chunk of readStreamableValue(value)) {
        if (chunk != null) {
          setOutput(chunk);
        }
      }
    } catch (err) {
      setOutput(`Error: ${err instanceof Error ? err.message : "Generation failed"}`);
    } finally {
      setLoading(false);
    }
  }

  async function handlePostNow() {
    if (!output.trim()) {
      toast.error("No content to post. Generate content first.");
      return;
    }

    setPublishing(true);

    try {
      const result = await publishPost(output.trim(), platform);

      if (result.success) {
        toast.success("Post published successfully!", {
          description: result.postIds?.length
            ? `Posted to ${result.postIds.map((p) => p.platform).join(", ")}`
            : undefined,
        });
      } else {
        toast.error("Failed to publish post", {
          description: result.error,
        });
      }
    } catch (err) {
      toast.error("Failed to publish post", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setPublishing(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-3 flex-wrap">
        <input
          type="text"
          placeholder="Topic (e.g. Product launch)"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          className="flex-1 min-w-[200px] rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500/50"
        />
        <select
          value={platform}
          onChange={(e) => setPlatform(e.target.value)}
          className="rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white focus:outline-none focus:border-amber-500/50"
        >
          <option value="Twitter">Twitter</option>
          <option value="LinkedIn">LinkedIn</option>
          <option value="Instagram">Instagram</option>
        </select>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleGenerate}
          disabled={loading}
          className="rounded-xl bg-amber-500/20 border border-amber-500/30 px-6 py-3 text-amber-400 font-medium disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? "Generating…" : "Generate"}
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        </motion.button>
      </div>
      {output && (
        <div className="space-y-3">
          <div className="glass-card p-4 text-slate-300 whitespace-pre-wrap">
            {output}
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handlePostNow}
            disabled={publishing}
            className="rounded-xl bg-emerald-500/20 border border-emerald-500/30 px-6 py-3 text-emerald-400 font-medium disabled:opacity-50 flex items-center gap-2"
          >
            {publishing ? "Publishing…" : "Post Now"}
            {publishing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </motion.button>
        </div>
      )}
    </div>
  );
}
