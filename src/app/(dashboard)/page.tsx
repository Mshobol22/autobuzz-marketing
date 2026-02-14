"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { Sparkles, Loader2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { getUpcomingScheduledPosts } from "@/app/actions/getScheduledPosts";
import { format } from "date-fns";
import { formatScheduledDate } from "@/lib/dateUtils";
import { VelocityText } from "@/components/ui/VelocityText";
import { Magnetic } from "@/components/ui/Magnetic";
import { MaskRevealText } from "@/components/ui/MaskRevealText";

// Astrolabe / navigation dial image for Quick Generate
const ASTROLABE_IMAGE =
  "https://images.unsplash.com/photo-1590523278135-1e42c2393393?q=80&w=2500&auto=format&fit=crop";

const MOCK_ANALYTICS = [
  { label: "FOLLOWERS", value: "+400%", sub: "vs last month" },
  { label: "ENGAGEMENT", value: "+127%", sub: "vs last month" },
  { label: "REACH", value: "+89%", sub: "vs last month" },
];

export default function DashboardPage() {
  const { user } = useUser();
  const [scheduled, setScheduled] = useState<
    Awaited<ReturnType<typeof getUpcomingScheduledPosts>>
  >([]);
  const [loading, setLoading] = useState(true);

  const { scrollYProgress } = useScroll();
  const heroY = useTransform(scrollYProgress, [0, 0.3], [0, -80]);
  const imageY = useTransform(scrollYProgress, [0, 0.3], [0, -40]);
  const timelineOpacity = useTransform(scrollYProgress, [0.2, 0.4], [0, 1]);

  useEffect(() => {
    getUpcomingScheduledPosts(10).then((data) => {
      setScheduled(Array.isArray(data) ? data : []);
      setLoading(false);
    });
  }, []);

  const displayName = user?.firstName ?? user?.username ?? "USER";

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
                {/* Astrolabe image - scale + rotate on hover (navigation dial) */}
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-110 group-hover:rotate-6"
                  style={{ backgroundImage: `url(${ASTROLABE_IMAGE})` }}
                />
                {/* Black gradient overlay for legibility */}
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

      {/* Section 3: The Feed - Horizontal Timeline */}
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
              ) : scheduled.length > 0 ? (
                scheduled.map((post) => (
                  <div
                    key={post.id}
                    className="w-64 h-32 flex-shrink-0 border border-white/10 bg-white/5 flex flex-col justify-between p-4 hover:bg-white/10 transition-colors"
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
                  </div>
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
                    Schedule one →
                  </span>
                </Link>
              )}
            </div>
          </div>
        </motion.div>
      </section>

      {/* Section 4: Data - Brutalist Numbers (Mask Reveal cascade) */}
      <section className="py-32 px-6 md:px-12 space-y-16">
        {MOCK_ANALYTICS.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={{
              hidden: {},
              visible: {
                transition: { staggerChildren: 0.05, delayChildren: i * 0.08 },
              },
            }}
            className="w-full border-t border-b border-amber-500/20 py-12 flex flex-col md:flex-row md:items-end md:justify-between gap-4"
          >
            <motion.div
              variants={{ hidden: { y: "100%" }, visible: { y: 0 } }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden font-mono text-[10px] tracking-[0.4em] text-amber-500/60 uppercase"
            >
              {stat.label}
            </motion.div>
            <div className="flex flex-col gap-2">
              <motion.div
                variants={{ hidden: { y: "100%" }, visible: { y: 0 } }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="overflow-hidden text-6xl md:text-8xl lg:text-9xl font-bold text-amber-500 tracking-tighter font-serif"
              >
                {stat.value}
              </motion.div>
              <motion.div
                variants={{ hidden: { y: "100%" }, visible: { y: 0 } }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="overflow-hidden font-mono text-xs text-amber-500/50"
              >
                {stat.sub}
              </motion.div>
            </div>
          </motion.div>
        ))}
      </section>
    </div>
  );
}
