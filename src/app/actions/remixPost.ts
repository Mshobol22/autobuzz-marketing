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

export type RemixPostOptions = {
  isHallOfFame?: boolean;
  sourceContent?: string;
  sourcePlatform?: string;
};

function buildRemixSystemPrompt(
  sourcePlatform: string,
  targetPlatform: string,
  isHallOfFame?: boolean
): string {
  if (isHallOfFame) {
    return `You are a social media expert. This content was a high-performing hit. Deconstruct WHY it worked (hook, tone, structure) and generate 3 NEW variations on the same topic that keep the core psychological trigger but change the angle.

Output format: Provide exactly 3 variations, each separated by a line containing only "---". Each variation should be a complete, ready-to-post ${targetPlatform} post. No JSON, no numbering, no explanation—just the 3 post texts.`;
  }

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
  targetPlatform: string,
  options?: RemixPostOptions
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

  const isHallOfFame = options?.isHallOfFame ?? false;
  const sourceContentOverride = options?.sourceContent?.trim();
  const sourcePlatformOverride = options?.sourcePlatform;

  // Step A: Get source content (fetch or use override)
  let sourceContent: string;
  let sourcePlatform: string;
  let imageUrl: string | null = null;
  let baseDate = new Date();

  if (sourceContentOverride) {
    sourceContent = sourceContentOverride;
    sourcePlatform = normalizePlatformForPrompt(sourcePlatformOverride ?? null);
  } else {
    const original = await getPostById(originalPostId);
    if (!original?.content?.trim()) {
      return { success: false, error: "Post not found or has no content" };
    }
    sourceContent = original.content.trim();
    sourcePlatform = normalizePlatformForPrompt(original.platform);
    imageUrl = original.image_url;
    if (original.scheduled_for || original.created_at) {
      baseDate = new Date(original.scheduled_for ?? original.created_at!);
    }
  }

  const targetNorm = normalizePlatformForPrompt(targetPlatform);

  // Step B: AI Rewrite
  const systemPrompt = buildRemixSystemPrompt(
    sourcePlatform,
    targetNorm,
    isHallOfFame
  );
  const userPrompt = isHallOfFame
    ? `High-performing ${sourcePlatform} post:\n\n${sourceContent}\n\nGenerate 3 variations.`
    : `Original ${sourcePlatform} post:\n\n${sourceContent}\n\nRewrite for ${targetNorm}. Output ONLY the rewritten post text, no JSON, no explanation.`;

  let rawOutput: string;
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
    rawOutput = result.text?.trim() ?? "";
  } catch (err) {
    const msg = err instanceof Error ? err.message : "AI rewrite failed";
    return { success: false, error: msg };
  }

  const variations = isHallOfFame
    ? rawOutput.split(/\n---\n/).map((s) => s.trim()).filter(Boolean)
    : [rawOutput];

  const firstContent = variations[0];
  if (!firstContent) {
    return { success: false, error: "AI returned empty content" };
  }

  // Step C: Image handling for first variation
  const targetLower = targetPlatform.toLowerCase();
  if (targetLower.includes("instagram")) {
    const imgResult = await generateImage(firstContent.slice(0, 500));
    imageUrl = imgResult.success ? imgResult.imageUrl : imageUrl;
  }

  // Step D: Save as new draft(s)
  const supabase = getSupabase();
  if (!supabase) {
    return { success: false, error: "Database not configured" };
  }

  let firstPostId: string | null = null;
  for (let i = 0; i < variations.length; i++) {
    const content = variations[i];
    if (!content) continue;

    const scheduledFor = new Date(baseDate.getTime() + (i + 1) * 60 * 60 * 1000).toISOString();
    const { data, error } = await supabase
      .from("posts")
      .insert({
        user_id: userId,
        content,
        image_url: i === 0 ? imageUrl : null,
        platform: targetNorm,
        status: "draft",
        scheduled_for: scheduledFor,
      })
      .select("id")
      .single();

    if (!error && data) {
      if (i === 0) firstPostId = data.id;
    }
  }

  if (!firstPostId) {
    return {
      success: false,
      error: "Failed to save remixed post",
    };
  }

  return { success: true, postId: firstPostId };
}
