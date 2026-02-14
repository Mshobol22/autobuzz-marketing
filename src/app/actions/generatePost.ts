"use server";

import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import { auth } from "@clerk/nextjs/server";
import { getBrandSettingsForUser } from "@/app/actions/brandSettings";
import type { GeneratePostResult } from "@/lib/types";

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

const SAFETY_SETTINGS = [
  { category: "HARM_CATEGORY_HARASSMENT" as const, threshold: "BLOCK_ONLY_HIGH" as const },
  { category: "HARM_CATEGORY_HATE_SPEECH" as const, threshold: "BLOCK_ONLY_HIGH" as const },
  { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT" as const, threshold: "BLOCK_ONLY_HIGH" as const },
  { category: "HARM_CATEGORY_DANGEROUS_CONTENT" as const, threshold: "BLOCK_ONLY_HIGH" as const },
  { category: "HARM_CATEGORY_CIVIC_INTEGRITY" as const, threshold: "BLOCK_ONLY_HIGH" as const },
];

function is429Error(err: unknown): boolean {
  if (err && typeof err === "object") {
    const status = (err as { status?: number }).status;
    const statusCode = (err as { statusCode?: number }).statusCode;
    const message = String((err as { message?: string }).message ?? "");
    return status === 429 || statusCode === 429 || message.includes("429") || message.toLowerCase().includes("quota") || message.toLowerCase().includes("rate limit");
  }
  return false;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const FALLBACK = {
  company_name: "Generic Professional",
  tone_of_voice: "Professional, clear, and engaging",
  target_audience: "General business audience",
};

function buildPrompt(
  topic: string,
  platform: string,
  companyName: string,
  tone: string,
  audience: string,
  vibeOverride?: string
): string {
  const vibeLine = vibeOverride?.trim()
    ? `\nVibe override: ${vibeOverride.trim()}`
    : "";
  return `You are the social media manager for ${companyName}. Target Audience: ${audience}. Tone: ${tone}.${vibeLine}

Write a ${platform} post about: ${topic}.

Constraints:
- Use short, punchy paragraphs.
- Include 3 relevant hashtags.
- NO introductory text (e.g., "Here is your post"). Just the content.

Respond with ONLY a valid JSON object in this exact format, no markdown or explanation:
{"content":"<the post text>","suggestedImagePrompt":"<a detailed image generation prompt for Replicate/FLUX that visually complements this post>"}`;
}

export async function generatePost(
  topic: string,
  platform: string,
  vibeOverride?: string
): Promise<GeneratePostResult> {
  try {
    const { userId } = await auth();

    // 1. Fetch brand context from Supabase
    let companyName = FALLBACK.company_name;
    let tone = FALLBACK.tone_of_voice;
    let audience = FALLBACK.target_audience;

    if (userId) {
      const settings = await getBrandSettingsForUser();
      companyName = settings.company_name || FALLBACK.company_name;
      tone = settings.tone_of_voice || FALLBACK.tone_of_voice;
      audience = settings.target_audience || FALLBACK.target_audience;
    }

    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) {
      return {
        success: false,
        error: "Missing GOOGLE_GENERATIVE_AI_API_KEY",
      };
    }

    const prompt = buildPrompt(
      topic,
      platform,
      companyName,
      tone,
      audience,
      vibeOverride
    );

    let text = "";
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const result = await generateText({
          model: google("gemini-1.5-flash"),
          prompt,
          providerOptions: {
            google: {
              safetySettings: SAFETY_SETTINGS,
            },
          },
        });
        text = result.text;
        break;
      } catch (err) {
        if (is429Error(err) && attempt < MAX_RETRIES) {
          await sleep(RETRY_DELAY_MS);
        } else {
          throw err;
        }
      }
    }

    if (!text) {
      return { success: false, error: "No response from AI after retries" };
    }

    // Parse JSON from response (handle markdown code blocks if present)
    let parsed: { content?: string; suggestedImagePrompt?: string };
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? jsonMatch[0] : text;

    try {
      parsed = JSON.parse(jsonStr) as {
        content?: string;
        suggestedImagePrompt?: string;
      };
    } catch {
      return {
        success: false,
        error: "Failed to parse AI response as JSON",
      };
    }

    const content = parsed.content?.trim();
    const suggestedImagePrompt = parsed.suggestedImagePrompt?.trim();

    if (!content) {
      return {
        success: false,
        error: "No content in AI response",
      };
    }

    return {
      success: true,
      content,
      suggestedImagePrompt: suggestedImagePrompt || content.slice(0, 200),
    };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Generation failed";
    return { success: false, error: message };
  }
}
