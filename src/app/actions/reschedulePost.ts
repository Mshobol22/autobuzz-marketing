"use server";

import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

export type ReschedulePostResult =
  | { success: true }
  | { success: false; error: string };

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function reschedulePost(
  postId: string,
  newDate: Date
): Promise<ReschedulePostResult> {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: "Not authenticated" };
  }

  const supabase = getSupabase();
  if (!supabase) {
    return { success: false, error: "Supabase is not configured" };
  }

  try {
    const { error } = await supabase
      .from("posts")
      .update({
        scheduled_for: newDate.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", postId)
      .eq("user_id", userId);

    if (error) throw error;
    return { success: true };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to reschedule post";
    return { success: false, error: message };
  }
}
