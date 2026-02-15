"use server";

import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

export type GalleryImage = {
  imageUrl: string;
  postId: string;
  createdAt: string;
};

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

/**
 * Fetch distinct gallery images from posts (image_url IS NOT NULL).
 * Deduplicated by image_url, newest first.
 */
export async function getGalleryImages(): Promise<GalleryImage[]> {
  const { userId } = await auth();
  if (!userId) return [];

  const supabase = getSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("posts")
    .select("id, image_url, created_at")
    .eq("user_id", userId)
    .not("image_url", "is", null)
    .order("created_at", { ascending: false });

  if (error) return [];

  const seen = new Set<string>();
  const result: GalleryImage[] = [];

  for (const row of data ?? []) {
    const url = (row.image_url as string)?.trim();
    if (!url || !url.startsWith("http")) continue;
    if (seen.has(url)) continue;
    seen.add(url);
    result.push({
      imageUrl: url,
      postId: row.id,
      createdAt: row.created_at,
    });
  }

  return result;
}
