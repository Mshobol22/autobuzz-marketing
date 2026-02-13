"use client";

import { motion } from "framer-motion";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import { TrendingUp, MousePointer, Eye, Percent } from "lucide-react";

const followerData = Array.from({ length: 30 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() - (29 - i));
  return {
    date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    followers: 1200 + Math.floor(Math.random() * 200) + i * 15,
  };
});

const metricCards = [
  {
    title: "Impressions",
    value: "24.8K",
    change: "+12%",
    icon: Eye,
    trend: "up",
  },
  {
    title: "Clicks",
    value: "1,842",
    change: "+8%",
    icon: MousePointer,
    trend: "up",
  },
  {
    title: "Conversion Rate",
    value: "3.2%",
    change: "+0.4%",
    icon: Percent,
    trend: "up",
  },
];

export default function AnalyticsPage() {
  return (
    <div className="p-6 lg:p-8">
      <motion.h1
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-bold text-zinc-100"
      >
        Analytics
      </motion.h1>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="mt-1 text-zinc-400 mb-8"
      >
        Track performance and growth.
      </motion.p>

      <div className="space-y-6">
        {/* Follower Growth Chart */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-white/10 bg-zinc-900/50 backdrop-blur-md p-6"
        >
          <h2 className="text-lg font-semibold text-zinc-100 mb-6 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-zinc-400" />
            Follower Growth (Last 30 Days)
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={followerData}>
                <defs>
                  <linearGradient
                    id="colorFollowers"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor="#71717a"
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="95%"
                      stopColor="#71717a"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#3f3f46"
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
                  stroke="#71717a"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#71717a"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${(v / 1000).toFixed(1)}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#27272a",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "12px",
                  }}
                  labelStyle={{ color: "#a1a1aa" }}
                  formatter={(value) => [
                    (value ?? 0).toLocaleString(),
                    "Followers",
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="followers"
                  stroke="#a1a1aa"
                  strokeWidth={2}
                  fill="url(#colorFollowers)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Metric Cards */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          {metricCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.title}
                className="rounded-2xl border border-white/10 bg-zinc-900/50 backdrop-blur-md p-6"
              >
                <div className="flex items-start justify-between">
                  <div className="p-2.5 rounded-xl bg-zinc-600/40 border border-white/10">
                    <Icon className="h-5 w-5 text-zinc-300" />
                  </div>
                  <span className="flex items-center gap-1 text-xs font-medium text-emerald-400">
                    <TrendingUp className="h-3.5 w-3.5" />
                    {card.change}
                  </span>
                </div>
                <p className="text-2xl font-bold text-zinc-100 mt-4">
                  {card.value}
                </p>
                <p className="text-sm text-zinc-500 mt-1">{card.title}</p>
              </div>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
}
