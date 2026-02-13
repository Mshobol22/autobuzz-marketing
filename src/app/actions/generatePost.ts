"use server";

import { streamText } from "ai";
import { google } from "@ai-sdk/google";
import { createStreamableValue } from "@ai-sdk/rsc";
import { auth } from "@clerk/nextjs/server";
import { getBrandSettings } from "@/lib/supabase/server";

function buildPrompt(
  topic: string,
  platform: string,
  brandSettings: Record<string, unknown> | null
): string {
  const brandContext = brandSettings
    ? `
CRITICAL - Match this brand's tone and voice exactly:
${JSON.stringify(brandSettings, null, 2)}
`
    : "";

  return `You are a social media copywriter. Generate a compelling post for the given topic and platform.

Topic: ${topic}
Platform: ${platform}
${brandContext}
${brandSettings ? "Write in the brand's tone and voice. Follow any guidelines provided." : ""}

Return ONLY the post text, no explanations or meta commentary. Adapt length and format for ${platform} (e.g., Twitter/X: concise, LinkedIn: professional, Instagram: engaging).`;
}

export async function generatePost(topic: string, platform: string) {
  const stream = createStreamableValue("");

  (async () => {
    try {
      const { userId } = await auth();
      const brandSettings = userId ? await getBrandSettings(userId) : null;

      const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
      if (!apiKey) {
        stream.error(new Error("Missing GOOGLE_GENERATIVE_AI_API_KEY"));
        return;
      }

      const { textStream } = streamText({
        model: google("gemini-2.0-flash"),
        prompt: buildPrompt(topic, platform, brandSettings),
      });

      let fullText = "";
      for await (const chunk of textStream) {
        fullText += chunk;
        stream.update(fullText);
      }

      stream.done();
    } catch (err) {
      stream.error(err instanceof Error ? err : new Error("Generation failed"));
    }
  })();

  return { value: stream.value };
}
