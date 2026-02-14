"use server";

import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

export type DashboardStats = {
  publishedCount: number;
  scheduledCount: number;
  upcomingPosts: Array<{
    id: string;
    content: string | null;
    platform: string | null;
    scheduled_for: string | null;
  }>;
  generationsToday: number;
  recentTopics: Array<{
    id: string;
    content: string | null;
    created_at: string;
  }>;
  postsPerDay: Array<{ date: string; count: number; label: string }>;
};

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const { userId } = await auth();
  const empty: DashboardStats = {
    publishedCount: 0,
    scheduledCount: 0,
    upcomingPosts: [],
    generationsToday: 0,
    recentTopics: [],
    postsPerDay: [],
  };

  if (!userId) return empty;

  const supabase = getSupabase();
  if (!supabase) return empty;

  const now = new Date();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Query 1: Post volume (published vs scheduled)
  const [publishedRes, scheduledRes] = await Promise.all([
    supabase
      .from("posts")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "published"),
    supabase
      .from("posts")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "scheduled"),
  ]);

  const publishedCount = publishedRes.count ?? 0;
  const scheduledCount = scheduledRes.count ?? 0;

  // Query 2: Next 3 scheduled posts
  const { data: upcoming } = await supabase
    .from("posts")
    .select("id, content, platform, scheduled_for")
    .eq("user_id", userId)
    .eq("status", "scheduled")
    .gte("scheduled_for", now.toISOString())
    .order("scheduled_for", { ascending: true })
    .limit(3);

  // Query 3: Generations today (posts created in last 24h)
  const { count: generationsToday } = await supabase
    .from("posts")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", twentyFourHoursAgo.toISOString());

  // Recent topics: last 3 posts by created_at
  const { data: recent } = await supabase
    .from("posts")
    .select("id, content, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(3);

  // Posts per day: fetch last 7 days of posts and group
  const { data: lastWeekPosts } = await supabase
    .from("posts")
    .select("created_at")
    .eq("user_id", userId)
    .gte("created_at", sevenDaysAgo.toISOString());

  const dayCounts = new Map<string, number>();
  for (let i = 0; i < 7; i++) {
    const d = new Date(sevenDaysAgo.getTime() + i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().slice(0, 10);
    dayCounts.set(key, 0);
  }

  for (const p of lastWeekPosts ?? []) {
    const key = (p.created_at as string).slice(0, 10);
    if (dayCounts.has(key)) {
      dayCounts.set(key, (dayCounts.get(key) ?? 0) + 1);
    }
  }

  const postsPerDay = Array.from(dayCounts.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({
      date,
      count,
      label: new Date(date + "T12:00:00").toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
    }));

  return {
    publishedCount,
    scheduledCount,
    upcomingPosts: (upcoming ?? []) as DashboardStats["upcomingPosts"],
    generationsToday: generationsToday ?? 0,
    recentTopics: (recent ?? []).map((r) => ({
      id: r.id,
      content: r.content,
      created_at: r.created_at,
    })),
    postsPerDay,
  };
}
