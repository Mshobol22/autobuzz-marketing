"use client";

import { motion } from "framer-motion";
import {
  Building2,
  Megaphone,
  Target,
  Sparkles,
  Package,
  Loader2,
  Save,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { getBrandSettingsForUser, updateBrandSettings } from "@/app/actions/brandSettings";
import { DEFAULT_BRAND_SETTINGS, type BrandSettingsForm } from "@/lib/types";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.05 },
  },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, damping: 25, stiffness: 200 },
  },
};

const BENTO_SECTIONS = [
  {
    id: "company",
    key: "company_name" as const,
    label: "Company Name",
    icon: Building2,
    placeholder: "Your company or brand name",
    size: "md" as const,
  },
  {
    id: "core_values",
    key: "core_values" as const,
    label: "Core Values",
    icon: Sparkles,
    placeholder: "Key values that define your brand",
    size: "md" as const,
  },
  {
    id: "tone",
    key: "tone_of_voice" as const,
    label: "Tone of Voice",
    icon: Megaphone,
    placeholder: "How your brand sounds",
    size: "md" as const,
  },
  {
    id: "audience",
    key: "target_audience" as const,
    label: "Target Audience",
    icon: Target,
    placeholder: "Who you're speaking to",
    size: "md" as const,
  },
  {
    id: "product",
    key: "product_description" as const,
    label: "Product Description",
    icon: Package,
    placeholder: "What you offer",
    size: "wide" as const,
  },
];

function generateSampleTweet(settings: BrandSettingsForm): string {
  return `🚀 ${settings.company_name} here! We're all about ${settings.core_values.split(", ")[0].toLowerCase()} and ${settings.core_values.split(", ")[1]?.toLowerCase() ?? "excellence"}.

${settings.tone_of_voice} — that's our vibe.

Built for ${settings.target_audience.split(", ")[0]} who get it.

${settings.product_description}

What are you building? 👇`;
}

export default function BrandVoicePage() {
  const [form, setForm] = useState<BrandSettingsForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getBrandSettingsForUser().then((data) => {
      setForm(data);
      setLoading(false);
    });
  }, []);

  async function handleSave() {
    if (!form) return;

    setSaving(true);
    try {
      const result = await updateBrandSettings(form);

      if (result.success) {
        toast.success("Brand voice saved!");
      } else {
        toast.error("Failed to save", { description: result.error });
      }
    } catch (err) {
      toast.error("Failed to save", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setSaving(false);
    }
  }

  function handleGenerateSample() {
    const settings = form ?? { ...DEFAULT_BRAND_SETTINGS };
    const tweet = generateSampleTweet(settings);
    console.log("Sample Tweet:\n\n", tweet);
    toast.success("Sample post printed to console!");
  }

  if (loading || !form) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <motion.h1
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-bold text-white"
      >
        Brand Voice
      </motion.h1>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="mt-1 text-slate-400 mb-8"
      >
        Define your brand&apos;s tone and audience for consistent content.
      </motion.p>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-fr"
      >
        {BENTO_SECTIONS.map((section) => {
          const Icon = section.icon;
          return (
            <motion.div
              key={section.id}
              variants={item}
              className={`art-card p-6 group ${
                section.size === "wide" ? "lg:col-span-4" : ""
              }`}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-500/30">
                  <Icon className="h-4 w-4 text-amber-400" />
                </div>
                <label className="text-sm font-medium text-slate-300">
                  {section.label}
                </label>
              </div>
              <textarea
                value={form[section.key]}
                onChange={(e) =>
                  setForm((prev) =>
                    prev ? { ...prev, [section.key]: e.target.value } : prev
                  )
                }
                placeholder={section.placeholder}
                rows={section.size === "wide" ? 3 : 2}
                className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500/50 resize-none"
              />
            </motion.div>
          );
        })}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mt-8 flex flex-wrap gap-4"
      >
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSave}
          disabled={saving}
          className="rounded-xl bg-accent-violet/40 border border-accent-violet/50 px-6 py-3 text-white font-medium disabled:opacity-50 flex items-center gap-2 hover:bg-accent-violet/50 transition-colors"
        >
          {saving ? "Saving…" : "Save"}
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleGenerateSample}
          className="rounded-xl bg-zinc-800/40 border border-white/10 px-6 py-3 text-zinc-300 font-medium hover:bg-zinc-700/40 flex items-center gap-2"
        >
          <Zap className="h-4 w-4" />
          Generate Sample Post
        </motion.button>
      </motion.div>
    </div>
  );
}
