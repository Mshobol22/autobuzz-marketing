"use server";

import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

export type ScheduledPost = {
  id: string;
  content: string | null;
  platform: string | null;
  scheduled_for: string | null;
};

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
