"use server";

import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import type { Post } from "@/lib/types";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function getPostById(postId: string): Promise<Post | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const supabase = getSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("posts")
    .select("id, content, image_url, platform, status, scheduled_for, created_at")
    .eq("id", postId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) return null;
  return data as Post;
}
