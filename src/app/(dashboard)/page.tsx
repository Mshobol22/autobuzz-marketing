"use client";

import { motion } from "framer-motion";
import {
  Heart,
  Calendar,
  Sparkles,
  ArrowUpRight,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getUpcomingScheduledPosts } from "@/app/actions/getScheduledPosts";
import { format } from "date-fns";

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

export default function DashboardPage() {
  const [scheduled, setScheduled] = useState<
    Awaited<ReturnType<typeof getUpcomingScheduledPosts>>
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUpcomingScheduledPosts(2).then((data) => {
      setScheduled(data);
      setLoading(false);
    });
  }, []);

  return (
    <div className="p-6 lg:p-8">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold tracking-tight text-zinc-100">
          Dashboard
        </h1>
        <p className="mt-1 text-zinc-400">
          Welcome back. Here&apos;s what&apos;s happening.
        </p>
      </motion.div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-fr"
      >
        {/* Widget 1: Account Health */}
        <motion.div
          variants={item}
          className="rounded-2xl border border-white/10 bg-zinc-900/50 backdrop-blur-md p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-zinc-600/40 border border-white/10">
              <Heart className="h-5 w-5 text-zinc-300" />
            </div>
            <h3 className="text-sm font-medium text-zinc-400">
              Account Health
            </h3>
          </div>
          <p className="text-2xl font-bold text-emerald-400">Excellent</p>
          <p className="text-sm text-zinc-500 mt-1">All systems operational</p>
        </motion.div>

        {/* Widget 2: Upcoming Schedule */}
        <motion.div
          variants={item}
          className="rounded-2xl border border-white/10 bg-zinc-900/50 backdrop-blur-md p-6 lg:col-span-2"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-zinc-600/40 border border-white/10">
              <Calendar className="h-5 w-5 text-zinc-300" />
            </div>
            <h3 className="text-sm font-medium text-zinc-400">
              Upcoming Schedule
            </h3>
          </div>
          {loading ? (
            <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
          ) : scheduled.length > 0 ? (
            <ul className="space-y-3">
              {scheduled.map((post) => (
                <li
                  key={post.id}
                  className="flex items-center justify-between rounded-xl bg-zinc-800/40 border border-white/10 px-4 py-3"
                >
                  <span className="text-sm text-zinc-300 truncate max-w-[200px]">
                    {post.content?.slice(0, 40) ?? "Post"}...
                  </span>
                  <span className="text-xs text-zinc-500">
                    {post.scheduled_for
                      ? format(new Date(post.scheduled_for), "MMM d, h:mm a")
                      : "—"}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-zinc-500 mt-1">
              No scheduled posts. Create one in Schedule.
            </p>
          )}
        </motion.div>

        {/* Widget 3: Quick Generate */}
        <motion.div variants={item}>
          <Link href="/generator">
            <div className="h-full rounded-2xl border border-white/10 bg-zinc-900/50 backdrop-blur-md p-6 flex flex-col items-center justify-center gap-4 hover:border-zinc-500/30 transition-colors group">
              <div className="p-3 rounded-xl bg-zinc-600/40 border border-white/10 group-hover:bg-zinc-500/40 transition-colors">
                <Sparkles className="h-8 w-8 text-zinc-300" />
              </div>
              <div className="flex items-center gap-2 text-zinc-300 font-medium">
                Quick Generate
                <ArrowUpRight className="h-4 w-4" />
              </div>
              <p className="text-xs text-zinc-500 text-center">
                Create a new post
              </p>
            </div>
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
