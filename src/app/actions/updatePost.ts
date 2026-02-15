"use server";

import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { parseISO, isValid } from "date-fns";

export type UpdatePostResult =
  | { success: true; postId: string }
  | { success: false; error: string };

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function updatePost(
  postId: string,
  updates: {
    content?: string | null;
    image_url?: string | null;
    scheduled_for?: string | null;
    ayrshare_post_id?: string | null;
    status?: string | null;
  }
): Promise<UpdatePostResult> {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: "Not authenticated" };
  }

  const supabase = getSupabase();
  if (!supabase) {
    return { success: false, error: "Supabase is not configured" };
  }

  try {
    const payload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (updates.content !== undefined) payload.content = updates.content;
    if (updates.image_url !== undefined) payload.image_url = updates.image_url;
    if (updates.scheduled_for !== undefined) {
      let utcIso: string | null = null;
      if (updates.scheduled_for && typeof updates.scheduled_for === "string") {
        const parsed = parseISO(updates.scheduled_for);
        if (isValid(parsed)) {
          utcIso = parsed.toISOString();
        }
      }
      payload.scheduled_for = utcIso;
      payload.status = utcIso ? "scheduled" : "draft";
    }
    if (updates.ayrshare_post_id !== undefined) payload.ayrshare_post_id = updates.ayrshare_post_id;
    if (updates.status !== undefined) payload.status = updates.status;

    const { error } = await supabase
      .from("posts")
      .update(payload)
      .eq("id", postId)
      .eq("user_id", userId);

    if (error) throw error;

    revalidatePath("/");
    revalidatePath("/schedule");
    revalidatePath("/(dashboard)");

    return { success: true, postId };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to update post";
    return { success: false, error: message };
  }
}
