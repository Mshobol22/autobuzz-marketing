"use client";

import { DayPicker } from "react-day-picker";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { CalendarIcon, Clock, Loader2, List } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { getDraftPosts, type Post } from "@/app/actions/getPosts";
import { schedulePost } from "@/app/actions/schedulePost";
import "react-day-picker/style.css";

const MOCK_QUEUED = [
  { id: "1", title: "Tweet: Product Launch", date: "Feb 14th", platform: "Twitter" },
  { id: "2", title: "LinkedIn: Team Update", date: "Feb 16th", platform: "LinkedIn" },
  { id: "3", title: "Instagram: Behind the Scenes", date: "Feb 18th", platform: "Instagram" },
];

export default function SchedulePage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState("12:00");
  const [scheduling, setScheduling] = useState(false);

  useEffect(() => {
    getDraftPosts().then((data) => {
      setPosts(data);
      setLoading(false);
      if (data.length > 0) {
        setSelectedPostId((prev) => prev || data[0].id);
      }
    });
  }, []);

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
      const result = await schedulePost(selectedPostId, scheduledFor);

      if (result.success) {
        toast.success("Post scheduled!", {
          description: `Scheduled for ${format(scheduledFor, "PPp")}`,
        });
        setPosts((prev) =>
          prev.map((p) =>
            p.id === selectedPostId
              ? {
                  ...p,
                  status: "scheduled",
                  scheduled_for: scheduledFor.toISOString(),
                }
              : p
          )
        );
      } else {
        toast.error("Failed to schedule", { description: result.error });
      }
    } catch (err) {
      toast.error("Failed to schedule", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
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

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <motion.h1
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-bold text-zinc-100"
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
        className="rounded-2xl border border-white/10 bg-zinc-900/50 backdrop-blur-md p-6 mb-8"
      >
        <h2 className="text-lg font-semibold text-zinc-100 mb-4 flex items-center gap-2">
          <CalendarIcon className="h-5 w-5 text-zinc-400" />
          Pick date & time
        </h2>

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="rounded-xl overflow-hidden [&_.rdp]:m-0">
            <DayPicker
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              disabled={(date) =>
                date < new Date(new Date().setHours(0, 0, 0, 0))
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
          </div>

          <div className="flex-1 space-y-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-zinc-400" />
              <input
                type="time"
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                className="rounded-lg bg-zinc-800/60 border border-white/10 px-3 py-2 text-zinc-100 focus:outline-none focus:border-zinc-500/50"
              />
            </div>

            <div>
              <label className="text-sm text-zinc-400 mb-2 block">
                Select post
              </label>
              <select
                value={selectedPostId ?? ""}
                onChange={(e) => setSelectedPostId(e.target.value || null)}
                className="w-full rounded-xl bg-zinc-800/60 border border-white/10 px-4 py-3 text-zinc-100 focus:outline-none focus:border-zinc-500/50"
              >
                {posts.map((post) => (
                  <option key={post.id} value={post.id}>
                    {post.content?.slice(0, 50) ?? "Untitled"}...
                    {post.scheduled_for && " (scheduled)"}
                  </option>
                ))}
              </select>
            </div>

            {posts.length > 0 && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSchedule}
                disabled={scheduling || !selectedPostId || !selectedDate}
                className="w-full rounded-xl bg-zinc-600/40 border border-white/10 px-4 py-3 text-zinc-100 font-medium disabled:opacity-50 flex items-center justify-center gap-2 hover:bg-zinc-600/60"
              >
                {scheduling ? "Scheduling…" : "Schedule Post"}
                {scheduling && <Loader2 className="h-4 w-4 animate-spin" />}
              </motion.button>
            )}
          </div>
        </div>
      </motion.div>

      {/* List View - Queued Posts */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-2xl border border-white/10 bg-zinc-900/50 backdrop-blur-md p-6"
      >
        <h2 className="text-lg font-semibold text-zinc-100 mb-4 flex items-center gap-2">
          <List className="h-5 w-5 text-zinc-400" />
          Queued Posts
        </h2>
        <ul className="space-y-3">
          {MOCK_QUEUED.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between rounded-xl border border-white/10 bg-zinc-800/40 px-4 py-3"
            >
              <span className="text-sm font-medium text-zinc-200">
                {item.title}
              </span>
              <span className="text-xs text-zinc-500">{item.date}</span>
            </li>
          ))}
        </ul>
      </motion.div>
    </div>
  );
}
