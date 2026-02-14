"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2, BookOpen, Sparkles } from "lucide-react";
import { toast } from "sonner";
import {
  getKnowledgeAssets,
  addKnowledgeAsset,
  deleteKnowledgeAsset,
  type KnowledgeAsset,
} from "@/app/actions/knowledgeAssets";
import { generateCampaign } from "@/app/actions/generateCampaign";
import { format } from "date-fns";

export default function VaultPage() {
  const router = useRouter();
  const [assets, setAssets] = useState<KnowledgeAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [campaignAssetId, setCampaignAssetId] = useState<string | null>(null);
  const [campaignStartDate, setCampaignStartDate] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.toISOString().slice(0, 10);
  });

  const loadAssets = () => {
    getKnowledgeAssets().then((data) => {
      setAssets(Array.isArray(data) ? data : []);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadAssets();
  }, []);

  async function handleAdd() {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      toast.error("Title is required.");
      return;
    }

    setSubmitting(true);
    try {
      const result = await addKnowledgeAsset(trimmedTitle, content);
      if (result.success) {
        toast.success("Asset added to The Vault.");
        setTitle("");
        setContent("");
        loadAssets();
      } else {
        toast.error("Failed to add", { description: result.error });
      }
    } catch (err) {
      toast.error(
        "Failed to add",
        { description: err instanceof Error ? err.message : "Unknown error" }
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAutoFillWeek(assetId: string) {
    setCampaignAssetId(assetId);
    toast.loading("Concocting 5-day strategy...", { id: "campaign" });

    try {
      const HOURS = [9, 10, 11, 12, 13];
      const scheduledDates: string[] = [];
      for (let i = 0; i < 5; i++) {
        const d = new Date(campaignStartDate + "T12:00:00");
        d.setDate(d.getDate() + i);
        d.setHours(HOURS[i], 0, 0, 0);
        scheduledDates.push(d.toISOString());
      }
      const result = await generateCampaign(assetId, scheduledDates);

      toast.dismiss("campaign");

      if (result.success) {
        toast.success("5 posts created! Review them in Schedule.");
        router.push("/schedule");
      } else {
        toast.error("Campaign failed", { description: result.error });
      }
    } catch (err) {
      toast.dismiss("campaign");
      toast.error(
        "Campaign failed",
        { description: err instanceof Error ? err.message : "Unknown error" }
      );
    } finally {
      setCampaignAssetId(null);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      const result = await deleteKnowledgeAsset(id);
      if (result.success) {
        toast.success("Asset deleted.");
        loadAssets();
      } else {
        toast.error("Failed to delete", { description: result.error });
      }
    } catch (err) {
      toast.error(
        "Failed to delete",
        { description: err instanceof Error ? err.message : "Unknown error" }
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="min-h-screen bg-[#1e1b4b]">
      {/* Neo-Golden Age: Deep Indigo bg, Gold accents */}
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold text-amber-400 font-serif flex items-center gap-3"
        >
          <BookOpen className="h-8 w-8" />
          The Vault
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="mt-1 text-indigo-200/80 mb-8"
        >
          Store facts for AI. Your knowledge assets are injected into every
          post generation.
        </motion.p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Asset list */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2 space-y-4"
          >
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <h2 className="font-mono text-xs tracking-widest text-amber-500/80 uppercase">
                Existing Assets
              </h2>
              <div className="flex items-center gap-2">
                <label className="text-xs text-amber-200/70">Campaign start:</label>
                <input
                  type="date"
                  value={campaignStartDate}
                  onChange={(e) => setCampaignStartDate(e.target.value)}
                  className="rounded-lg border border-amber-500/20 bg-indigo-950/50 px-2 py-1 text-sm text-amber-100 placeholder-indigo-400/50 focus:outline-none focus:border-amber-500/50"
                />
              </div>
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-amber-500/60" />
              </div>
            ) : assets.length === 0 ? (
              <div className="rounded-xl border border-amber-500/20 bg-indigo-900/20 p-8 text-center">
                <p className="text-indigo-200/70">No assets yet.</p>
                <p className="text-sm text-indigo-300/50 mt-1">
                  Add your first asset on the right →
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {assets.map((asset) => (
                  <div
                    key={asset.id}
                    className="rounded-xl border border-amber-500/30 bg-indigo-900/30 p-4 flex items-start justify-between gap-4 hover:border-amber-500/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-amber-200 truncate">
                        {asset.title}
                      </h3>
                      <p className="text-sm text-indigo-200/70 line-clamp-2 mt-1">
                        {asset.content || "—"}
                      </p>
                      <p className="text-xs text-indigo-400/60 mt-2">
                        {format(new Date(asset.created_at), "MMM d, yyyy")}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => handleAutoFillWeek(asset.id)}
                        disabled={campaignAssetId !== null}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-400 text-xs font-medium hover:bg-amber-500/30 disabled:opacity-50 transition-colors"
                        title="Auto-Fill Week"
                      >
                        {campaignAssetId === asset.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Sparkles className="h-3.5 w-3.5" />
                        )}
                        Auto-Fill Week
                      </button>
                      <button
                        onClick={() => handleDelete(asset.id)}
                      disabled={deletingId === asset.id}
                      className="p-2 rounded-lg text-rose-400 hover:bg-rose-500/20 disabled:opacity-50 transition-colors flex-shrink-0"
                      title="Delete"
                    >
                      {deletingId === asset.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Right: Add form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
            className="rounded-xl border border-amber-500/30 bg-indigo-900/20 p-6 h-fit"
          >
            <h2 className="font-mono text-xs tracking-widest text-amber-500/80 uppercase mb-4">
              Add New Asset
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-amber-200/80 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Pricing 2026"
                  className="w-full rounded-lg border border-amber-500/20 bg-indigo-950/50 px-3 py-2 text-amber-100 placeholder-indigo-400/50 focus:outline-none focus:border-amber-500/50"
                />
              </div>
              <div>
                <label className="block text-sm text-amber-200/80 mb-1">
                  Content (facts)
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Paste or type the facts your AI should know. E.g. pricing, policies, product details..."
                  rows={10}
                  className="w-full rounded-lg border border-amber-500/20 bg-indigo-950/50 px-3 py-2 text-amber-100 placeholder-indigo-400/50 focus:outline-none focus:border-amber-500/50 resize-none"
                />
              </div>
              <button
                onClick={handleAdd}
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-400 font-medium hover:bg-amber-500/30 disabled:opacity-50 transition-colors"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Add to Vault"
                )}
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
