"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { Sparkles, Loader2, Send, Calendar, FileText, Play } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import { format } from "date-fns";
import { formatScheduledDate } from "@/lib/dateUtils";
import { VelocityText } from "@/components/ui/VelocityText";
import { Magnetic } from "@/components/ui/Magnetic";
import { MaskRevealText } from "@/components/ui/MaskRevealText";
import {
  getDashboardStats,
  type DashboardStats,
} from "@/app/actions/getDashboardStats";
import { PostEditorPanel } from "@/components/PostEditorPanel";
import { testDispatch } from "@/app/actions/testDispatch";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// Astrolabe / navigation dial image for Quick Generate
const ASTROLABE_IMAGE =
  "https://images.unsplash.com/photo-1590523278135-1e42c2393393?q=80&w=2500&auto=format&fit=crop";

export default function DashboardPage() {
  const { user } = useUser();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [editorPostId, setEditorPostId] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [dispatching, setDispatching] = useState(false);

  const refreshStats = () => {
    getDashboardStats().then(setStats);
  };

  const { scrollYProgress } = useScroll();
  const heroY = useTransform(scrollYProgress, [0, 0.3], [0, -80]);
  const imageY = useTransform(scrollYProgress, [0, 0.3], [0, -40]);
  const timelineOpacity = useTransform(scrollYProgress, [0.2, 0.4], [0, 1]);

  useEffect(() => {
    getDashboardStats().then((data) => {
      setStats(data);
      setLoading(false);
    });
  }, []);

  const displayName = user?.firstName ?? user?.username ?? "USER";
  const upcomingPosts = stats?.upcomingPosts ?? [];

  async function handleTestDispatch() {
    setDispatching(true);
    try {
      const result = await testDispatch();
      if (result.errors.length > 0 && result.posts_processed === 0) {
        toast.error(result.errors[0]?.error ?? "Dispatch failed");
      } else {
        toast.success(`Processed ${result.posts_processed} post(s)`, {
          description:
            result.errors.length > 0
              ? `${result.errors.length} failed`
              : undefined,
        });
        refreshStats();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Dispatch failed");
    } finally {
      setDispatching(false);
    }
  }

  return (
    <div className="min-h-screen">
      {/* Section 1: Hero - Massive Typography with Velocity + Mask Reveal */}
      <section className="min-h-[80vh] flex flex-col justify-end pb-20 px-6 md:px-12">
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          style={{ y: heroY }}
          className="text-5xl md:text-8xl lg:text-9xl font-bold tracking-tighter text-white leading-[0.9] font-serif"
        >
          <VelocityText>
            <MaskRevealText
              lines={[
                "WELCOME",
                "BACK,",
                `${displayName.toUpperCase()}.`,
              ]}
              staggerDelay={0.05}
              className="[&>span]:leading-[0.9] [&>span>span]:text-white [&>span:last-child>span]:text-white/60"
            />
          </VelocityText>
        </motion.h1>
      </section>

      {/* Section 2: Quick Action - Cinematic Card (Magnetic) */}
      <section className="min-h-[60vh] flex items-center px-6 md:px-12 py-20">
        <motion.div style={{ y: imageY }} className="w-full">
          <Magnetic>
            <Link href="/generator">
              <div className="group relative w-full aspect-[21/9] overflow-hidden border border-amber-500/20">
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-110 group-hover:rotate-6"
                  style={{ backgroundImage: `url(${ASTROLABE_IMAGE})` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-black/40" />
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-6">
                  <div className="p-6 border border-amber-500/40 group-hover:border-amber-500/60 transition-colors">
                    <Sparkles className="h-16 w-16 text-amber-500" />
                  </div>
                  <span className="font-serif text-2xl md:text-4xl tracking-[0.4em] text-amber-500 font-semibold">
                    GENERATE
                  </span>
                  <span className="font-mono text-sm tracking-widest text-white/80">
                    Create a new post with AI
                  </span>
                </div>
              </div>
            </Link>
          </Magnetic>
        </motion.div>
      </section>

      {/* Section 3: The Queue - Upcoming Schedule */}
      <section className="h-[50vh] flex flex-col px-6 md:px-12">
        <motion.div
          style={{ opacity: timelineOpacity }}
          className="flex-1 flex flex-col"
        >
          <div className="overflow-hidden mb-8">
            <motion.h2
              initial={{ y: "100%" }}
              whileInView={{ y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="font-serif text-xs tracking-[0.3em] text-amber-500/80 uppercase"
            >
              Upcoming Schedule
            </motion.h2>
          </div>
          <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4 -mx-6 px-6 md:-mx-12 md:px-12">
            <div className="flex gap-6 h-full min-w-max items-end">
              {loading ? (
                <div className="flex items-center gap-4 text-white/50">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="font-mono text-sm">Loading…</span>
                </div>
              ) : upcomingPosts.length > 0 ? (
                upcomingPosts.map((post) => (
                  <button
                    key={post.id}
                    type="button"
                    onClick={() => {
                      setEditorPostId(post.id);
                      setEditorOpen(true);
                    }}
                    className="w-64 h-32 flex-shrink-0 border border-white/10 bg-white/5 flex flex-col justify-between p-4 hover:bg-white/10 transition-colors text-left cursor-pointer"
                  >
                    <span className="font-mono text-sm text-white/80 truncate">
                      {post.content?.slice(0, 60) ?? "Post"}
                      {(post.content?.length ?? 0) > 60 ? "…" : ""}
                    </span>
                    <span className="font-mono text-[10px] tracking-widest text-white/50">
                      {formatScheduledDate(
                        post.scheduled_for,
                        (d) => format(d, "MMM d, HH:mm"),
                        "No Date"
                      )}
                    </span>
                  </button>
                ))
              ) : (
                <Link
                  href="/schedule"
                  className="w-64 h-32 flex-shrink-0 border border-dashed border-white/20 flex flex-col items-center justify-center gap-2 hover:border-white/40 transition-colors"
                >
                  <span className="font-mono text-xs text-white/50">
                    No scheduled posts
                  </span>
                  <span className="font-mono text-[10px] tracking-widest text-white/40">
                    Schedule first post →
                  </span>
                </Link>
              )}
            </div>
          </div>
        </motion.div>
      </section>

      {/* Section 4: Live Stats - Activity, Queue summary, Recent, Chart */}
      <section className="py-32 px-6 md:px-12 space-y-16">
        {/* Card A: Activity - Posts Published & Scheduled */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={{
            hidden: {},
            visible: {
              transition: { staggerChildren: 0.05, delayChildren: 0 },
            },
          }}
          className="w-full border-t border-b border-amber-500/20 py-12 flex flex-col md:flex-row md:items-end md:justify-between gap-4"
        >
          <motion.div
            variants={{ hidden: { y: "100%" }, visible: { y: 0 } }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden font-mono text-[10px] tracking-[0.4em] text-amber-500/60 uppercase"
          >
            Activity
          </motion.div>
          <div className="flex flex-col gap-2">
            <motion.div
              variants={{ hidden: { y: "100%" }, visible: { y: 0 } }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden flex flex-wrap items-baseline gap-x-6 gap-y-2"
            >
              {loading ? (
                <span className="text-6xl md:text-8xl font-bold text-amber-500 font-serif">—</span>
              ) : (
                <>
                  <span className="text-6xl md:text-8xl lg:text-9xl font-bold text-amber-500 tracking-tighter font-serif">
                    {stats?.publishedCount ?? 0}
                  </span>
                  <span className="text-2xl md:text-4xl text-amber-500/80 font-serif">
                    Posts Published
                  </span>
                  <span className="text-6xl md:text-8xl lg:text-9xl font-bold text-amber-500/70 tracking-tighter font-serif">
                    {stats?.scheduledCount ?? 0}
                  </span>
                  <span className="text-2xl md:text-4xl text-amber-500/60 font-serif">
                    Scheduled
                  </span>
                </>
              )}
            </motion.div>
            <motion.div
              variants={{ hidden: { y: "100%" }, visible: { y: 0 } }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden font-mono text-xs text-amber-500/50 flex items-center gap-4"
            >
              {!loading && (
                <>
                  <span className="flex items-center gap-1.5">
                    <Send className="h-3.5 w-3.5" />
                    {stats?.publishedCount ?? 0} posts published
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    {stats?.scheduledCount ?? 0} in queue
                  </span>
                  {typeof stats?.generationsToday === "number" && (
                    <span>{stats.generationsToday} generated today</span>
                  )}
                </>
              )}
            </motion.div>
          </div>
        </motion.div>

        {/* Card C: Recent Topics */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={{
            hidden: {},
            visible: {
              transition: { staggerChildren: 0.05, delayChildren: 0.08 },
            },
          }}
          className="w-full border-t border-b border-amber-500/20 py-12"
        >
          <motion.div
            variants={{ hidden: { y: "100%" }, visible: { y: 0 } }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="font-mono text-[10px] tracking-[0.4em] text-amber-500/60 uppercase mb-6"
          >
            Recent Topics
          </motion.div>
          {loading ? (
            <div className="flex items-center gap-4 text-white/50">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="font-mono text-sm">Loading…</span>
            </div>
          ) : (stats?.recentTopics?.length ?? 0) > 0 ? (
            <ul className="space-y-4">
              {stats!.recentTopics.map((topic) => (
                <motion.li
                  key={topic.id}
                  variants={{ hidden: { y: "100%" }, visible: { y: 0 } }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setEditorPostId(topic.id);
                      setEditorOpen(true);
                    }}
                    className="w-full flex items-start gap-3 font-mono text-sm text-white/80 text-left hover:text-white transition-colors"
                  >
                    <FileText className="h-4 w-4 text-amber-500/60 flex-shrink-0 mt-0.5" />
                    <span className="line-clamp-2 flex-1">
                      {topic.content?.slice(0, 120) ?? "Untitled"}
                      {(topic.content?.length ?? 0) > 120 ? "…" : ""}
                    </span>
                  <span className="text-[10px] text-white/40 flex-shrink-0">
                    {topic.created_at
                      ? format(new Date(topic.created_at), "MMM d")
                      : ""}
                  </span>
                  </button>
                </motion.li>
              ))}
            </ul>
          ) : (
            <p className="font-mono text-sm text-white/50">
              No posts yet. Generate your first post to see topics here.
            </p>
          )}
        </motion.div>

        {/* Activity Chart - Posts per Day (Last 7 Days) */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: {
              opacity: 1,
              y: 0,
              transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
            },
          }}
          className="w-full border border-amber-500/20 p-6 md:p-8"
        >
          <h3 className="font-mono text-[10px] tracking-[0.4em] text-amber-500/60 uppercase mb-6">
            Posts per Day (Last 7 Days)
          </h3>
          <div className="h-48 md:h-64">
            {loading ? (
              <div className="h-full flex items-center justify-center text-white/50">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={stats?.postsPerDay ?? []}
                  margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(245, 158, 11, 0.15)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="label"
                    stroke="rgba(255,255,255,0.5)"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="rgba(255,255,255,0.5)"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(0,0,0,0.9)",
                      border: "1px solid rgba(245, 158, 11, 0.3)",
                      borderRadius: "8px",
                    }}
                    labelStyle={{ color: "rgba(255,255,255,0.8)" }}
                    labelFormatter={(_, payload) =>
                      payload?.[0]?.payload?.label ?? ""
                    }
                    formatter={(value: number | undefined) => [
                      `${value ?? 0} post${(value ?? 0) !== 1 ? "s" : ""}`,
                      "Posts",
                    ]}
                  />
                  <Bar
                    dataKey="count"
                    fill="rgba(245, 158, 11, 0.6)"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>

        {/* Test Dispatcher (admin only when ADMIN_USER_IDS is set) */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="flex justify-end"
        >
          <button
            onClick={handleTestDispatch}
            disabled={dispatching}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-amber-500/30 text-amber-500/80 text-xs font-mono hover:bg-amber-500/10 disabled:opacity-50 transition-colors"
            title="Run Dispatcher (process due scheduled posts)"
          >
            {dispatching ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Play className="h-3.5 w-3.5" />
            )}
            Test Dispatcher
          </button>
        </motion.div>
      </section>

      <PostEditorPanel
        postId={editorPostId}
        open={editorOpen}
        onClose={() => {
          setEditorOpen(false);
          setEditorPostId(null);
        }}
        onOpenPost={(id) => setEditorPostId(id)}
        onSaved={refreshStats}
      />
    </div>
  );
}
