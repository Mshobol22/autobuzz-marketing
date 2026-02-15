"use server";

import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { getAyrshareProfileKeyForUser } from "@/app/actions/getAyrshareToken";

const AYRSHARE_ANALYTICS_URL = "https://api.ayrshare.com/api/analytics/post";

export type PostAnalyticsSummary = {
  totalImpressions: number;
  totalEngagement: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  topPlatform: string;
  viralityScore: number; // engagement rate
  engagementOverTime: Array<{ date: string; engagement: number }>;
  topPosts: Array<{
    postId: string;
    content: string;
    platform: string;
    engagement: number;
    impressions: number;
    postedAt: string;
  }>;
};

type Range = "last_7_days" | "last_30_days" | "last_90_days";

function getDateRange(range: Range): { start: Date; end: Date } {
  const end = new Date();
  const start = new Date();
  if (range === "last_7_days") start.setDate(start.getDate() - 7);
  else if (range === "last_30_days") start.setDate(start.getDate() - 30);
  else start.setDate(start.getDate() - 90);
  return { start, end };
}

function extractMetrics(platformData: Record<string, unknown>): {
  likes: number;
  comments: number;
  shares: number;
  impressions: number;
} {
  const analytics = (platformData.analytics as Record<string, unknown>) ?? {};
  const a = analytics as Record<string, number | undefined>;

  const likes =
    a.likeCount ??
    a.likesCount ??
    (a.reactions && typeof a.reactions === "object" && "total" in a.reactions
      ? (a.reactions as { total?: number }).total ?? 0
      : 0) ??
    0;

  const comments =
    a.commentsCount ??
    a.commentCount ??
    a.totalFirstLevelComments ??
    0;

  const shares =
    a.sharesCount ??
    a.shareCount ??
    a.repostCount ??
    0;

  const impressions =
    a.impressionCount ??
    a.impressionsUnique ??
    a.reachCount ??
    a.viewsCount ??
    0;

  return { likes, comments, shares, impressions };
}

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function getPostAnalytics(
  range: Range = "last_30_days"
): Promise<PostAnalyticsSummary | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const apiKey = process.env.AYRSHARE_API_KEY;
  const supabase = getSupabase();
  if (!apiKey || !supabase) return null;

  const { start, end } = getDateRange(range);
  const startIso = start.toISOString();
  const endIso = end.toISOString();

  const { data: rawPosts, error } = await supabase
    .from("posts")
    .select("id, content, platform, ayrshare_post_id, posted_at, created_at")
    .eq("user_id", userId)
    .eq("status", "published")
    .not("ayrshare_post_id", "is", null)
    .order("posted_at", { ascending: true });

  const posts = (rawPosts ?? []).filter((p) => {
    const dt = (p.posted_at ?? p.created_at) as string | undefined;
    if (!dt) return false;
    return dt >= startIso && dt <= endIso;
  });

  if (error || !posts?.length) {
    return {
      totalImpressions: 0,
      totalEngagement: 0,
      totalLikes: 0,
      totalComments: 0,
      totalShares: 0,
      topPlatform: "—",
      viralityScore: 0,
      engagementOverTime: [],
      topPosts: [],
    };
  }

  const profileKey = await getAyrshareProfileKeyForUser(userId);
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
  };
  if (profileKey) headers["Profile-Key"] = profileKey;

  const postMetrics: Array<{
    postId: string;
    content: string;
    platform: string;
    likes: number;
    comments: number;
    shares: number;
    impressions: number;
    postedAt: string;
  }> = [];

  for (const post of posts) {
    const aid = post.ayrshare_post_id as string;
    if (!aid) continue;

    try {
      const res = await fetch(AYRSHARE_ANALYTICS_URL, {
        method: "POST",
        headers,
        body: JSON.stringify({ id: aid }),
      });
      const data = (await res.json()) as Record<string, Record<string, unknown>>;

      let totalLikes = 0;
      let totalComments = 0;
      let totalShares = 0;
      let totalImpressions = 0;

      for (const platformKey of Object.keys(data)) {
        if (platformKey === "status" || platformKey === "id") continue;
        const p = data[platformKey];
        if (!p || typeof p !== "object") continue;
        const m = extractMetrics(p);
        totalLikes += m.likes;
        totalComments += m.comments;
        totalShares += m.shares;
        totalImpressions += m.impressions;
      }

      postMetrics.push({
        postId: post.id,
        content: (post.content ?? "").slice(0, 80),
        platform: post.platform ?? "—",
        likes: totalLikes,
        comments: totalComments,
        shares: totalShares,
        impressions: totalImpressions,
        postedAt: post.posted_at ?? "",
      });
    } catch {
      // Skip failed fetches
    }
  }

  const totalLikes = postMetrics.reduce((s, p) => s + p.likes, 0);
  const totalComments = postMetrics.reduce((s, p) => s + p.comments, 0);
  const totalShares = postMetrics.reduce((s, p) => s + p.shares, 0);
  const totalImpressions = postMetrics.reduce((s, p) => s + p.impressions, 0);
  const totalEngagement = totalLikes + totalComments + totalShares;

  const platformCounts: Record<string, number> = {};
  for (const p of postMetrics) {
    const plat = (p.platform ?? "").toLowerCase() || "other";
    const engagement = p.likes + p.comments + p.shares;
    platformCounts[plat] = (platformCounts[plat] ?? 0) + engagement;
  }
  const topPlatform =
    Object.entries(platformCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";
  const topPlatformLabel =
    topPlatform === "linkedin"
      ? "LinkedIn"
      : topPlatform === "instagram"
        ? "Instagram"
        : topPlatform === "twitter"
          ? "Twitter"
          : topPlatform;

  const viralityScore =
    totalImpressions > 0
      ? Math.round((totalEngagement / totalImpressions) * 10000) / 100
      : 0;

  const byDate = new Map<string, number>();
  for (const p of postMetrics) {
    const d = p.postedAt.slice(0, 10);
    byDate.set(d, (byDate.get(d) ?? 0) + p.likes + p.comments + p.shares);
  }
  const engagementOverTime = Array.from(byDate.entries())
    .map(([date, engagement]) => ({ date, engagement }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const topPosts = [...postMetrics]
    .sort((a, b) => {
      const ea = a.likes + a.comments + a.shares;
      const eb = b.likes + b.comments + b.shares;
      return eb - ea;
    })
    .slice(0, 3)
    .map((p) => ({
      postId: p.postId,
      content: p.content,
      platform: p.platform,
      engagement: p.likes + p.comments + p.shares,
      impressions: p.impressions,
      postedAt: p.postedAt,
    }));

  return {
    totalImpressions,
    totalEngagement,
    totalLikes,
    totalComments,
    totalShares,
    topPlatform: topPlatformLabel,
    viralityScore,
    engagementOverTime,
    topPosts,
  };
}
