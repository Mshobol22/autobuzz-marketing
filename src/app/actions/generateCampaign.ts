"use server";

import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import { groq } from "@ai-sdk/groq";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { getKnowledgeAssetById } from "@/app/actions/knowledgeAssets";

export type GenerateCampaignResult =
  | { success: true; postIds: string[] }
  | { success: false; error: string };

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

const CAMPAIGN_PROMPT = `Read this knowledge asset:

---
{CONTENT}
---

Generate 5 distinct social media posts based on this asset. Use these frameworks (one per post):
1. Myth vs Fact - Debunk a common misconception
2. Behind the Scenes - Show how it works or the human side
3. Soft Sell / Benefit - Highlight a benefit without hard selling
4. Educational / How-to - Teach something useful
5. Provocative Question - Start with a thought-provoking question

Return ONLY a valid JSON array of exactly 5 objects, no markdown or explanation:
[
  {"content":"<post 1 text>","suggestedImagePrompt":"<image prompt 1>"},
  {"content":"<post 2 text>","suggestedImagePrompt":"<image prompt 2>"},
  {"content":"<post 3 text>","suggestedImagePrompt":"<image prompt 3>"},
  {"content":"<post 4 text>","suggestedImagePrompt":"<image prompt 4>"},
  {"content":"<post 5 text>","suggestedImagePrompt":"<image prompt 5>"}
]`;

export async function generateCampaign(
  assetId: string,
  scheduledDates: string[]
): Promise<GenerateCampaignResult> {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: "Not authenticated" };
  }

  const asset = await getKnowledgeAssetById(assetId);
  if (!asset || !asset.content?.trim()) {
    return { success: false, error: "Knowledge asset not found or empty" };
  }

  const groqKey = process.env.GROQ_API_KEY;
  const googleKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!groqKey && !googleKey) {
    return {
      success: false,
      error: "Missing API key. Add GROQ_API_KEY or GOOGLE_GENERATIVE_AI_API_KEY",
    };
  }

  const prompt = CAMPAIGN_PROMPT.replace("{CONTENT}", asset.content.trim());
  const useGroq = !!groqKey;

  let text = "";
  try {
    const result = useGroq
      ? await generateText({
          model: groq("llama-3.1-8b-instant"),
          prompt,
        })
      : await generateText({
          model: google("gemini-2.0-flash"),
          prompt,
          providerOptions: {
            google: {
              safetySettings: [
                { category: "HARM_CATEGORY_HARASSMENT" as const, threshold: "BLOCK_ONLY_HIGH" as const },
                { category: "HARM_CATEGORY_HATE_SPEECH" as const, threshold: "BLOCK_ONLY_HIGH" as const },
                { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT" as const, threshold: "BLOCK_ONLY_HIGH" as const },
                { category: "HARM_CATEGORY_DANGEROUS_CONTENT" as const, threshold: "BLOCK_ONLY_HIGH" as const },
                { category: "HARM_CATEGORY_CIVIC_INTEGRITY" as const, threshold: "BLOCK_ONLY_HIGH" as const },
              ],
            },
          },
        });
    text = result.text;
  } catch (err) {
    const msg = err instanceof Error ? err.message : "AI generation failed";
    return { success: false, error: msg };
  }

  const jsonMatch = text.match(/\[[\s\S]*\]/);
  const jsonStr = jsonMatch ? jsonMatch[0] : text;
  let posts: Array<{ content?: string; suggestedImagePrompt?: string }>;
  try {
    posts = JSON.parse(jsonStr);
  } catch {
    return { success: false, error: "Failed to parse AI response as JSON" };
  }

  if (!Array.isArray(posts) || posts.length < 5) {
    return { success: false, error: "AI did not return 5 posts" };
  }

  const supabase = getSupabase();
  if (!supabase) {
    return { success: false, error: "Supabase is not configured" };
  }

  const postIds: string[] = [];

  for (let i = 0; i < 5; i++) {
    const post = posts[i];
    const content = (post?.content ?? "").trim() || `Campaign post ${i + 1}`;
    const scheduledForIso = scheduledDates[i];

    const { data, error } = await supabase
      .from("posts")
      .insert({
        user_id: userId,
        content,
        image_url: null,
        platform: "Twitter",
        status: "draft",
        scheduled_for: scheduledForIso ?? null,
      })
      .select("id")
      .single();

    if (error) {
      return {
        success: false,
        error: `Failed to save post ${i + 1}: ${error.message}`,
      };
    }
    postIds.push(data.id);
  }

  return { success: true, postIds };
}
