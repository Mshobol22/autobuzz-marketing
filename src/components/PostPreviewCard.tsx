"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Calendar,
  Download,
  Facebook,
  ImageIcon,
  Loader2,
  RefreshCw,
  Save,
  Send,
} from "lucide-react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { generatePost } from "@/app/actions/generatePost";
import { generateImage } from "@/app/actions/generateImage";
import { postNow } from "@/app/actions/postNow";
import { updatePost } from "@/app/actions/updatePost";
import { schedulePost } from "@/app/actions/schedulePost";
import { savePostDraft, savePostImage } from "@/app/actions/savePost";

const PLATFORM_OPTIONS = [
  { value: "LinkedIn", label: "LinkedIn" },
  { value: "Twitter", label: "Twitter" },
  { value: "Instagram", label: "Instagram" },
  { value: "facebook", label: "Facebook Page" },
] as const;
type Platform = (typeof PLATFORM_OPTIONS)[number]["value"];
const PLATFORMS = PLATFORM_OPTIONS.map((p) => p.value);

const VIBE_OVERRIDES = [
  { value: "", label: "None" },
  { value: "Make it funnier", label: "Make it funnier" },
  { value: "Make it serious", label: "Make it serious" },
  { value: "Make it more casual", label: "Make it more casual" },
  { value: "Make it more formal", label: "Make it more formal" },
  { value: "Add more urgency", label: "Add more urgency" },
] as const;

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
  facebook: {
    bg: "bg-white",
    text: "text-[#050505]",
    container: "w-full max-w-[500px]",
    imageAspect: "aspect-[4/3]",
  },
};

const PLATFORM_FONT_STYLES: Record<Platform, string> = {
  LinkedIn: "text-[15px] leading-[1.4]",
  Twitter: "text-[15px] leading-[1.3125]",
  Instagram: "text-[14px] leading-[1.375]",
  facebook: "text-[15px] leading-[1.4]",
};

const PLATFORM_LABELS: Record<Platform, string> = {
  LinkedIn: "LinkedIn",
  Twitter: "Twitter",
  Instagram: "Instagram",
  facebook: "Facebook Page",
};

const PLATFORM_ICONS: Partial<Record<Platform, React.ComponentType<{ className?: string }>>> = {
  facebook: Facebook,
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

export type PostPreviewCardProps = {
  initialImage?: string | null;
};

export function PostPreviewCard({ initialImage }: PostPreviewCardProps = {}) {
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [platform, setPlatform] = useState<Platform>("Twitter");
  const [vibeOverride, setVibeOverride] = useState("");
  const [previewPlatform, setPreviewPlatform] = useState<Platform>("Twitter");
  const [draftContent, setDraftContent] = useState("");
  const [draftImage, setDraftImage] = useState<string | null>(initialImage ?? null);
  const [imageLoadError, setImageLoadError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [imageGenerating, setImageGenerating] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [scheduling, setScheduling] = useState(false);
  const [schedulePopoverOpen, setSchedulePopoverOpen] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("");
  const scheduleButtonRef = useRef<HTMLButtonElement>(null);
  const [scheduleDropdownStyle, setScheduleDropdownStyle] = useState<{
    top: number;
    left: number;
    width: number;
    openAbove: boolean;
  } | null>(null);
  const [postId, setPostId] = useState<string | null>(null);
  const [suggestedImagePrompt, setSuggestedImagePrompt] = useState<string | null>(null);

  useEffect(() => {
    if (initialImage) setDraftImage(initialImage);
  }, [initialImage]);

  useLayoutEffect(() => {
    if (!schedulePopoverOpen || !scheduleButtonRef.current || typeof document === "undefined") {
      setScheduleDropdownStyle(null);
      return;
    }
    const rect = scheduleButtonRef.current.getBoundingClientRect();
    const DROPDOWN_EST_HEIGHT = 160;
    const spaceBelow = window.innerHeight - rect.bottom;
    const openAbove = spaceBelow < DROPDOWN_EST_HEIGHT;
    setScheduleDropdownStyle({
      top: openAbove ? rect.top - DROPDOWN_EST_HEIGHT - 4 : rect.bottom + 4,
      left: rect.left,
      width: Math.max(rect.width, 280),
      openAbove,
    });
  }, [schedulePopoverOpen]);

  useEffect(() => {
    if (!schedulePopoverOpen) return;
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (target?.closest?.("[data-schedule-dropdown]")) return;
      if (target?.closest?.("[data-schedule-trigger]")) return;
      setSchedulePopoverOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [schedulePopoverOpen]);

  async function handleGenerate() {
    if (!topic.trim()) return;

    setLoading(true);
    setDraftContent("");
    setDraftImage(null);
    setImageLoadError(false);
    setPostId(null);
    setSuggestedImagePrompt(null);
    setPreviewPlatform(platform);

    try {
      const result = await generatePost(
        topic.trim(),
        platform,
        vibeOverride || undefined
      );

      if (result.success) {
        setDraftContent(result.content);
        setSuggestedImagePrompt(result.suggestedImagePrompt);
      } else {
        setDraftContent(`Error: ${result.error}`);
      }
    } catch (err) {
      setDraftContent(
        `Error: ${err instanceof Error ? err.message : "Generation failed"}`
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerateImage() {
    if (!draftContent.trim()) {
      toast.error("Generate post content first.");
      return;
    }

    const imagePrompt = suggestedImagePrompt?.trim() || draftContent.trim();

    setImageGenerating(true);
    try {
      const result = await generateImage(imagePrompt);

      if (result.success) {
        setImageLoadError(false);
        setDraftImage(result.imageUrl);

        const saveResult = await savePostImage(
          postId,
          draftContent.trim(),
          result.imageUrl,
          platform
        );

        if (saveResult.success) {
          setPostId(saveResult.postId);
          toast.success("Image URL generated and saved to post.");
        } else {
          toast.warning("Image URL generated but could not save to Supabase.", {
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
      setImageGenerating(false);
    }
  }

  async function handleSaveDraft() {
    if (!draftContent.trim()) {
      toast.error("No content to save.");
      return;
    }

    setSaving(true);

    try {
      const result = await savePostDraft(
        postId,
        draftContent.trim(),
        platform,
        draftImage
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
    if (!draftContent.trim()) {
      toast.error("No content to post. Generate content first.");
      return;
    }

    setPublishing(true);

    try {
      const result = await postNow({
        content: draftContent.trim(),
        image: draftImage,
        platforms: [platform],
      });

      if (result.success) {
        if (postId && result.id) {
          await updatePost(postId, {
            ayrshare_post_id: result.id,
            status: "published",
          });
        }
        toast.success("Posted!");
        router.push("/");
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

  async function handleSchedule() {
    if (!draftContent.trim()) {
      toast.error("No content to schedule. Generate content first.");
      return;
    }
    if (!scheduleDate) {
      toast.error("Please select a date and time.");
      return;
    }

    setScheduling(true);

    try {
      const result = await schedulePost({
        content: draftContent.trim(),
        image: draftImage,
        date: new Date(scheduleDate),
        platform,
      });

      if (result.success) {
        toast.success("Post scheduled!");
        setSchedulePopoverOpen(false);
        setScheduleDate("");
      } else {
        toast.error("Failed to schedule post", {
          description: result.error,
        });
      }
    } catch (err) {
      toast.error("Failed to schedule post", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setScheduling(false);
    }
  }

  function handleDownload() {
    if (!draftImage) return;

    fetch(draftImage)
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
      {/* Left: Controls */}
      <div className="space-y-4">
        <div className="space-y-3">
          <label className="block text-sm font-medium text-zinc-400">
            What is this post about?
          </label>
          <textarea
            placeholder="e.g. Product launch, team milestone, industry insight..."
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            rows={4}
            className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder:text-zinc-500 focus:outline-none focus:border-accent-violet/50 resize-none"
          />
          <div className="flex gap-3 flex-wrap">
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value as Platform)}
              className="rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white focus:outline-none focus:border-accent-violet/50 [&_option]:bg-white [&_option]:text-zinc-900"
            >
              {PLATFORM_OPTIONS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
            <select
              value={vibeOverride}
              onChange={(e) => setVibeOverride(e.target.value)}
              className="rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white focus:outline-none focus:border-accent-violet/50 [&_option]:bg-white [&_option]:text-zinc-900"
            >
              {VIBE_OVERRIDES.map((v) => (
                <option key={v.value || "none"} value={v.value}>
                  {v.label}
                </option>
              ))}
            </select>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleGenerate}
              disabled={loading}
              className="rounded-xl bg-accent-violet/30 border border-accent-violet/40 px-6 py-3 text-accent-pink font-medium disabled:opacity-50 flex items-center gap-2 hover:bg-accent-violet/40 transition-colors"
            >
              {loading ? "Generating…" : "Generate Draft"}
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            </motion.button>
          </div>
        </div>
      </div>

      {/* Right: Preview */}
      <div className="lg:sticky lg:top-8">
        <div className="mx-auto">
          {/* Platform Toggle - only when we have content */}
          {draftContent && (
            <div className="flex gap-0 mb-4 rounded-xl bg-white/5 p-1 border border-white/10 w-fit">
              {PLATFORMS.map((p) => {
                const Icon = PLATFORM_ICONS[p];
                return (
                  <button
                    key={p}
                    onClick={() => setPreviewPlatform(p)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                      previewPlatform === p
                        ? "bg-accent-violet/20 text-white"
                        : "text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    {Icon && <Icon className="h-4 w-4" />}
                    {PLATFORM_LABELS[p]}
                  </button>
                );
              })}
            </div>
          )}

          {/* Skeleton Loader - while Gemini is thinking */}
          {loading ? (
            <div className={`${previewStyles.container} mx-auto`}>
              <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden shadow-xl">
                <div className="p-4 space-y-3 border-b border-white/10">
                  <div className="shimmer h-4 w-3/4 rounded bg-white/10" />
                  <div className="shimmer h-4 w-full rounded bg-white/10" />
                  <div className="shimmer h-4 w-2/3 rounded bg-white/10" />
                </div>
                <div
                  className={`shimmer w-full ${previewStyles.imageAspect} bg-white/10`}
                />
              </div>
            </div>
          ) : (
            <>
              {/* Preview container - dimensions match platform */}
              <div className={`${previewStyles.container} mx-auto`}>
                <div
                  className={`${previewStyles.bg} rounded-2xl border border-white/10 overflow-hidden shadow-xl transition-all duration-300`}
                >
            {draftContent ? (
              <>
                <div className="p-4 border-b border-[#e7e7e7]">
                  <AutoResizeTextarea
                    value={draftContent}
                    onChange={setDraftContent}
                    placeholder="Write your post..."
                    platform={previewPlatform}
                  />
                </div>

                {/* Image section */}
                <div className="relative">
                  {draftImage ? (
                    <div className={`relative ${previewStyles.imageAspect}`}>
                      {imageLoadError ? (
                        <div
                          className={`w-full h-full flex flex-col items-center justify-center gap-2 bg-slate-100 text-slate-500 border border-dashed border-slate-300 ${previewStyles.imageAspect}`}
                        >
                          <ImageIcon className="h-10 w-10" />
                          <span className="text-sm font-medium">Image failed to load</span>
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => {
                              setImageLoadError(false);
                              setDraftImage(null);
                            }}
                            className="text-xs text-slate-600 hover:text-slate-800 underline"
                          >
                            Try again
                          </motion.button>
                        </div>
                      ) : (
                        <>
                          <Image
                            src={draftImage}
                            alt="Generated"
                            fill
                            className="object-cover"
                            sizes="(max-width: 600px) 100vw, 600px"
                            onError={() => setImageLoadError(true)}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
                          <div className="absolute top-2 right-2 flex gap-2 pointer-events-auto">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleGenerateImage}
                            disabled={imageGenerating}
                            className="p-2 rounded-lg bg-black/30 backdrop-blur-sm text-white hover:bg-black/50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                            title="Regenerate"
                          >
                            {imageGenerating ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <RefreshCw className="h-4 w-4" />
                            )}
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
                        </>
                      )}
                    </div>
                  ) : (
                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={handleGenerateImage}
                      disabled={imageGenerating}
                      className={`w-full ${previewStyles.imageAspect} border border-dashed border-[#e7e7e7] flex flex-col items-center justify-center gap-2 text-[#657786] hover:bg-slate-50 hover:border-[#ccc] transition-colors disabled:opacity-60 disabled:cursor-not-allowed`}
                    >
                      {imageGenerating ? (
                        <Loader2 className="h-10 w-10 animate-spin" />
                      ) : (
                        <ImageIcon className="h-10 w-10" />
                      )}
                      <span className="text-sm font-medium">
                        {imageGenerating ? "Generating…" : "Generate Visual"}
                      </span>
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
          {draftContent && (
            <div className="flex flex-wrap gap-3 mt-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSaveDraft}
                disabled={saving}
                className="rounded-xl bg-white/10 border border-white/20 px-4 py-3 text-slate-200 font-medium disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? "Saving…" : "Save Draft"}
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
              </motion.button>
              <div className="relative" data-schedule-trigger>
                <motion.button
                  ref={scheduleButtonRef}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSchedulePopoverOpen((o) => !o)}
                  disabled={scheduling}
                  className="rounded-xl bg-white/10 border border-white/20 px-4 py-3 text-slate-200 font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {scheduling ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Calendar className="h-4 w-4" />
                  )}
                  Schedule
                </motion.button>
                {schedulePopoverOpen &&
                  typeof document !== "undefined" &&
                  scheduleDropdownStyle &&
                  createPortal(
                    <>
                      <div
                        className="fixed inset-0 z-[100]"
                        onClick={() => setSchedulePopoverOpen(false)}
                        aria-hidden
                      />
                      <div
                        data-schedule-dropdown
                        className="fixed z-[101] min-w-[280px] rounded-xl bg-zinc-900 border border-white/10 shadow-xl p-4"
                        style={{
                          top: scheduleDropdownStyle.top,
                          left: scheduleDropdownStyle.left,
                          width: scheduleDropdownStyle.width,
                        }}
                      >
                        <label className="block text-sm font-medium text-zinc-400 mb-2">
                          Date & Time
                        </label>
                        <input
                          type="datetime-local"
                          value={scheduleDate}
                          onChange={(e) => setScheduleDate(e.target.value)}
                          min={new Date().toISOString().slice(0, 16)}
                          className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-white focus:outline-none focus:border-accent-violet/50"
                        />
                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={() => setSchedulePopoverOpen(false)}
                            className="flex-1 rounded-lg px-3 py-2 text-sm text-zinc-400 hover:text-white transition-colors"
                          >
                            Cancel
                          </button>
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleSchedule}
                            disabled={scheduling || !scheduleDate}
                            className="flex-1 rounded-lg bg-accent-violet/30 border border-accent-violet/40 px-3 py-2 text-sm text-accent-pink font-medium disabled:opacity-50"
                          >
                            {scheduling ? "Scheduling…" : "Schedule"}
                          </motion.button>
                        </div>
                      </div>
                    </>,
                    document.body
                  )}
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handlePostNow}
                disabled={publishing}
                className="rounded-xl bg-emerald-500/20 border border-emerald-500/30 px-4 py-3 text-emerald-400 font-medium disabled:opacity-50 flex items-center justify-center gap-2"
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}
