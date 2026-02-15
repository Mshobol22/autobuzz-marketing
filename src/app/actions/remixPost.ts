"use server";

import { generateText } from "ai";
import { groq } from "@ai-sdk/groq";
import { google } from "@ai-sdk/google";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { getPostById } from "@/app/actions/getPostById";
import { generateImage } from "@/app/actions/generateImage";

export type RemixPostResult =
  | { success: true; postId: string }
  | { success: false; error: string };

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

function normalizePlatformForPrompt(p: string | null): string {
  const s = (p ?? "").toLowerCase();
  if (s.includes("instagram") || s === "ig") return "Instagram";
  if (s.includes("linkedin") || s === "li") return "LinkedIn";
  if (s.includes("twitter") || s === "x") return "Twitter";
  if (s.includes("facebook") || s === "fb") return "Facebook";
  return p ?? "Unknown";
}

function buildRemixSystemPrompt(
  sourcePlatform: string,
  targetPlatform: string
): string {
  const base = `You are a social media expert. Rewrite the following ${sourcePlatform} post for ${targetPlatform}.`;

  const target = targetPlatform.toLowerCase();
  if (target.includes("instagram")) {
    return `${base}

If Target is Instagram: Make it visual, use emojis, add 15 relevant hashtags, and keep the caption under 200 words.`;
  }
  if (target.includes("linkedin")) {
    return `${base}

If Target is LinkedIn: Use a professional 'bro-etry' style with clean line breaks and a business lesson.`;
  }
  if (target.includes("twitter") || target.includes("x")) {
    return `${base}

If Target is Twitter: Condense the main point into a punchy <280 char hook or a 3-tweet thread format.`;
  }
  if (target.includes("facebook")) {
    return `${base}

If Target is Facebook: Use a conversational, engaging tone suitable for a broad audience.`;
  }
  return base;
}

export async function remixPost(
  originalPostId: string,
  targetPlatform: string
): Promise<RemixPostResult> {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: "Not authenticated" };
  }

  const groqKey = process.env.GROQ_API_KEY;
  const googleKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!groqKey && !googleKey) {
    return {
      success: false,
      error: "Add GROQ_API_KEY or GOOGLE_GENERATIVE_AI_API_KEY to .env.local",
    };
  }

  // Step A: Fetch original post
  const original = await getPostById(originalPostId);
  if (!original?.content?.trim()) {
    return { success: false, error: "Post not found or has no content" };
  }

  const sourcePlatform = normalizePlatformForPrompt(original.platform);
  const targetNorm = normalizePlatformForPrompt(targetPlatform);

  // Step B: AI Rewrite
  const systemPrompt = buildRemixSystemPrompt(sourcePlatform, targetNorm);
  const userPrompt = `Original ${sourcePlatform} post:\n\n${original.content.trim()}\n\nRewrite for ${targetNorm}. Output ONLY the rewritten post text, no JSON, no explanation.`;

  let rewrittenContent: string;
  try {
    const useGroq = !!groqKey;
    const result = useGroq
      ? await generateText({
          model: groq("llama-3.1-8b-instant"),
          system: systemPrompt,
          prompt: userPrompt,
        })
      : await generateText({
          model: google("gemini-2.0-flash"),
          system: systemPrompt,
          prompt: userPrompt,
        });
    rewrittenContent = result.text?.trim() ?? "";
  } catch (err) {
    const msg = err instanceof Error ? err.message : "AI rewrite failed";
    return { success: false, error: msg };
  }

  if (!rewrittenContent) {
    return { success: false, error: "AI returned empty content" };
  }

  // Step C: Image handling
  let imageUrl: string | null = original.image_url;

  const targetLower = targetPlatform.toLowerCase();
  if (targetLower.includes("instagram")) {
    const imgResult = await generateImage(rewrittenContent.slice(0, 500));
    imageUrl = imgResult.success ? imgResult.imageUrl : original.image_url;
  }

  // Step D: Save as new draft
  const supabase = getSupabase();
  if (!supabase) {
    return { success: false, error: "Database not configured" };
  }

  let scheduledFor: string | null = null;
  const origDate = original.scheduled_for
    ? new Date(original.scheduled_for)
    : original.created_at
      ? new Date(original.created_at)
      : new Date();
  const newDate = new Date(origDate.getTime() + 60 * 60 * 1000);
  scheduledFor = newDate.toISOString();

  const { data, error } = await supabase
    .from("posts")
    .insert({
      user_id: userId,
      content: rewrittenContent,
      image_url: imageUrl,
      platform: targetNorm,
      status: "draft",
      scheduled_for: scheduledFor,
    })
    .select("id")
    .single();

  if (error) {
    return {
      success: false,
      error: error.message ?? "Failed to save remixed post",
    };
  }

  return { success: true, postId: data.id };
}
