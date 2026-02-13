"use server";

import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

export type SchedulePostResult =
  | { success: true }
  | { success: false; error: string };

export async function schedulePost(
  postId: string,
  scheduledFor: Date
): Promise<SchedulePostResult> {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: "Not authenticated" };
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return { success: false, error: "Supabase is not configured" };
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
    return { success: true };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to schedule post";
    return { success: false, error: message };
  }
}
