/**
 * Shared logic for dispatching scheduled posts to Ayrshare.
 * Used by both the cron API route and the Test Dispatcher button.
 */

import { createClient } from "@supabase/supabase-js";
import { getAyrshareProfileKeyForUser } from "@/app/actions/getAyrshareToken";

const AYRSHARE_API_URL = "https://api.ayrshare.com/api/post";

const PLATFORM_MAP: Record<string, string> = {
  Twitter: "twitter",
  LinkedIn: "linkedin",
  Instagram: "instagram",
  Facebook: "facebook",
  facebook: "facebook",
};

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

async function publishToAyrshare(
  content: string,
  platform: string,
  profileKey: string,
  imageUrl?: string | null
): Promise<{ success: boolean; error?: string }> {
  const apiKey = process.env.AYRSHARE_API_KEY;
  if (!apiKey) {
    return { success: false, error: "AYRSHARE_API_KEY not configured" };
  }

  const ayrsharePlatform = PLATFORM_MAP[platform] ?? platform.toLowerCase();

  const body: Record<string, unknown> = {
    post: content,
    platforms: [ayrsharePlatform],
  };
  if (imageUrl?.trim() && imageUrl.startsWith("https://")) {
    body.mediaUrls = [imageUrl.trim()];
  }

  try {
    const res = await fetch(AYRSHARE_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "Profile-Key": profileKey,
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!res.ok) {
      const message =
        data?.message ?? data?.error ?? `Request failed (${res.status})`;
      return { success: false, error: message };
    }

    if (data?.status === "success") {
      return { success: true };
    }

    const errors = data?.errors ?? [];
    const errorMsg =
      Array.isArray(errors) && errors.length > 0
        ? errors.map((e: { message?: string }) => e.message ?? e).join(", ")
        : "Post failed";

    return { success: false, error: errorMsg };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Failed to publish";
    return { success: false, error: errorMsg };
  }
}

export type DispatchResult = {
  posts_processed: number;
  errors: Array<{ postId: string; error: string }>;
};

export async function dispatchScheduledPosts(): Promise<DispatchResult> {
  const supabase = getSupabase();
  const result: DispatchResult = { posts_processed: 0, errors: [] };

  if (!supabase) {
    result.errors.push({ postId: "", error: "Supabase not configured" });
    return result;
  }

  const now = new Date().toISOString();

  const { data: posts, error: fetchError } = await supabase
    .from("posts")
    .select("id, content, platform, image_url, user_id")
    .eq("status", "scheduled")
    .lte("scheduled_for", now);

  if (fetchError) {
    result.errors.push({ postId: "", error: fetchError.message });
    return result;
  }

  if (!posts || posts.length === 0) {
    return result;
  }

  for (const post of posts) {
    if (!post.content || !post.platform) {
      await supabase
        .from("posts")
        .update({
          status: "failed",
          error_message: "Missing content or platform",
          updated_at: now,
        })
        .eq("id", post.id);
      result.errors.push({ postId: post.id, error: "Missing content or platform" });
      result.posts_processed++;
      continue;
    }

    const profileKey = post.user_id
      ? await getAyrshareProfileKeyForUser(post.user_id)
      : null;
    if (!profileKey) {
      await supabase
        .from("posts")
        .update({
          status: "failed",
          error_message: "User has not connected social accounts",
          updated_at: now,
        })
        .eq("id", post.id);
      result.errors.push({
        postId: post.id,
        error: "User has not connected social accounts",
      });
      result.posts_processed++;
      continue;
    }

    const publishResult = await publishToAyrshare(
      post.content,
      post.platform,
      profileKey,
      post.image_url
    );

    if (publishResult.success) {
      await supabase
        .from("posts")
        .update({
          status: "published",
          posted_at: now,
          error_message: null,
          updated_at: now,
        })
        .eq("id", post.id);
      result.posts_processed++;
    } else {
      await supabase
        .from("posts")
        .update({
          status: "failed",
          error_message: publishResult.error ?? "Unknown error",
          updated_at: now,
        })
        .eq("id", post.id);
      result.errors.push({
        postId: post.id,
        error: publishResult.error ?? "Unknown error",
      });
      result.posts_processed++;
    }
  }

  return result;
}
