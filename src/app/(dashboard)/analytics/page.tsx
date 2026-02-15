"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Line,
  LineChart,
} from "recharts";
import { Eye, Heart, Trophy, TrendingUp, Calendar, Wand2, ChevronDown } from "lucide-react";
import { getPostAnalytics, type PostAnalyticsSummary } from "@/app/actions/getPostAnalytics";
import { remixPost } from "@/app/actions/remixPost";
import { format } from "date-fns";
import { toast } from "sonner";

const REMIX_PLATFORMS = [
  { value: "Instagram", label: "Instagram" },
  { value: "LinkedIn", label: "LinkedIn" },
  { value: "Twitter", label: "Twitter" },
  { value: "facebook", label: "Facebook" },
];

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-amber-500/20 bg-indigo-900/20 p-6 animate-pulse">
      <div className="h-10 w-10 rounded-xl bg-amber-500/20 mb-4" />
      <div className="h-8 w-24 bg-amber-500/20 rounded mb-2" />
      <div className="h-4 w-16 bg-amber-500/10 rounded" />
    </div>
  );
}

function SkeletonChart() {
  return (
    <div className="rounded-xl border border-amber-500/20 bg-indigo-900/20 p-6 animate-pulse">
      <div className="h-5 w-48 bg-amber-500/20 rounded mb-6" />
      <div className="h-64 flex items-end gap-2">
        {Array.from({ length: 14 }).map((_, i) => (
          <div
            key={i}
            className="flex-1 bg-amber-500/10 rounded-t"
            style={{ height: `${30 + Math.random() * 60}%` }}
          />
        ))}
      </div>
    </div>
  );
}

type HallOfFamePost = PostAnalyticsSummary["topPosts"][number];

function HallOfFameCard({
  post,
  rank,
  onRemix,
  remixing,
}: {
  post: HallOfFamePost;
  rank: number;
  onRemix: (targetPlatform: string) => void;
  remixing: boolean;
}) {
  const [remixOpen, setRemixOpen] = useState(false);
  return (
    <div className="flex items-start gap-4 rounded-lg border border-amber-500/20 bg-indigo-950/30 p-4">
      <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 font-bold">
        {rank === 0 ? (
          <Trophy className="h-5 w-5" />
        ) : (
          rank + 1
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-amber-200 line-clamp-2">
          {post.content || "—"}
        </p>
        <p className="text-xs text-indigo-400/70 mt-1">
          {post.platform} · {formatNumber(post.engagement)}{" "}
          engagement
          {post.postedAt && (
            <> · {format(new Date(post.postedAt), "MMM d, yyyy")}</>
          )}
        </p>
      </div>
      <div className="flex-shrink-0 relative">
        <button
          onClick={() => setRemixOpen((v) => !v)}
          disabled={remixing}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-400 text-sm font-medium hover:bg-amber-500/30 disabled:opacity-50 transition-colors"
          title="Remix this post"
        >
          {remixing ? (
            <span className="h-4 w-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
          ) : (
            <Wand2 className="h-4 w-4" />
          )}
          <span className="hidden sm:inline">Remix</span>
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${remixOpen ? "rotate-180" : ""}`} />
        </button>
        {remixOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setRemixOpen(false)}
              aria-hidden
            />
            <div className="absolute right-0 top-full mt-1 z-20 py-1 rounded-lg bg-indigo-950 border border-amber-500/30 shadow-xl min-w-[140px]">
              {REMIX_PLATFORMS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    setRemixOpen(false);
                    onRemix(opt.value);
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-amber-200 hover:bg-amber-500/20 transition-colors"
                >
                  Remix for {opt.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function SkeletonHallOfFame() {
  return (
    <div className="rounded-xl border border-amber-500/20 bg-indigo-900/20 p-6 animate-pulse space-y-4">
      <div className="h-5 w-32 bg-amber-500/20 rounded mb-4" />
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex gap-4 items-center">
          <div className="h-8 w-8 rounded-full bg-amber-500/20" />
          <div className="flex-1 h-4 bg-amber-500/10 rounded" />
        </div>
      ))}
    </div>
  );
}

export default function AnalyticsPage() {
  const router = useRouter();
  const [data, setData] = useState<PostAnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [remixPostId, setRemixPostId] = useState<string | null>(null);

  useEffect(() => {
    getPostAnalytics("last_30_days").then((result) => {
      setData(result ?? null);
      setLoading(false);
    });
  }, []);

  const isEmpty =
    !loading &&
    data &&
    data.totalImpressions === 0 &&
    data.totalEngagement === 0 &&
    data.topPosts.length === 0;

  return (
    <div className="min-h-screen bg-[#1e1b4b]">
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold text-amber-400 font-serif flex items-center gap-3"
        >
          <Trophy className="h-8 w-8" />
          The Scoreboard
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="mt-1 text-indigo-200/80 mb-8"
        >
          Track performance and growth of your posts.
        </motion.p>

        {loading ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
            <SkeletonChart />
            <SkeletonHallOfFame />
          </div>
        ) : isEmpty ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-amber-500/30 bg-indigo-900/20 p-12 text-center"
          >
            <p className="text-xl text-amber-200/90 font-medium">
              Not enough data yet
            </p>
            <p className="text-indigo-200/70 mt-2">
              Publish some posts to see your analytics here.
            </p>
            <Link
              href="/schedule"
              className="inline-flex items-center gap-2 mt-6 px-6 py-3 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-400 font-medium hover:bg-amber-500/30 transition-colors"
            >
              <Calendar className="h-4 w-4" />
              Schedule a Post
            </Link>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {/* Top Row: 3 Big Cards */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-4"
            >
              <div className="rounded-xl border border-amber-500/30 bg-indigo-900/20 p-6">
                <div className="flex items-start justify-between">
                  <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-500/30">
                    <Eye className="h-5 w-5 text-amber-400" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-amber-200 mt-4">
                  {formatNumber(data!.totalImpressions)}
                </p>
                <p className="text-sm text-indigo-300/70 mt-1">
                  Total Impressions
                </p>
              </div>
              <div className="rounded-xl border border-amber-500/30 bg-indigo-900/20 p-6">
                <div className="flex items-start justify-between">
                  <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-500/30">
                    <Heart className="h-5 w-5 text-amber-400" />
                  </div>
                  {data!.viralityScore > 0 && (
                    <span className="text-xs font-medium text-amber-400/90">
                      {data!.viralityScore}% virality
                    </span>
                  )}
                </div>
                <p className="text-2xl font-bold text-amber-200 mt-4">
                  {formatNumber(data!.totalEngagement)}
                </p>
                <p className="text-sm text-indigo-300/70 mt-1">
                  Total Engagement
                </p>
              </div>
              <div className="rounded-xl border border-amber-500/30 bg-indigo-900/20 p-6">
                <div className="flex items-start justify-between">
                  <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-500/30">
                    <TrendingUp className="h-5 w-5 text-amber-400" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-amber-200 mt-4">
                  {data!.topPlatform}
                </p>
                <p className="text-sm text-indigo-300/70 mt-1">
                  Top Platform
                </p>
              </div>
            </motion.div>

            {/* Middle Row: Engagement Over Time Chart */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="rounded-xl border border-amber-500/30 bg-indigo-900/20 p-4 sm:p-6 overflow-x-auto"
            >
              <h2 className="text-lg font-semibold text-amber-200 mb-6 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-amber-500/80" />
                Engagement Over Time
              </h2>
              <div className="h-64 min-w-[280px]">
                {data!.engagementOverTime.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={data!.engagementOverTime.map((d) => ({
                        ...d,
                        label: format(new Date(d.date), "MMM d"),
                      }))}
                    >
                      <defs>
                        <linearGradient
                          id="colorEngagement"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#f59e0b"
                            stopOpacity={0.4}
                          />
                          <stop
                            offset="95%"
                            stopColor="#f59e0b"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="rgba(129,140,248,0.2)"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="label"
                        stroke="#a5b4fc"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        stroke="#a5b4fc"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v) => formatNumber(v)}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#312e81",
                          border: "1px solid rgba(245,158,11,0.3)",
                          borderRadius: "12px",
                        }}
                        labelStyle={{ color: "#fcd34d" }}
                        formatter={(value) => [
                          (value ?? 0).toLocaleString(),
                          "Engagement",
                        ]}
                      />
                      <Line
                        type="monotone"
                        dataKey="engagement"
                        stroke="#f59e0b"
                        strokeWidth={2}
                        dot={{ fill: "#f59e0b", r: 3 }}
                        activeDot={{ r: 5 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-indigo-300/60">
                    No engagement data in this range
                  </div>
                )}
              </div>
            </motion.div>

            {/* Bottom Row: Hall of Fame */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-xl border border-amber-500/30 bg-indigo-900/20 p-6"
            >
              <h2 className="text-lg font-semibold text-amber-200 mb-6 flex items-center gap-2">
                <Trophy className="h-5 w-5 text-amber-500" />
                Hall of Fame
              </h2>
              {data!.topPosts.length > 0 ? (
                <div className="space-y-4">
                  {data!.topPosts.map((post, idx) => (
                    <HallOfFameCard
                      key={post.postId}
                      post={post}
                      rank={idx}
                      onRemix={async (targetPlatform) => {
                        setRemixPostId(post.postId);
                        toast.info("Remixing your best post...");
                        try {
                          const result = await remixPost(
                            post.postId,
                            targetPlatform,
                            {
                              isHallOfFame: true,
                              sourceContent: post.content,
                              sourcePlatform: post.platform,
                            }
                          );
                          if (result.success) {
                            toast.success("Created 3 variations! Opening first draft.");
                            router.push(`/schedule?open=${result.postId}`);
                          } else {
                            toast.error("Failed to remix", {
                              description: result.error,
                            });
                          }
                        } catch (err) {
                          toast.error("Failed to remix", {
                            description: err instanceof Error ? err.message : "Unknown error",
                          });
                        } finally {
                          setRemixPostId(null);
                        }
                      }}
                      remixing={remixPostId === post.postId}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-indigo-300/60">No posts yet.</p>
              )}
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
