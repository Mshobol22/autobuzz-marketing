"use server";

import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import type { ScheduledPost } from "@/lib/types";

export async function getUpcomingScheduledPosts(
  limit = 2
): Promise<ScheduledPost[]> {
  const { userId } = await auth();
  if (!userId) return [];

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) return [];

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("posts")
    .select("id, content, platform, scheduled_for")
    .eq("user_id", userId)
    .eq("status", "scheduled")
    .gte("scheduled_for", now)
    .order("scheduled_for", { ascending: true })
    .limit(limit);

  if (error) return [];
  return (data ?? []) as ScheduledPost[];
}

/**
 * Fetch scheduled posts for a given month (start to end).
 * Used by the Calendar view to avoid loading entire history.
 */
export async function getScheduledPostsForMonth(
  year: number,
  month: number
): Promise<ScheduledPost[]> {
  const { userId } = await auth();
  if (!userId) return [];

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) return [];

  const startOfMonth = new Date(year, month, 1, 0, 0, 0, 0);
  const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999);

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { data, error } = await supabase
    .from("posts")
    .select("id, content, platform, scheduled_for")
    .eq("user_id", userId)
    .eq("status", "scheduled")
    .gte("scheduled_for", startOfMonth.toISOString())
    .lte("scheduled_for", endOfMonth.toISOString())
    .order("scheduled_for", { ascending: true });

  if (error) return [];
  return (data ?? []) as ScheduledPost[];
}
