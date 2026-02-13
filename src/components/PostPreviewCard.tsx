"use client";

import { readStreamableValue } from "@ai-sdk/rsc";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  Download,
  ImageIcon,
  Loader2,
  RefreshCw,
  Save,
  Send,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { generatePost } from "@/app/actions/generatePost";
import { generateImage } from "@/app/actions/generateImage";
import { publishPost } from "@/app/actions/publishPost";
import { savePostDraft, savePostImage } from "@/app/actions/savePost";

const PLATFORMS = ["LinkedIn", "Twitter", "Instagram"] as const;
type Platform = (typeof PLATFORMS)[number];

const PLATFORM_PREVIEW_STYLES: Record<
  Platform,
  { bg: string; text: string; container: string; imageAspect: string }
> = {
  LinkedIn: {
    bg: "bg-white",
    text: "text-[#000000]",
    container: "w-full max-w-[552px]",
    imageAspect: "aspect-[4/3]",
  },
  Twitter: {
    bg: "bg-white",
    text: "text-[#0f1419]",
    container: "w-full max-w-[600px]",
    imageAspect: "aspect-video",
  },
  Instagram: {
    bg: "bg-white",
    text: "text-[#262626]",
    container: "w-full max-w-[468px]",
    imageAspect: "aspect-square",
  },
};

const PLATFORM_FONT_STYLES: Record<Platform, string> = {
  LinkedIn: "text-[15px] leading-[1.4]",
  Twitter: "text-[15px] leading-[1.3125]",
  Instagram: "text-[14px] leading-[1.375]",
};

function AutoResizeTextarea({
  value,
  onChange,
  placeholder,
  className,
  platform,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  className?: string;
  platform: Platform;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 400)}px`;
  }, []);

  useEffect(() => {
    adjustHeight();
  }, [value, adjustHeight]);

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={3}
      className={`w-full resize-none overflow-hidden border-0 bg-transparent p-0 outline-none placeholder:text-[#657786] ${className ?? ""} ${PLATFORM_FONT_STYLES[platform]} ${PLATFORM_PREVIEW_STYLES[platform].text}`}
    />
  );
}

export function PostPreviewCard() {
  const [topic, setTopic] = useState("");
  const [platform, setPlatform] = useState<Platform>("Twitter");
  const [previewPlatform, setPreviewPlatform] = useState<Platform>("Twitter");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [postId, setPostId] = useState<string | null>(null);

  async function handleGenerate() {
    if (!topic.trim()) return;

    setLoading(true);
    setOutput("");
    setImageUrl(null);
    setPostId(null);
    setPreviewPlatform(platform);

    try {
      const { value } = await generatePost(topic.trim(), platform);

      for await (const chunk of readStreamableValue(value)) {
        if (chunk != null) {
          setOutput(chunk);
        }
      }
    } catch (err) {
      setOutput(
        `Error: ${err instanceof Error ? err.message : "Generation failed"}`
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerateImage() {
    if (!output.trim()) {
      toast.error("Generate post content first.");
      return;
    }

    setImageLoading(true);
    setImageUrl(null);

    try {
      const result = await generateImage(output.trim());

      if (result.success) {
        setImageUrl(result.imageUrl);

        const saveResult = await savePostImage(
          postId,
          output.trim(),
          result.imageUrl,
          platform
        );

        if (saveResult.success) {
          setPostId(saveResult.postId);
          toast.success("Image generated and saved to post.");
        } else {
          toast.warning("Image generated but could not save to Supabase.", {
            description: saveResult.error,
          });
        }
      } else {
        toast.error("Failed to generate image", {
          description: result.error,
        });
      }
    } catch (err) {
      toast.error("Failed to generate image", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setImageLoading(false);
    }
  }

  async function handleSaveDraft() {
    if (!output.trim()) {
      toast.error("No content to save.");
      return;
    }

    setSaving(true);

    try {
      const result = await savePostDraft(
        postId,
        output.trim(),
        platform,
        imageUrl
      );

      if (result.success) {
        setPostId(result.postId);
        toast.success("Draft saved.");
      } else {
        toast.error("Failed to save draft", {
          description: result.error,
        });
      }
    } catch (err) {
      toast.error("Failed to save draft", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setSaving(false);
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

  function handleDownload() {
    if (!imageUrl) return;

    fetch(imageUrl)
      .then((res) => res.blob())
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `autobuzz-image-${Date.now()}.png`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success("Image downloaded.");
      })
      .catch(() => toast.error("Failed to download image."));
  }

  const previewStyles = PLATFORM_PREVIEW_STYLES[previewPlatform];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
      {/* Left: Input */}
      <div className="space-y-4">
        <div className="space-y-3">
          <input
            type="text"
            placeholder="Topic (e.g. Product launch)"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500/50"
          />
          <div className="flex gap-3 flex-wrap">
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value as Platform)}
              className="rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white focus:outline-none focus:border-amber-500/50"
            >
              {PLATFORMS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
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
        </div>
      </div>

      {/* Right: Preview */}
      <div className="lg:sticky lg:top-8">
        <div className="mx-auto">
          {/* Platform Toggle */}
          <div className="flex gap-0 mb-4 rounded-xl bg-white/5 p-1 border border-white/10 w-fit">
            {PLATFORMS.map((p) => (
              <button
                key={p}
                onClick={() => setPreviewPlatform(p)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  previewPlatform === p
                    ? "bg-white/10 text-white"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          {/* Preview container - dimensions match platform */}
          <div className={`${previewStyles.container} mx-auto`}>
            <div
              className={`${previewStyles.bg} rounded-2xl border border-white/10 overflow-hidden shadow-xl transition-all duration-300`}
            >
            {output ? (
              <>
                <div className="p-4 border-b border-[#e7e7e7]">
                  <AutoResizeTextarea
                    value={output}
                    onChange={setOutput}
                    placeholder="Write your post..."
                    platform={previewPlatform}
                  />
                </div>

                {/* Image section */}
                <div className="relative">
                  {imageLoading ? (
                    <div
                      className={`shimmer w-full ${previewStyles.imageAspect} bg-slate-200`}
                    />
                  ) : imageUrl ? (
                    <div className={`relative ${previewStyles.imageAspect}`}>
                      <Image
                        src={imageUrl}
                        alt="Generated"
                        fill
                        className="object-cover"
                        sizes="(max-width: 600px) 100vw, 600px"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
                      <div className="absolute top-2 right-2 flex gap-2 pointer-events-auto">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={handleGenerateImage}
                          disabled={imageLoading}
                          className="p-2 rounded-lg bg-black/30 backdrop-blur-sm text-white hover:bg-black/50 transition-colors"
                          title="Regenerate"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </motion.button>
                      </div>
                      <div className="absolute bottom-2 left-2 right-2 flex justify-end pointer-events-auto">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={handleDownload}
                          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-black/30 backdrop-blur-sm text-white hover:bg-black/50 transition-colors text-sm font-medium"
                        >
                          <Download className="h-4 w-4" />
                          Download
                        </motion.button>
                      </div>
                    </div>
                  ) : (
                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={handleGenerateImage}
                      disabled={imageLoading}
                      className={`w-full ${previewStyles.imageAspect} border border-dashed border-[#e7e7e7] flex flex-col items-center justify-center gap-2 text-[#657786] hover:bg-slate-50 hover:border-[#ccc] transition-colors`}
                    >
                      <ImageIcon className="h-10 w-10" />
                      <span className="text-sm font-medium">Generate Image</span>
                    </motion.button>
                  )}
                </div>
              </>
            ) : (
              <div className="p-12 text-center text-slate-500">
                <p className="text-sm">Generate a post to see preview</p>
              </div>
            )}
          </div>
        </div>

          {/* Action buttons */}
          {output && (
            <div className="flex gap-3 mt-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSaveDraft}
                disabled={saving}
                className="flex-1 rounded-xl bg-white/10 border border-white/20 px-4 py-3 text-slate-200 font-medium disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? "Saving…" : "Save Draft"}
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handlePostNow}
                disabled={publishing}
                className="flex-1 rounded-xl bg-emerald-500/20 border border-emerald-500/30 px-4 py-3 text-emerald-400 font-medium disabled:opacity-50 flex items-center justify-center gap-2"
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
      </div>
    </div>
  );
}
