"use client";

import { DayPicker } from "react-day-picker";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { CalendarIcon, Clock, Loader2, List, FileText } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { toast } from "sonner";
import { getDraftPosts } from "@/app/actions/getPosts";
import { getUpcomingScheduledPosts } from "@/app/actions/getScheduledPosts";
import type { Post } from "@/lib/types";
import { scheduleDraftPost } from "@/app/actions/schedulePost";
import { PostEditorPanel } from "@/components/PostEditorPanel";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { parseScheduledDate } from "@/lib/dateUtils";
import "react-day-picker/style.css";

function ScheduleContent() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState("12:00");
  const [scheduling, setScheduling] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [queuedPosts, setQueuedPosts] = useState<
    Awaited<ReturnType<typeof getUpcomingScheduledPosts>>
  >([]);
  const [editorPostId, setEditorPostId] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await getDraftPosts();
        if (cancelled) return;

        setPosts(Array.isArray(data) ? data : []);
        setError(null);
        if (Array.isArray(data) && data.length > 0) {
          setSelectedPostId((prev) => prev || data[0].id);
        }
      } catch (err) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : "Failed to load posts";
        console.error("[Schedule] getDraftPosts error:", err);
        setError(message);
        setPosts([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    getUpcomingScheduledPosts(20).then((data) => {
      setQueuedPosts(Array.isArray(data) ? data : []);
    });
  }, []);

  const todayStart = useMemo(() => {
    if (!mounted) return null;
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, [mounted]);

  const defaultSelectedDate = useMemo(() => {
    if (!mounted) return undefined;
    return new Date();
  }, [mounted]);

  async function handleSchedule() {
    if (!selectedPostId || !selectedDate) {
      toast.error("Select a post and date.");
      return;
    }

    const [hours, minutes] = selectedTime.split(":").map(Number);
    const scheduledFor = new Date(selectedDate);
    scheduledFor.setHours(hours, minutes, 0, 0);

    if (scheduledFor <= new Date()) {
      toast.error("Schedule time must be in the future.");
      return;
    }

    setScheduling(true);

    try {
      const result = await scheduleDraftPost(selectedPostId, scheduledFor);

      if (result.success) {
        toast.success("Post scheduled!", {
          description: `Scheduled for ${format(scheduledFor, "PPp")}`,
        });
        setPosts((prev) =>
          prev.filter((p) => p.id !== selectedPostId)
        );
        getUpcomingScheduledPosts(20).then((data) => {
          setQueuedPosts(Array.isArray(data) ? data : []);
        });
      } else {
        toast.error("Failed to schedule", { description: result.error });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error("[Schedule] schedulePost error:", err);
      toast.error("Failed to schedule", { description: message });
    } finally {
      setScheduling(false);
    }
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 lg:p-8 max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-white font-serif">Schedule</h1>
        <div className="mt-6 art-card p-6">
          <p className="text-rose-400">Failed to load posts: {error}</p>
          <p className="mt-2 text-sm text-zinc-500">
            Check the console for details. You may need to create a post in Generator first.
          </p>
        </div>
      </div>
    );
  }

  const safePosts = Array.isArray(posts) ? posts : [];

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <motion.h1
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-bold text-white font-serif"
      >
        Schedule
      </motion.h1>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="mt-1 text-zinc-400 mb-8"
      >
        Schedule posts for later publishing.
      </motion.p>

      {/* Calendar - Center Stage */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="art-card p-6 mb-8"
      >
        <h2 className="text-lg font-semibold text-zinc-100 mb-4 flex items-center gap-2">
          <CalendarIcon className="h-5 w-5 text-zinc-400" />
          Pick date & time
        </h2>

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="rounded-xl overflow-hidden [&_.rdp]:m-0">
            {mounted ? (
              <DayPicker
                mode="single"
                selected={selectedDate ?? defaultSelectedDate}
                onSelect={setSelectedDate}
                disabled={(date) =>
                  todayStart ? date < todayStart : false
                }
                className="rdp-custom bg-zinc-800/40 rounded-xl p-4 border border-white/10"
                classNames={{
                  months: "flex flex-col sm:flex-row gap-4",
                  month: "flex flex-col gap-4",
                  month_caption:
                    "flex justify-center pt-1 relative items-center",
                  caption_label: "text-sm font-medium text-zinc-100",
                  nav: "flex items-center gap-1",
                  button_previous:
                    "absolute left-1 h-9 w-9 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 flex items-center justify-center",
                  button_next:
                    "absolute right-1 h-9 w-9 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 flex items-center justify-center",
                  month_grid: "w-full border-collapse",
                  weekdays: "flex",
                  weekday: "text-zinc-500 text-xs font-medium w-9 rounded-lg py-1",
                  week: "flex w-full mt-1",
                  day: "h-9 w-9 p-0 text-center text-sm",
                  day_button:
                    "h-9 w-9 rounded-lg text-zinc-300 hover:bg-white/10 hover:text-white focus:bg-zinc-500/30 focus:text-zinc-100",
                  selected:
                    "bg-zinc-500/30 text-zinc-100 hover:bg-zinc-500/40",
                  today: "font-semibold text-zinc-200",
                  disabled: "text-zinc-600 opacity-50",
                  outside: "text-zinc-600",
                  hidden: "invisible",
                }}
              />
            ) : (
              <div className="h-64 animate-pulse bg-zinc-800/40 rounded-xl" />
            )}
          </div>

          <div className="flex-1 space-y-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-zinc-400" />
              <input
                type="time"
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                className="rounded-lg bg-zinc-800/60 border border-white/10 px-3 py-2 text-zinc-100 focus:outline-none focus:border-accent-violet/50"
              />
            </div>

            <div>
              <label className="text-sm text-zinc-400 mb-2 block">
                Select post
              </label>
              {safePosts.length === 0 ? (
                <div className="rounded-xl border border-white/10 bg-zinc-800/40 px-4 py-8 flex flex-col items-center justify-center gap-2 text-center">
                  <FileText className="h-10 w-10 text-zinc-500" />
                  <p className="text-sm text-zinc-400">No draft posts</p>
                  <p className="text-xs text-zinc-500">
                    Create a post in Generator first, then return here to schedule it.
                  </p>
                </div>
              ) : (
                <>
                  <select
                    value={selectedPostId ?? ""}
                    onChange={(e) => setSelectedPostId(e.target.value || null)}
                    className="w-full rounded-xl bg-zinc-800/60 border border-white/10 px-4 py-3 text-zinc-100 focus:outline-none focus:border-accent-violet/50"
                  >
                    {safePosts.map((post) => {
                      const hasValidDate = parseScheduledDate(post.scheduled_for) != null;
                      return (
                        <option key={post.id} value={post.id}>
                          {(post.content?.slice(0, 50) ?? "Untitled")}
                          {post.content && (post.content.length > 50 ? "…" : "")}
                          {hasValidDate ? " (scheduled)" : ""}
                        </option>
                      );
                    })}
                  </select>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSchedule}
                    disabled={scheduling || !selectedPostId || !selectedDate}
                    className="w-full mt-4 rounded-xl bg-accent-violet/40 border border-accent-violet/50 px-4 py-3 text-white font-medium disabled:opacity-50 flex items-center justify-center gap-2 hover:bg-accent-violet/50 transition-colors"
                  >
                    {scheduling ? "Scheduling…" : "Schedule Post"}
                    {scheduling && <Loader2 className="h-4 w-4 animate-spin" />}
                  </motion.button>
                </>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* List View - Queued Posts */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="art-card p-6"
      >
        <h2 className="text-lg font-semibold text-zinc-100 mb-4 flex items-center gap-2">
          <List className="h-5 w-5 text-zinc-400" />
          Queued Posts
        </h2>
        <ul className="space-y-3">
          {queuedPosts.length === 0 ? (
            <li className="rounded-xl border border-dashed border-white/10 bg-zinc-800/40 px-4 py-8 flex flex-col items-center justify-center gap-2 text-center">
              <span className="text-sm text-zinc-500">No scheduled posts</span>
              <span className="text-xs text-zinc-600">
                Schedule a draft above to see it here.
              </span>
            </li>
          ) : (
            queuedPosts.map((post) => (
              <li key={post.id}>
                <button
                  type="button"
                  onClick={() => {
                    setEditorPostId(post.id);
                    setEditorOpen(true);
                  }}
                  className="w-full flex items-center justify-between rounded-xl border border-white/10 bg-zinc-800/40 px-4 py-3 hover:bg-zinc-800/60 transition-colors text-left"
                >
                  <span className="text-sm font-medium text-zinc-200 truncate flex-1 mr-2">
                    {post.content?.slice(0, 50) ?? "Untitled"}
                    {(post.content?.length ?? 0) > 50 ? "…" : ""}
                  </span>
                  <span className="text-xs text-zinc-500 flex-shrink-0">
                    {post.scheduled_for
                      ? format(
                          new Date(post.scheduled_for),
                          "MMM d, HH:mm"
                        )
                      : "—"}
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      </motion.div>

      <PostEditorPanel
        postId={editorPostId}
        open={editorOpen}
        onClose={() => {
          setEditorOpen(false);
          setEditorPostId(null);
        }}
        onSaved={async () => {
          const [queue, drafts] = await Promise.all([
            getUpcomingScheduledPosts(20),
            getDraftPosts(),
          ]);
          setQueuedPosts(Array.isArray(queue) ? queue : []);
          setPosts(Array.isArray(drafts) ? drafts : []);
        }}
      />
    </div>
  );
}

export default function SchedulePage() {
  return (
    <ErrorBoundary>
      <ScheduleContent />
    </ErrorBoundary>
  );
}
