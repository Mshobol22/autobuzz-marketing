"use server";

import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import type { SavePostResult } from "@/lib/types";

/** Backend-only Supabase client using service role key (bypasses RLS) */
function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function savePostDraft(
  postId: string | null,
  content: string,
  platform?: string,
  imageUrl?: string | null
): Promise<SavePostResult> {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: "Not authenticated" };
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return { success: false, error: "Supabase is not configured" };
  }

  try {
    const payload = {
      content,
      platform: platform ?? null,
      image_url: imageUrl ?? null,
      status: "draft",
      updated_at: new Date().toISOString(),
    };

    if (postId) {
      const { error } = await supabase
        .from("posts")
        .update(payload)
        .eq("id", postId)
        .eq("user_id", userId);

      if (error) throw error;
      return { success: true, postId };
    } else {
      const { data, error } = await supabase
        .from("posts")
        .insert({
          user_id: userId,
          ...payload,
        })
        .select("id")
        .single();

      if (error) throw error;
      return { success: true, postId: data.id };
    }
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to save draft";
    return { success: false, error: message };
  }
}

export async function savePostImage(
  postId: string | null,
  content: string,
  imageUrl: string,
  platform?: string
): Promise<SavePostResult> {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: "Not authenticated" };
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return { success: false, error: "Supabase is not configured" };
  }

  try {
    if (postId) {
      const { error } = await supabase
        .from("posts")
        .update({
          content,
          image_url: imageUrl,
          platform: platform ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", postId)
        .eq("user_id", userId);

      if (error) throw error;
      return { success: true, postId };
    } else {
      const { data, error } = await supabase
        .from("posts")
        .insert({
          user_id: userId,
          content,
          image_url: imageUrl,
          platform: platform ?? null,
          status: "draft",
        })
        .select("id")
        .single();

      if (error) throw error;
      return { success: true, postId: data.id };
    }
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to save post";
    return { success: false, error: message };
  }
}
