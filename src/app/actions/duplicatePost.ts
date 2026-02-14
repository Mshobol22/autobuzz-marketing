"use server";

import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

export type DuplicatePostResult =
  | { success: true; postId: string }
  | { success: false; error: string };

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function duplicatePost(postId: string): Promise<DuplicatePostResult> {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: "Not authenticated" };
  }

  const supabase = getSupabase();
  if (!supabase) {
    return { success: false, error: "Supabase is not configured" };
  }

  try {
    const { data: original, error: fetchError } = await supabase
      .from("posts")
      .select("content, image_url, platform")
      .eq("id", postId)
      .eq("user_id", userId)
      .single();

    if (fetchError || !original) {
      return { success: false, error: "Post not found" };
    }

    const { data: newPost, error: insertError } = await supabase
      .from("posts")
      .insert({
        user_id: userId,
        content: original.content,
        image_url: original.image_url,
        platform: original.platform,
        status: "draft",
        scheduled_for: null,
      })
      .select("id")
      .single();

    if (insertError) throw insertError;

    revalidatePath("/");
    revalidatePath("/schedule");
    revalidatePath("/(dashboard)");

    return { success: true, postId: newPost.id };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to duplicate post";
    return { success: false, error: message };
  }
}
