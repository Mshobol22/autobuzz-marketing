"use server";

import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import type { SchedulePostResult } from "@/lib/types";

/** Backend-only Supabase client using service role key (bypasses RLS) */
function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

/** Schedule an existing draft post for a future date (Schedule page) */
export async function scheduleDraftPost(
  postId: string,
  scheduledFor: Date
): Promise<SchedulePostResult> {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: "Not authenticated" };
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return { success: false, error: "Supabase is not configured" };
  }

  try {
    const { error } = await supabase
      .from("posts")
      .update({
        status: "scheduled",
        scheduled_for: scheduledFor.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", postId)
      .eq("user_id", userId);

    if (error) throw error;
    return { success: true, postId };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to schedule post";
    return { success: false, error: message };
  }
}

/** Create a new scheduled post from Generator (inserts row with status: 'scheduled') */
export async function schedulePost({
  content,
  image,
  date,
  platform,
}: {
  content: string;
  image?: string | null;
  date: Date;
  platform: string;
}): Promise<SchedulePostResult> {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: "Not authenticated" };
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return { success: false, error: "Supabase is not configured" };
  }

  try {
    const { data, error } = await supabase
      .from("posts")
      .insert({
        user_id: userId,
        content,
        image_url: image ?? null,
        platform,
        status: "scheduled",
        scheduled_for: date.toISOString(),
      })
      .select("id")
      .single();

    if (error) throw error;
    return { success: true, postId: data.id };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to schedule post";
    return { success: false, error: message };
  }
}
