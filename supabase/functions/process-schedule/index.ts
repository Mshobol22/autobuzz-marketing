// Supabase Edge Function: Process scheduled posts
// Queries posts where status='scheduled' and scheduled_for <= now()
// Publishes each via Ayrshare, then updates status to 'published'

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const AYRSHARE_API_URL = "https://app.ayrshare.com/api/post";

const PLATFORM_MAP: Record<string, string> = {
  Twitter: "twitter",
  LinkedIn: "linkedin",
  Instagram: "instagram",
  Facebook: "facebook",
};

async function publishToAyrshare(
  content: string,
  platform: string,
  apiKey: string
): Promise<{ success: boolean; error?: string }> {
  const ayrsharePlatform = PLATFORM_MAP[platform] ?? platform.toLowerCase();

  try {
    const res = await fetch(AYRSHARE_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        post: content,
        platforms: [ayrsharePlatform],
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      const message =
        data?.message ?? data?.error ?? `Request failed (${res.status})`;
      console.error("[process-schedule] Ayrshare HTTP error:", message);
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
    console.error("[process-schedule] Ayrshare API error:", errorMsg);
    return { success: false, error: errorMsg };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Failed to publish";
    console.error("[process-schedule] Ayrshare request failed:", errorMsg);
    return { success: false, error: errorMsg };
  }
}

Deno.serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const ayrshareApiKey = Deno.env.get("AYRSHARE_API_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: "Supabase environment not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!ayrshareApiKey) {
      return new Response(
        JSON.stringify({ error: "AYRSHARE_API_KEY not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const now = new Date().toISOString();

    const { data: posts, error: fetchError } = await supabase
      .from("posts")
      .select("id, content, platform")
      .eq("status", "scheduled")
      .lte("scheduled_for", now);

    if (fetchError) {
      return new Response(
        JSON.stringify({ error: fetchError.message }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!posts || posts.length === 0) {
      return new Response(
        JSON.stringify({
          message: "No scheduled posts to process",
          processed: 0,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    const results: { id: string; success: boolean; error?: string }[] = [];

    for (const post of posts) {
      if (!post.content || !post.platform) {
        await supabase
          .from("posts")
          .update({ status: "failed", updated_at: now })
          .eq("id", post.id);
        results.push({
          id: post.id,
          success: false,
          error: "Missing content or platform",
        });
        continue;
      }

      const publishResult = await publishToAyrshare(
        post.content,
        post.platform,
        ayrshareApiKey
      );

      if (publishResult.success) {
        await supabase
          .from("posts")
          .update({ status: "published", updated_at: now })
          .eq("id", post.id);
        results.push({ id: post.id, success: true });
      } else {
        console.error(
          `[process-schedule] Post ${post.id} failed:`,
          publishResult.error
        );
        await supabase
          .from("posts")
          .update({ status: "failed", updated_at: now })
          .eq("id", post.id);
        results.push({
          id: post.id,
          success: false,
          error: publishResult.error,
        });
      }
    }

    return new Response(
      JSON.stringify({
        message: `Processed ${posts.length} scheduled post(s)`,
        processed: posts.length,
        results,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
