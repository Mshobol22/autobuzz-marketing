"use client";

import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import {
  toUTCISOString,
  formatInLocalWithTz,
} from "@/lib/dateUtils";
import {
  X,
  Loader2,
  RefreshCw,
  Upload,
  Trash2,
  Copy,
  Calendar,
  FileText,
  Eye,
  Wand2,
  ChevronDown,
} from "lucide-react";
import { useState, useEffect, useRef, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { DayPicker } from "react-day-picker";
import type { Post } from "@/lib/types";
import { getPostById } from "@/app/actions/getPostById";
import { updatePost } from "@/app/actions/updatePost";
import { deletePost } from "@/app/actions/deletePost";
import { duplicatePost } from "@/app/actions/duplicatePost";
import { remixPost } from "@/app/actions/remixPost";
import { generateImage } from "@/app/actions/generateImage";
import { parseScheduledDate } from "@/lib/dateUtils";
import { LinkedInPreview } from "@/components/previews/LinkedInPreview";
import { InstagramPreview } from "@/components/previews/InstagramPreview";
import "react-day-picker/style.css";

export type PostEditorPanelProps = {
  postId: string | null;
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
  onOpenPost?: (postId: string) => void;
};

function PlatformSelect<T extends string>({
  value,
  onChange,
  options,
  label,
}: {
  value: T;
  onChange: (v: T) => void;
  options: Array<{ value: T; label: string }>;
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [style, setStyle] = useState<{ top: number; left: number; width: number } | null>(null);

  useLayoutEffect(() => {
    if (!open || !buttonRef.current || typeof document === "undefined") {
      setStyle(null);
      return;
    }
    const rect = buttonRef.current.getBoundingClientRect();
    setStyle({ top: rect.bottom + 4, left: rect.left, width: rect.width });
  }, [open]);

  return (
    <div>
      <label className="block text-xs font-mono text-amber-500/60 uppercase tracking-wider mb-2">
        {label}
      </label>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50 flex items-center justify-between"
      >
        {options.find((o) => o.value === value)?.label ?? value}
        <ChevronDown className={`h-4 w-4 opacity-70 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open &&
        typeof document !== "undefined" &&
        style &&
        createPortal(
          <>
            <div
              className="fixed inset-0 z-[100]"
              onClick={() => setOpen(false)}
              aria-hidden
            />
            <div
              className="fixed z-[101] rounded-lg border border-white/10 bg-zinc-900/95 backdrop-blur-xl py-1 shadow-xl"
              style={{ top: style.top, left: style.left, width: style.width }}
            >
              {options.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-white/90 hover:bg-white/10 transition-colors"
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </>,
          document.body
        )}
    </div>
  );
}

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-zinc-500/30 text-zinc-200 border-zinc-500/50",
  scheduled: "bg-amber-500/20 text-amber-400 border-amber-500/40",
  published: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
  failed: "bg-rose-500/20 text-rose-400 border-rose-500/40",
};

export function PostEditorPanel({
  postId,
  open,
  onClose,
  onSaved,
  onOpenPost,
}: PostEditorPanelProps) {
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const [remixing, setRemixing] = useState(false);
  const [remixOpen, setRemixOpen] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [scheduledFor, setScheduledFor] = useState<Date | undefined>(undefined);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [pasteUrl, setPasteUrl] = useState("");
  const [editorTab, setEditorTab] = useState<"write" | "preview">("write");
  const [previewPlatform, setPreviewPlatform] = useState<"LinkedIn" | "Instagram">("LinkedIn");
  const datePickerRef = useRef<HTMLDivElement>(null);
  const remixButtonRef = useRef<HTMLButtonElement>(null);
  const [remixDropdownStyle, setRemixDropdownStyle] = useState<{
    top: number;
    left: number;
    width: number;
    openAbove: boolean;
  } | null>(null);

  useEffect(() => {
    if (open && postId) {
      setLoading(true);
      getPostById(postId).then((p) => {
        setPost(p);
        setContent(p?.content ?? "");
        setImageUrl(p?.image_url ?? null);
        setScheduledFor(
          parseScheduledDate(p?.scheduled_for ?? null) ?? undefined
        );
        setLoading(false);
        setShowDatePicker(false);
        setShowUrlInput(false);
        setPasteUrl("");
      });
    } else {
      setPost(null);
    }
  }, [open, postId]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        datePickerRef.current &&
        !datePickerRef.current.contains(e.target as Node)
      ) {
        setShowDatePicker(false);
      }
    }
    if (showDatePicker) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showDatePicker]);

  // Position Remix dropdown via portal - open ABOVE button when near bottom (avoids off-screen)
  useLayoutEffect(() => {
    if (!remixOpen || !remixButtonRef.current || typeof document === "undefined") {
      setRemixDropdownStyle(null);
      return;
    }
    const rect = remixButtonRef.current.getBoundingClientRect();
    const DROPDOWN_EST_HEIGHT = 180;
    const spaceBelow = window.innerHeight - rect.bottom;
    const openAbove = spaceBelow < DROPDOWN_EST_HEIGHT;
    setRemixDropdownStyle({
      top: openAbove ? rect.top - DROPDOWN_EST_HEIGHT - 4 : rect.bottom + 4,
      left: rect.left,
      width: rect.width,
      openAbove,
    });
  }, [remixOpen]);

  async function handleSave() {
    if (!postId) return;
    setSaving(true);
    try {
      const result = await updatePost(postId, {
        content: content.trim() || null,
        image_url: imageUrl,
        scheduled_for: scheduledFor ? toUTCISOString(scheduledFor) : null,
      });
      if (result.success) {
        toast.success("Post saved.");
        onSaved?.();
        onClose();
      } else {
        toast.error("Failed to save", { description: result.error });
      }
    } catch (err) {
      toast.error(
        "Failed to save",
        { description: err instanceof Error ? err.message : "Unknown error" }
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!postId) return;
    if (!confirm("Delete this post? This cannot be undone.")) return;
    setDeleting(true);
    try {
      const result = await deletePost(postId);
      if (result.success) {
        toast.success("Post deleted.");
        onSaved?.();
        onClose();
      } else {
        toast.error("Failed to delete", { description: result.error });
      }
    } catch (err) {
      toast.error(
        "Failed to delete",
        { description: err instanceof Error ? err.message : "Unknown error" }
      );
    } finally {
      setDeleting(false);
    }
  }

  async function handleDuplicate() {
    if (!postId) return;
    setDuplicating(true);
    try {
      const result = await duplicatePost(postId);
      if (result.success) {
        toast.success("Post duplicated. Open it from drafts to schedule.");
        onSaved?.();
        onClose();
      } else {
        toast.error("Failed to duplicate", { description: result.error });
      }
    } catch (err) {
      toast.error(
        "Failed to duplicate",
        { description: err instanceof Error ? err.message : "Unknown error" }
      );
    } finally {
      setDuplicating(false);
    }
  }

  const REMIX_OPTIONS = [
    { value: "Instagram", label: "Remix for Instagram" },
    { value: "LinkedIn", label: "Remix for LinkedIn" },
    { value: "Twitter", label: "Remix for Twitter" },
    { value: "facebook", label: "Remix for Facebook" },
  ].filter((o) => (post?.platform ?? "").toLowerCase() !== o.value.toLowerCase());

  async function handleRemix(targetPlatform: string) {
    if (!postId) return;
    setRemixOpen(false);
    toast.info("Remixing content...");
    setRemixing(true);
    try {
      const result = await remixPost(postId, targetPlatform);
      if (result.success) {
        toast.success("Remixed! Opening new draft.");
        onSaved?.();
        onOpenPost?.(result.postId);
      } else {
        toast.error("Failed to remix", { description: result.error });
      }
    } catch (err) {
      toast.error(
        "Failed to remix",
        { description: err instanceof Error ? err.message : "Unknown error" }
      );
    } finally {
      setRemixing(false);
    }
  }

  async function handleRegenerateImage() {
    const prompt = content?.trim() || "social media post visual";
    setRegenerating(true);
    try {
      const result = await generateImage(prompt);
      if (result.success) {
        setImageUrl(result.imageUrl);
        toast.success("Image regenerated.");
      } else {
        toast.error("Failed to generate image", { description: result.error });
      }
    } catch (err) {
      toast.error(
        "Failed to generate image",
        { description: err instanceof Error ? err.message : "Unknown error" }
      );
    } finally {
      setRegenerating(false);
    }
  }

  function handleApplyUrl() {
    const url = pasteUrl.trim();
    if (url && (url.startsWith("http://") || url.startsWith("https://"))) {
      setImageUrl(url);
      setShowUrlInput(false);
      setPasteUrl("");
    } else {
      toast.error("Enter a valid image URL.");
    }
  }

  const status = (post?.status ?? "draft").toLowerCase();
  const statusStyle = STATUS_STYLES[status] ?? STATUS_STYLES.draft;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full sm:max-w-[400px] md:max-w-[30vw] min-w-[320px] border-l border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl flex flex-col"
          >
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h2 className="font-mono text-sm tracking-widest text-amber-500/80 uppercase">
                Flight Check
              </h2>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Write | Preview tabs */}
            <div className="flex border-b border-white/10">
              <button
                onClick={() => setEditorTab("write")}
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
                  editorTab === "write"
                    ? "text-amber-500 border-b-2 border-amber-500 bg-amber-500/5"
                    : "text-white/60 hover:text-white/80"
                }`}
              >
                <FileText className="h-4 w-4" />
                Write
              </button>
              <button
                onClick={() => setEditorTab("preview")}
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
                  editorTab === "preview"
                    ? "text-amber-500 border-b-2 border-amber-500 bg-amber-500/5"
                    : "text-white/60 hover:text-white/80"
                }`}
              >
                <Eye className="h-4 w-4" />
                Preview
              </button>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-4 pb-32 space-y-6">
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="h-8 w-8 animate-spin text-amber-500/60" />
                </div>
              ) : !post ? (
                <p className="text-sm text-white/50 py-8">Post not found.</p>
              ) : editorTab === "preview" ? (
                <>
                  {/* Platform selector - custom dropdown with portal to avoid scroll clipping */}
                  <PlatformSelect
                    value={previewPlatform}
                    onChange={(v) => setPreviewPlatform(v)}
                    options={[
                      { value: "LinkedIn", label: "LinkedIn" },
                      { value: "Instagram", label: "Instagram" },
                    ]}
                    label="Platform"
                  />
                  {/* Preview card */}
                  <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-4 overflow-x-auto">
                    {previewPlatform === "LinkedIn" ? (
                      <LinkedInPreview
                        content={content}
                        imageUrl={imageUrl}
                      />
                    ) : (
                      <InstagramPreview
                        content={content}
                        imageUrl={imageUrl}
                      />
                    )}
                  </div>
                </>
              ) : (
                <>
                  {/* Status Badge */}
                  <div>
                    <span
                      className={`inline-flex px-3 py-1 rounded-full text-xs font-medium border capitalize ${statusStyle}`}
                    >
                      {status}
                    </span>
                  </div>

                  {/* Content Textarea */}
                  <div>
                    <label className="block text-xs font-mono text-amber-500/60 uppercase tracking-wider mb-2">
                      Content
                    </label>
                    <textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      rows={6}
                      className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-amber-500/50 resize-none"
                      placeholder="Post content..."
                    />
                  </div>

                  {/* Image Preview + Regenerate + Upload */}
                  <div>
                    <label className="block text-xs font-mono text-amber-500/60 uppercase tracking-wider mb-2">
                      Image
                    </label>
                    <div className="space-y-3">
                      {imageUrl ? (
                        <div className="relative aspect-video rounded-lg overflow-hidden bg-white/5 border border-white/10">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={imageUrl}
                            alt="Post"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="aspect-video rounded-lg bg-white/5 border border-dashed border-white/10 flex items-center justify-center">
                          <span className="text-xs text-white/40">
                            No image
                          </span>
                        </div>
                      )}
                      <div className="flex gap-2">
                        <button
                          onClick={handleRegenerateImage}
                          disabled={regenerating}
                          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-400 text-sm font-medium hover:bg-amber-500/30 disabled:opacity-50 transition-colors"
                        >
                          {regenerating ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <RefreshCw className="h-4 w-4" />
                          )}
                          Regenerate
                        </button>
                        <button
                          onClick={() =>
                            setShowUrlInput((v) => !v)
                          }
                          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white/80 text-sm font-medium hover:bg-white/10 transition-colors"
                        >
                          <Upload className="h-4 w-4" />
                          Upload
                        </button>
                      </div>
                      {showUrlInput && (
                        <div className="flex gap-2">
                          <input
                            type="url"
                            value={pasteUrl}
                            onChange={(e) => setPasteUrl(e.target.value)}
                            placeholder="https://..."
                            className="flex-1 rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-amber-500/50"
                          />
                          <button
                            onClick={handleApplyUrl}
                            className="px-3 py-2 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-400 text-sm font-medium hover:bg-amber-500/30"
                          >
                            Apply
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Date Picker - Reschedule */}
                  <div ref={datePickerRef}>
                    <label className="block text-xs font-mono text-amber-500/60 uppercase tracking-wider mb-2">
                      Reschedule
                    </label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowDatePicker((v) => !v)}
                        className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white/80 text-sm hover:bg-white/10 transition-colors"
                      >
                        <Calendar className="h-4 w-4 text-amber-500/60" />
                        {scheduledFor
                          ? format(scheduledFor, "PPP · HH:mm")
                          : "Pick date & time"}
                      </button>
                      {scheduledFor && (
                        <button
                          onClick={() => setScheduledFor(undefined)}
                          className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white/60 text-xs hover:bg-white/10"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    {scheduledFor && (
                      <p className="mt-2 text-xs text-amber-500/70 font-mono">
                        Scheduling for: {formatInLocalWithTz(scheduledFor)}
                      </p>
                    )}
                    {showDatePicker && (
                      <div className="mt-2 p-3 rounded-lg bg-white/5 border border-white/10 [&_.rdp]:m-0">
                        <DayPicker
                          mode="single"
                          selected={scheduledFor}
                          onSelect={(d) => {
                            setScheduledFor(d);
                            setShowDatePicker(false);
                          }}
                          className="rdp-custom"
                          classNames={{
                            months: "flex flex-col",
                            month: "flex flex-col gap-2",
                            month_caption:
                              "flex justify-center relative items-center",
                            caption_label: "text-sm text-white/80",
                            nav: "flex items-center gap-1",
                            button_previous:
                              "absolute left-0 h-8 w-8 rounded bg-white/5 hover:bg-white/10 text-white/60",
                            button_next:
                              "absolute right-0 h-8 w-8 rounded bg-white/5 hover:bg-white/10 text-white/60",
                            month_grid: "w-full",
                            weekdays: "flex",
                            weekday: "text-white/40 text-xs w-8",
                            week: "flex",
                            day: "w-8 h-8 p-0",
                            day_button:
                              "w-8 h-8 rounded text-white/70 hover:bg-white/10",
                            selected: "bg-amber-500/30 text-white",
                            today: "font-semibold",
                            disabled: "text-white/30",
                            outside: "text-white/30",
                            hidden: "invisible",
                          }}
                        />
                        <input
                          type="time"
                          value={
                            scheduledFor
                              ? format(scheduledFor, "HH:mm")
                              : "12:00"
                          }
                          onChange={(e) => {
                            const [h, m] = e.target.value.split(":").map(Number);
                            const base = scheduledFor ?? new Date();
                            const d = new Date(base);
                            d.setHours(h, m, 0, 0);
                            setScheduledFor(d);
                          }}
                          className="mt-2 w-full rounded bg-white/5 border border-white/10 px-2 py-1.5 text-sm text-white"
                        />
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {post && (
              <div className="p-4 border-t border-white/10 space-y-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-amber-500/30 border border-amber-500/50 text-amber-400 font-medium hover:bg-amber-500/40 disabled:opacity-50 transition-colors"
                >
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  Save
                </button>
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={handleDuplicate}
                    disabled={duplicating}
                    className="flex-1 min-w-0 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white/70 text-sm hover:bg-white/10 disabled:opacity-50 transition-colors"
                  >
                    {duplicating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                    Duplicate
                  </button>
                  <div className="relative flex-1 min-w-0">
                    <button
                      ref={remixButtonRef}
                      onClick={() => setRemixOpen((v) => !v)}
                      disabled={remixing || REMIX_OPTIONS.length === 0}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm hover:bg-amber-500/20 disabled:opacity-50 transition-colors"
                    >
                      {remixing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Wand2 className="h-4 w-4" />
                      )}
                      Remix
                      <ChevronDown className="h-3.5 w-3.5 opacity-70" />
                    </button>
                    {remixOpen &&
                      typeof document !== "undefined" &&
                      remixDropdownStyle &&
                      createPortal(
                        <>
                          <div
                            className="fixed inset-0 z-[100]"
                            onClick={() => setRemixOpen(false)}
                            aria-hidden
                          />
                          <div
                            className="fixed z-[101] rounded-lg border border-white/10 bg-zinc-900/95 backdrop-blur-xl py-1 shadow-xl max-h-[50vh] overflow-y-auto"
                            style={{
                              top: remixDropdownStyle.top,
                              left: remixDropdownStyle.left,
                              width: remixDropdownStyle.width,
                            }}
                          >
                            {REMIX_OPTIONS.map((opt) => (
                              <button
                                key={opt.value}
                                onClick={() => handleRemix(opt.value)}
                                className="w-full px-3 py-2 text-left text-sm text-white/90 hover:bg-white/10 transition-colors"
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        </>,
                        document.body
                      )}
                  </div>
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm hover:bg-rose-500/20 disabled:opacity-50 transition-colors"
                  >
                    {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
