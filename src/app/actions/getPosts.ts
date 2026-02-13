"use server";

import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

export type Post = {
  id: string;
  content: string | null;
  image_url: string | null;
  platform: string | null;
  status: string | null;
  scheduled_for: string | null;
  created_at: string;
};

export async function getDraftPosts(): Promise<Post[]> {
  const { userId } = await auth();
  if (!userId) return [];

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) return [];

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { data, error } = await supabase
    .from("posts")
    .select("id, content, image_url, platform, status, scheduled_for, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) return [];
  return (data ?? []) as Post[];
}
